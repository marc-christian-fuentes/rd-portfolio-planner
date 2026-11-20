/** A stand-in for pages built in later steps. Shows what the page will do. */
import { SECTIONS, accessFor, visibleProjects, type SectionId } from '../data/access';
import { useApp } from '../store';
import { Card, PageHeader, PhaseBadge } from '../components/ui';

export default function PlaceholderPage({ section }: { section: SectionId }) {
  const { data, role, actingAsId } = useApp();
  const info = SECTIONS.find((s) => s.id === section)!;
  const projects = visibleProjects(data, role, actingAsId);
  const access = accessFor(role, section);

  return (
    <>
      <PageHeader title={info.label} subtitle={info.description} />
      <Card className="border-dashed">
        <p className="text-sm text-slate-600">
          This page is built in <strong>step {info.step}</strong>. As <strong>{role}</strong> you will be able to{' '}
          <strong>{access === 'edit' ? 'edit' : 'view'}</strong> it.
        </p>
        {section !== 'inbox' && section !== 'admin' && section !== 'assumptions' && (
          <>
            <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Projects in scope for this role ({projects.length})
            </p>
            <ul className="divide-y divide-slate-100">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                  <span>{p.name}</span>
                  <PhaseBadge phase={p.phase} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
