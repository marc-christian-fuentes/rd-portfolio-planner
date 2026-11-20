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

export function periodLabel(key: string): string {
  const part = key.slice(5);
  if (!part) return key;
  if (part.startsWith('Q')) return part;
  return new Date(2000, Number(part) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
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

/** Re-cuts entered numbers when switching between monthly, quarterly and yearly. */
export function convertGranularity(plan: RevenuePlan, to: Granularity, years: number[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const y of years) {
    const yearly = enteredForYear(plan, y);
    const keys = periodKeys(y, to);
    if (plan.recurringMode === 'standalone') {
      // Subscribers are a level, not a flow: every period keeps the same count.
      keys.forEach((k) => (out[k] = Math.round(yearly)));
    } else {
      // Units are a flow: split the year's total evenly, remainder in the last period.
      const each = Math.floor(yearly / keys.length);
      keys.forEach((k, i) => (out[k] = i === keys.length - 1 ? Math.round(yearly - each * (keys.length - 1)) : each));
    }
  }
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
