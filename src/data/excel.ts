/**
 * EXCEL EXPORT (spec section 4)
 * -----------------------------
 * Exports one project, or a chosen set, as an Excel workbook with live
 * formulas, so people can model offline. Each project gets a sheet:
 *   - WACC and mid-year discounting are input cells at the top;
 *   - units, price, margin and costs are blue input cells;
 *   - revenue, COGS, cash flow, discount factors, present values, NPV,
 *     discounted ROI and IRR are Excel formulas that recalculate.
 * With more than one project, a Summary sheet links to each project's NPV.
 *
 * The workbook is built with ExcelJS, loaded only when someone exports,
 * so the app itself stays small and quick to open.
 */
import type { Workbook, Worksheet } from 'exceljs';
import { yearLabel } from './access';
import { computeRoi, type RoiResult } from './roi';
import { hireCostsForModel } from './resourcing';
import { unitCostOf } from './unitcost';
import type { Assumptions, ProposedHire, Project, RoiModel, RevenuePlan, SeedData, UnitCostItem } from './types';

/** Everything the export needs from the app's state. */
export interface ExportState {
  data: SeedData;
  roiModels: Record<string, RoiModel>;
  revenuePlans: Record<string, RevenuePlan>;
  unitCosts: UnitCostItem[];
  hires: ProposedHire[];
  includePendingHires: boolean;
  assumptions: Assumptions;
  /** How far department rates have moved for a project (1 = unchanged). */
  rateIndex?: (projectId: string) => number;
}

type EffectiveModel = (state: ExportState, projectId: string) => RoiModel | undefined;

// Spreadsheet conventions: blue = input, black = formula.
const BLUE = { argb: 'FF1F4E9F' };
const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE8EADF' } };
const MONEY = '#,##0;(#,##0);"–"';
const PRICE = '$#,##0.00';
const PCT = '0.0%';
const FACTOR = '0.000';
const UNITS = '#,##0';

/** 1 → A, 2 → B, … 27 → AA. */
export function col(n: number): string {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Excel sheet names: max 31 characters, no [ ] : * ? / \ , and unique. */
function sheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[[\]:*?/\\]/g, '').slice(0, 31) || 'Project';
  let out = base;
  for (let i = 2; used.has(out.toLowerCase()); i++) out = `${base.slice(0, 28)} ${i}`;
  used.add(out.toLowerCase());
  return out;
}

const quoteSheet = (name: string) => `'${name.replace(/'/g, "''")}'`;

// Row numbers on each project sheet, so the formulas read clearly.
const R = {
  wacc: 4,
  midYear: 5,
  header: 8,
  t: 9,
  units: 10,
  price: 11,
  revenue: 12,
  margin: 13,
  cogs: 14,
  grossProfit: 15,
  savings: 16,
  rd: 17,
  hires: 18,
  opex: 19,
  ncf: 20,
  df: 21,
  pv: 22,
  cumPv: 23,
  npv: 25,
  pvCosts: 26,
  roi: 27,
  irr: 28,
};

interface SheetRef {
  project: Project;
  sheet: string;
  totalCol: string;
  result: RoiResult;
}

