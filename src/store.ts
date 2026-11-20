/**
 * APP STORE
 * ---------
 * The single shared place the whole app reads from: the demo data, the
 * selected role, each project's ROI model, people's allocations to
 * projects, non-labour costs and proposed hires.
 * Built with the "zustand" library.
 *
 * Everything you can edit is saved in the browser, so it survives a page
 * refresh. (The Reset demo button comes in step 7.9.)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seed, seedAllocations, seedCostLines } from './data/seed';
import type { Allocation, CostLine, Granularity, PlanStage, ProposedHire, QuarterlyPlan, RevenuePlan, Role, RoiModel, RoiYear, SeedData } from './data/types';
import { PLAN_STAGES, seedPlan } from './data/planning';
import { applyUnitCost, seedUnitCosts, unitCostOf } from './data/unitcost';
import type { CostCategory, UnitCostItem } from './data/types';
import { peopleForRole } from './data/access';
import { MAX_YEARS, MIN_YEARS, computeRoi, createDefaultRoiModel, seedRoiModels } from './data/roi';
import { currentStep, hireCostsForModel, nextStatus } from './data/resourcing';
import { applyRevenuePlan, convertGranularity, createRevenuePlan, enteredForYear, seedRevenuePlans } from './data/revenue';
import type { RoiLookup } from './data/rollup';

const seededModels = seedRoiModels(seed.projects);
const goalOf = (projectId: string) => seed.projects.find((p) => p.id === projectId)?.quarterlyGoal ?? '';
const projectName = (projectId: string) => seed.projects.find((p) => p.id === projectId)?.name ?? projectId;

const today = () => new Date().toISOString().slice(0, 10);
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

interface AppState {
  data: SeedData;
  role: Role;
  /** Which demo person the role is acting as (e.g. which product manager). */
  actingAsId: string;
  /** ROI model per project id. A project without one has no entry. */
  roiModels: Record<string, RoiModel>;
  allocations: Allocation[];
  costLines: CostLine[];
  hires: ProposedHire[];
  /** Whether hires still awaiting approval count in ROI and forecasts. */
  includePendingHires: boolean;
  /** Sales' revenue plan per project id. */
  revenuePlans: Record<string, RevenuePlan>;
  /** This quarter's R&D plan. */
  plan: QuarterlyPlan;
  /** Manufacturing's per-unit cost breakdowns, all products. */
  unitCosts: UnitCostItem[];

  setRole: (role: Role) => void;
  setActingAs: (personId: string) => void;
  createRoiModel: (projectId: string) => void;
  updateRoiModel: (projectId: string, patch: Partial<Pick<RoiModel, 'waccPct' | 'convention' | 'startYear'>>) => void;
  updateRoiYear: (projectId: string, index: number, patch: Partial<RoiYear>) => void;
  setRoiHorizon: (projectId: string, years: number) => void;

  setAllocation: (personId: string, projectId: string, percent: number) => void;
  addCostLine: (projectId: string) => void;
  updateCostLine: (id: string, patch: Partial<Pick<CostLine, 'label' | 'amount' | 'granularity'>>) => void;
  removeCostLine: (id: string) => void;
  proposeHire: (hire: Pick<ProposedHire, 'projectId' | 'departmentId' | 'startDate' | 'hours'>) => void;
  decideHire: (hireId: string, approve: boolean) => void;
  setIncludePendingHires: (include: boolean) => void;

  createRevenuePlan: (projectId: string) => void;
  updateRevenuePlan: (projectId: string, patch: Partial<Omit<RevenuePlan, 'projectId' | 'unitsByPeriod' | 'granularity'>>) => void;
  setPlanUnits: (projectId: string, periodKey: string, value: number) => void;
  setPlanGranularity: (projectId: string, granularity: Granularity, years: number[]) => void;

  submitToPlan: (projectId: string, goal: string) => void;
  withdrawFromPlan: (projectId: string) => void;
  updatePlanGoal: (projectId: string, goal: string) => void;
  advancePlanStage: () => void;
  setPlanRanking: (ranking: string[], how: string) => void;
  setCommitted: (projectId: string, committed: boolean) => void;
  proposePullIn: (projectId: string, reason: string) => void;
  decidePullIn: (pullInId: string, approve: boolean) => void;
  restartPlan: () => void;

  startUnitCost: (projectId: string, estimate: number | null) => void;
  addUnitCostItem: (projectId: string) => void;
  updateUnitCostItem: (id: string, patch: Partial<Pick<UnitCostItem, 'component' | 'category' | 'quantity' | 'unitCost'>>) => void;
  removeUnitCostItem: (id: string) => void;
  clearUnitCost: (projectId: string) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => {
      /** Apply a change to one project's model and stamp the date. */
      const editModel = (projectId: string, change: (m: RoiModel) => RoiModel) => {
        const current = get().roiModels[projectId];
        if (!current) return;
        set({ roiModels: { ...get().roiModels, [projectId]: { ...change(current), updatedAt: today() } } });
      };

      /** Apply a change to the quarterly plan and log it, unless nothing changed. */
      const changePlan = (action: string, change: (p: QuarterlyPlan) => QuarterlyPlan) => {
        const before = get().plan;
        const after = change(before);
        if (after === before) return;
        set({ plan: { ...after, history: [...after.history, { at: today(), by: get().actingAsId, action }] } });
      };

      return {
        data: seed,
        role: 'Leadership',
        actingAsId: 'ldr-ceo',
        roiModels: seededModels,
        allocations: seedAllocations,
        costLines: seedCostLines,
        hires: seed.hires,
        includePendingHires: true,
        revenuePlans: seedRevenuePlans(seed.projects, seededModels),
        plan: seedPlan(goalOf),
        unitCosts: seedUnitCosts,

        setRole: (role) => set({ role, actingAsId: peopleForRole(get().data, role)[0]?.id ?? '' }),
        setActingAs: (actingAsId) => set({ actingAsId }),

        createRoiModel: (projectId) => {
          const project = get().data.projects.find((p) => p.id === projectId);
          if (!project || get().roiModels[projectId]) return;
          set({ roiModels: { ...get().roiModels, [projectId]: createDefaultRoiModel(project, get().actingAsId, today()) } });
        },

        updateRoiModel: (projectId, patch) => editModel(projectId, (m) => ({ ...m, ...patch })),

        updateRoiYear: (projectId, index, patch) =>
          editModel(projectId, (m) => ({ ...m, years: m.years.map((y, i) => (i === index ? { ...y, ...patch } : y)) })),

        setRoiHorizon: (projectId, count) =>
          editModel(projectId, (m) => {
            const target = Math.max(MIN_YEARS, Math.min(MAX_YEARS, count));
            const years = m.years.slice(0, target);
            while (years.length < target) years.push({ ...years[years.length - 1] });
            return { ...m, years };
          }),

        setAllocation: (personId, projectId, percent) => {
          const others = get().allocations.filter((a) => !(a.personId === personId && a.projectId === projectId));
          const pct = Math.max(0, Math.min(100, Math.round(percent)));
          set({ allocations: pct > 0 ? [...others, { id: `al-${personId}-${projectId}`, personId, projectId, percent: pct }] : others });
        },

        addCostLine: (projectId) =>
          set({ costLines: [...get().costLines, { id: newId('cl'), projectId, label: 'New cost', amount: 0, granularity: 'monthly' }] }),
        updateCostLine: (id, patch) => set({ costLines: get().costLines.map((c) => (c.id === id ? { ...c, ...patch } : c)) }),
        removeCostLine: (id) => set({ costLines: get().costLines.filter((c) => c.id !== id) }),

        proposeHire: (hire) =>
          set({
            hires: [
              ...get().hires,
              {
                ...hire,
                id: newId('hire'),
                status: 'Awaiting Director',
                history: [{ at: today(), by: get().actingAsId, action: 'Proposed to close a capacity gap' }],
              },
            ],
          }),

        decideHire: (hireId, approve) =>
          set({
            hires: get().hires.map((h) => {
              const step = currentStep(h.status);
              if (h.id !== hireId || !step) return h;
              return {
                ...h,
                status: approve ? nextStatus(h.status) : 'Rejected',
                history: [...h.history, { at: today(), by: get().actingAsId, action: `${approve ? 'Approved' : 'Rejected'} by ${step.approver}` }],
              };
            }),
          }),

        setIncludePendingHires: (includePendingHires) => set({ includePendingHires }),

        createRevenuePlan: (projectId) => {
          const project = get().data.projects.find((p) => p.id === projectId);
          if (!project || get().revenuePlans[projectId]) return;
          set({ revenuePlans: { ...get().revenuePlans, [projectId]: createRevenuePlan(project, get().roiModels[projectId]) } });
        },
        updateRevenuePlan: (projectId, patch) => {
          const plan = get().revenuePlans[projectId];
          if (plan) set({ revenuePlans: { ...get().revenuePlans, [projectId]: { ...plan, ...patch } } });
        },
        setPlanUnits: (projectId, periodKey, value) => {
          const plan = get().revenuePlans[projectId];
          if (!plan) return;
          set({
            revenuePlans: {
              ...get().revenuePlans,
              [projectId]: { ...plan, unitsByPeriod: { ...plan.unitsByPeriod, [periodKey]: Math.max(0, Math.round(value)) } },
            },
          });
        },
        // ---------- Quarterly plan: every change is logged in its history ----------

        submitToPlan: (projectId, goal) =>
          changePlan(`Submitted ${projectName(projectId)}`, (p) =>
            p.stage !== 'Propose' || p.entries.some((e) => e.projectId === projectId)
              ? p
              : {
                  ...p,
                  entries: [...p.entries, { projectId, goal, submittedBy: get().actingAsId, submittedAt: today() }],
                  ranking: [...p.ranking, projectId],
                },
          ),
        withdrawFromPlan: (projectId) =>
          changePlan(`Withdrew ${projectName(projectId)}`, (p) =>
            p.stage !== 'Propose'
              ? p
              : { ...p, entries: p.entries.filter((e) => e.projectId !== projectId), ranking: p.ranking.filter((id) => id !== projectId) },
          ),
        updatePlanGoal: (projectId, goal) =>
          set({ plan: { ...get().plan, entries: get().plan.entries.map((e) => (e.projectId === projectId ? { ...e, goal } : e)) } }),
        advancePlanStage: () => {
          const p = get().plan;
          const i = PLAN_STAGES.indexOf(p.stage);
          if (i === -1 || p.stage === 'Published') return;
          const next: PlanStage = PLAN_STAGES[i + 1];
          if (next === 'Published') {
            const version = p.versions.length + 1;
            changePlan(`Published version ${version}`, (q) => ({
              ...q,
              stage: next,
              versions: [...q.versions, { version, at: today(), by: get().actingAsId, ranking: q.ranking, committed: q.committed, note: 'Published' }],
            }));
          } else if (next === 'Adjust') {
            changePlan(`CTO committed ${p.committed.length} of ${p.ranking.length} projects; sent to Director and CEO`, (q) => ({
              ...q,
              stage: next,
              approvedCount: q.committed.length,
            }));
          } else {
            changePlan(`Moved to ${next}`, (q) => ({ ...q, stage: next }));
          }
        },
        setPlanRanking: (ranking, how) => changePlan(how, (p) => ({ ...p, ranking })),
        setCommitted: (projectId, committed) => {
          const p = get().plan;
          if (committed && p.stage === 'Adjust' && p.approvedCount !== null && p.committed.length >= p.approvedCount) return;
          changePlan(`${committed ? 'Committed' : 'Uncommitted'} ${projectName(projectId)}`, (q) => ({
            ...q,
            committed: committed ? [...q.committed.filter((id) => id !== projectId), projectId] : q.committed.filter((id) => id !== projectId),
          }));
        },
        proposePullIn: (projectId, reason) =>
          changePlan(`Proposed mid-quarter pull-in: ${projectName(projectId)}`, (p) => ({
            ...p,
            pullIns: [...p.pullIns, { id: newId('pull'), projectId, reason, proposedBy: get().actingAsId, at: today(), status: 'Pending' }],
          })),
        decidePullIn: (pullInId, approve) => {
          const pull = get().plan.pullIns.find((x) => x.id === pullInId);
          if (!pull || pull.status !== 'Pending') return;
          changePlan(`${approve ? 'Approved' : 'Rejected'} pull-in: ${projectName(pull.projectId)}`, (p) => {
            const pullIns = p.pullIns.map((x) => (x.id === pullInId ? { ...x, status: approve ? ('Approved' as const) : ('Rejected' as const) } : x));
            if (!approve) return { ...p, pullIns };
            // Urgent must-do: goes to the top of the ranking and into the committed set, as a new version.
            const ranking = [pull.projectId, ...p.ranking.filter((id) => id !== pull.projectId)];
            const committed = [...p.committed.filter((id) => id !== pull.projectId), pull.projectId];
            const entries = p.entries.some((e) => e.projectId === pull.projectId)
              ? p.entries
              : [...p.entries, { projectId: pull.projectId, goal: goalOf(pull.projectId), submittedBy: pull.proposedBy, submittedAt: pull.at }];
            const version = p.versions.length + 1;
            return {
              ...p,
              pullIns,
              ranking,
              committed,
              entries,
              approvedCount: committed.length,
              versions: [
                ...p.versions,
                { version, at: today(), by: get().actingAsId, ranking, committed, note: `Mid-quarter pull-in: ${projectName(pull.projectId)}` },
              ],
            };
          });
        },
        restartPlan: () => set({ plan: seedPlan(goalOf) }),

        // ---------- Unit cost builder ----------

        startUnitCost: (projectId, estimate) => {
          if (get().unitCosts.some((i) => i.projectId === projectId)) return;
          const line = (component: string, category: CostCategory, unitCost: number): UnitCostItem => ({
            id: newId('uc') + Math.random().toString(36).slice(2, 5),
            projectId,
            component,
            category,
            quantity: 1,
            unitCost,
          });
          // Starts from the margin estimate as one line, ready to be broken down.
          set({ unitCosts: [...get().unitCosts, line('Estimated unit cost (break this down)', 'Materials', Math.round((estimate ?? 0) * 100) / 100)] });
        },
        addUnitCostItem: (projectId) =>
          set({
            unitCosts: [
              ...get().unitCosts,
              { id: newId('uc') + Math.random().toString(36).slice(2, 5), projectId, component: 'New component', category: 'Materials', quantity: 1, unitCost: 0 },
            ],
          }),
        updateUnitCostItem: (id, patch) => set({ unitCosts: get().unitCosts.map((i) => (i.id === id ? { ...i, ...patch } : i)) }),
        removeUnitCostItem: (id) => set({ unitCosts: get().unitCosts.filter((i) => i.id !== id) }),
        clearUnitCost: (projectId) => set({ unitCosts: get().unitCosts.filter((i) => i.projectId !== projectId) }),

        setPlanGranularity: (projectId, granularity, years) => {
          const plan = get().revenuePlans[projectId];
          if (!plan || plan.granularity === granularity) return;
          set({
            revenuePlans: {
              ...get().revenuePlans,
              [projectId]: { ...plan, granularity, unitsByPeriod: convertGranularity(plan, granularity, years) },
            },
          });
        },
      };
    },
    {
      name: 'rdpp-session',
      version: 7,
      partialize: (s) => ({
        revenuePlans: s.revenuePlans,
        plan: s.plan,
        unitCosts: s.unitCosts,
        role: s.role,
        actingAsId: s.actingAsId,
        roiModels: s.roiModels,
        allocations: s.allocations,
        costLines: s.costLines,
        hires: s.hires,
        includePendingHires: s.includePendingHires,
      }),
      migrate: (saved, version) => {
        const s = (saved ?? {}) as Partial<AppState>;
        return {
          ...s,
          // Sessions saved before version 3 hold older demo ROI numbers: replace them.
          roiModels: version < 3 || !s.roiModels ? seedRoiModels(seed.projects) : s.roiModels,
          // Version 4 added resourcing data.
          allocations: s.allocations ?? seedAllocations,
          costLines: s.costLines ?? seedCostLines,
          hires: s.hires ?? seed.hires,
          includePendingHires: s.includePendingHires ?? true,
          // Version 5 added sales revenue plans.
          revenuePlans: s.revenuePlans ?? seedRevenuePlans(seed.projects, seededModels),
          // Version 6 added the quarterly plan (older saves had a different shape).
          plan: version < 6 || !s.plan ? seedPlan(goalOf) : s.plan,
          // Version 7 added unit cost breakdowns.
          unitCosts: s.unitCosts ?? seedUnitCosts,
        } as AppState;
      },
    },
  ),
);

