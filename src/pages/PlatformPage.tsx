/**
 * PORTFOLIO · PLATFORM VIEW
 * -------------------------
 * One product platform: its headline figures and rolled-up P&L by year
 * (including cost-only projects), with its projects listed on the right.
 */
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { visibleProjects } from '../data/access';
import { isPlatformLaunched, personName } from '../data/model';
import { formatK } from '../data/roi';
import { roiPctOf, totalCostOf, totalsFor, yearlyPnl } from '../data/rollup';
import { useApp, useRoiFor } from '../store';
import { KpiStrip, PageHeader, Panel, PhaseMarker, Tag } from '../components/ui';
import { FilterSelect, HiresToggle, PmFilter, byPm, usePmFilter } from '../components/Filters';
import { PnlTable } from '../components/PnlTable';
import { PHASE_TABS } from '../components/PhaseTabs';

/** Sort projects in the shared phase order; Scoping (not a tab) goes last. */
const order = (phase: (typeof PHASE_TABS)[number] | 'Scoping') => {
  const i = PHASE_TABS.indexOf(phase as (typeof PHASE_TABS)[number]);
  return i === -1 ? PHASE_TABS.length : i;
};

export default function PlatformPage() {
  const { data, role, actingAsId } = useApp();
  const roiFor = useRoiFor();
  const { platformId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [pm] = usePmFilter();

  const projects = byPm(visibleProjects(data, role, actingAsId), pm);
  const platforms = data.platforms.filter((pl) => projects.some((p) => p.platformId === pl.id));
  const platform = platforms.find((pl) => pl.id === platformId);

  if (!platform) {
    if (platforms.length === 0) {
      return (
        <>
          <PageHeader title="Platform view">
            <PmFilter />
          </PageHeader>
          <Panel>
            <p className="px-4 py-5 text-[13px] text-moss-500">No platforms for this selection.</p>
          </Panel>
        </>
      );
    }
    return <Navigate to={`/platform/${platforms[0].id}${search}`} replace />;
  }

  const own = projects
    .filter((p) => p.platformId === platform.id)
    .sort((a, b) => order(a.phase) - order(b.phase));
  const totals = totalsFor(own, roiFor);
  const roi = roiPctOf(totals);

  return (
    <>
      <PageHeader title="Platform view" subtitle="One product platform’s rolled-up P&L, including cost-only projects, with its projects alongside.">
        <FilterSelect
          label="Platform"
          value={platform.id}
          onChange={(id) => navigate(`/platform/${id}${search}`)}
          options={platforms.map((pl) => ({
            value: pl.id,
            label: `${pl.name} (${projects.filter((p) => p.platformId === pl.id).length})`,
          }))}
        />
        <PmFilter />
        <HiresToggle />
      </PageHeader>

      <div className="mb-5 rounded-[10px] border border-moss-200 bg-white">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
          <h2 className="text-lg font-semibold text-moss-900">{platform.name}</h2>
          <Tag tone={isPlatformLaunched(data, platform) ? 'solid' : 'neutral'}>{isPlatformLaunched(data, platform) ? 'Launched' : 'In progress'}</Tag>
          <p className="w-full text-[13px] text-moss-500">
            {platform.description} Hardware: {platform.hardwarePiece}. Software: {platform.softwarePiece}.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <KpiStrip
            items={[
              { label: 'Revenue', value: formatK(totals.revenue) },
              { label: 'Total cost', value: formatK(totalCostOf(totals)) },
              { label: 'Net present value', value: formatK(totals.npv) },
              { label: 'Discounted ROI', value: roi != null ? `${roi.toFixed(0)}%` : '—' },
            ]}
          />
          <PnlTable pnl={yearlyPnl(own, roiFor)} title="Platform P&L" />
        </div>

        <aside aria-label={`${platform.name} projects`}>
          <h3 className="mb-2 text-[13px] font-semibold text-moss-900">
            Projects <span className="num font-normal text-moss-500">· {own.length}</span>
          </h3>
          <ul className="space-y-2">
            {own.map((p) => {
              const npv = roiFor(p.id)?.npv ?? null;
              return (
                <li key={p.id}>
                  <Link
                    to={`/project/${p.id}?phase=${encodeURIComponent(p.phase)}`}
                    className="block rounded-lg border border-moss-200 bg-white px-3 py-2.5 hover:border-moss-500"
                  >
                    <div className="text-[13px] font-semibold text-moss-900">{p.name}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[12px] text-moss-600">
                      <PhaseMarker phase={p.phase} />
                      <span className="num">{npv != null ? `NPV ${formatK(npv)}` : 'No ROI yet'}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-moss-500">
                      {p.type === 'revenue' ? 'Revenue' : 'Cost-only'} · {personName(data, p.ownerId)}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </>
  );
}
