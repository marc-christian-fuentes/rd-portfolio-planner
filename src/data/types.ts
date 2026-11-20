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

// ---------- ROI calculator (step 7.3) ----------

/**
 * When cash is assumed to arrive within each year.
 * Mid-year: spread evenly through the year, so it is discounted by half a year less.
 * End-of-year: all on the last day of the year.
 */
export type DiscountConvention = 'mid-year' | 'end-of-year';

/** One year of inputs in a project's ROI model. Money is in $ thousands, except price. */
export interface RoiYear {
  units: number;
  /** $ per unit (not thousands). */
  price: number;
  marginPct: number;
  /** Cost savings, mainly for cost-only projects ($000s). */
  savings: number;
  /** Development spend ($000s). */
  rdCost: number;
  /** Running costs after launch: support, marketing, hosting ($000s). */
  opex: number;
}

/** A multi-year cash flow model for one project, created by its product manager. */
export interface RoiModel {
  projectId: string;
  /** Weighted average cost of capital, the discount rate (%). */
  waccPct: number;
  convention: DiscountConvention;
  startYear: number;
  years: RoiYear[];
  createdBy: string;
  updatedAt: ISODate;
}

// ---------- Defined now, seeded in later steps ----------

/** Share of a person's capacity given to a project (e.g. 50%). */
export interface Allocation {
  id: string;
  personId: string;
  projectId: string;
  percent: number;
}

/**
 * A non-labour cost such as testing materials or lab fees, planned per
 * month, quarter or year. (Labour costs come from allocations instead.)
 */
export interface CostLine {
  id: string;
  projectId: string;
  label: string;
  /** $ per period (not thousands). */
  amount: number;
  granularity: Granularity;
}

/**
 * How a revenue plan counts sales:
 * - none: one-off unit sales (e.g. hardware). Units are entered.
 * - linked-to-hardware: subscriptions or warranty sold with a hardware
 *   product. Subscribers = hardware units × attach rate, and each yearly
 *   renewal keeps the retention share.
 * - standalone: subscriptions sold on their own. Active subscribers are entered.
 */
export type RecurringMode = 'none' | 'linked-to-hardware' | 'standalone';

/** Sales' revenue plan for one project (spec section 5). */
export interface RevenuePlan {
  projectId: string;
  granularity: Granularity;
  /** Units (or active subscribers) per period, keyed "2027", "2027-Q1" or "2027-01". */
  unitsByPeriod: Record<string, number>;
  /** Sales' price per unit; null = the project's default price. */
  priceOverride: number | null;
  recurringMode: RecurringMode;
  attachRatePct: number;
  retentionPct: number;
  linkedHardwareProjectId: string | null;
}

export type HireStatus = 'Draft' | 'Awaiting Director' | 'Awaiting CTO' | 'Awaiting Finance' | 'Approved' | 'Rejected';

export interface ProposedHire {
  id: string;
  projectId: string;
  departmentId: string;
  startDate: ISODate;
  /** Hours per year on this project, from the start date until the project ends. */
  hours: number;
  status: HireStatus;
  history: { at: ISODate; by: string; action: string }[];
}

export type PlanStage = 'Propose' | 'Prioritise' | 'Resource' | 'Adjust' | 'Published';

/** Something that happened to the plan, for its history. */
export interface PlanEvent {
  at: ISODate;
  by: string;
  action: string;
}

/** A project a product manager submitted for the quarter. */
export interface PlanEntry {
  projectId: string;
  /** What the project commits to this quarter. */
  goal: string;
  submittedBy: string;
  submittedAt: ISODate;
}

/** A locked, published snapshot of the plan. */
export interface PlanVersion {
  version: number;
  at: ISODate;
  by: string;
  ranking: string[];
  committed: string[];
  note: string;
}

/** An urgent must-do project proposed after the plan was published. */
export interface PullIn {
  id: string;
  projectId: string;
  reason: string;
  proposedBy: string;
  at: ISODate;
  status: 'Pending' | 'Approved' | 'Rejected';
}

/** The quarter's R&D priorities as they move through the fixed stages (spec section 7). */
export interface QuarterlyPlan {
  quarter: string; // e.g. "Q1 2027"
  stage: PlanStage;
  entries: PlanEntry[];
  /** Project ids, highest priority first. */
  ranking: string[];
  /** Projects the CTO committed resources to. */
  committed: string[];
  /** How many projects the CTO approved; Adjust may swap but not exceed it. */
  approvedCount: number | null;
  versions: PlanVersion[];
  pullIns: PullIn[];
  history: PlanEvent[];
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

export type CostCategory = 'Materials' | 'Labour' | 'Overhead & logistics';

/** One line of a product's per-unit cost breakdown (spec section 8). */
export interface UnitCostItem {
  id: string;
  projectId: string;
  component: string;
  category: CostCategory;
  /** How many per finished unit (e.g. 0.35 hours of assembly). */
  quantity: number;
  /** $ per item (not thousands). */
  unitCost: number;
}

/** Everything the app knows, in one object: the "single source of truth". */
export interface SeedData {
  platforms: Platform[];
  departments: Department[];
  people: Person[];
  projects: Project[];
  /** Proposed hires; full workflow arrives in step 7.4. */
  hires: ProposedHire[];
}
