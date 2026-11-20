/**
 * APP STORE
 * ---------
 * The single shared place the whole app reads from: the demo data, the
 * currently selected role, and each project's ROI model.
 * Built with the "zustand" library.
 *
 * The chosen role and the ROI models are saved in the browser, so edits
 * survive a page refresh. (The Reset demo button comes in step 7.9.)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seed } from './data/seed';
import type { Role, RoiModel, RoiYear, SeedData } from './data/types';
import { peopleForRole } from './data/access';
import { MAX_YEARS, MIN_YEARS, createDefaultRoiModel, seedRoiModels } from './data/roi';

const today = () => new Date().toISOString().slice(0, 10);

interface AppState {
  data: SeedData;
  role: Role;
  /** Which demo person the role is acting as (e.g. which product manager). */
  actingAsId: string;
  /** ROI model per project id. A project without one has no entry. */
  roiModels: Record<string, RoiModel>;

  setRole: (role: Role) => void;
  setActingAs: (personId: string) => void;
  createRoiModel: (projectId: string) => void;
  updateRoiModel: (projectId: string, patch: Partial<Pick<RoiModel, 'waccPct' | 'convention' | 'startYear'>>) => void;
  updateRoiYear: (projectId: string, index: number, patch: Partial<RoiYear>) => void;
  setRoiHorizon: (projectId: string, years: number) => void;
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
        roiModels: seedRoiModels(seed.projects),

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
      };
    },
    {
      name: 'rdpp-session',
      version: 3,
      partialize: (state) => ({ role: state.role, actingAsId: state.actingAsId, roiModels: state.roiModels }),
      // Sessions saved before version 3 hold older demo ROI numbers: replace them with the current seed.
      migrate: (saved, version) => {
        const s = (saved ?? {}) as Partial<AppState>;
        return { ...s, roiModels: version < 3 || !s.roiModels ? seedRoiModels(seed.projects) : s.roiModels } as AppState;
      },
    },
  ),
);
