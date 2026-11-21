/**
 * SEED DATA
 * ---------
 * All fake. Every platform, project, person and number here is invented.
 * 3 product platforms, 15 projects spread across every phase,
 * 6 departments and 30 people (shaped like an HR system feed).
 */
import type { Allocation, AppUser, Assumptions, Comment, CostLine, Department, Person, Platform, Project, ProposedHire, SeedData } from './types';

// ---------- Product platforms ----------

const platforms: Platform[] = [
  {
    id: 'plat-aero',
    name: 'AeroSense',
    description: 'Indoor air quality monitor for offices and schools.',
    hardwarePiece: 'Wall-mounted air quality sensor',
    softwarePiece: 'Cloud dashboard with alerts',
  },
  {
    id: 'plat-flow',
    name: 'FlowGuard',
    description: 'Smart water valve that detects and stops leaks.',
    hardwarePiece: 'Motorised valve with flow sensor',
    softwarePiece: 'Leak detection mobile app',
  },
  {
    id: 'plat-volt',
    name: 'VoltGrid',
    description: 'Controller that manages home and small-business batteries.',
    hardwarePiece: 'Battery management controller board',
    softwarePiece: 'Energy optimisation service',
  },
];

// ---------- Departments ----------

const departments: Department[] = [
  { id: 'dept-sw', name: 'Software Engineering', ratePerHour: 95, capacityHoursPerYear: 1600 },
  { id: 'dept-hw', name: 'Hardware Engineering', ratePerHour: 105, capacityHoursPerYear: 1600 },
  { id: 'dept-ai', name: 'AI', ratePerHour: 120, capacityHoursPerYear: 1600 },
  { id: 'dept-pt', name: 'Project Team', ratePerHour: 85, capacityHoursPerYear: 1600 },
  { id: 'dept-qa', name: 'QA', ratePerHour: 70, capacityHoursPerYear: 1600 },
  { id: 'dept-prod', name: 'Product Management', ratePerHour: 90, capacityHoursPerYear: 1600 },
];

// ---------- People ----------

/** Small helper so each person fits on one line. */
function person(
  id: string,
  name: string,
  title: string,
  kind: Person['kind'],
  departmentId: string | null,
  managerId: string | null,
  capacityHoursPerYear = 1600,
): Person {
  return { id, name, title, kind, departmentId, managerId, capacityHoursPerYear };
}

