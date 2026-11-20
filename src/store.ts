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
import type { Allocation, CostLine, Granularity, ProposedHire, RevenuePlan, Role, RoiModel, RoiYear, SeedData } from './data/types';
import { peopleForRole } from './data/access';
import { MAX_YEARS, MIN_YEARS, computeRoi, createDefaultRoiModel, seedRoiModels } from './data/roi';
import { currentStep, hireCostsForModel, nextStatus } from './data/resourcing';
import { applyRevenuePlan, convertGranularity, createRevenuePlan, enteredForYear, seedRevenuePlans } from './data/revenue';
import type { RoiLookup } from './data/rollup';

const seededModels = seedRoiModels(seed.projects);

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
      version: 5,
      partialize: (s) => ({
        revenuePlans: s.revenuePlans,
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
        } as AppState;
      },
    },
  ),
);

type ModelState = Pick<AppState, 'data' | 'roiModels' | 'revenuePlans'>;

/** A hardware project's units for the given years: from its sales plan, or else its ROI model. */
function unitsForYears(state: ModelState, projectId: string, years: number[]): number[] {
  const plan = state.revenuePlans[projectId];
  if (plan && plan.recurringMode !== 'linked-to-hardware') return years.map((y) => enteredForYear(plan, y));
  const model = state.roiModels[projectId];
  return years.map((y) => (model ? (model.years[y - model.startYear]?.units ?? 0) : 0));
}

/**
 * The ROI model as actually used: if Sales has a revenue plan for the
 * project, its units and price replace the ones typed into the model.
 */
export function effectiveModel(state: ModelState, projectId: string): RoiModel | undefined {
  const model = state.roiModels[projectId];
  const plan = state.revenuePlans[projectId];
  const project = state.data.projects.find((p) => p.id === projectId);
  if (!model || !plan || !project) return model;
  const years = model.years.map((_, i) => model.startYear + i);
  const hardware = plan.linkedHardwareProjectId ? unitsForYears(state, plan.linkedHardwareProjectId, years) : [];
  return applyRevenuePlan(model, plan, project, hardware);
}

/** Linked plans need the hardware units for the plan's years. */
export function useHardwareUnits(): (projectId: string, years: number[]) => number[] {
  const data = useApp((s) => s.data);
  const roiModels = useApp((s) => s.roiModels);
  const revenuePlans = useApp((s) => s.revenuePlans);
  return (projectId, years) => unitsForYears({ data, roiModels, revenuePlans }, projectId, years);
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
  const hires = useApp((s) => s.hires);
  const includePending = useApp((s) => s.includePendingHires);
  return (projectId) => {
    const model = effectiveModel({ data, roiModels, revenuePlans }, projectId);
    const project = data.projects.find((p) => p.id === projectId);
    if (!model || !project) return null;
    return computeRoi(model, hireCostsForModel(project, model, hires, data.departments, includePending));
  };
}