type ModelState = Pick<AppState, 'data' | 'roiModels' | 'revenuePlans' | 'unitCosts'>;

/** A hardware project's units for the given years: from its sales plan, or else its ROI model. */
function unitsForYears(state: ModelState, projectId: string, years: number[]): number[] {
  const plan = state.revenuePlans[projectId];
  if (plan && plan.recurringMode !== 'linked-to-hardware') return years.map((y) => enteredForYear(plan, y));
  const model = state.roiModels[projectId];
  return years.map((y) => (model ? (model.years[y - model.startYear]?.units ?? 0) : 0));
}

/**
 * The ROI model as actually used (one shared model):
 *  1. if Sales has a revenue plan, its units and price replace the typed ones;
 *  2. if Manufacturing has a unit cost breakdown, it replaces the margin estimate.
 */
export function effectiveModel(state: ModelState, projectId: string): RoiModel | undefined {
  let model = state.roiModels[projectId];
  const plan = state.revenuePlans[projectId];
  const project = state.data.projects.find((p) => p.id === projectId);
  if (!model || !project) return model;
  if (plan) {
    const years = model.years.map((_, i) => model!.startYear + i);
    const hardware = plan.linkedHardwareProjectId ? unitsForYears(state, plan.linkedHardwareProjectId, years) : [];
    model = applyRevenuePlan(model, plan, project, hardware);
  }
  const unitCost = unitCostOf(state.unitCosts, projectId);
  if (unitCost !== null) model = applyUnitCost(model, unitCost);
  return model;
}

