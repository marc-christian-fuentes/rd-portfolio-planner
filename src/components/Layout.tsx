/**
 * APP LAYOUT
 * ----------
 * Top bar with the role switcher, a side menu that only lists the pages
 * the current role may see, and the page content on the right.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { ROLES, type Role } from '../data/types';
import { ROLE_SUMMARY, SECTIONS, accessFor, canSee, peopleForRole } from '../data/access';
import { useApp } from '../store';

export default function Layout() {
  const { data, role, actingAsId, setRole, setActingAs } = useApp();
  const actors = peopleForRole(data, role);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <div className="mr-auto">
            <div className="text-base font-bold text-slate-900">R&amp;D Portfolio Planner</div>
            <div className="text-xs text-slate-500">Demo · all data is invented</div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">View as</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-medium"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>

          {actors.length > 1 && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Person</span>
              <select
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5"
                value={actingAsId}
                onChange={(e) => setActingAs(e.target.value)}
              >
                {actors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {actors.length === 1 && <span className="text-sm text-slate-500">{actors[0].name}</span>}
        </div>
        <div className="border-t border-slate-100 bg-blue-50/60">
          <p className="mx-auto max-w-7xl px-4 py-1.5 text-xs text-blue-900">
            <strong>{role}:</strong> {ROLE_SUMMARY[role]}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 md:flex md:gap-8">
        <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 py-2 md:sticky md:top-28 md:mx-0 md:w-52 md:shrink-0 md:flex-col md:self-start md:border-0 md:px-0 md:py-6">
          {SECTIONS.filter((s) => canSee(role, s.id)).map((s) => (
            <NavLink
              key={s.id}
              to={s.path}
              end={s.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  isActive ? 'bg-slate-900 font-semibold text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {s.label}
              {accessFor(role, s.id) === 'view' && <span className="text-[10px] uppercase tracking-wide opacity-60">view</span>}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
