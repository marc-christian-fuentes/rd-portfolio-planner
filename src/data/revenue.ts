/**
 * REVENUE PLANS (spec section 5)
 * ------------------------------
 * Sales plans units per month, quarter or year. Recurring revenue
 * (subscriptions and warranty) is either linked to a hardware product or
 * entered directly. A project's plan then supplies the units and price in
 * its ROI model, so Sales and the ROI calculator share one set of numbers.
 *
 * COGS, version 1: the project's gross margin % stays fixed, so
 * COGS = revenue × (1 − margin) and moves with price. (Version 2, itemised
 * unit costs from the manufacturing builder, arrives in step 7.7.)
 */
import type { Granularity, Phase, Project, RevenuePlan, RoiModel } from './types';

/** Revenue planning opens once a project is in development. */
export const PLANNING_PHASES: Phase[] = ['In Development', 'Testing / Validation', 'Completed'];
export const canPlanRevenue = (p: Project) => p.type === 'revenue' && PLANNING_PHASES.includes(p.phase);

/** Default attach and retention for new linked plans (warranty example from the spec). */
export const DEFAULT_ATTACH = 72;
export const DEFAULT_RETENTION = 80;

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

/** The period keys for one year: "2027", or "2027-Q1".."Q4", or "2027-01".."12". */
export function periodKeys(year: number, g: Granularity): string[] {
  if (g === 'annual') return [String(year)];
  return (g === 'quarterly' ? QUARTERS : MONTHS).map((p) => `${year}-${p}`);
}

const monthName = (calendarMonth: number) => new Date(2000, calendarMonth - 1, 1).toLocaleDateString('en-US', { month: 'short' });

/**
 * Model years are fiscal years. Month "2027-01" is the first month of
 * FY27, so with an October year start it is labelled "Oct", and Q1 covers
 * Oct–Dec. With a January start, the labels are ordinary calendar months.
 */
export function periodLabel(key: string, fiscalStartMonth = 1): string {
  const part = key.slice(5);
  if (!part) return key;
  if (part.startsWith('Q')) return part;
  return monthName(((fiscalStartMonth - 1 + Number(part) - 1) % 12) + 1);
}

/** The months a fiscal quarter covers, e.g. "Oct–Dec" for Q1 with an October start. */
export function quarterMonths(quarter: number, fiscalStartMonth = 1): string {
  const first = ((fiscalStartMonth - 1 + (quarter - 1) * 3) % 12) + 1;
  const last = ((first - 1 + 2) % 12) + 1;
  return `${monthName(first)}–${monthName(last)}`;
}

/**
 * The yearly figure from entered periods: total units sold, or (for
 * standalone subscriptions) the average number of active subscribers.
 */
export function enteredForYear(plan: RevenuePlan, year: number): number {
  const values = periodKeys(year, plan.granularity).map((k) => plan.unitsByPeriod[k] ?? 0);
  const sum = values.reduce((s, v) => s + v, 0);
  return plan.recurringMode === 'standalone' ? sum / values.length : sum;
}

/** Splits a whole number into n parts that add back up exactly. */
function splitEvenly(total: number, n: number): number[] {
  const whole = Math.round(total);
  const each = Math.floor(whole / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? whole - each * (n - 1) : each));
}

/**
 * Re-cuts entered numbers when switching between monthly, quarterly and
 * yearly. It works period by period, so the shape survives a round trip:
 * quarters split into their own three months, and months add back up into
 * their own quarter (not the year's average).
 */
export function convertGranularity(plan: RevenuePlan, to: Granularity, years: number[]): Record<string, number> {
  const from = plan.granularity;
  const level = plan.recurringMode === 'standalone'; // subscribers: a level, so average/copy instead of sum/split
  const get = (k: string) => plan.unitsByPeriod[k] ?? 0;
  const out: Record<string, number> = {};
  const size: Record<Granularity, number> = { annual: 1, quarterly: 4, monthly: 12 };

  for (const y of years) {
    const src = periodKeys(y, from).map(get);
    const keys = periodKeys(y, to);
    if (from === to) {
      keys.forEach((k, i) => (out[k] = src[i]));
    } else if (size[to] < size[from]) {
      // Coarser: each target period gathers its own block of source periods.
      const block = size[from] / size[to];
      keys.forEach((k, i) => {
        const part = src.slice(i * block, (i + 1) * block);
        const sum = part.reduce((s, v) => s + v, 0);
        out[k] = level ? Math.round(sum / block) : sum;
      });
    } else {
      // Finer: each source period is split across its own child periods.
      const block = size[to] / size[from];
      src.forEach((v, i) => {
        const parts = level ? Array(block).fill(Math.round(v)) : splitEvenly(v, block);
        parts.forEach((p: number, j: number) => (out[keys[i * block + j]] = p));
      });
    }
  }
  return out;
}