/** Linked plans need the hardware units for the plan's years. */
export function useHardwareUnits(): (projectId: string, years: number[]) => number[] {
  const data = useApp((s) => s.data);
  const roiModels = useApp((s) => s.roiModels);
  const revenuePlans = useApp((s) => s.revenuePlans);
  const unitCosts = useApp((s) => s.unitCosts);
  return (projectId, years) => unitsForYears({ data, roiModels, revenuePlans, unitCosts }, projectId, years);
}

/**
 * Returns a function that gives a project's ROI result: units and price from
 * its sales plan (if any), plus its hires' costs (pending ones only when
 * "Include pending hires" is on).
 */
export function useRoiFor(): RoiLookup {
  const data = useApp((s) => s.data);
  const roiModels = useApp((s) => s.roiModels);
  const revenuePlans = useApp((s) => s.revenuePlans);
  const unitCosts = useApp((s) => s.unitCosts);
  const hires = useApp((s) => s.hires);
  const includePending = useApp((s) => s.includePendingHires);
  return (projectId) => {
    const model = effectiveModel({ data, roiModels, revenuePlans, unitCosts }, projectId);
    const project = data.projects.find((p) => p.id === projectId);
    if (!model || !project) return null;
    return computeRoi(model, hireCostsForModel(project, model, hires, data.departments, includePending));
  };
}
