/** A stand-in for pages built in later steps. Shows what the page will do. */
import { SECTIONS, accessFor, visibleProjects, type SectionId } from '../data/access';
import { useApp } from '../store';
import { PageHeader, Panel, PhaseMarker, Tag, table, td, th } from '../components/ui';

export default function PlaceholderPage({ section }: { section: SectionId }) {
  const { data, role, actingAsId } = useApp();
  const info = SECTIONS.find((s) => s.id === section)!;
  const projects = visibleProjects(data, role, actingAsId);
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
        <Panel title="Projects in scope for this role" aside={<span className="num text-[12px] text-moss-500">{projects.length}</span>}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Project</th>
                <th className={th}>Phase</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-moss-50">
                  <td className={td}>{p.name}</td>
                  <td className={td}>
                    <PhaseMarker phase={p.phase} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </>
  );
}
