/**
 * PHASE TABS (shared)
 * -------------------
 * Every page that lists projects groups them into the same tabs, ordered by
 * progress: Completed (default, far left) → Testing / Validation →
 * In Development → Approved → Proposed (far right).
 * The open tab is kept in the web address (?phase=...), so it is remembered
 * when moving between pages and when sharing a link.
 */
import { useSearchParams } from 'react-router-dom';
import type { Phase, Project } from '../data/types';
import { Tabs } from './ui';

export const PHASE_TABS: Phase[] = ['Completed', 'Testing / Validation', 'In Development', 'Approved', 'Proposed'];
const DEFAULT_PHASE: Phase = 'Completed';

/** Reads and changes the open phase tab. */
export function usePhaseTab(): [Phase, (phase: Phase) => void] {
  const [params, setParams] = useSearchParams();
  const requested = params.get('phase');
  const active = PHASE_TABS.find((p) => p === requested) ?? DEFAULT_PHASE;
  const setActive = (phase: Phase) => {
    const next = new URLSearchParams(params);
    if (phase === DEFAULT_PHASE) next.delete('phase');
    else next.set('phase', phase);
    setParams(next, { replace: true });
  };
  return [active, setActive];
}

/** The tab row, with a project count on each tab. */
export function PhaseTabs({ projects, active, onChange }: { projects: Project[]; active: Phase; onChange: (p: Phase) => void }) {
  return (
    <Tabs
      label="Project phase"
      tabs={PHASE_TABS.map((phase) => ({ id: phase, label: phase, count: projects.filter((p) => p.phase === phase).length }))}
      active={active}
      onChange={onChange}
    />
  );
}

/** Keeps the ?phase= tab when linking to another page. */
export function withPhase(path: string, phase: Phase): string {
  return phase === DEFAULT_PHASE ? path : `${path}?phase=${encodeURIComponent(phase)}`;
}