const people: Person[] = [
  // Leadership and staff (not allocated to projects)
  person('ldr-ceo', 'Elena Vasquez', 'Chief Executive Officer', 'leader', null, null, 0),
  person('ldr-dir', 'Tom Okafor', 'Director of R&D', 'leader', null, null, 0),
  person('ldr-cto', 'Hana Kobayashi', 'Chief Technology Officer', 'leader', null, null, 0),
  person('ldr-fin', 'Raj Mehta', 'Head of Finance', 'leader', null, null, 0),
  person('stf-sales', 'Lucy Brennan', 'Sales Lead', 'staff', null, null, 0),
  person('stf-mfg', 'Diego Alvarez', 'Manufacturing Engineer', 'staff', null, null, 0),
  person('stf-admin', 'Sam Whitfield', 'Systems Administrator', 'staff', null, null, 0),

  // Project managers (Project Team)
  person('pjm-1', 'Priya Raman', 'Senior Project Manager', 'project-manager', 'dept-pt', null),
  person('pjm-2', 'Marcus Bell', 'Project Manager', 'project-manager', 'dept-pt', null),
  person('pjm-3', 'Ingrid Solberg', 'Project Manager', 'project-manager', 'dept-pt', null),

  // Product managers (Product Management)
  person('pdm-1', 'Aisha Karim', 'Product Manager, AeroSense', 'product-manager', 'dept-prod', null),
  person('pdm-2', 'Ben Castillo', 'Product Manager, FlowGuard', 'product-manager', 'dept-prod', null),
  person('pdm-3', 'Chloe Dubois', 'Product Manager, VoltGrid', 'product-manager', 'dept-prod', null),
  person('pdm-4', 'Daniel Osei', 'Product Manager, Platform AI', 'product-manager', 'dept-prod', null),

  // Software Engineering
  person('r-01', 'Ethan Park', 'Senior Software Engineer', 'resource', 'dept-sw', 'pjm-1'),
  person('r-02', 'Fatima Zahra', 'Software Engineer', 'resource', 'dept-sw', 'pjm-2'),
  person('r-03', 'George Lindqvist', 'Software Engineer', 'resource', 'dept-sw', 'pjm-2'),
  person('r-04', 'Mei Chen', 'Mobile Engineer', 'resource', 'dept-sw', 'pjm-2'),
  person('r-05', 'Noah Fischer', 'Backend Engineer', 'resource', 'dept-sw', 'pjm-3', 800),

  // Hardware Engineering
  person('r-06', 'Olivia Grant', 'Lead Hardware Engineer', 'resource', 'dept-hw', 'pjm-3'),
  person('r-07', 'Pavel Novak', 'Electronics Engineer', 'resource', 'dept-hw', 'pjm-3'),
  person('r-08', 'Rosa Medina', 'Mechanical Engineer', 'resource', 'dept-hw', 'pjm-2'),
  person('r-09', 'Kenji Ito', 'Firmware Engineer', 'resource', 'dept-hw', 'pjm-1'),

  // AI
  person('r-10', 'Leila Haddad', 'Machine Learning Engineer', 'resource', 'dept-ai', 'pjm-2'),
  person('r-11', 'Victor Moreau', 'Data Scientist', 'resource', 'dept-ai', 'pjm-3'),
  person('r-12', 'Yuki Tanaka', 'ML Engineer', 'resource', 'dept-ai', 'pjm-1', 1200),

  // QA
  person('r-13', 'Zoe Adams', 'QA Lead', 'resource', 'dept-qa', 'pjm-1'),
  person('r-14', 'Arjun Patel', 'Test Engineer', 'resource', 'dept-qa', 'pjm-3'),
  person('r-15', 'Hannah Weiss', 'Validation Engineer', 'resource', 'dept-qa', 'pjm-2'),

  // Project Team support
  person('r-16', 'Liam Walsh', 'Project Coordinator', 'resource', 'dept-pt', 'pjm-1'),
];

// ---------- Projects ----------

