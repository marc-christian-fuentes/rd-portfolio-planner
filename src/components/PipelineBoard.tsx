/**
 * Phase pipeline board: one column per phase, side by side, in the shared
 * phase order (Completed → Proposed). Each card opens the Project view.
 * Columns wrap onto new rows on narrow screens, so nothing scrolls sideways.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatK } from '../data/roi';
import type { Phase, Project } from '../data/types';
import { useApp, useRoiFor } from '../store';
import { PHASE_TABS } from './PhaseTabs';
import { useQuarterName } from './YearLabel';

const SHORT: Record<Phase, string> = {
  Scoping: 'Scoping',
  Proposed: 'Proposed',
  Approved: 'Approved',
  'In Development': 'In dev',
  'Testing / Validation': 'Testing',
  Completed: 'Completed',
};
const TENTATIVE: Phase[] = ['Proposed', 'Approved'];
const CARD_LIMIT = 3;

export function PipelineBoard({ projects }: { projects: Project[] }) {
  const data = useApp((s) => s.data);
  const plan = useApp((s) => s.plan);
  const qn = useQuarterName();
  const roiFor = useRoiFor();
  // The latest published plan drives this view: committed projects show their priority.
  const published = plan.versions[plan.versions.length - 1];
  const planRank = (id: string) => {
    if (!published || !published.committed.includes(id)) return null;
    return published.ranking.filter((x) => published.committed.includes(x)).indexOf(id) + 1;
  };
  const [expanded, setExpanded] = useState<Phase[]>([]);
  const platformName = (id: string) => data.platforms.find((pl) => pl.id === id)?.name ?? '—';

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        {PHASE_TABS.map((phase) => {
          const column = projects.filter((p) => p.phase === phase);
          const open = expanded.includes(phase);
          const shown = open ? column : column.slice(0, CARD_LIMIT);
          const hidden = column.length - shown.length;
          return (
            <section key={phase} aria-label={`${phase}, ${column.length} projects`} className="min-w-0">
              <h3 className="rounded-lg bg-moss-100 px-3 py-1.5 text-[13px] font-semibold text-moss-900">
                {SHORT[phase]} <span className="num font-normal text-moss-500">· {column.length}</span>
              </h3>
              <p className="h-6 px-1 pt-1 text-[12px] text-moss-500">{TENTATIVE.includes(phase) ? 'Tentative' : ''}</p>
              <ul className="space-y-2">
                {shown.map((p) => {
                  const npv = roiFor(p.id)?.npv ?? null;
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/project/${p.id}?phase=${encodeURIComponent(phase)}`}
                        className="block rounded-lg border border-moss-200 bg-white px-3 py-2 hover:border-moss-500 focus-visible:outline-2 focus-visible:outline-moss-600"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[13px] leading-snug font-semibold text-moss-900">{p.name}</span>
                          {planRank(p.id) && (
                            <span
                              className="num shrink-0 rounded-full bg-moss-800 px-1.5 py-px text-[10px] font-medium text-white"
                              title={`Priority #${planRank(p.id)} in the published ${qn(plan.quarter)} plan`}
                            >
                              {qn(plan.quarter).split(' ').find((w) => w.startsWith('Q'))} #{planRank(p.id)}
                            </span>
                          )}
                        </div>
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
              {column.length > CARD_LIMIT && (
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
      <p className="mt-4 text-[12px] text-moss-500">Revenue planning unlocks from In Development onward; earlier phases are tentative.</p>
    </>
  );
}
