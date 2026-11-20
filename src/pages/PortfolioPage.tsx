/**
 * Portfolio overview (landing page).
 * Projects are split into phase tabs, newest-progress first:
 * Completed (default, far left) → Testing / Validation → In Development → Approved → Proposed.
 * The chosen tab is kept in the web address (?phase=...), so a link opens the same tab.
 * ROI figures and drill-down arrive in step 7.3.
 */
import { useSearchParams } from 'react-router-dom';
import { visibleProjects } from '../data/access';
import type { Phase } from '../data/types';
import { durationMonths, formatDate, formatMoney, isPlatformLaunched, personName } from '../data/model';
import { useApp } from '../store';
import { KpiStrip, PageHeader, Panel, Tabs, Tag, right, table, td, th } from '../components/ui';

/** Tab order, left to right. */
const PHASE_TABS: { id: Phase; label: string }[] = [
  { id: 'Completed', label: 'Completed' },
  { id: 'Testing / Validation', label: 'Testing / Validation' },
  { id: 'In Development', label: 'In Development' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Proposed', label: 'Proposed' },
];

export default function PortfolioPage() {
  const { data, role, actingAsId } = useApp();
  const [params, setParams] = useSearchParams();
  const projects = visibleProjects(data, role, actingAsId);

  const requested = params.get('phase');
  const active: Phase = PHASE_TABS.find((t) => t.id === requested)?.id ?? 'Completed';
  const rows = projects.filter((p) => p.phase === active);
  const platformName = (id: string) => data.platforms.find((pl) => pl.id === id)?.name ?? '—';

  return (
    <>
      <PageHeader
        title="Portfolio overview"
        subtitle="Every project from one shared model, grouped by how far along it is. ROI and drill-down to the calculator arrive in step 7.3."
      />

      <KpiStrip
        items={[
          { label: 'Projects visible', value: `${projects.length} / ${data.projects.length}` },
          { label: 'Platforms launched', value: `${data.platforms.filter((pl) => isPlatformLaunched(data, pl)).length} / ${data.platforms.length}` },
          { label: 'Revenue-generating', value: String(projects.filter((p) => p.type === 'revenue').length) },
          { label: 'Cost-only', value: String(projects.filter((p) => p.type === 'cost-only').length) },
        ]}
      />

      <Panel>
        <Tabs
          label="Project phase"
          tabs={PHASE_TABS.map((t) => ({ ...t, count: projects.filter((p) => p.phase === t.id).length }))}
          active={active}
          onChange={(phase) => setParams(phase === 'Completed' ? {} : { phase }, { replace: true })}
        />

        <div role="tabpanel" aria-label={active} className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-moss-500">No projects in {active} for this role.</p>
          ) : (
            <table className={table}>
              <thead>
                <tr>
                  <th className={`${th} min-w-[210px]`}>Project</th>
                  <th className={th}>Platform</th>
                  <th className={th}>Type</th>
                  <th className={th}>Start – end</th>
                  <th className={th}>Product mgr</th>
                  <th className={th}>Project mgr</th>
                  <th className={`${th} ${right}`}>Price / unit</th>
                  <th className={`${th} ${right}`}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const platform = data.platforms.find((pl) => pl.id === p.platformId)!;
                  return (
                    <tr key={p.id} className="hover:bg-moss-50">
                      <td className={td}>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-[12px] text-moss-500">{p.quarterlyGoal}</div>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        {platformName(p.platformId)}
                        {isPlatformLaunched(data, platform) && (
                          <span className="ml-2">
                            <Tag tone="solid">Launched</Tag>
                          </span>
                        )}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        {p.type === 'revenue' ? 'Revenue' : 'Cost-only'}
                        <span className="text-moss-500">
                          {' '}
                          · {p.component === 'hardware' ? 'HW' : 'SW'}
                          {p.recurring && ' · recurring'}
                        </span>
                      </td>
                      <td className={`${td} num whitespace-nowrap`}>
                        {formatDate(p.startDate)} – {formatDate(p.endDate)}
                        <div className="text-[12px] text-moss-500">{durationMonths(p)} months</div>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{personName(data, p.ownerId)}</td>
                      <td className={`${td} whitespace-nowrap`}>{personName(data, p.projectManagerId)}</td>
                      <td className={`${td} num ${right}`}>
                        {p.defaultPricePerUnit !== null ? formatMoney(p.defaultPricePerUnit) : <span className="text-moss-400">—</span>}
                      </td>
                      <td className={`${td} num ${right}`}>
                        {p.grossMarginPct !== null ? `${p.grossMarginPct}%` : <span className="text-moss-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Panel>
    </>
  );
}
