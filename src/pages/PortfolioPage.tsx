/**
 * Portfolio overview (landing page).
 * Step 7.2 version: lists the platforms and the projects this role may see.
 * ROI figures and drill-down arrive in step 7.3.
 */
import { visibleProjects } from '../data/access';
import { durationMonths, formatDate, formatMoney, isPlatformLaunched, personName } from '../data/model';
import { useApp } from '../store';
import { Card, PageHeader, PhaseBadge, Pill, num, td, th } from '../components/ui';

export default function PortfolioPage() {
  const { data, role, actingAsId } = useApp();
  const projects = visibleProjects(data, role, actingAsId);
  const platforms = data.platforms.filter((pl) => projects.some((p) => p.platformId === pl.id));

  return (
    <>
      <PageHeader
        title="Portfolio overview"
        subtitle={`${projects.length} of ${data.projects.length} projects visible to this role, across ${platforms.length} product platform${platforms.length === 1 ? '' : 's'}. ROI and drill-down come in step 7.3.`}
      />

      {platforms.length === 0 && <Card>No projects are assigned to this person.</Card>}

      <div className="space-y-5">
        {platforms.map((platform) => {
          const launched = isPlatformLaunched(data, platform);
          return (
            <Card key={platform.id}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{platform.name}</h2>
                <Pill tone={launched ? 'green' : 'slate'}>{launched ? 'Launched' : 'In progress'}</Pill>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {platform.description} Hardware: {platform.hardwarePiece}. Software: {platform.softwarePiece}.
              </p>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={th}>Project</th>
                      <th className={th}>Phase</th>
                      <th className={th}>Type</th>
                      <th className={th}>Dates</th>
                      <th className={th}>Product manager</th>
                      <th className={th}>Project manager</th>
                      <th className={`${th} ${num}`}>Price / unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects
                      .filter((p) => p.platformId === platform.id)
                      .map((p) => (
                        <tr key={p.id}>
                          <td className={td}>
                            <div className="font-medium text-slate-900">{p.name}</div>
                            <div className="text-xs text-slate-500">Goal: {p.quarterlyGoal}</div>
                          </td>
                          <td className={td}>
                            <PhaseBadge phase={p.phase} />
                          </td>
                          <td className={td}>
                            {p.type === 'revenue' ? 'Revenue' : 'Cost-only'}
                            <div className="text-xs capitalize text-slate-500">
                              {p.component}
                              {p.recurring && ' · recurring'}
                            </div>
                          </td>
                          <td className={`${td} whitespace-nowrap`}>
                            {formatDate(p.startDate)} – {formatDate(p.endDate)}
                            <div className="text-xs text-slate-500">{durationMonths(p)} months</div>
                          </td>
                          <td className={td}>{personName(data, p.ownerId)}</td>
                          <td className={td}>{personName(data, p.projectManagerId)}</td>
                          <td className={`${td} ${num}`}>
                            {p.defaultPricePerUnit !== null ? formatMoney(p.defaultPricePerUnit) : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
