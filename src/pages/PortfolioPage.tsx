/**
 * Portfolio overview (landing page).
 * A KPI strip, then a pipeline board: one column per phase, side by side,
 * in the shared phase order (Completed → Proposed). Each card opens that
 * project's ROI calculator. Columns wrap onto new rows on narrow screens,
 * so nothing scrolls sideways.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { visibleProjects } from '../data/access';
import { isPendingHire, isPlatformLaunched } from '../data/model';
import { computeRoi, formatK } from '../data/roi';
import type { Phase } from '../data/types';
import { useApp } from '../store';
import { KpiStrip, PageHeader } from '../components/ui';
import { PHASE_TABS } from '../components/PhaseTabs';

/** Short column titles. */
const SHORT: Record<Phase, string> = {
  Scoping: 'Scoping',
  Proposed: 'Proposed',
  Approved: 'Approved',
  'In Development': 'In dev',
  'Testing / Validation': 'Testing',
  Completed: 'Completed',
};
const TENTATIVE: Phase[] = ['Proposed', 'Approved'];
/** Cards shown per column before "+ N more". */
const CARD_LIMIT = 3;

export default function PortfolioPage() {
  const { data, role, actingAsId, roiModels } = useApp();
  const [expanded, setExpanded] = useState<Phase[]>([]);
  const projects = visibleProjects(data, role, actingAsId);

  const npvOf = (id: string) => (roiModels[id] ? computeRoi(roiModels[id]).npv : null);
  const portfolioNpv = projects.reduce((s, p) => s + (npvOf(p.id) ?? 0), 0);
  const visibleIds = new Set(projects.map((p) => p.id));
  const pendingHires = data.hires.filter((h) => visibleIds.has(h.projectId) && isPendingHire(h.status)).length;
  const platformName = (id: string) => data.platforms.find((pl) => pl.id === id)?.name ?? '—';

  return (
    <>
      <PageHeader title="Portfolio overview" subtitle="Every project from one shared model, by phase. Click a project to open its ROI calculator." />

      <KpiStrip
        items={[
          { label: 'Active projects', value: String(projects.filter((p) => PHASE_TABS.includes(p.phase)).length) },
          { label: 'Platforms launched', value: `${data.platforms.filter((pl) => isPlatformLaunched(data, pl)).length} of ${data.platforms.length}` },
          { label: 'Portfolio NPV', value: `${portfolioNpv > 0 ? '+' : ''}${formatK(portfolioNpv)}` },
          { label: 'Pending hires', value: String(pendingHires) },
        ]}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        {PHASE_TABS.map((phase) => {
          const column = projects.filter((p) => p.phase === phase);
          const open = expanded.includes(phase);
          const shown = open ? column : column.slice(0, CARD_LIMIT);
          const hidden = column.length - shown.length;
          return (
            <section key={phase} aria-label={`${phase}, ${column.length} projects`} className="min-w-0">
              <h2 className="rounded-lg bg-moss-100 px-3 py-1.5 text-[13px] font-semibold text-moss-900">
                {SHORT[phase]} <span className="num font-normal text-moss-500">· {column.length}</span>
              </h2>
              <p className="h-6 px-1 pt-1 text-[12px] text-moss-500">{TENTATIVE.includes(phase) ? 'Tentative' : ''}</p>

              <ul className="space-y-2">
                {shown.map((p) => {
                  const npv = npvOf(p.id);
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/roi/${p.id}?phase=${encodeURIComponent(phase)}`}
                        className="block rounded-lg border border-moss-200 bg-white px-3 py-2 hover:border-moss-500 focus-visible:outline-2 focus-visible:outline-moss-600"
                      >
                        <div className="text-[13px] leading-snug font-semibold text-moss-900">{p.name}</div>
                        <div className="mt-0.5 flex items-baseline justify-between gap-2 text-[12px] text-moss-500">
                          <span className="truncate">{platformName(p.platformId)}</span>
                          <span className="num shrink-0">{npv != null ? `NPV ${formatK(npv)}` : 'No ROI yet'}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
                {column.length === 0 && <li className="px-1 text-[12px] text-moss-400">None</li>}
              </ul>

              {(hidden > 0 || open) && column.length > CARD_LIMIT && (
                <button
                  onClick={() => setExpanded(open ? expanded.filter((x) => x !== phase) : [...expanded, phase])}
                  className="mt-2 px-1 text-[12px] font-medium text-moss-600 hover:text-moss-900"
                >
                  {open ? 'Show less' : `+ ${hidden} more`}
                </button>
              )}
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-[12px] text-moss-500">
        Revenue planning unlocks from In Development onward; earlier phases are tentative.
      </p>
    </>
  );
}
