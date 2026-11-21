/**
 * RESOURCING MATHS
 * ----------------
 * Allocations, staffing gaps, costs and the hire approval chain (spec section 6).
 *
 * Everything is on a "per year" basis:
 *   hours needed per year  = planned hours ÷ project length in years
 *   hours allocated        = Σ (person's yearly capacity × % allocated)
 *   gap                    = needed − allocated (if positive)
 * A proposed hire adds its hours from its start date until the project ends.
 */
import { durationMonths } from './model';
import type { Allocation, CostLine, Department, Granularity, HireStatus, Person, Project, ProposedHire, Role, RoiModel } from './types';

export const PERIODS_PER_YEAR: Record<Granularity, number> = { monthly: 12, quarterly: 4, annual: 1 };

/** A non-labour line's cost per year, in $. */
export const annualAmount = (line: CostLine) => line.amount * PERIODS_PER_YEAR[line.granularity];

/** Phases where a project is being worked on and needs people. */
export const ACTIVE_PHASES: Project['phase'][] = ['Approved', 'In Development', 'Testing / Validation'];
export const isActive = (p: Project) => ACTIVE_PHASES.includes(p.phase);

export function hoursNeededPerYear(project: Project): number {
  return Math.round(project.plannedHours / Math.max(1, durationMonths(project) / 12));
}

export function allocatedHoursPerYear(projectId: string, allocations: Allocation[], people: Person[]): number {
  return allocations
    .filter((a) => a.projectId === projectId)
    .reduce((sum, a) => sum + ((people.find((p) => p.id === a.personId)?.capacityHoursPerYear ?? 0) * a.percent) / 100, 0);
}

/** Hours per year that pending or approved hires add to a project. */
export function hireHoursPerYear(projectId: string, hires: ProposedHire[]): number {
  return hires.filter((h) => h.projectId === projectId && h.status !== 'Rejected').reduce((s, h) => s + h.hours, 0);
}

/** Total % of a person's time allocated across all projects. Over 100 = over-allocated. */
export function personLoadPct(personId: string, allocations: Allocation[]): number {
  return allocations.filter((a) => a.personId === personId).reduce((s, a) => s + a.percent, 0);
}

export function rateOf(departments: Department[], departmentId: string | null): number {
  return departments.find((d) => d.id === departmentId)?.ratePerHour ?? 0;
}

/** Yearly labour cost of the people allocated to a project, in $. */
export function labourCostPerYear(projectId: string, allocations: Allocation[], people: Person[], departments: Department[]): number {
  return allocations
    .filter((a) => a.projectId === projectId)
    .reduce((sum, a) => {
      const person = people.find((p) => p.id === a.personId);
      if (!person) return sum;
      return sum + ((person.capacityHoursPerYear * a.percent) / 100) * rateOf(departments, person.departmentId);
    }, 0);
}

/**
 * How far department rates have moved for one project since its R&D budget
 * was entered: today's cost of its people's hours ÷ their cost at the
 * original rates. 1 = unchanged; 1.2 = 20% dearer. Weighted by the hours
 * each department puts into the project (or, for a project with nobody
 * allocated, by each department's headcount).
 */
export function rdRateIndex(
  projectId: string,
  allocations: Allocation[],
  people: Person[],
  departments: Department[],
  baseDepartments: Department[],
): number {
  const weights = new Map<string, number>();
  const add = (deptId: string | null, hours: number) => deptId && weights.set(deptId, (weights.get(deptId) ?? 0) + hours);
  for (const a of allocations.filter((x) => x.projectId === projectId)) {
    const person = people.find((p) => p.id === a.personId);
    if (person) add(person.departmentId, (person.capacityHoursPerYear * a.percent) / 100);
  }
  if (weights.size === 0) people.forEach((p) => add(p.departmentId, p.capacityHoursPerYear));

  let now = 0;
  let base = 0;
  weights.forEach((hours, deptId) => {
    const current = rateOf(departments, deptId);
    const original = baseDepartments.find((d) => d.id === deptId)?.ratePerHour ?? current;
    now += hours * current;
    base += hours * original;
  });
  return base > 0 ? now / base : 1;
}

export function hireAnnualCost(hire: ProposedHire, departments: Department[]): number {
  return hire.hours * rateOf(departments, hire.departmentId);
}

const utc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/**
 * A hire's cost in each calendar year ($ thousands), pro-rated from its start
 * date to the end of the project. E.g. a hire starting in October costs a quarter year.
 */
export function hireCostByYear(hire: ProposedHire, project: Project, departments: Department[], years: number[]): number[] {
  const start = utc(hire.startDate);
  const end = utc(project.endDate) + 24 * 60 * 60 * 1000;
  const annualK = hireAnnualCost(hire, departments) / 1000;
  return years.map((y) => {
    const ys = Date.UTC(y, 0, 1);
    const ye = Date.UTC(y + 1, 0, 1);
    const overlap = Math.max(0, Math.min(end, ye) - Math.max(start, ys));
    return (annualK * overlap) / (ye - ys);
  });
}

/**
 * The extra R&D cost per model year from a project's hires ($ thousands).
 * Approved hires always count; pending ones only when includePending is on.
 */
export function hireCostsForModel(
  project: Project,
  model: RoiModel,
  hires: ProposedHire[],
  departments: Department[],
  includePending: boolean,
): number[] | undefined {
  const relevant = hires.filter(
    (h) => h.projectId === project.id && h.status !== 'Rejected' && h.status !== 'Draft' && (includePending || h.status === 'Approved'),
  );
  if (relevant.length === 0) return undefined;
  const years = model.years.map((_, i) => model.startYear + i);
  return relevant
    .map((h) => hireCostByYear(h, project, departments, years))
    .reduce((total, costs) => total.map((v, i) => v + costs[i]));
}

// ---------- Approval chain: Director → CTO → Finance ----------

export const APPROVAL_STEPS: { status: HireStatus; approver: string; role: Role }[] = [
  { status: 'Awaiting Director', approver: 'Director', role: 'Leadership' },
  { status: 'Awaiting CTO', approver: 'CTO', role: 'CTO' },
  { status: 'Awaiting Finance', approver: 'Finance', role: 'Finance' },
];

export function currentStep(status: HireStatus) {
  return APPROVAL_STEPS.find((s) => s.status === status);
}

export function nextStatus(status: HireStatus): HireStatus {
  const i = APPROVAL_STEPS.findIndex((s) => s.status === status);
  return i === -1 ? status : i === APPROVAL_STEPS.length - 1 ? 'Approved' : APPROVAL_STEPS[i + 1].status;
}

/** Whether the viewer's role is the one that decides this hire next. */
export function canDecide(role: Role, status: HireStatus): boolean {
  return currentStep(status)?.role === role;
}
