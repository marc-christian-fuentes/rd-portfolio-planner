/**
 * ROADMAP
 * -------
 * Every project as a bar on a shared timeline, grouped by platform:
 * where it starts, how long it runs, and what phase it is in.
 * Bars are placed by percentage, so the timeline always fits the screen.
 */
import { Link } from 'react-router-dom';
import { visibleProjects } from '../data/access';
import { durationMonths, formatDate } from '../data/model';
import { PHASES } from '../data/types';
import { useApp } from '../store';
import { PageHeader, PHASE_COLOR } from '../components/ui';
import { PmFilter, byPm, usePmFilter } from '../components/Filters';

const time = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

export default function RoadmapPage() {
  const { data, role, actingAsId } = useApp();
  const [pm] = usePmFilter();
  const projects = byPm(visibleProjects(data, role, actingAsId), pm);

  if (projects.length === 0) {
    return (
      <>
        <PageHeader title="Roadmap">
          <PmFilter />
        </PageHeader>
        <p className="mt-4 text-[13px] text-moss-500">No projects for this selection.</p>
      </>
    );
  }

  // Timeline runs from 1 Jan of the first start year to 31 Dec of the last end year.
  const firstYear = Math.min(...projects.map((p) => Number(p.startDate.slice(0, 4))));
  const lastYear = Math.max(...projects.map((p) => Number(p.endDate.slice(0, 4))));
  const start = Date.UTC(firstYear, 0, 1);
  const end = Date.UTC(lastYear + 1, 0, 1);
  const pct = (t: number) => ((t - start) / (end - start)) * 100;
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);
  const today = Date.now();
  const todayPct = today >= start && today <= end ? pct(today) : null;

  // Faint line at the start of every year, drawn behind the bars.
  const grid = {
    backgroundImage: 'linear-gradient(to right, var(--color-moss-200) 1px, transparent 1px)',
    backgroundSize: `${100 / years.length}% 100%`,
  };

  return (
    <>
      <PageHeader title="Roadmap" subtitle="Every project on one timeline: when it starts, how long it runs, and its phase. Click a bar to open the project.">
        <PmFilter />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-moss-600" aria-label="Phase colours">
          {PHASES.map((ph) => (
            <li key={ph} className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-full ${PHASE_COLOR[ph]}`} aria-hidden="true" />
              {ph}
            </li>
          ))}
        </ul>
      </PageHeader>

      <div className="rounded-[10px] border border-moss-200 bg-white p-4">
        {/* Year axis */}
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="hidden md:block" />
          <div className="relative flex border-b border-moss-200 pb-1.5">
            {years.map((y) => (
              <div key={y} className="num flex-1 text-[12px] font-medium text-moss-600">
                {y}
              </div>
            ))}
          </div>
        </div>

        {data.platforms.map((pl) => {
          const rows = projects.filter((p) => p.platformId === pl.id).sort((a, b) => a.startDate.localeCompare(b.startDate));
          if (rows.length === 0) return null;
          return (
            <section key={pl.id} aria-label={pl.name} className="mt-4">
              <h2 className="mb-1.5 text-[13px] font-semibold text-moss-900">{pl.name}</h2>
              <ul className="space-y-1.5">
                {rows.map((p) => {
                  const left = pct(time(p.startDate));
                  const width = Math.max(1.5, pct(time(p.endDate)) - left);
                  const months = durationMonths(p);
                  return (
                    <li key={p.id} className="grid grid-cols-1 items-center gap-x-4 gap-y-1 md:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="truncate text-[13px] text-moss-800" title={p.name}>
                        {p.name}
                      </div>
                      <div className="relative h-7 rounded-md bg-moss-50" style={grid}>
                        {todayPct !== null && (
                          <div className="absolute inset-y-0 w-px bg-rust/70" style={{ left: `${todayPct}%` }} aria-hidden="true" />
                        )}
                        <Link
                          to={`/project/${p.id}?phase=${encodeURIComponent(p.phase)}`}
                          title={`${p.name}: ${formatDate(p.startDate)} – ${formatDate(p.endDate)} (${months} months), ${p.phase}`}
                          className={`absolute inset-y-1 flex items-center overflow-hidden rounded-full px-2.5 text-[11px] font-medium whitespace-nowrap hover:brightness-110 ${PHASE_COLOR[p.phase]} ${
                            p.phase === 'Scoping' ? 'text-moss-900' : 'text-white'
                          }`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        >
                          <span className="num truncate">{months} mo</span>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        {todayPct !== null && (
          <p className="mt-4 flex items-center gap-2 text-[12px] text-moss-500">
            <span className="inline-block h-3 w-px bg-rust/70" aria-hidden="true" /> Today
          </p>
        )}
      </div>
    </>
  );
}
