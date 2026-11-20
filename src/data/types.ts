/**
 * DATA MODEL
 * ----------
 * This file describes the "shape" of every kind of record in the app
 * (spec section 2). It holds no data itself; the fake data lives in seed.ts.
 *
 * Step 7.1 seeds platforms, projects, departments and people.
 * The other shapes (allocations, cost lines, revenue plans, hires, quarterly
 * plans, comments, unit costs) are defined now so later steps can build on them.
 */

// ---------- Fixed lists ----------

/** Project phases, in order (spec section 2). */
export const PHASES = [
  'Scoping',
  'Proposed',
  'Approved',
  'In Development',
  'Testing / Validation',
  'Completed',
] as const;
export type Phase = (typeof PHASES)[number];

/** Roles in the role switcher (spec section 3). */
export const ROLES = [
  'Leadership',
  'CTO',
  'Product Manager',
  'Project Manager',
  'Sales',
  'Manufacturing',
  'Finance',
  'Admin',
] as const;
export type Role = (typeof ROLES)[number];

/** Revenue-generating (sales can plan revenue) or cost-only (adds cost only). */
export type ProjectType = 'revenue' | 'cost-only';

/** Whether a project is mainly about the platform's hardware or software piece. */
export type Component = 'hardware' | 'software';

export type ApprovalStatus = 'Not submitted' | 'Pending' | 'Approved' | 'Rejected';

/** How often a cost or revenue figure is planned. */
export type Granularity = 'monthly' | 'quarterly' | 'annual';

/** A date written as text, e.g. "2026-07-01". */
export type ISODate = string;

// ---------- Seeded in step 7.1 ----------

/** A product made of several projects. Launched once all its projects are Completed. */
export interface Platform {
  id: string;
  name: string;
  description: string;
  hardwarePiece: string;
  softwarePiece: string;
}

/** A team such as Software Engineering, with its cost and standard capacity. */
export interface Department {
  id: string;
  name: string;
  ratePerHour: number;
  /** Standard working hours per person per year in this department. */
  capacityHoursPerYear: number;
}

export type PersonKind =
  | 'resource' // engineers, QA, etc. who get allocated to projects
  | 'project-manager'
  | 'product-manager'
  | 'leader' // CEO, Director, CTO, Finance
  | 'staff'; // sales, manufacturing, admin

/** A person, shaped like a record from an HR system feed. */
export interface Person {
  id: string;
  name: string;
  title: string;
  kind: PersonKind;
  /** null for leaders and staff outside the R&D departments. */
  departmentId: string | null;
  /** The project manager this person reports to (resources only). */
  managerId: string | null;
  /** This person's own available hours per year (part-timers have fewer). */
  capacityHoursPerYear: number;
}

export interface BusinessCase {
  fileName: string;
  summary: string;
}

export interface Project {
  id: string;
  platformId: string;
  name: string;
  description: string;
  /** The product manager who owns the project. */
  ownerId: string;
  /** The project manager who runs costs and resourcing. */
  projectManagerId: string;
  phase: Phase;
  startDate: ISODate;
  endDate: ISODate;
  type: ProjectType;
  component: Component;
  businessCase: BusinessCase | null;
  /** The goal this project commits to for the current quarter. */
  quarterlyGoal: string;
  approvalStatus: ApprovalStatus;
  /** Total hours the project needs; used later to find resourcing gaps. */
  plannedHours: number;
  /** Revenue projects only: default price per unit (sales may override). */
  defaultPricePerUnit: number | null;
  /** Revenue projects only: gross margin used until a unit cost breakdown exists. */
  grossMarginPct: number | null;
  /** True for subscriptions and warranty, false for one-off unit sales. */
  recurring: boolean;
}

// ---------- Defined now, seeded in later steps ----------

/** Share of a person's capacity given to a project (e.g. 50%). */
export interface Allocation {
  id: string;
  personId: string;
  projectId: string;
  percent: number;
}

export interface CostLine {
  id: string;
  projectId: string;
  kind: 'labour' | 'non-labour';
  label: string;
  departmentId: string | null;
  personId: string | null;
  hours: number | null;
  amount: number | null;
  granularity: Granularity;
  period: string; // e.g. "2026-Q3" or "2026-07"
  /** True when it comes from a hire that is not yet approved by Finance. */
  proposed: boolean;
}

export interface RevenuePlan {
  id: string;
  projectId: string;
  granularity: Granularity;
  unitsByPeriod: Record<string, number>;
  priceOverride: number | null;
  recurringMode: 'none' | 'linked-to-hardware' | 'standalone';
  attachRatePct: number | null;
  retentionPct: number | null;
  linkedHardwareProjectId: string | null;
}

export type HireStatus = 'Draft' | 'Awaiting Director' | 'Awaiting CTO' | 'Awaiting Finance' | 'Approved' | 'Rejected';

export interface ProposedHire {
  id: string;
  projectId: string;
  departmentId: string;
  startDate: ISODate;
  hours: number;
  status: HireStatus;
  history: { at: ISODate; by: string; action: string }[];
}

export type PlanStage = 'Propose' | 'Prioritise' | 'Resource' | 'Adjust' | 'Published';

export interface QuarterlyPlan {
  id: string;
  quarter: string; // e.g. "FY27-Q1"
  version: number;
  stage: PlanStage;
  rankedProjectIds: string[];
  committedProjectIds: string[];
  history: { at: ISODate; by: string; action: string }[];
}

export interface Comment {
  id: string;
  itemType: 'project' | 'cost-line' | 'revenue-plan' | 'hire' | 'plan-entry';
  itemId: string;
  authorId: string;
  text: string;
  mentions: string[];
  parentId: string | null;
  at: ISODate;
}

export interface UnitCostItem {
  id: string;
  projectId: string;
  component: string;
  quantity: number;
  unitCost: number;
}

/** Everything the app knows, in one object: the "single source of truth". */
export interface SeedData {
  platforms: Platform[];
  departments: Department[];
  people: Person[];
  projects: Project[];
}