const projects: Project[] = [
  // AeroSense: every project completed, so the platform counts as launched.
  {
    id: 'prj-01',
    platformId: 'plat-aero',
    name: 'Sensor Hardware Rev B',
    description: 'Second revision of the air quality sensor with a cheaper particle sensor and longer battery life.',
    ownerId: 'pdm-1',
    projectManagerId: 'pjm-1',
    phase: 'Completed',
    startDate: '2024-07-01',
    endDate: '2025-12-31',
    type: 'revenue',
    component: 'hardware',
    businessCase: { fileName: 'sensor-rev-b-business-case.pdf', summary: 'Lower unit cost opens the schools market.' },
    quarterlyGoal: 'Ship to first 500 customers',
    approvalStatus: 'Approved',
    plannedHours: 6400,
    defaultPricePerUnit: 249,
    grossMarginPct: 45,
    recurring: false,
  },
  {
    id: 'prj-02',
    platformId: 'plat-aero',
    name: 'Air Quality Cloud Dashboard',
    description: 'Subscription dashboard with live readings, history and threshold alerts.',
    ownerId: 'pdm-1',
    projectManagerId: 'pjm-1',
    phase: 'Completed',
    startDate: '2025-01-01',
    endDate: '2026-03-31',
    type: 'revenue',
    component: 'software',
    businessCase: { fileName: 'aero-dashboard-business-case.pdf', summary: 'Recurring revenue attached to every sensor sold.' },
    quarterlyGoal: 'Reach 60% subscription attach rate',
    approvalStatus: 'Approved',
    plannedHours: 4800,
    defaultPricePerUnit: 60,
    grossMarginPct: 80,
    recurring: true,
  },
  {
    id: 'prj-03',
    platformId: 'plat-aero',
    name: 'Calibration Drift Fix',
    description: 'Troubleshoot and fix sensor readings drifting after 6 months in the field.',
    ownerId: 'pdm-1',
    projectManagerId: 'pjm-1',
    phase: 'Completed',
    startDate: '2025-10-01',
    endDate: '2026-06-30',
    type: 'cost-only',
    component: 'hardware',
    businessCase: { fileName: 'calibration-drift-rca.pdf', summary: 'Reduces returns and support calls.' },
    quarterlyGoal: 'Cut drift-related support tickets by 80%',
    approvalStatus: 'Approved',
    plannedHours: 1800,
    defaultPricePerUnit: null,
    grossMarginPct: null,
    recurring: false,
  },
  {
    id: 'prj-04',
    platformId: 'plat-aero',
    name: 'AeroSense Warranty Programme',
    description: 'One-year warranty billed on the initial order and renewed yearly.',
    ownerId: 'pdm-1',
    projectManagerId: 'pjm-1',
    phase: 'Completed',
    startDate: '2025-07-01',
    endDate: '2026-06-30',
    type: 'revenue',
    component: 'hardware',
    businessCase: { fileName: 'aero-warranty-business-case.pdf', summary: 'High-margin recurring revenue on installed base.' },
    quarterlyGoal: 'Warranty attached to 70% of new orders',
    approvalStatus: 'Approved',
    plannedHours: 900,
    defaultPricePerUnit: 35,
    grossMarginPct: 70,
    recurring: true,
  },

  // FlowGuard: projects in every phase.
  {
    id: 'prj-05',
    platformId: 'plat-flow',
    name: 'Valve Actuator v2',
    description: 'Quieter, lower-power valve motor with a built-in flow sensor.',
    ownerId: 'pdm-2',
    projectManagerId: 'pjm-3',
    phase: 'Testing / Validation',
    startDate: '2025-04-01',
    endDate: '2027-03-31',
    type: 'revenue',
    component: 'hardware',
    businessCase: { fileName: 'valve-v2-business-case.pdf', summary: 'Replaces v1 with 20% lower unit cost.' },
    quarterlyGoal: 'Pass 1,000-hour endurance test',
    approvalStatus: 'Approved',
    plannedHours: 7200,
    defaultPricePerUnit: 189,
    grossMarginPct: 40,
    recurring: false,
  },
  {
    id: 'prj-06',
    platformId: 'plat-flow',
    name: 'Leak Detection AI Model',
    description: 'Machine learning model that spots slow leaks from flow patterns. Sold as a subscription.',
    ownerId: 'pdm-4',
    projectManagerId: 'pjm-2',
    phase: 'In Development',
    startDate: '2026-01-01',
    endDate: '2027-06-30',
    type: 'revenue',
    component: 'software',
    businessCase: { fileName: 'leak-ai-business-case.pdf', summary: 'Premium tier that insurers will subsidise.' },
    quarterlyGoal: 'Model reaches 90% detection accuracy on pilot homes',
    approvalStatus: 'Approved',
    plannedHours: 5600,
    defaultPricePerUnit: 48,
    grossMarginPct: 85,
    recurring: true,
  },
  {
    id: 'prj-07',
    platformId: 'plat-flow',
    name: 'Mobile App Rebuild',
    description: 'Rebuild the ageing FlowGuard app on a modern framework to clear tech debt.',
    ownerId: 'pdm-2',
    projectManagerId: 'pjm-2',
    phase: 'In Development',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    type: 'cost-only',
    component: 'software',
    businessCase: { fileName: 'app-rebuild-case.pdf', summary: 'Halves time to ship app changes.' },
    quarterlyGoal: 'Beta app live for internal testers',
    approvalStatus: 'Approved',
    plannedHours: 4000,
    defaultPricePerUnit: null,
    grossMarginPct: null,
    recurring: false,
  },
  {
    id: 'prj-08',
    platformId: 'plat-flow',
    name: 'Firmware Over-the-Air Updates',
    description: 'Let valves receive firmware updates remotely instead of by technician visit.',
    ownerId: 'pdm-2',
    projectManagerId: 'pjm-3',
    phase: 'Approved',
    startDate: '2026-10-01',
    endDate: '2027-09-30',
    type: 'cost-only',
    component: 'hardware',
    businessCase: { fileName: 'ota-updates-case.pdf', summary: 'Removes most field service visits.' },
    quarterlyGoal: 'Secure update pipeline designed and reviewed',
    approvalStatus: 'Approved',
    plannedHours: 3200,
    defaultPricePerUnit: null,
    grossMarginPct: null,
    recurring: false,
  },
  {
    id: 'prj-09',
    platformId: 'plat-flow',
    name: 'Water Usage Insights',
    description: 'Monthly water usage reports and saving tips, sold as an add-on subscription.',
    ownerId: 'pdm-2',
    projectManagerId: 'pjm-2',
    phase: 'Proposed',
    startDate: '2027-01-01',
    endDate: '2027-12-31',
    type: 'revenue',
    component: 'software',
    businessCase: { fileName: 'usage-insights-business-case.pdf', summary: 'Low-effort upsell on existing data.' },
    quarterlyGoal: 'Validate pricing with 50 customer interviews',
    approvalStatus: 'Pending',
    plannedHours: 2400,
    defaultPricePerUnit: 24,
    grossMarginPct: 85,
    recurring: true,
  },
  {
    id: 'prj-10',
    platformId: 'plat-flow',
    name: 'Flow Sensor Cost Reduction',
    description: 'Explore a cheaper flow sensor supplier without losing accuracy.',
    ownerId: 'pdm-2',
    projectManagerId: 'pjm-3',
    phase: 'Scoping',
    startDate: '2027-04-01',
    endDate: '2028-03-31',
    type: 'cost-only',
    component: 'hardware',
    businessCase: null,
    quarterlyGoal: 'Shortlist two alternative suppliers',
    approvalStatus: 'Not submitted',
    plannedHours: 1500,
    defaultPricePerUnit: null,
    grossMarginPct: null,
    recurring: false,
  },

  // VoltGrid: projects in every phase except Completed.
  {
    id: 'prj-11',
    platformId: 'plat-volt',
    name: 'Battery Controller Board',
    description: 'Main controller board that balances cells and reports battery health.',
    ownerId: 'pdm-3',
    projectManagerId: 'pjm-3',
    phase: 'In Development',
    startDate: '2025-10-01',
    endDate: '2027-09-30',
    type: 'revenue',
    component: 'hardware',
    businessCase: { fileName: 'voltgrid-board-business-case.pdf', summary: 'Entry into the home battery market.' },
    quarterlyGoal: 'Second prototype passes thermal tests',
    approvalStatus: 'Approved',
    plannedHours: 8800,
    defaultPricePerUnit: 399,
    grossMarginPct: 38,
    recurring: false,
  },
  {
    id: 'prj-12',
    platformId: 'plat-volt',
    name: 'Energy Optimisation Service',
    description: 'Cloud service that charges batteries when power is cheap and uses them when it is expensive.',
    ownerId: 'pdm-3',
    projectManagerId: 'pjm-1',
    phase: 'Approved',
    startDate: '2026-07-01',
    endDate: '2028-06-30',
    type: 'revenue',
    component: 'software',
    businessCase: { fileName: 'energy-optimisation-business-case.pdf', summary: 'Subscription that pays for itself in saved energy.' },
    quarterlyGoal: 'Architecture approved and team staffed',
    approvalStatus: 'Approved',
    plannedHours: 6000,
    defaultPricePerUnit: 120,
    grossMarginPct: 82,
    recurring: true,
  },
  {
    id: 'prj-13',
    platformId: 'plat-volt',
    name: 'Thermal Safety Validation',
    description: 'Independent safety testing needed before the controller can be certified.',
    ownerId: 'pdm-3',
    projectManagerId: 'pjm-3',
    phase: 'Testing / Validation',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    type: 'cost-only',
    component: 'hardware',
    businessCase: { fileName: 'thermal-safety-plan.pdf', summary: 'Required for certification; no direct revenue.' },
    quarterlyGoal: 'Certification lab report received',
    approvalStatus: 'Approved',
    plannedHours: 2200,
    defaultPricePerUnit: null,
    grossMarginPct: null,
    recurring: false,
  },
  {
    id: 'prj-14',
    platformId: 'plat-volt',
    name: 'Predictive Maintenance AI',
    description: 'Predict battery faults weeks ahead and alert installers.',
    ownerId: 'pdm-4',
    projectManagerId: 'pjm-1',
    phase: 'Proposed',
    startDate: '2027-01-01',
    endDate: '2028-06-30',
    type: 'revenue',
    component: 'software',
    businessCase: { fileName: 'predictive-maintenance-business-case.pdf', summary: 'Installer subscription that cuts truck rolls.' },
    quarterlyGoal: 'Collect 6 months of fault data from pilot sites',
    approvalStatus: 'Pending',
    plannedHours: 4400,
    defaultPricePerUnit: 72,
    grossMarginPct: 80,
    recurring: true,
  },
  {
    id: 'prj-15',
    platformId: 'plat-volt',
    name: 'Grid Tariff Integration',
    description: 'Pull live electricity prices from utility companies into the optimisation service.',
    ownerId: 'pdm-3',
    projectManagerId: 'pjm-2',
    phase: 'Scoping',
    startDate: '2027-07-01',
    endDate: '2028-06-30',
    type: 'revenue',
    component: 'software',
    businessCase: null,
    quarterlyGoal: 'Confirm which utilities offer a price API',
    approvalStatus: 'Not submitted',
    plannedHours: 2000,
    defaultPricePerUnit: 36,
    grossMarginPct: 85,
    recurring: true,
  },
];

