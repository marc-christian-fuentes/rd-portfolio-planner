/**
 * QUARTERLY PLANNING (spec section 7)
 * -----------------------------------
 * Stages, who acts at each one, the demo's starting plan, and the
 * "Rank by comparing" engine.
 *
 * Rank by comparing is a binary insertion sort driven by human choices:
 * projects are added to a sorted list one at a time, and each is placed by
 * asking "this one or that one?" against the middle of the list, halving
 * the range each time. Ranking n projects takes about n × log2(n) choices.
 */
import type { Phase, PlanStage, QuarterlyPlan, Role } from './types';

export const PLAN_STAGES: PlanStage[] = ['Propose', 'Prioritise', 'Resource', 'Adjust', 'Published'];

export const STAGE_INFO: Record<PlanStage, { title: string; who: string; hint: string }> = {
  Propose: {
    title: 'Propose',
    who: 'Product managers',
    hint: 'Product managers submit projects for the quarter, each with its quarterly goal. Leadership then closes submissions.',
  },
  Prioritise: {
    title: 'Prioritise',
    who: 'Leadership and CTO',
    hint: 'Rank the list by dragging, or use Rank by comparing. Then send it to the CTO to resource.',
  },
  Resource: {
    title: 'Resource',
    who: 'CTO',
    hint: 'The CTO ticks the projects they can commit people to, then sends the plan back to the Director and CEO.',
  },
  Adjust: {
    title: 'Adjust',
    who: 'Director and CEO',
    hint: 'Swap projects in or out, as long as the number committed stays within what the CTO approved. Then publish.',
  },
  Published: {
    title: 'Published',
    who: 'Everyone',
    hint: 'The plan is locked and versioned. Urgent must-do projects can still be pulled in mid-quarter, creating a new version.',
  },
};

/** Phases a project can be submitted from (multi-quarter projects carry over). */
export const SUBMITTABLE_PHASES: Phase[] = ['Proposed', 'Approved', 'In Development', 'Testing / Validation'];

/** The roles that do something at each stage. */
export const STAGE_ROLES: Record<PlanStage, Role[]> = {
  Propose: ['Product Manager', 'Leadership'],
  Prioritise: ['Leadership', 'CTO'],
  Resource: ['CTO'],
  Adjust: ['Leadership'],
  Published: ['Leadership', 'Product Manager'],
};

export const canRank =(role: Role, stage: PlanStage) => stage === 'Prioritise' && (role === 'Leadership' || role === 'CTO');
export const canResource = (role: Role, stage: PlanStage) => stage === 'Resource' && role === 'CTO';
export const canAdjust = (role: Role, stage: PlanStage) => stage === 'Adjust' && role === 'Leadership';

/** Who may move the plan to its next stage, and what the button says. */
export function nextStageAction(role: Role, stage: PlanStage): { label: string } | null {
  if (stage === 'Propose' && role === 'Leadership') return { label: 'Close submissions and start prioritising' };
  if (stage === 'Prioritise' && (role === 'Leadership' || role === 'CTO')) return { label: 'Send to CTO to resource' };
  if (stage === 'Resource' && role === 'CTO') return { label: 'Send back to Director and CEO' };
  if (stage === 'Adjust' && role === 'Leadership') return { label: 'Publish plan' };
  return null;
}

/** Last quarter's published ranking, so people can see how priorities moved. */
export const PREVIOUS_QUARTER = {
  quarter: 'Q4 2026',
  ranking: ['prj-11', 'prj-05', 'prj-06', 'prj-13', 'prj-12', 'prj-07', 'prj-08'],
};

/** Places moved up (positive) or down (negative) since last quarter, or "new". */
export function movement(projectId: string, ranking: string[]): number | 'new' {
  const before = PREVIOUS_QUARTER.ranking.indexOf(projectId);
  if (before === -1) return 'new';
  return before - ranking.indexOf(projectId);
}

/** The demo's starting plan: Q1 2027, still taking submissions. */
export function seedPlan(goalOf: (projectId: string) => string): QuarterlyPlan {
  const submitted: [string, string][] = [
    ['prj-12', 'pdm-3'],
    ['prj-05', 'pdm-2'],
    ['prj-11', 'pdm-3'],
    ['prj-06', 'pdm-4'],
    ['prj-08', 'pdm-2'],
    ['prj-13', 'pdm-3'],
    ['prj-07', 'pdm-2'],
  ];
  return {
    quarter: 'Q1 2027',
    stage: 'Propose',
    entries: submitted.map(([projectId, by]) => ({ projectId, goal: goalOf(projectId), submittedBy: by, submittedAt: '2026-11-12' })),
    ranking: submitted.map(([id]) => id),
    committed: [],
    approvedCount: null,
    versions: [],
    pullIns: [],
    history: [
      { at: '2026-11-10', by: 'ldr-dir', action: 'Opened Q1 2027 planning for submissions' },
      ...submitted.map(([id, by]) => ({ at: '2026-11-12', by, action: `Submitted ${id}` })),
    ],
  };
}

// ---------- Rank by comparing ----------

export interface CompareState {
  /** Projects already placed, best first. */
  sorted: string[];
  /** Projects still to place; the first one is being placed now. */
  remaining: string[];
  /** The range of positions the current project could still go in. */
  lo: number;
  hi: number;
  comparisons: number;
  /** Roughly how many choices the whole ranking takes. */
  estimate: number;
}

export function startCompare(ids: string[]): CompareState {
  let estimate = 0;
  for (let k = 1; k < ids.length; k++) estimate += Math.ceil(Math.log2(k + 1));
  return { sorted: ids.slice(0, 1), remaining: ids.slice(1), lo: 0, hi: ids.length > 0 ? 1 : 0, comparisons: 0, estimate };
}

/** The two projects to show: [the one being placed, the one it's compared with]. */
export function currentPair(s: CompareState): [string, string] | null {
  if (s.remaining.length === 0) return null;
  return [s.remaining[0], s.sorted[Math.floor((s.lo + s.hi) / 2)]];
}

/** Record a choice: true if the project being placed is the higher priority. */
export function choose(s: CompareState, preferNew: boolean): CompareState {
  const mid = Math.floor((s.lo + s.hi) / 2);
  let lo = s.lo;
  let hi = s.hi;
  if (preferNew) hi = mid;
  else lo = mid + 1;
  if (lo < hi) return { ...s, lo, hi, comparisons: s.comparisons + 1 };
  // Position found: insert, then start placing the next project.
  const sorted = [...s.sorted.slice(0, lo), s.remaining[0], ...s.sorted.slice(lo)];
  const remaining = s.remaining.slice(1);
  return { ...s, sorted, remaining, lo: 0, hi: sorted.length, comparisons: s.comparisons + 1 };
}