/** Standalone entries that continue a linked plan: each year's active subscribers. */
export function standaloneFromLinked(plan: RevenuePlan, project: Project, years: number[], hardwareUnits: number[]): Record<string, number> {
  const rows = revenueByYear({ ...plan, recurringMode: 'linked-to-hardware' }, project, years, hardwareUnits);
  const out: Record<string, number> = {};
  years.forEach((y, i) => periodKeys(y, plan.granularity).forEach((k) => (out[k] = Math.round(rows[i].billedUnits))));
  return out;
}

export function priceOf(plan: RevenuePlan | undefined, project: Project): number {
  return plan?.priceOverride ?? project.defaultPricePerUnit ?? 0;
}

export interface RevenueYear {
  year: number;
  /** Units sold, or new subscribers/warranties this year. */
  newUnits: number;
  /** Units billed this year: units sold, or active subscribers. */
  billedUnits: number;
  price: number;
  revenue: number;
}

/**
 * Revenue by year from a plan. For linked plans, hardwareUnits gives the
 * hardware product's units for the same years.
 */
export function revenueByYear(plan: RevenuePlan, project: Project, years: number[], hardwareUnits: number[] = []): RevenueYear[] {
  const price = priceOf(plan, project);
  let active = 0;
  return years.map((year, i) => {
    let newUnits: number;
    let billed: number;
    if (plan.recurringMode === 'linked-to-hardware') {
      newUnits = (hardwareUnits[i] ?? 0) * (plan.attachRatePct / 100);
      active = newUnits + active * (plan.retentionPct / 100);
      billed = active;
    } else if (plan.recurringMode === 'standalone') {
      billed = enteredForYear(plan, year);
      newUnits = Math.max(0, billed - active);
      active = billed;
    } else {
      newUnits = enteredForYear(plan, year);
      billed = newUnits;
    }
    return { year, newUnits, billedUnits: billed, price, revenue: (billed * price) / 1000 };
  });
}

/** A copy of the ROI model with units and price taken from the sales plan. */
export function applyRevenuePlan(model: RoiModel, plan: RevenuePlan, project: Project, hardwareUnits: number[]): RoiModel {
  const years = model.years.map((_, i) => model.startYear + i);
  const rows = revenueByYear(plan, project, years, hardwareUnits);
  return {
    ...model,
    years: model.years.map((y, i) => ({ ...y, units: Math.round(rows[i].billedUnits), price: rows[i].price })),
  };
}

/** A new plan, pre-filled with the units already in the ROI model. */
export function createRevenuePlan(project: Project, model: RoiModel | undefined): RevenuePlan {
  const unitsByPeriod: Record<string, number> = {};
  model?.years.forEach((y, i) => (unitsByPeriod[String(model.startYear + i)] = y.units));
  return {
    projectId: project.id,
    granularity: 'annual',
    unitsByPeriod,
    priceOverride: null,
    recurringMode: project.recurring ? 'standalone' : 'none',
    attachRatePct: DEFAULT_ATTACH,
    retentionPct: DEFAULT_RETENTION,
    linkedHardwareProjectId: null,
  };
}

/** The demo's starting plans, built from the seeded ROI models. */
export function seedRevenuePlans(projects: Project[], models: Record<string, RoiModel>): Record<string, RevenuePlan> {
  const byId = (id: string) => projects.find((p) => p.id === id)!;
  const base = (id: string) => createRevenuePlan(byId(id), models[id]);
  const linked = (id: string, hardwareId: string, attach: number, retention: number): RevenuePlan => ({
    ...base(id),
    unitsByPeriod: {},
    recurringMode: 'linked-to-hardware',
    linkedHardwareProjectId: hardwareId,
    attachRatePct: attach,
    retentionPct: retention,
  });

  // Valve Actuator v2: planned by quarter.
  const valve = base('prj-05');
  const valveYears = models['prj-05'].years.map((_, i) => models['prj-05'].startYear + i);
  const valveQuarterly: RevenuePlan = { ...valve, granularity: 'quarterly', unitsByPeriod: convertGranularity(valve, 'quarterly', valveYears) };

  return {
    // Cloud dashboard subscriptions sold with AeroSense sensors
    'prj-02': linked('prj-02', 'prj-01', 60, 85),
    // AeroSense warranty: billed on the initial order, renewed yearly
    'prj-04': linked('prj-04', 'prj-01', DEFAULT_ATTACH, DEFAULT_RETENTION),
    'prj-05': valveQuarterly,
    // Leak detection subscriptions sold with FlowGuard valves
    'prj-06': linked('prj-06', 'prj-05', 80, 90),
    // Battery board: Sales has negotiated a lower launch price
    'prj-11': { ...base('prj-11'), priceOverride: 379 },
  };
}