// ---------- Proposed hires (pending approval: Director → CTO → Finance) ----------

const hires: ProposedHire[] = [
  {
    id: 'hire-1',
    projectId: 'prj-11',
    departmentId: 'dept-hw',
    startDate: '2027-01-04',
    hours: 1600,
    status: 'Awaiting CTO',
    history: [
      { at: '2026-10-20', by: 'pjm-3', action: 'Proposed to close a hardware capacity gap' },
      { at: '2026-10-24', by: 'ldr-dir', action: 'Approved by Director' },
    ],
  },
  {
    id: 'hire-2',
    projectId: 'prj-06',
    departmentId: 'dept-ai',
    startDate: '2027-02-01',
    hours: 1000,
    status: 'Awaiting Director',
    history: [{ at: '2026-11-05', by: 'pjm-2', action: 'Proposed to close an AI capacity gap' }],
  },
  {
    id: 'hire-3',
    projectId: 'prj-12',
    departmentId: 'dept-sw',
    startDate: '2027-01-04',
    hours: 900,
    status: 'Awaiting Finance',
    history: [
      { at: '2026-10-02', by: 'pjm-1', action: 'Proposed to staff the optimisation service' },
      { at: '2026-10-06', by: 'ldr-dir', action: 'Approved by Director' },
      { at: '2026-10-13', by: 'ldr-cto', action: 'Approved by CTO' },
    ],
  },
];

