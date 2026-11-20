/**
 * ROLL-UPS
 * --------
 * Adds projects' ROI models together, for the Summary, Platform view and
 * Forecast. Two shapes:
 *   - Totals: one set of lifetime figures for a group of projects.
 *   - Pnl: the same figures year by year, plus each project's cash flow.
 * Money is in $ thousands. A project without an ROI model still counts
 * for hours, but adds no money.
 */
import { computeRoi, type RoiRow } from './roi';
import type { Project, RoiModel } from './types';

export interface Totals {
  revenue: number;
  cogs: number;
  savings: number;
  rdCost: number;
  opex: number;
  npv: number;
  /** Present value of R&D and operating costs, used for ROI. */
  pvCosts: number;
  hours: number;
  projects: number;
  withModel: number;
}

const ZERO: Totals = { revenue: 0, cogs: 0, savings: 0, rdCost: 0, opex: 0, npv: 0, pvCosts: 0, hours: 0, projects: 0, withModel: 0 };
type MoneyKey = 'revenue' | 'cogs' | 'savings' | 'rdCost' | 'opex';
const sumRows = (rows: RoiRow[], key: MoneyKey) => rows.reduce((s, r) => s + r[key], 0);

export function projectTotals(project: Project, model: RoiModel | undefined): Totals {
  const base: Totals = { ...ZERO, hours: project.plannedHours, projects: 1 };
  if (!model) return base;
  const r = computeRoi(model);
  return {
    ...base,
    revenue: sumRows(r.rows, 'revenue'),
    cogs: sumRows(r.rows, 'cogs'),
    savings: sumRows(r.rows, 'savings'),
    rdCost: sumRows(r.rows, 'rdCost'),
    opex: sumRows(r.rows, 'opex'),
    npv: r.npv,
    pvCosts: r.pvCosts,
    withModel: 1,
  };
}

export function totalsFor(projects: Project[], models: Record<string, RoiModel>): Totals {
  return projects
    .map((p) => projectTotals(p, models[p.id]))
    .reduce((a, b) => {
      const out = { ...a };
      for (const k of Object.keys(out) as (keyof Totals)[]) out[k] = a[k] + b[k];
      return out;
    }, ZERO);
}

export const grossProfitOf = (t: Totals) => t.revenue - t.cogs;
/** COGS + R&D + operating cost. */
export const totalCostOf = (t: Totals) => t.cogs + t.rdCost + t.opex;
export const roiPctOf = (t: Totals) => (t.pvCosts > 0 ? (t.npv / t.pvCosts) * 100 : null);
export const marginPctOf = (t: Totals) => (t.revenue > 0 ? ((t.revenue - t.cogs) / t.revenue) * 100 : null);

export interface PnlYear {
  year: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  savings: number;
  rdCost: number;
  opex: number;
  /** Gross profit + savings − R&D − operating cost. Pre-tax; equals net cash flow here. */
  operatingIncome: number;
  cumulative: number;
}

export interface Pnl {
  years: PnlYear[];
  byProject: { project: Project; cashFlow: number[] }[];
}

/** Year-by-year P&L for a group of projects, from the first to the last year any model covers. */
export function yearlyPnl(projects: Project[], models: Record<string, RoiModel>): Pnl {
  const results = projects.filter((p) => models[p.id]).map((p) => ({ project: p, rows: computeRoi(models[p.id]).rows }));
  if (results.length === 0) return { years: [], byProject: [] };

  const allYears = results.flatMap((r) => r.rows.map((x) => x.year));
  const first = Math.min(...allYears);
  const last = Math.max(...allYears);
  const yearList = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  let cumulative = 0;
  const years = yearList.map((year) => {
    const rows = results.map((r) => r.rows.find((x) => x.year === year)).filter((x): x is RoiRow => x !== undefined);
    const s = (key: MoneyKey) => rows.reduce((t, x) => t + x[key], 0);
    const revenue = s('revenue');
    const cogs = s('cogs');
    const savings = s('savings');
    const rdCost = s('rdCost');
    const opex = s('opex');
    const gp = revenue - cogs;
    const operatingIncome = gp + savings - rdCost - opex;
    cumulative += operatingIncome;
    return { year, revenue, cogs, grossProfit: gp, savings, rdCost, opex, operatingIncome, cumulative };
  });

  const byProject = results.map((r) => ({
    project: r.project,
    cashFlow: yearList.map((y) => r.rows.find((x) => x.year === y)?.netCashFlow ?? 0),
  }));

  return { years, byProject };
}

/** $000s with brackets for negatives, as on a P&L: −1234 → "(1,234)". */
export function formatAccounting(v: number): string {
  const s = Math.abs(Math.round(v)).toLocaleString('en-US');
  return v < -0.5 ? `(${s})` : s;
}
