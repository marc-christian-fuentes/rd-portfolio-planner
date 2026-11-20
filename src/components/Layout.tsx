/**
 * APP LAYOUT
 * ----------
 * Dark green top bar with the role switcher, a light green side menu that
 * only lists the pages the current role may see, and the page on the right.
 */
import { Fragment } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ROLES, type Role } from '../data/types';
import { ROLE_SUMMARY, SECTIONS, canSee, peopleForRole } from '../data/access';
import { useApp } from '../store';
import { usePhaseTab, withPhase } from './PhaseTabs';
import { APP_NAME, APP_TAGLINE } from '../config';

/** Carries the ?pm= product manager filter onto menu links. */
function keepFilters(search: string): string {
  const pm = new URLSearchParams(search).get('pm');
  return pm ? `${search.includes('phase=') ? '&' : '?'}pm=${pm}` : '';
}

const selectClass =
  'rounded-md border border-moss-600 bg-moss-700 px-2 py-1 text-[13px] text-white focus:outline focus:outline-2 focus:outline-sage-300';

export default function Layout() {
  const { data, role, actingAsId, setRole, setActingAs } = useApp();
  const actors = peopleForRole(data, role);
  // Keep the open phase tab and the product manager filter when moving between pages.
  const [phase] = usePhaseTab();
  const { search } = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-moss-800 text-white">
        <div className="flex min-h-12 flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
          <div className="mr-auto flex items-center gap-3">
            <span className="text-[17px] font-semibold tracking-tight" aria-label={`${APP_NAME}.`}>
              {APP_NAME}
              <span className="text-sage-300">.</span>
            </span>
            <span className="hidden text-[13px] text-sage-200 sm:inline">{APP_TAGLINE}</span>
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
          <nav className="flex gap-1 overflow-x-auto px-2 py-2 md:flex-col md:gap-0.5 md:overflow-y-auto md:py-4">
            {SECTIONS.filter((s) => canSee(role, s.id)).map((s, i, list) => {
              const startsGroup = s.group && s.group !== list[i - 1]?.group;
              return (
                <Fragment key={s.id}>
                  {startsGroup && (
                    <div className="hidden px-3 pt-3 pb-1 text-[11px] font-semibold text-moss-500 md:block">{s.group}</div>
                  )}
                  <NavLink
                    to={withPhase(s.path, phase) + keepFilters(search)}
                    end={s.path === '/'}
                    className={({ isActive }) =>
                      `whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] ${s.group ? 'md:ml-2' : ''} ${
                        isActive
                          ? 'bg-white font-semibold text-moss-900 shadow-[0_0_0_1px_var(--color-sage-200)]'
                          : 'text-moss-700 hover:bg-sage-200/60 hover:text-moss-900'
                      }`
                    }
                  >
                    {s.group && <span className="md:hidden">{s.group}: </span>}
                    {s.label}
                  </NavLink>
                </Fragment>
              );
            })}
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
