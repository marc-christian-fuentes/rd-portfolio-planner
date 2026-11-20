/**
 * ROI MATHS
 * ---------
 * Turns a project's ROI model (yearly inputs) into cash flows and the
 * headline figures: NPV, discounted ROI, IRR and discounted payback.
 *
 * All money is in $ thousands, except price per unit.
 *
 * Mid-year discounting: cash is assumed to arrive evenly through each year,
 * so year t is discounted by (t − 0.5) years instead of t:
 *     discount factor = 1 ÷ (1 + WACC) ^ (t − 0.5)
 */
import type { DiscountConvention, Project, RoiModel, RoiYear } from './types';

export interface RoiRow {
  year: number;
  units: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  savings: number;
  rdCost: number;
  /** Cost of new hires on this project this year (proposed or approved). */
  hireCost: number;
  opex: number;
  netCashFlow: number;
  discountFactor: number;
  presentValue: number;
  cumulativePv: number;
}

export interface RoiResult {
  rows: RoiRow[];
  /** Net present value ($000s): the sum of every year's present value. */
  npv: number;
  /** Present value of R&D and operating costs ($000s). */
  pvCosts: number;
  /** NPV ÷ PV of costs, as %. null when there are no costs. */
  roiPct: number | null;
  /** The discount rate at which NPV would be zero, as %. null if it can't be found. */
  irrPct: number | null;
  /** Years until cumulative present value turns positive. null if it never does. */
  paybackYears: number | null;
}

/** How many years to discount year number t (1 = first year) by. */
function timing(t: number, convention: DiscountConvention): number {
  return convention === 'mid-year' ? t - 0.5 : t;
}

export function discountFactor(waccPct: number, t: number, convention: DiscountConvention): number {
  return 1 / Math.pow(1 + waccPct / 100, timing(t, convention));
}

/**
 * @param hireCosts optional extra R&D cost per model year from new hires
 *   ($ thousands), which lowers the cash flow and NPV.
 */
export function computeRoi(model: RoiModel, hireCosts?: number[]): RoiResult {
  let cumulative = 0;
  const rows: RoiRow[] = model.years.map((y, i) => {
    const t = i + 1;
    const revenue = (y.units * y.price) / 1000;
    const cogs = revenue * (1 - y.marginPct / 100);
    const grossProfit = revenue - cogs;
    const hireCost = hireCosts?.[i] ?? 0;
    const netCashFlow = grossProfit + y.savings - y.rdCost - hireCost - y.opex;
    const df = discountFactor(model.waccPct, t, model.convention);
    const presentValue = netCashFlow * df;
    cumulative += presentValue;
    return {
      year: model.startYear + i,
      units: y.units,
      revenue,
      cogs,
      grossProfit,
      savings: y.savings,
      rdCost: y.rdCost,
      hireCost,
      opex: y.opex,
      netCashFlow,
      discountFactor: df,
      presentValue,
      cumulativePv: cumulative,
    };
  });

  const npv = cumulative;
  const pvCosts = rows.reduce((sum, r) => sum + (r.rdCost + r.hireCost + r.opex) * r.discountFactor, 0);

  return {
    rows,
    npv,
    pvCosts,
    roiPct: pvCosts > 0 ? (npv / pvCosts) * 100 : null,
    irrPct: solveIrr(rows.map((r) => r.netCashFlow), model.convention),
    paybackYears: discountedPayback(rows),
  };
}

/** Finds the rate where NPV = 0 by repeatedly halving the search range. */
function solveIrr(flows: number[], convention: DiscountConvention): number | null {
  const npvAt = (rate: number) => flows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate, timing(i + 1, convention)), 0);
  let lo = -0.99;
  let hi = 10;
  let fLo = npvAt(lo);
  if (fLo * npvAt(hi) > 0) return null; // no sign change: IRR undefined
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npvAt(mid);
    if (Math.abs(fMid) < 1e-7) return mid * 100;
    if (fLo * fMid < 0) hi = mid;
    else {
      lo = mid;
      fLo = fMid;
    }
  }
  return ((lo + hi) / 2) * 100;
}

/** Years until cumulative PV first turns positive, interpolated within that year. */
function discountedPayback(rows: RoiRow[]): number | null {
  let previous = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.cumulativePv >= 0 && previous < 0 && r.presentValue > 0) {
      return i + -previous / r.presentValue;
    }
    previous = r.cumulativePv;
  }
  return null;
}

// ---------- Creating a starter model ----------

/** Blended R&D cost per hour used to turn planned hours into dollars. */
const BLENDED_RATE = 100;
/** Sales ramp-up after launch: year 1 sells 40% of the steady-state volume, and so on. */
const RAMP = [0.4, 0.75, 1, 1.1, 1.15, 1.2, 1.2, 1.2, 1.2, 1.2];
export const DEFAULT_WACC = 10;
export const MIN_YEARS = 3;
export const MAX_YEARS = 10;
const SALES_YEARS = 4;

/**
 * A sensible first draft for a project, built from its own data:
 * planned hours become R&D cost, the default price and margin drive revenue,
 * and sales start the year after development ends.
 */
export function createDefaultRoiModel(project: Project, createdBy: string, today: string): RoiModel {
  const startYear = Number(project.startDate.slice(0, 4));
  const endYear = Number(project.endDate.slice(0, 4));
  const devYears = endYear - startYear + 1;
  // Development years plus four years of sales (or savings) after launch.
  const horizon = Math.min(MAX_YEARS, devYears + SALES_YEARS);
  const rdTotal = (project.plannedHours * BLENDED_RATE) / 1000;
  const launch = Math.min(horizon - 1, devYears);
  const isRevenue = project.type === 'revenue';
  // Steady-state yearly volume: hardware units, or software subscribers.
  const baseUnits = project.component === 'hardware' ? 6000 : 9000;

  const years: RoiYear[] = Array.from({ length: horizon }, (_, i) => {
    const selling = i >= launch;
    const k = i - launch;
    return {
      units: isRevenue && selling ? Math.round(baseUnits * RAMP[k]) : 0,
      price: project.defaultPricePerUnit ?? 0,
      marginPct: project.grossMarginPct ?? 0,
      savings: !isRevenue && selling ? Math.round(rdTotal * 0.6) : 0,
      rdCost: i < devYears ? Math.round(rdTotal / devYears) : 0,
      opex: selling ? (isRevenue ? 60 : 15) : 0,
    };
  });

  return { projectId: project.id, waccPct: DEFAULT_WACC, convention: 'mid-year', startYear, years, createdBy, updatedAt: today };
}

/** Demo starting point: every project past Proposed already has a model. */
export function seedRoiModels(projects: Project[]): Record<string, RoiModel> {
  const models: Record<string, RoiModel> = {};
  for (const p of projects) {
    if (p.phase !== 'Scoping' && p.phase !== 'Proposed') {
      models[p.id] = createDefaultRoiModel(p, p.ownerId, '2026-11-01');
    }
  }
  return models;
}

/** Formats $ thousands compactly: 1234 → "$1.23M", 456 → "$456K", −120 → "−$120K". */
export function formatK(valueK: number): string {
  const sign = valueK < 0 ? '−' : '';
  const abs = Math.abs(valueK);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}M`;
  return `${sign}$${Math.round(abs).toLocaleString('en-US')}K`;
}
