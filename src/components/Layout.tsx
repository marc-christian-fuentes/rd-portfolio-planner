/**
 * APP LAYOUT
 * ----------
 * Dark green top bar with the role switcher, a light green side menu that
 * only lists the pages the current role may see, and the page on the right.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { ROLES, type Role } from '../data/types';
import { ROLE_SUMMARY, SECTIONS, canSee, peopleForRole } from '../data/access';
import { useApp } from '../store';
import { usePhaseTab, withPhase } from './PhaseTabs';

const selectClass =
  'rounded border border-moss-600 bg-moss-700 px-2 py-1 text-[13px] text-white focus:outline focus:outline-2 focus:outline-sage-300';

export default function Layout() {
  const { data, role, actingAsId, setRole, setActingAs } = useApp();
  const actors = peopleForRole(data, role);
  // Keep the open phase tab when moving between pages.
  const [phase] = usePhaseTab();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-moss-800 text-white">
        <div className="flex min-h-12 flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
          <div className="mr-auto flex items-center gap-3">
            <span className="text-[15px] font-semibold">R&amp;D Portfolio Planner</span>
            <span className="rounded-full bg-moss-700 px-2.5 py-0.5 text-[11px] text-sage-200">Demo data</span>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-sage-200">
            View as
            <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>

          {actors.length > 1 ? (
            <label className="flex items-center gap-2 text-[13px] text-sage-200">
              Person
              <select className={selectClass} value={actingAsId} onChange={(e) => setActingAs(e.target.value)}>
                {actors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="text-[13px] text-sage-200">{actors[0]?.name}</span>
          )}
        </div>
      </header>

      <div className="md:flex">
        <aside className="border-b border-sage-200 bg-sage-100 md:sticky md:top-12 md:flex md:h-[calc(100vh-3rem)] md:w-56 md:shrink-0 md:flex-col md:border-r md:border-b-0">
          <nav className="flex gap-1 overflow-x-auto px-2 py-2 md:flex-col md:py-4">
            {SECTIONS.filter((s) => canSee(role, s.id)).map((s) => (
              <NavLink
                key={s.id}
                to={withPhase(s.path, phase)}
                end={s.path === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] ${
                    isActive ? 'bg-white font-semibold text-moss-900 shadow-[0_0_0_1px_var(--color-sage-200)]' : 'text-moss-700 hover:bg-sage-200/60 hover:text-moss-900'
                  }`
                }
              >
                {s.label}
              </NavLink>
            ))}
          </nav>
          <p className="mt-auto hidden border-t border-sage-200 px-4 py-3 text-[12px] leading-snug text-moss-600 md:block">
            <span className="font-semibold text-moss-800">{role}</span>
            <br />
            {ROLE_SUMMARY[role]}
          </p>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
