/**
 * ROLE VISIBILITY
 * ---------------
 * Who can see which pages and which projects (spec section 3).
 * There are no logins: the role switcher at the top picks a role,
 * and these rules decide what that role sees.
 */
import type { Person, Project, Role, SeedData } from './types';

export type SectionId =
  | 'portfolio'
  | 'roi'
  | 'resourcing'
  | 'capacity'
  | 'sales'
  | 'planning'
  | 'manufacturing'
  | 'assumptions'
  | 'admin'
  | 'inbox';

export interface Section {
  id: SectionId;
  label: string;
  path: string;
  /** Which build step (spec section 13, step 7) fills this page in. */
  step: string;
  description: string;
}

export const SECTIONS: Section[] = [
  { id: 'portfolio', label: 'Portfolio', path: '/', step: '7.3', description: 'All product platforms and projects, with phase, type and ROI. Drill down to the ROI calculator.' },
  { id: 'roi', label: 'ROI calculator', path: '/roi', step: '7.3', description: 'A multi-year cash flow model per project. NPV, ROI, IRR and payback update live as you type, discounted at WACC with mid-year timing.' },
  { id: 'resourcing', label: 'Costs & resourcing', path: '/resourcing', step: '7.4', description: 'Itemise costs, assign people to projects, and turn capacity gaps into proposed hires.' },
  { id: 'capacity', label: 'Capacity', path: '/capacity', step: '7.4', description: 'Utilisation by department and person across all projects.' },
  { id: 'sales', label: 'Sales pipeline', path: '/sales', step: '7.5', description: 'Projects from Proposed onwards as a pipeline board, with revenue planning, recurring revenue and warranty.' },
  { id: 'planning', label: 'Quarterly planning', path: '/planning', step: '7.6', description: 'Propose, prioritise (including Rank by comparing), resource, adjust and publish the quarter’s R&D priorities.' },
  { id: 'manufacturing', label: 'Unit cost builder', path: '/manufacturing', step: '7.7', description: 'Itemise per-unit components to replace the gross margin estimate with real COGS.' },
  { id: 'assumptions', label: 'Assumptions', path: '/assumptions', step: '7.8', description: 'Fiscal year, department rates and capacity, and default revenue settings.' },
  { id: 'admin', label: 'Admin', path: '/admin', step: '7.8', description: 'Users, role visibility and mocked integrations.' },
  { id: 'inbox', label: 'Inbox', path: '/inbox', step: '7.8', description: 'Mentions, replies and pending approvals.' },
];

export type Access = 'edit' | 'view';

/** The role visibility matrix: which sections each role can see or edit. Missing = hidden. */
export const ACCESS: Record<SectionId, Partial<Record<Role, Access>>> = {
  portfolio: { Leadership: 'view', CTO: 'view', Finance: 'view', 'Product Manager': 'edit', 'Project Manager': 'view' },
  roi: { Leadership: 'view', CTO: 'view', Finance: 'view', 'Product Manager': 'edit', 'Project Manager': 'view' },
  resourcing: { Leadership: 'edit', CTO: 'edit', Finance: 'edit', 'Project Manager': 'edit' },
  capacity: { Leadership: 'view', CTO: 'view', Finance: 'view', 'Project Manager': 'view' },
  sales: { Leadership: 'view', CTO: 'view', Finance: 'view', Sales: 'edit' },
  planning: { Leadership: 'edit', CTO: 'edit', Finance: 'view', 'Product Manager': 'edit' },
  manufacturing: { Leadership: 'view', CTO: 'view', Finance: 'view', Manufacturing: 'edit' },
  assumptions: { Leadership: 'view', CTO: 'view', Finance: 'edit', Admin: 'edit' },
  admin: { Leadership: 'view', CTO: 'view', Finance: 'view', Admin: 'edit' },
  inbox: {
    Leadership: 'edit', CTO: 'edit', Finance: 'edit', 'Product Manager': 'edit', 'Project Manager': 'edit',
    Sales: 'edit', Manufacturing: 'edit', Admin: 'edit',
  },
};

export function accessFor(role: Role, section: SectionId): Access | undefined {
  return ACCESS[section][role];
}

export function canSee(role: Role, section: SectionId): boolean {
  return accessFor(role, section) !== undefined;
}

/** The page each role lands on when it is selected. */
const HOME: Partial<Record<Role, SectionId>> = { Sales: 'sales', Manufacturing: 'manufacturing', Admin: 'admin' };

export function homePath(role: Role): string {
  const home = HOME[role] ?? 'portfolio';
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

/** The demo people a role can "act as" (e.g. which product manager). */
export function peopleForRole(data: SeedData, role: Role): Person[] {
  const byIds = (ids: string[]) => data.people.filter((p) => ids.includes(p.id));
  switch (role) {
    case 'Leadership':
      return byIds(['ldr-ceo', 'ldr-dir']);
    case 'CTO':
      return byIds(['ldr-cto']);
    case 'Finance':
      return byIds(['ldr-fin']);
    case 'Product Manager':
      return data.people.filter((p) => p.kind === 'product-manager');
    case 'Project Manager':
      return data.people.filter((p) => p.kind === 'project-manager');
    case 'Sales':
      return byIds(['stf-sales']);
    case 'Manufacturing':
      return byIds(['stf-mfg']);
    case 'Admin':
      return byIds(['stf-admin']);
  }
}

/** The projects a role (acting as a given person) is allowed to see. */
export function visibleProjects(data: SeedData, role: Role, personId: string): Project[] {
  switch (role) {
    case 'Product Manager':
      return data.projects.filter((p) => p.ownerId === personId);
    case 'Project Manager':
      return data.projects.filter((p) => p.projectManagerId === personId);
    case 'Sales':
      return data.projects.filter((p) => p.phase !== 'Scoping');
    case 'Manufacturing':
      return data.projects.filter((p) => p.component === 'hardware' && p.type === 'revenue');
    default:
      return data.projects;
  }
}
