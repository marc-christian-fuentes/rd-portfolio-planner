/**
 * APP STORE
 * ---------
 * The single shared place the whole app reads from: the demo data plus
 * the currently selected role. Built with the "zustand" library.
 *
 * The chosen role is remembered in the browser between visits.
 * (Saving edits to the data, and the Reset demo button, come in step 7.9.)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seed } from './data/seed';
import type { Role, SeedData } from './data/types';
import { peopleForRole } from './data/access';

interface AppState {
  data: SeedData;
  role: Role;
  /** Which demo person the role is acting as (e.g. which product manager). */
  actingAsId: string;
  setRole: (role: Role) => void;
  setActingAs: (personId: string) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      data: seed,
      role: 'Leadership',
      actingAsId: 'ldr-ceo',
      setRole: (role) => set({ role, actingAsId: peopleForRole(get().data, role)[0]?.id ?? '' }),
      setActingAs: (actingAsId) => set({ actingAsId }),
    }),
    {
      name: 'rdpp-session',
      partialize: (state) => ({ role: state.role, actingAsId: state.actingAsId }),
    },
  ),
);
