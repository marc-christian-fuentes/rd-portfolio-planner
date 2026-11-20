/**
 * MODEL HELPERS
 * -------------
 * Small functions that answer common questions about the data,
 * plus a self-check that confirms the seed data is consistent.
 */
import { PHASES, type Person, type Platform, type Project, type SeedData } from './types';

export function projectsForPlatform(data: SeedData, platformId: string): Project[] {
  return data.projects.filter((p) => p.platformId === platformId);
}

/** A platform is launched once all of its projects are completed (spec section 2). */
export function isPlatformLaunched(data: SeedData, platform: Platform): boolean {
  const list = projectsForPlatform(data, platform.id);
  return list.length > 0 && list.every((p) => p.phase === 'Completed');
}

export function personById(data: SeedData, id: string | null): Person | undefined {
  return id ? data.people.find((p) => p.id === id) : undefined;
}

export function personName(data: SeedData, id: string | null): string {
  return personById(data, id)?.name ?? '—';
}

export function departmentName(data: SeedData, id: string | null): string {
  return data.departments.find((d) => d.id === id)?.name ?? '—';
}

/** People in a department who can be allocated to projects. */
export function departmentMembers(data: SeedData, departmentId: string): Person[] {
  return data.people.filter((p) => p.departmentId === departmentId);
}

/** Total yearly hours available in a department, from its people. */
export function departmentCapacityHours(data: SeedData, departmentId: string): number {
  return departmentMembers(data, departmentId).reduce((sum, p) => sum + p.capacityHoursPerYear, 0);
}

/** Number of months a project spans, counting start and end months. */
export function durationMonths(project: Project): number {
  const [sy, sm] = project.startDate.split('-').map(Number);
  const [ey, em] = project.endDate.split('-').map(Number);
  return (ey - sy) * 12 + (em - sm) + 1;
}

/** Hires not yet fully approved or rejected. */
export function isPendingHire(status: string): boolean {
  return status !== 'Approved' && status !== 'Rejected';
}

export function formatMoney(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

/** "2025-10-01" → "Oct 1, 2025". */
export function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Where a project is in its schedule, as of today. */
export function scheduleStatus(project: Project, today = new Date()) {
  const start = new Date(`${project.startDate}T00:00:00`);
  const end = new Date(`${project.endDate}T23:59:59`);
  const now = today.getTime();
  const done = project.phase === 'Completed';
  const notStarted = now < start.getTime() && !done;
  const elapsed = done ? 1 : Math.min(1, Math.max(0, (now - start.getTime()) / (end.getTime() - start.getTime())));
  const monthsLeft = done || now >= end.getTime() ? 0 : Math.ceil((end.getTime() - Math.max(now, start.getTime())) / (1000 * 60 * 60 * 24 * 30.44));
  const overdue = !done && now > end.getTime();
  return { done, notStarted, overdue, elapsedPct: Math.round(elapsed * 100), monthsLeft };
}

export function formatDate(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Self-check: looks for mistakes in the seed data (broken links between
 * records, missing prices, etc.). The page shows the result.
 */
export function checkSeed(data: SeedData): { checks: number; problems: string[] } {
  const problems: string[] = [];
  let checks = 0;
  const check = (ok: boolean, message: string) => {
    checks++;
    if (!ok) problems.push(message);
  };

  const allIds = [...data.platforms, ...data.departments, ...data.people, ...data.projects, ...data.hires].map((x) => x.id);
  check(new Set(allIds).size === allIds.length, 'Some records share the same id.');
  check(data.platforms.length === 3, `Expected 3 platforms, found ${data.platforms.length}.`);

  const usedPhases = new Set(data.projects.map((p) => p.phase));
  for (const phase of PHASES) check(usedPhases.has(phase), `No project is in the "${phase}" phase.`);

  for (const p of data.projects) {
    check(data.platforms.some((pl) => pl.id === p.platformId), `${p.name}: unknown platform.`);
    check(personById(data, p.ownerId)?.kind === 'product-manager', `${p.name}: owner is not a product manager.`);
    check(
      personById(data, p.projectManagerId)?.kind === 'project-manager',
      `${p.name}: project manager is not a project manager.`,
    );
    check(p.endDate > p.startDate, `${p.name}: ends before it starts.`);
    check(durationMonths(p) <= 24, `${p.name}: runs longer than two years.`);
    if (p.type === 'revenue') {
      check(p.defaultPricePerUnit !== null && p.grossMarginPct !== null, `${p.name}: revenue project needs a price and margin.`);
    } else {
      check(!p.recurring, `${p.name}: cost-only project cannot be recurring revenue.`);
    }
    if (p.phase !== 'Scoping') check(p.businessCase !== null, `${p.name}: needs a business case past Scoping.`);
  }

  for (const person of data.people) {
    if (person.departmentId !== null) {
      check(data.departments.some((d) => d.id === person.departmentId), `${person.name}: unknown department.`);
    }
    if (person.kind === 'resource') {
      check(personById(data, person.managerId)?.kind === 'project-manager', `${person.name}: must report to a project manager.`);
    }
  }

  for (const h of data.hires) {
    check(data.projects.some((p) => p.id === h.projectId), `Hire ${h.id}: unknown project.`);
    check(data.departments.some((d) => d.id === h.departmentId), `Hire ${h.id}: unknown department.`);
  }

  return { checks, problems };
}