// ---------- Users: everyone who can use the app, and what they see ----------
// Product managers see the projects they own; project managers the ones they run.

const users: AppUser[] = [
  { personId: 'ldr-ceo', role: 'Leadership', visibleProjectIds: [] },
  { personId: 'ldr-dir', role: 'Leadership', visibleProjectIds: [] },
  { personId: 'ldr-cto', role: 'CTO', visibleProjectIds: [] },
  { personId: 'ldr-fin', role: 'Finance', visibleProjectIds: [] },
  { personId: 'stf-sales', role: 'Sales', visibleProjectIds: [] },
  { personId: 'stf-mfg', role: 'Manufacturing', visibleProjectIds: [] },
  { personId: 'stf-admin', role: 'Admin', visibleProjectIds: [] },
  ...people
    .filter((p) => p.kind === 'product-manager')
    .map((p) => ({ personId: p.id, role: 'Product Manager' as const, visibleProjectIds: projects.filter((x) => x.ownerId === p.id).map((x) => x.id) })),
  ...people
    .filter((p) => p.kind === 'project-manager')
    .map((p) => ({ personId: p.id, role: 'Project Manager' as const, visibleProjectIds: projects.filter((x) => x.projectManagerId === p.id).map((x) => x.id) })),
];

export const seed: SeedData = { platforms, departments, people, projects, hires, users };

// ---------- Assumptions ----------

export const seedAssumptions: Assumptions = {
  fiscalStartMonth: 1,
  periodView: 'calendar',
  defaultGrossMarginPct: 40,
  defaultWarrantyPrice: 35,
  defaultAttachRatePct: 72,
  defaultRetentionPct: 80,
};

// ---------- Comments ----------

