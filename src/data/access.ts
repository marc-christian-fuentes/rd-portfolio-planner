/**
 * ROLE VISIBILITY
 * ---------------
 * Who can see which pages and which projects (spec section 3).
 * There are no logins: the role switcher at the top picks a role,
 * and these rules decide what that role sees.
 */
import type { Person, Project, Role, SeedData } from './types';

export type SectionId =
  | 'inbox'
  | 'summary'
  | 'platform'
  | 'project'
  | 'forecast'
  | 'roadmap'
  | 'submission'
  | 'prioritisation'
  | 'manufacturing'
  | 'resourcing'
  | 'capacity'
  | 'sales'
  | 'assumptions'
  | 'admin';

export interface Section {
  id: SectionId;
  label: string;
  path: string;
  /** Menu heading this page sits under, e.g. "Portfolio". */
  group?: string;
  /** Which build step (spec section 13, step 7) fills this page in. */
  step: string;
  description: string;
}

/** Menu order, top to bottom. */
export const SECTIONS: Section[] = [
  { id: 'inbox', label: 'Inbox', path: '/inbox', step: '7.8', description: 'Mentions, replies and pending approvals.' },
  { id: 'summary', group: 'Portfolio', label: 'Summary', path: '/', step: '7.3', description: 'Every product platform side by side: revenue, costs, NPV and hours. Filter by product manager.' },
  { id: 'platform', group: 'Portfolio', label: 'Platform view', path: '/platform', step: '7.3', description: 'One product platform’s rolled-up P&L, with its projects alongside.' },
  { id: 'project', group: 'Portfolio', label: 'Project view', path: '/project', step: '7.3', description: 'The ROI calculator for each project: a multi-year cash flow model with live NPV, ROI, IRR and payback, discounted at WACC with mid-year timing.' },
  { id: 'forecast', label: 'Forecast', path: '/forecast', step: '7.3', description: 'The P&L and cash flow that feed the corporate plan, by year and by project.' },
  { id: 'roadmap', label: 'Roadmap', path: '/roadmap', step: '7.3', description: 'Every project on a timeline, showing when it starts and how long it runs.' },
  { id: 'submission', group: 'Quarterly planning', label: 'Project submission', path: '/planning/submit', step: '7.6', description: 'Product managers submit projects for the quarter, each with its ROI, description and quarterly goal.' },
  { id: 'prioritisation', group: 'Quarterly planning', label: 'Prioritisation', path: '/planning/prioritise', step: '7.6', description: 'Directors, the CEO and the CTO rank submitted projects by drag and drop, or with Rank by comparing: two projects side by side, pick one, repeat.' },
  { id: 'manufacturing', label: 'Unit cost builder', path: '/manufacturing', step: '7.7', description: 'Itemise per-unit components to replace the gross margin estimate with real COGS.' },
  { id: 'resourcing', group: 'Project management', label: 'Costs & resourcing', path: '/resourcing', step: '7.4', description: 'Itemise costs, assign people to projects, and turn capacity gaps into proposed hires.' },
  { id: 'capacity', group: 'Project management', label: 'Capacity', path: '/capacity', step: '7.4', description: 'Utilisation by department and person across all projects.' },
  { id: 'sales', label: 'Sales pipeline', path: '/sales', step: '7.5', description: 'Projects from Proposed onwards as a pipeline board, with revenue planning, recurring revenue and warranty.' },
  { id: 'assumptions', label: 'Assumptions', path: '/assumptions', step: '7.8', description: 'Fiscal year, department rates and capacity, and default revenue settings.' },
  { id: 'admin', label: 'Admin', path: '/admin', step: '7.8', description: 'Users, role visibility and mocked integrations.' },
];

export type Access = 'edit' | 'view';

const LEADERS_VIEW = { Leadership: 'view', CTO: 'view', Finance: 'view' } as const;

/** The role visibility matrix: which sections each role can see or edit. Missing = hidden. */
export const ACCESS: Record<SectionId, Partial<Record<Role, Access>>> = {
  // (Admin can edit this matrix in the app; see applyAccessMatrix below.)
  inbox: {
    Leadership: 'edit', CTO: 'edit', Finance: 'edit', 'Product Manager': 'edit', 'Project Manager': 'edit',
    Sales: 'edit', Manufacturing: 'edit', Admin: 'edit',
  },
  summary: { ...LEADERS_VIEW, 'Product Manager': 'view', 'Project Manager': 'view' },
  platform: { ...LEADERS_VIEW, 'Product Manager': 'view', 'Project Manager': 'view' },
  project: { ...LEADERS_VIEW, 'Product Manager': 'edit', 'Project Manager': 'view' },
  forecast: { ...LEADERS_VIEW, 'Product Manager': 'view', 'Project Manager': 'view' },
  roadmap: { ...LEADERS_VIEW, 'Product Manager': 'view', 'Project Manager': 'view', Sales: 'view', Manufacturing: 'view' },
  submission: { ...LEADERS_VIEW, Leadership: 'edit', 'Product Manager': 'edit' },
  prioritisation: { Leadership: 'edit', CTO: 'edit', Finance: 'view', 'Product Manager': 'edit' },
  manufacturing: { ...LEADERS_VIEW, Manufacturing: 'edit' },
  resourcing: { Leadership: 'edit', CTO: 'edit', Finance: 'edit', 'Project Manager': 'edit' },
  capacity: { ...LEADERS_VIEW, 'Project Manager': 'view' },
  sales: { ...LEADERS_VIEW, Sales: 'edit' },
  assumptions: { ...LEADERS_VIEW, Finance: 'edit', Admin: 'edit' },
  admin: { ...LEADERS_VIEW, Admin: 'edit' },
};

