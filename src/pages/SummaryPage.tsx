/**
 * PORTFOLIO · SUMMARY (landing page)
 * ----------------------------------
 * Every product platform side by side with its revenue, costs, NPV and
 * hours (lifetime totals from the projects' ROI models). Filter by product
 * manager, or group the table by product manager instead of platform.
 * Below: the phase pipeline board.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { visibleProjects } from '../data/access';
import { isPendingHire, isPlatformLaunched } from '../data/model';
import { formatK } from '../data/roi';
import { formatAccounting, marginPctOf, roiPctOf, totalCostOf, totalsFor, type Totals } from '../data/rollup';
import type { Project } from '../data/types';
import { useApp } from '../store';
import { KpiStrip, PageHeader, Panel, Tag, right, table, td, th } from '../components/ui';
import { PmFilter, byPm, usePmFilter, useQueryParam } from '../components/Filters';
import { PipelineBoard } from '../components/PipelineBoard';

interface Group {
  key: string;
  label: string;
  /** Where clicking the row goes. */
  to: string;
  note?: string;
  launched?: boolean;
  projects: Project[];
}

export default function SummaryPage() {
  const { data, role, actingAsId, roiModels } = useApp();
  const [pm] = usePmFilter();
  const [groupBy, setGroupBy] = useQueryParam('group', 'platform');
  const projects = byPm(visibleProjects(data, role, actingAsId), pm);
  const totals = totalsFor(projects, roiModels);

  const visibleIds = new Set(projects.map((p) => p.id));
  const pendingHires = data.hires.filter((h) => visibleIds.has(h.projectId) && isPendingHire(h.status)).length;

  const groups: Group[] =
    groupBy === 'pm'
      ? data.people
          .filter((p) => p.kind === 'product-manager')
          .map((p) => ({
            key: p.id,
            label: p.name,
            to: `/?pm=${p.id}`,
            note: p.title.replace('Product Manager, ', ''),
            projects: projects.filter((x) => x.ownerId === p.id),
          }))
      : data.platforms.map((pl) => ({
          key: pl.id,
          label: pl.name,
          to: `/platform/${pl.id}${pm === 'all' ? '' : `?pm=${pm}`}`,
          note: pl.description,
          launched: isPlatformLaunched(data, pl),
          projects: projects.filter((x) => x.platformId === pl.id),
        }));
  const shownGroups = groups.filter((g) => g.projects.length > 0);

  return (
    <>
      <PageHeader title="Portfolio summary" subtitle="Every product platform side by side. Lifetime totals from each project’s ROI model, in $ thousands." />

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <PmFilter />
        <div className="flex items-center gap-2 text-[13px] text-moss-600">
          Group by
          <div className="flex overflow-hidden rounded-md" role="group" aria-label="Group by">
            {[
              { id: 'platform', label: 'Platform' },
              { id: 'pm', label: 'Product manager' },
            ].map((o) => {
              const on = groupBy === o.id;
              return (
                <button
                  key={o.id}
                  aria-pressed={on}
                  onClick={() => setGroupBy(o.id)}
                  className={`border px-2.5 py-1 text-[12px] first:rounded-l-md first:border-r-0 last:rounded-r-md ${
                    on ? 'border-moss-800 bg-moss-800 text-white' : 'border-moss-300 bg-white text-moss-700 hover:bg-moss-50'
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <KpiStrip
        items={[
          { label: 'Revenue', value: formatK(totals.revenue) },
          { label: 'Total cost', value: formatK(totalCostOf(totals)) },
          { label: 'Net present value', value: `${totals.npv > 0 ? '+' : ''}${formatK(totals.npv)}` },
          { label: 'Planned R&D hours', value: Math.round(totals.hours).toLocaleString('en-US') },
        ]}
      />

      <Panel
        title={groupBy === 'pm' ? 'By product manager' : 'By product platform'}
        aside={<span className="text-[12px] text-moss-500">{pendingHires} pending hire{pendingHires === 1 ? '' : 's'} not yet in costs</span>}
      >
        <div className="overflow-x-auto">
          <table className={table}>
            <thead>
              <tr>
                <th className={`${th} min-w-[180px]`}>{groupBy === 'pm' ? 'Product manager' : 'Platform'}</th>
                <th className={`${th} ${right}`}>Projects</th>
                <th className={`${th} ${right}`}>Revenue</th>
                <th className={`${th} ${right}`}>COGS</th>
                <th className={`${th} ${right}`}>Margin</th>
                <th className={`${th} ${right}`}>R&amp;D</th>
                <th className={`${th} ${right}`}>Opex</th>
                <th className={`${th} ${right}`}>NPV</th>
                <th className={`${th} ${right}`}>ROI</th>
                <th className={`${th} ${right}`}>Hours</th>
              </tr>
            </thead>
            <tbody>
              {shownGroups.map((g) => (
                <MetricsRow key={g.key} label={<GroupLabel group={g} />} totals={totalsFor(g.projects, roiModels)} />
              ))}
              {shownGroups.length > 1 && <MetricsRow label="Total" totals={totals} strong />}
              {shownGroups.length === 0 && (
                <tr>
                  <td colSpan={10} className={`${td} text-moss-500`}>
                    No projects for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <h2 className="mt-8 mb-3 text-[15px] font-semibold text-moss-900">Projects by phase</h2>
      <PipelineBoard projects={projects} />
    </>
  );
}

function GroupLabel({ group }: { group: Group }) {
  return (
    <>
      <Link to={group.to} className="font-semibold text-moss-900 underline decoration-moss-300 underline-offset-2 hover:decoration-moss-700">
        {group.label}
      </Link>
      {group.launched && (
        <span className="ml-2">
          <Tag tone="solid">Launched</Tag>
        </span>
      )}
      {group.note && <div className="text-[12px] text-moss-500">{group.note}</div>}
    </>
  );
}

function MetricsRow({ label, totals, strong }: { label: ReactNode; totals: Totals; strong?: boolean }) {
  const cell = `${td} num ${right} ${strong ? 'border-t-moss-300 font-semibold' : ''}`;
  const margin = marginPctOf(totals);
  const roi = roiPctOf(totals);
  return (
    <tr className={strong ? '' : 'hover:bg-moss-50'}>
      <td className={`${td} ${strong ? 'border-t-moss-300 font-semibold' : ''}`}>{label}</td>
      <td className={cell} title={`${totals.withModel} of ${totals.projects} have an ROI model`}>
        {totals.projects}
        {totals.withModel < totals.projects && <span className="text-moss-400"> · {totals.withModel} with ROI</span>}
      </td>
      <td className={cell}>{formatAccounting(totals.revenue)}</td>
      <td className={cell}>{formatAccounting(-totals.cogs)}</td>
      <td className={cell}>{margin != null ? `${margin.toFixed(0)}%` : '—'}</td>
      <td className={cell}>{formatAccounting(-totals.rdCost)}</td>
      <td className={cell}>{formatAccounting(-totals.opex)}</td>
      <td className={cell}>{formatAccounting(totals.npv)}</td>
      <td className={cell}>{roi != null ? `${roi.toFixed(0)}%` : '—'}</td>
      <td className={cell}>{Math.round(totals.hours).toLocaleString('en-US')}</td>
    </tr>
  );
}