function projectSheet(ws: Worksheet, project: Project, model: RoiModel, result: RoiResult, s: ExportState): SheetRef['totalCol'] {
  const n = model.years.length;
  const first = 'B';
  const last = col(n + 1);
  const totalCol = col(n + 2);
  const platform = s.data.platforms.find((p) => p.id === project.platformId)?.name ?? '';
  const owner = s.data.people.find((p) => p.id === project.ownerId)?.name ?? '';

  ws.getColumn(1).width = 40;
  for (let c = 2; c <= n + 2; c++) ws.getColumn(c).width = 12;

  ws.getCell('A1').value = `${project.name}: ROI model`;
  ws.getCell('A1').font = { bold: true, size: 14 };
  ws.getCell('A2').value = `${platform} · ${project.phase} · Product manager: ${owner}`;
  ws.getCell('A2').font = { color: { argb: 'FF6B7558' } };

  ws.getCell(`A${R.wacc}`).value = 'WACC (discount rate)';
  ws.getCell(`B${R.wacc}`).value = model.waccPct / 100;
  ws.getCell(`B${R.wacc}`).numFmt = PCT;
  ws.getCell(`B${R.wacc}`).font = { color: BLUE };
  ws.getCell(`A${R.midYear}`).value = 'Mid-year discounting (1 = yes, 0 = end of year)';
  ws.getCell(`B${R.midYear}`).value = model.convention === 'mid-year' ? 1 : 0;
  ws.getCell(`B${R.midYear}`).font = { color: BLUE };
  ws.getCell('A6').value = '$ thousands unless noted · blue = input, black = formula · change any blue cell and everything recalculates';
  ws.getCell('A6').font = { italic: true, color: { argb: 'FF6B7558' } };

  // Header row
  const header = ws.getRow(R.header);
  header.getCell(1).value = 'Line item';
  model.years.forEach((_, i) => (header.getCell(i + 2).value = yearLabel(model.startYear + i, s.assumptions.periodView)));
  header.getCell(n + 2).value = 'Total';
  header.eachCell((c) => {
    c.font = { bold: true };
    c.fill = HEADER_FILL;
    c.alignment = { horizontal: c.address.startsWith('A') ? 'left' : 'right' };
  });

  const label = (row: number, text: string, bold = false) => {
    ws.getCell(`A${row}`).value = text;
    if (bold) ws.getCell(`A${row}`).font = { bold: true };
  };
  const input = (row: number, values: number[], fmt: string) =>
    values.forEach((v, i) => {
      const cell = ws.getCell(`${col(i + 2)}${row}`);
      cell.value = v;
      cell.numFmt = fmt;
      cell.font = { color: BLUE };
    });
  const formula = (row: number, f: (c: string, i: number) => string, results: number[], fmt: string, bold = false) =>
    results.forEach((v, i) => {
      const c = col(i + 2);
      const cell = ws.getCell(`${c}${row}`);
      cell.value = { formula: f(c, i), result: v };
      cell.numFmt = fmt;
      if (bold) cell.font = { bold: true };
    });
  const total = (row: number, value: number, fmt: string, bold = false) => {
    const cell = ws.getCell(`${totalCol}${row}`);
    cell.value = { formula: `SUM(${first}${row}:${last}${row})`, result: value };
    cell.numFmt = fmt;
    cell.font = { bold };
  };
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const rows = result.rows;

  label(R.t, 'Year number (t)');
  model.years.forEach((_, i) => {
    const cell = ws.getCell(`${col(i + 2)}${R.t}`);
    cell.value = i + 1;
    cell.font = { color: { argb: 'FF8E9677' } };
  });

  label(R.units, 'Units sold (or active subscribers)');
  input(R.units, model.years.map((y) => y.units), UNITS);
  total(R.units, sum(model.years.map((y) => y.units)), UNITS);

  label(R.price, 'Price per unit ($)');
  input(R.price, model.years.map((y) => y.price), PRICE);

  label(R.revenue, 'Revenue');
  formula(R.revenue, (c) => `${c}${R.units}*${c}${R.price}/1000`, rows.map((r) => r.revenue), MONEY);
  total(R.revenue, sum(rows.map((r) => r.revenue)), MONEY);

  label(R.margin, 'Gross margin (%)');
  input(R.margin, model.years.map((y) => y.marginPct / 100), PCT);

  label(R.cogs, 'Cost of goods sold');
  formula(R.cogs, (c) => `${c}${R.revenue}*(1-${c}${R.margin})`, rows.map((r) => r.cogs), MONEY);
  total(R.cogs, sum(rows.map((r) => r.cogs)), MONEY);

  label(R.grossProfit, 'Gross profit', true);
  formula(R.grossProfit, (c) => `${c}${R.revenue}-${c}${R.cogs}`, rows.map((r) => r.grossProfit), MONEY, true);
  total(R.grossProfit, sum(rows.map((r) => r.grossProfit)), MONEY, true);

  label(R.savings, 'Cost savings');
  input(R.savings, model.years.map((y) => y.savings), MONEY);
  total(R.savings, sum(model.years.map((y) => y.savings)), MONEY);

  // R&D at today's department rates (the same figure the app uses).
  const rd = rows.map((r) => Math.round(r.rdCost * 10) / 10);
  label(R.rd, rows.some((r) => Math.abs(r.rdRateChange) >= 0.05) ? 'R&D cost (at current department rates)' : 'R&D cost');
  input(R.rd, rd, MONEY);
  total(R.rd, sum(rd), MONEY);

  label(R.hires, 'New hires (from resourcing)');
  input(R.hires, rows.map((r) => Math.round(r.hireCost * 10) / 10), MONEY);
  total(R.hires, sum(rows.map((r) => Math.round(r.hireCost * 10) / 10)), MONEY);

  label(R.opex, 'Operating cost');
  input(R.opex, model.years.map((y) => y.opex), MONEY);
  total(R.opex, sum(model.years.map((y) => y.opex)), MONEY);

  label(R.ncf, 'Net cash flow', true);
  formula(R.ncf, (c) => `${c}${R.grossProfit}+${c}${R.savings}-${c}${R.rd}-${c}${R.hires}-${c}${R.opex}`, rows.map((r) => r.netCashFlow), MONEY, true);
  total(R.ncf, sum(rows.map((r) => r.netCashFlow)), MONEY, true);

  label(R.df, 'Discount factor');
  formula(R.df, (c) => `1/(1+$B$${R.wacc})^(${c}${R.t}-0.5*$B$${R.midYear})`, rows.map((r) => r.discountFactor), FACTOR);

  label(R.pv, 'Present value', true);
  formula(R.pv, (c) => `${c}${R.ncf}*${c}${R.df}`, rows.map((r) => r.presentValue), MONEY, true);
  total(R.pv, sum(rows.map((r) => r.presentValue)), MONEY, true);

  label(R.cumPv, 'Cumulative present value');
  formula(R.cumPv, (c, i) => (i === 0 ? `${c}${R.pv}` : `${col(i + 1)}${R.cumPv}+${c}${R.pv}`), rows.map((r) => r.cumulativePv), MONEY);

  // Headline results
  const range = (row: number) => `${first}${row}:${last}${row}`;
  const headline: [number, string, string, number | null, string][] = [
    [R.npv, 'Net present value ($000s)', `SUM(${range(R.pv)})`, result.npv, MONEY],
    // Three plain SUMPRODUCTs (no array arithmetic), so Excel, Google Sheets and LibreOffice all agree.
    [
      R.pvCosts,
      'Present value of R&D, hires and operating cost',
      `SUMPRODUCT(${range(R.rd)},${range(R.df)})+SUMPRODUCT(${range(R.hires)},${range(R.df)})+SUMPRODUCT(${range(R.opex)},${range(R.df)})`,
      result.pvCosts,
      MONEY,
    ],
    [R.roi, 'Discounted ROI (NPV ÷ PV of costs)', `IF(B${R.pvCosts}=0,"",B${R.npv}/B${R.pvCosts})`, result.roiPct === null ? null : result.roiPct / 100, PCT],
    [R.irr, 'IRR (same for mid-year and end-of-year timing)', `IRR(${range(R.ncf)})`, result.irrPct === null ? null : result.irrPct / 100, PCT],
  ];
  for (const [row, text, f, value, fmt] of headline) {
    label(row, text, true);
    const cell = ws.getCell(`B${row}`);
    cell.value = value === null ? { formula: f } : { formula: f, result: value };
    cell.numFmt = fmt;
    cell.font = { bold: true };
  }

  // Where the numbers came from
  const notes: string[] = [];
  if (s.revenuePlans[project.id]) notes.push('Units and price come from the Sales revenue plan.');
  const uc = unitCostOf(s.unitCosts, project.id);
  if (uc !== null) notes.push(`Gross margin comes from Manufacturing's itemised unit cost ($${uc.toFixed(2)} a unit).`);
  notes.push(s.includePendingHires ? 'New hires include hires still awaiting approval.' : 'New hires include approved hires only.');
  notes.push(`Exported from greenlight. on ${new Date().toLocaleDateString('en-CA')}. Demo data: all names and numbers are invented.`);
  notes.forEach((t, i) => {
    const cell = ws.getCell(`A${R.irr + 2 + i}`);
    cell.value = t;
    cell.font = { italic: true, color: { argb: 'FF6B7558' } };
  });

  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: R.header }];
  return totalCol;
}