export const seedComments: Comment[] = [
  {
    id: 'cm-1',
    itemType: 'project',
    itemId: 'prj-11',
    authorId: 'pdm-3',
    text: 'Second prototype thermal results look good. @Ingrid Solberg can we confirm the certification lab slot for January?',
    mentions: ['pjm-3'],
    parentId: null,
    at: '2026-11-14',
  },
  {
    id: 'cm-2',
    itemType: 'project',
    itemId: 'prj-11',
    authorId: 'pjm-3',
    text: 'Booked for January 12. @Chloe Dubois I’ll share the test plan this week.',
    mentions: ['pdm-3'],
    parentId: 'cm-1',
    at: '2026-11-15',
  },
  {
    id: 'cm-3',
    itemType: 'plan-entry',
    itemId: 'prj-06',
    authorId: 'pdm-4',
    text: 'Leak detection dropped two places since Q4. @Tom Okafor could you share the reasoning?',
    mentions: ['ldr-dir'],
    parentId: null,
    at: '2026-11-16',
  },
  {
    id: 'cm-4',
    itemType: 'hire',
    itemId: 'hire-2',
    authorId: 'pjm-2',
    text: '@Tom Okafor this AI hire unblocks the 90% accuracy goal for Q1.',
    mentions: ['ldr-dir'],
    parentId: null,
    at: '2026-11-06',
  },
  {
    id: 'cm-5',
    itemType: 'revenue-plan',
    itemId: 'prj-11',
    authorId: 'stf-sales',
    text: 'Launch price set to $379 after distributor feedback. @Raj Mehta FYI for the forecast.',
    mentions: ['ldr-fin'],
    parentId: null,
    at: '2026-11-18',
  },
  {
    id: 'cm-6',
    itemType: 'project',
    itemId: 'prj-05',
    authorId: 'pdm-2',
    text: '@Diego Alvarez can we get the updated valve body quote into the unit cost?',
    mentions: ['stf-mfg'],
    parentId: null,
    at: '2026-11-19',
  },
];

// ---------- Allocations: % of each person's year given to each project ----------
// Some people are deliberately left with spare time, and one (Pavel Novak) is
// over-allocated, so the capacity view has something to flag.

const alloc = (personId: string, projectId: string, percent: number): Allocation => ({
  id: `al-${personId}-${projectId}`,
  personId,
  projectId,
  percent,
});

export const seedAllocations: Allocation[] = [
  // Priya Raman's team → Energy Optimisation Service
  alloc('r-01', 'prj-12', 50),
  alloc('r-12', 'prj-12', 40),
  alloc('r-13', 'prj-12', 30),
  alloc('r-16', 'prj-12', 20),
  // Marcus Bell's team → Leak Detection AI Model and Mobile App Rebuild
  alloc('r-10', 'prj-06', 90),
  alloc('r-02', 'prj-06', 30),
  alloc('r-15', 'prj-06', 30),
  alloc('r-03', 'prj-06', 20),
  alloc('r-04', 'prj-07', 100),
  alloc('r-03', 'prj-07', 70),
  alloc('r-02', 'prj-07', 50),
  alloc('r-15', 'prj-07', 40),
  // Ingrid Solberg's team → Valve Actuator v2, OTA Updates, Battery Controller Board, Thermal Safety
  alloc('r-06', 'prj-11', 60),
  alloc('r-06', 'prj-05', 40),
  alloc('r-07', 'prj-11', 50),
  alloc('r-07', 'prj-05', 30),
  alloc('r-07', 'prj-13', 30),
  alloc('r-05', 'prj-08', 60),
  alloc('r-05', 'prj-11', 40),
  alloc('r-11', 'prj-11', 30),
  alloc('r-11', 'prj-08', 40),
  alloc('r-11', 'prj-05', 20),
  alloc('r-14', 'prj-13', 50),
  alloc('r-14', 'prj-05', 50),
];

// ---------- Non-labour costs ($ per period) ----------

export const seedCostLines: CostLine[] = [
  { id: 'cl-1', projectId: 'prj-13', label: 'Certification lab fees', amount: 45000, granularity: 'quarterly' },
  { id: 'cl-2', projectId: 'prj-13', label: 'Thermal chamber rental', amount: 6000, granularity: 'monthly' },
  { id: 'cl-3', projectId: 'prj-05', label: 'Endurance test rigs', amount: 25000, granularity: 'quarterly' },
  { id: 'cl-4', projectId: 'prj-11', label: 'Prototype PCB runs', amount: 18000, granularity: 'quarterly' },
  { id: 'cl-5', projectId: 'prj-06', label: 'Cloud GPU training', amount: 9000, granularity: 'monthly' },
  { id: 'cl-6', projectId: 'prj-12', label: 'Staging cloud hosting', amount: 4000, granularity: 'monthly' },
  { id: 'cl-7', projectId: 'prj-08', label: 'Field test units', amount: 30000, granularity: 'annual' },
];
