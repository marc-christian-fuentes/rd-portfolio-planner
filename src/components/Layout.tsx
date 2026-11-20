/**
 * APP LAYOUT
 * ----------
 * Dark olive top bar with the role switcher, a side menu that only lists
 * the pages the current role may see, and the page content on the right.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { ROLES, type Role } from '../data/types';
import { ROLE_SUMMARY, SECTIONS, accessFor, canSee, peopleForRole } from '../data/access';
import { useApp } from '../store';

const selectClass =
  'border border-moss-500 bg-moss-800 px-2 py-1 text-[13px] text-moss-50 focus:outline focus:outline-2 focus:outline-moss-300';

export default function Layout() {
  const { data, role, actingAsId, setRole, setActingAs } = useApp();
  const actors = peopleForRole(data, role);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10">
        <div className="bg-moss-800 text-moss-50">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
            <div className="mr-auto flex items-baseline gap-3">
              <span className="text-[15px] font-semibold">R&amp;D Portfolio Planner</span>
              <span className="hidden text-[11px] uppercase tracking-wider text-moss-300 sm:inline">Demo · fictional data</span>
            </div>

            <label className="flex items-center gap-2 text-[12px] text-moss-300">
              View as
              <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>

            {actors.length > 1 ? (
              <label className="flex items-center gap-2 text-[12px] text-moss-300">
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
              <span className="text-[13px] text-moss-200">{actors[0]?.name}</span>
            )}
          </div>
        </div>
        <div className="border-b border-moss-200 bg-moss-100">
          <p className="mx-auto max-w-[1400px] px-4 py-1 text-[12px] text-moss-700">
            <span className="font-semibold text-moss-900">{role}</span> · {ROLE_SUMMARY[role]}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] md:flex">
        <nav className="flex overflow-x-auto border-b border-moss-200 bg-white md:sticky md:top-[66px] md:h-[calc(100vh-66px)] md:w-52 md:shrink-0 md:flex-col md:border-r md:border-b-0 md:py-3">
          {SECTIONS.filter((s) => canSee(role, s.id)).map((s) => (
            <NavLink
              key={s.id}
              to={s.path}
              end={s.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 whitespace-nowrap border-b-2 px-4 py-2 text-[13px] md:border-b-0 md:border-l-[3px] ${
                  isActive
                    ? 'border-moss-600 bg-moss-50 font-semibold text-moss-900'
                    : 'border-transparent text-moss-700 hover:bg-moss-50 hover:text-moss-900'
                }`
              }
            >
              {s.label}
              {accessFor(role, s.id) === 'view' && <span className="text-[10px] uppercase tracking-wider text-moss-400">view</span>}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1 px-4 py-5 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
