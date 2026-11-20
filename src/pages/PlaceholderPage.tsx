/** A stand-in for pages built in later steps. Shows what the page will do. */
import { SECTIONS, accessFor, visibleProjects, type SectionId } from '../data/access';
import { personName } from '../data/model';
import { useApp } from '../store';
import { PageHeader, Panel, Tag, table, td, th } from '../components/ui';
import { PhaseTabs, usePhaseTab } from '../components/PhaseTabs';

export default function PlaceholderPage({ section }: { section: SectionId }) {
  const { data, role, actingAsId } = useApp();
  const [phase, setPhase] = usePhaseTab();
  const info = SECTIONS.find((s) => s.id === section)!;
  const projects = visibleProjects(data, role, actingAsId);
  const inTab = projects.filter((p) => p.phase === phase);
  const access = accessFor(role, section);
  const showProjects = section !== 'inbox' && section !== 'admin' && section !== 'assumptions';

  return (
    <>
      <PageHeader title={info.label} subtitle={info.description} />
      <div className="mb-4 flex flex-wrap items-center gap-2 border border-dashed border-moss-300 bg-white px-4 py-2.5 text-[13px] text-moss-700">
        <Tag>Step {info.step}</Tag>
        This page is built in a later step. As {role} you will be able to {access === 'edit' ? 'edit' : 'view'} it.
      </div>

      {showProjects && (
        <Panel>
          <PhaseTabs projects={projects} active={phase} onChange={setPhase} />
          <div role="tabpanel" aria-label={phase}>
            {inTab.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-moss-500">No projects in {phase} for this role.</p>
            ) : (
              <table className={table}>
                <thead>
                  <tr>
                    <th className={th}>Project</th>
                    <th className={th}>Product mgr</th>
                    <th className={th}>Project mgr</th>
                  </tr>
                </thead>
                <tbody>
                  {inTab.map((p) => (
                    <tr key={p.id} className="hover:bg-moss-50">
                      <td className={td}>{p.name}</td>
                      <td className={td}>{personName(data, p.ownerId)}</td>
                      <td className={td}>{personName(data, p.projectManagerId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>
      )}
    </>
  );
}
