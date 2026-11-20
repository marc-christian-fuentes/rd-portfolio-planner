/**
 * Portfolio overview (landing page).
 * Step 7.2 version: lists the platforms and the projects this role may see.
 * ROI figures and drill-down arrive in step 7.3.
 */
import { visibleProjects } from '../data/access';
import { durationMonths, formatDate, formatMoney, isPlatformLaunched, personName } from '../data/model';
import { useApp } from '../store';
import { KpiStrip, PageHeader, Panel, PhaseMarker, Tag, right, table, td, th } from '../components/ui';

export default function PortfolioPage() {
  const { data, role, actingAsId } = useApp();
  const projects = visibleProjects(data, role, actingAsId);
  const platforms = data.platforms.filter((pl) => projects.some((p) => p.platformId === pl.id));

  return (
    <>
      <PageHeader
        title="Portfolio overview"
        subtitle="Every product platform and its projects, from one shared model. ROI and drill-down to the calculator arrive in step 7.3."
      />

      <KpiStrip
        items={[
          { label: 'Projects visible', value: `${projects.length} / ${data.projects.length}` },
          { label: 'Platforms', value: String(platforms.length) },
          { label: 'Revenue-generating', value: String(projects.filter((p) => p.type === 'revenue').length) },
          { label: 'Cost-only', value: String(projects.filter((p) => p.type === 'cost-only').length) },
        ]}
      />

      {platforms.length === 0 && <Panel>No projects are assigned to this person.</Panel>}

      <div className="space-y-4">
        {platforms.map((platform) => {
          const launched = isPlatformLaunched(data, platform);
          return (
            <Panel
              key={platform.id}
              title={
                <span className="flex items-center gap-2">
                  {platform.name}
                  <Tag tone={launched ? 'solid' : 'neutral'}>{launched ? 'Launched' : 'In progress'}</Tag>
                </span>
              }
              aside={<span className="text-[12px] text-moss-500">{platform.description}</span>}
            >
              <div className="overflow-x-auto">
                <table className={table}>
                  <thead>
                    <tr>
                      <th className={th}>Project</th>
                      <th className={th}>Phase</th>
                      <th className={th}>Type</th>
                      <th className={th}>Start – end</th>
                      <th className={`${th} ${right}`}>Months</th>
                      <th className={th}>Product mgr</th>
                      <th className={th}>Project mgr</th>
                      <th className={`${th} ${right}`}>Price / unit</th>
                      <th className={`${th} ${right}`}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects
                      .filter((p) => p.platformId === platform.id)
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-moss-50">
                          <td className={td}>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-[12px] text-moss-500">{p.quarterlyGoal}</div>
                          </td>
                          <td className={td}>
                            <PhaseMarker phase={p.phase} />
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
                          </td>
                          <td className={`${td} num ${right}`}>{durationMonths(p)}</td>
                          <td className={`${td} whitespace-nowrap`}>{personName(data, p.ownerId)}</td>
                          <td className={`${td} whitespace-nowrap`}>{personName(data, p.projectManagerId)}</td>
                          <td className={`${td} num ${right}`}>
                            {p.defaultPricePerUnit !== null ? formatMoney(p.defaultPricePerUnit) : <span className="text-moss-400">—</span>}
                          </td>
                          <td className={`${td} num ${right}`}>
                            {p.grossMarginPct !== null ? `${p.grossMarginPct}%` : <span className="text-moss-400">—</span>}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