/** Fiscal or calendar year labels, e.g. 2027 → "FY27" when fiscal. */
export function yearLabel(year: number, view: 'fiscal' | 'calendar'): string {
  return view === 'fiscal' ? `FY${String(year).slice(2)}` : String(year);
}

/** The months a fiscal year covers, e.g. FY27 starting October → "Oct 2026 – Sep 2027". */
export function fiscalRange(year: number, startMonth: number): string {
  const start = new Date(startMonth === 1 ? year : year - 1, startMonth - 1, 1);
  const end = new Date(start.getFullYear() + 1, start.getMonth() - 1, 1);
  const f = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${f(start)} – ${f(end)}`;
}

export type AccessMatrix = Record<SectionId, Partial<Record<Role, Access>>>;

/** A copy of the built-in matrix, for resetting. */
export const DEFAULT_ACCESS: AccessMatrix = JSON.parse(JSON.stringify(ACCESS));

/**
 * Admin can change the matrix. The store keeps the saved version and calls
 * this to apply it; every page reads ACCESS through accessFor / canSee.
 */
export function applyAccessMatrix(matrix: AccessMatrix) {
  for (const key of Object.keys(ACCESS) as SectionId[]) ACCESS[key] = { ...(matrix[key] ?? DEFAULT_ACCESS[key]) };
  // Admin can never lock themselves out of the Admin page.
  ACCESS.admin.Admin = 'edit';
}

export function accessFor(role: Role, section: SectionId): Access | undefined {
  return ACCESS[section][role];
}

export function canSee(role: Role, section: SectionId): boolean {
  return accessFor(role, section) !== undefined;
}

/** The page each role lands on when it is selected. */
const HOME: Partial<Record<Role, SectionId>> = { Sales: 'sales', Manufacturing: 'manufacturing', Admin: 'admin' };

export function homePath(role: Role): string {
  const home = HOME[role] ?? 'summary';
  return SECTIONS.find((s) => s.id === home)!.path;
}

/** One-line explanation shown under the role switcher. */
export const ROLE_SUMMARY: Record<Role, string> = {
  Leadership: 'Sees everything. Ranks and adjusts the quarterly plan, and approves hires as Director.',
  CTO: 'Sees everything. Commits resources to the quarterly plan and approves hires.',
  'Product Manager': 'Sees only their own projects. Proposes projects for the quarter and comments on priorities.',
  'Project Manager': 'Sees only assigned projects. Plans costs and resourcing, and proposes hires.',
  Sales: 'Sees projects from Proposed onwards, revenue side only. No costs.',
  Manufacturing: 'Builds per-unit costs for hardware products.',
  Finance: 'Sees everything. Gives final approval on hires and owns the assumptions.',
  Admin: 'Manages users, role visibility and (mock) integrations.',
};

/** Only the product manager who owns a project can create or edit its ROI model. */
export function canEditRoi(role: Role, personId: string, project: Project): boolean {
  return role === 'Product Manager' && project.ownerId === personId;
}

/** Whether a role may see cost figures at all. */
export function canSeeCosts(role: Role): boolean {
  return role !== 'Sales';
}

/** The people a role can "act as": every user with that role (set in Admin). */
export function peopleForRole(data: SeedData, role: Role): Person[] {
  return data.users
    .filter((u) => u.role === role)
    .map((u) => data.people.find((p) => p.id === u.personId))
    .filter((p): p is Person => p !== undefined);
}

/**
 * The projects a role (acting as a given person) is allowed to see.
 * Product and project managers see the projects listed on their user record,
 * which Admin can change.
 */
export function visibleProjects(data: SeedData, role: Role, personId: string): Project[] {
  const user = data.users.find((u) => u.personId === personId && u.role === role);
  switch (role) {
    case 'Product Manager':
      return user ? data.projects.filter((p) => user.visibleProjectIds.includes(p.id)) : data.projects.filter((p) => p.ownerId === personId);
    case 'Project Manager':
      return user ? data.projects.filter((p) => user.visibleProjectIds.includes(p.id)) : data.projects.filter((p) => p.projectManagerId === personId);
    case 'Sales':
      return data.projects.filter((p) => p.phase !== 'Scoping');
    case 'Manufacturing':
      return data.projects.filter((p) => p.component === 'hardware' && p.type === 'revenue');
    default:
      return data.projects;
  }
}