/**
 * Fills a workbook with one sheet per project (and a Summary sheet when
 * there is more than one). Returns how many projects were exported.
 */
export function buildRoiWorkbook(wb: Workbook, projectIds: string[], s: ExportState, effectiveModel: EffectiveModel): number {
  wb.creator = 'greenlight.';
  wb.created = new Date();
  wb.calcProperties.fullCalcOnLoad = true;

  const summary = projectIds.length > 1 ? wb.addWorksheet('Summary') : null;
  const used = new Set<string>(['summary']);
  const refs: SheetRef[] = [];

  for (const id of projectIds) {
    const project = s.data.projects.find((p) => p.id === id);
    const model = effectiveModel(s, id);
    if (!project || !model) continue;
    const result = computeRoi(model, hireCostsForModel(project, model, s.hires, s.data.departments, s.includePendingHires), s.rateIndex?.(id) ?? 1);
    const name = sheetName(project.name, used);
    const totalCol = projectSheet(wb.addWorksheet(name), project, model, result, s);
    refs.push({ project, sheet: name, totalCol, result });
  }

  if (summary) {
    summary.getColumn(1).width = 34;
    summary.getColumn(2).width = 14;
    summary.getColumn(3).width = 20;
    for (const c of [4, 5, 6, 7]) summary.getColumn(c).width = 15;
    summary.getCell('A1').value = 'greenlight. portfolio export';
    summary.getCell('A1').font = { bold: true, size: 14 };
    summary.getCell('A2').value = 'Each figure links to its project sheet, so edits there flow through here. $ thousands.';
    summary.getCell('A2').font = { italic: true, color: { argb: 'FF6B7558' } };

    const header = summary.getRow(4);
    ['Project', 'Platform', 'Phase', 'Revenue', 'NPV', 'Discounted ROI', 'IRR'].forEach((h, i) => (header.getCell(i + 1).value = h));
    header.eachCell((c) => {
      c.font = { bold: true };
      c.fill = HEADER_FILL;
    });

    refs.forEach((r, i) => {
      const row = summary.getRow(5 + i);
      const sheet = quoteSheet(r.sheet);
      row.getCell(1).value = { text: r.project.name, hyperlink: `#${sheet}!A1` };
      row.getCell(1).font = { color: BLUE, underline: true };
      row.getCell(2).value = s.data.platforms.find((p) => p.id === r.project.platformId)?.name ?? '';
      row.getCell(3).value = r.project.phase;
      row.getCell(4).value = { formula: `${sheet}!${r.totalCol}${R.revenue}`, result: r.result.rows.reduce((a, x) => a + x.revenue, 0) };
      row.getCell(5).value = { formula: `${sheet}!B${R.npv}`, result: r.result.npv };
      row.getCell(6).value = r.result.roiPct === null ? { formula: `${sheet}!B${R.roi}` } : { formula: `${sheet}!B${R.roi}`, result: r.result.roiPct / 100 };
      row.getCell(7).value = r.result.irrPct === null ? { formula: `${sheet}!B${R.irr}` } : { formula: `${sheet}!B${R.irr}`, result: r.result.irrPct / 100 };
      row.getCell(4).numFmt = MONEY;
      row.getCell(5).numFmt = MONEY;
      row.getCell(6).numFmt = PCT;
      row.getCell(7).numFmt = PCT;
    });

    const totalRow = summary.getRow(5 + refs.length);
    totalRow.getCell(1).value = 'Total';
    const lastRow = 4 + refs.length;
    totalRow.getCell(4).value = { formula: `SUM(D5:D${lastRow})`, result: refs.reduce((a, r) => a + r.result.rows.reduce((b, x) => b + x.revenue, 0), 0) };
    totalRow.getCell(5).value = { formula: `SUM(E5:E${lastRow})`, result: refs.reduce((a, r) => a + r.result.npv, 0) };
    totalRow.getCell(4).numFmt = MONEY;
    totalRow.getCell(5).numFmt = MONEY;
    totalRow.eachCell((c) => (c.font = { bold: true }));
    summary.views = [{ state: 'frozen', ySplit: 4 }];
  }

  return refs.length;
}

/** Builds the workbook in the browser and downloads it. */
export async function downloadRoiWorkbook(projectIds: string[], s: ExportState, effectiveModel: EffectiveModel): Promise<number> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const count = buildRoiWorkbook(wb, projectIds, s, effectiveModel);
  if (count === 0) return 0;
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const single = count === 1 ? s.data.projects.find((p) => p.id === projectIds[0])?.name.replace(/\W+/g, '-').toLowerCase() : 'portfolio';
  a.download = `greenlight-roi-${single}-${new Date().toLocaleDateString('en-CA')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return count;
}
