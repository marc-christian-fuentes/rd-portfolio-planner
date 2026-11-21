/**
 * QUARTERLY PLANNING · PRIORITISATION (spec section 7, stages 2–5)
 * ----------------------------------------------------------------
 * The ranked list of submitted projects, worked on stage by stage:
 *   Prioritise: Leadership and the CTO reorder by drag and drop (or arrow
 *               buttons), or with Rank by comparing.
 *   Resource:   the CTO ticks the projects they can commit people to.
 *   Adjust:     the Director or CEO swaps projects within the approved count.
 *   Published:  locked and versioned; urgent pull-ins create a new version.
 * Rank movement against last quarter shows how priorities shifted.
 */
import { useEffect, useState } from 'react';
import { personName } from '../data/model';
import {
  PREVIOUS_QUARTER,
  SUBMITTABLE_PHASES,
  canAdjust,
  canRank,
  canResource,
  choose,
  currentPair,
  movement,
  startCompare,
  type CompareState,
} from '../data/planning';
import { formatK } from '../data/roi';
import { useApp, useRoiFor } from '../store';
import { PageHeader, Panel, PhaseMarker, Tag } from '../components/ui';
import { PlanStatus } from '../components/PlanStatus';
import { CommentToggle } from '../components/CommentThread';

export default function PrioritisationPage() {
  const { plan, role } = useApp();
  const [compare, setCompare] = useState<CompareState | null>(null);
  const ranking = canRank(role, plan.stage);

  return (
    <>
      <PageHeader
        title={`Prioritisation · ${plan.quarter}`}
        subtitle={`Rank the quarter’s projects, commit resources, adjust and publish. Arrows show movement since ${PREVIOUS_QUARTER.quarter}.`}
      />
      <PlanStatus />

      {plan.stage === 'Propose' ? (
        <p className="rounded-[10px] border border-dashed border-moss-300 bg-white px-4 py-5 text-[13px] text-moss-600">
          Submissions are still open. Ranking starts once Leadership closes submissions on the Project submission page or above.
        </p>
      ) : compare ? (
        <ComparePanel state={compare} onChange={setCompare} />
      ) : (
        <>
          {ranking && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-moss-600">Drag rows to reorder, or use the arrows. Every move is kept in the plan’s history.</p>
              <button
                onClick={() => setCompare(startCompare(plan.ranking))}
                className="rounded-md bg-moss-800 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-moss-700"
              >
                Rank by comparing
              </button>
            </div>
          )}
          <RankedList />
        </>
      )}

      {plan.stage === 'Published' && <PublishedSection />}
      <History />
    </>
  );
}

function RankedList() {
  const { data, role, plan, setPlanRanking, setCommitted } = useApp();
  const roiFor = useRoiFor();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const reorderable = canRank(role, plan.stage);
  const tickable = canResource(role, plan.stage) || canAdjust(role, plan.stage);
  const showCommit = ['Resource', 'Adjust', 'Published'].includes(plan.stage);
  const atLimit = plan.stage === 'Adjust' && plan.approvedCount !== null && plan.committed.length >= plan.approvedCount;
  const name = (id: string) => data.projects.find((p) => p.id === id)?.name ?? id;

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= plan.ranking.length) return;
    const next = [...plan.ranking];
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id);
    setPlanRanking(next, `Moved ${name(id)} from #${from + 1} to #${to + 1}`);
  };

  return (
    <Panel
      title="Ranked projects"
      aside={
        showCommit ? (
          <span className="num text-[12px] text-moss-600">
            Committed {plan.committed.length} of {plan.ranking.length}
            {plan.approvedCount !== null && ` · CTO approved ${plan.approvedCount}`}
          </span>
        ) : undefined
      }
    >
      {plan.stage === 'Adjust' && (
        <p className="border-b border-moss-200 bg-sage-50 px-4 py-2 text-[12px] text-moss-700">
          {atLimit
            ? 'At the approved count. To swap, untick a project first, then tick the one replacing it.'
            : `You can tick ${plan.approvedCount! - plan.committed.length} more.`}
        </p>
      )}
      <ol>
        {plan.ranking.map((id, i) => {
          const p = data.projects.find((x) => x.id === id)!;
          const entry = plan.entries.find((e) => e.projectId === id);
          const r = roiFor(id);
          const mv = movement(id, plan.ranking);
          const committed = plan.committed.includes(id);
          const faded = showCommit && !committed;
          return (
            <li
              key={id}
              draggable={reorderable}
              onDragStart={(e) => {
                setDragId(id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                if (!reorderable) return;
                e.preventDefault();
                setOverId(id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) move(plan.ranking.indexOf(dragId), i);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={`grid grid-cols-[2rem_3rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 border-t border-moss-100 px-4 py-2.5 first:border-t-0 md:grid-cols-[2rem_3rem_minmax(0,1fr)_8rem_5rem_4rem_auto] ${
                reorderable ? 'cursor-grab active:cursor-grabbing' : ''
              } ${overId === id && dragId !== id ? 'bg-sage-100' : dragId === id ? 'opacity-50' : faded ? 'opacity-55' : ''}`}
            >
              <span className="num text-[15px] font-semibold text-moss-900">#{i + 1}</span>
              <Movement value={mv} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {reorderable && <span className="text-moss-400" aria-hidden="true">⠿</span>}
                  <span className="text-[13px] font-semibold text-moss-900">{p.name}</span>
                  <span className="text-[12px] text-moss-500">
                    <PhaseMarker phase={p.phase} />
                  </span>
                </div>
                {entry && <div className="mt-0.5 text-[12px] text-moss-600">Goal: {entry.goal}</div>}
              </div>
              <span className="col-start-3 text-[12px] text-moss-600 md:col-start-auto">{personName(data, p.ownerId)}</span>
              <span className="num col-start-3 text-[12px] md:col-start-auto md:text-right">{r ? `NPV ${formatK(r.npv)}` : 'No ROI'}</span>
              <span className="num col-start-3 text-[12px] md:col-start-auto md:text-right">{r?.roiPct != null ? `${r.roiPct.toFixed(0)}%` : '—'}</span>
              <div className="col-start-3 flex items-center justify-end gap-2 md:col-start-auto">
                {reorderable && (
                  <>
                    <button
                      aria-label={`Move ${p.name} up`}
                      disabled={i === 0}
                      onClick={() => move(i, i - 1)}
                      className="size-7 rounded-md border border-moss-300 bg-white hover:bg-moss-50 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`Move ${p.name} down`}
                      disabled={i === plan.ranking.length - 1}
                      onClick={() => move(i, i + 1)}
                      className="size-7 rounded-md border border-moss-300 bg-white hover:bg-moss-50 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </>
                )}
                {showCommit && (
                  <label className="flex items-center gap-1.5 text-[12px] text-moss-700">
                    <input
                      type="checkbox"
                      aria-label={`Commit resources to ${p.name}`}
                      className="size-4 accent-moss-700"
                      checked={committed}
                      disabled={!tickable || (!committed && atLimit)}
                      onChange={(e) => setCommitted(id, e.target.checked)}
                    />
                    {committed ? 'Committed' : 'Not resourced'}
                  </label>
                )}
              </div>
              <div className="col-start-3 md:col-span-5" draggable={false} onDragStart={(e) => e.stopPropagation()}>
                <CommentToggle itemType="plan-entry" itemId={id} />
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

function Movement({ value }: { value: number | 'new' }) {
  if (value === 'new') return <span className="text-[11px] font-medium text-slateblue">new</span>;
  if (value === 0) return <span className="text-[12px] text-moss-400" aria-label="No change">–</span>;
  const up = value > 0;
  return (
    <span className={`num text-[12px] font-medium ${up ? 'text-moss-600' : 'text-rust'}`} aria-label={`${up ? 'Up' : 'Down'} ${Math.abs(value)} since last quarter`}>
      {up ? '▲' : '▼'} {Math.abs(value)}
    </span>
  );
}

/** Two projects side by side; pick the higher priority until the ranking is built. */
function ComparePanel({ state, onChange }: { state: CompareState; onChange: (s: CompareState | null) => void }) {
  const { setPlanRanking } = useApp();
  const pair = currentPair(state);

  useEffect(() => {
    if (!pair) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onChange(choose(state, true));
      if (e.key === 'ArrowRight') onChange(choose(state, false));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, pair, onChange]);

  if (!pair) {
    return (
      <Panel title="Rank by comparing · done">
        <div className="px-4 py-4">
          <p className="text-[13px] text-moss-700">
            Ranking built from <span className="num font-semibold">{state.comparisons}</span> choices:
          </p>
          <ol className="mt-2 list-decimal space-y-0.5 pl-6 text-[13px] text-moss-900">
            {state.sorted.map((id) => (
              <ProjectName key={id} id={id} />
            ))}
          </ol>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setPlanRanking(state.sorted, `Ranked by comparing (${state.comparisons} choices)`);
                onChange(null);
              }}
              className="rounded-md bg-moss-800 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-moss-700"
            >
              Use this ranking
            </button>
            <button onClick={() => onChange(null)} className="rounded-md border border-moss-300 px-3 py-1.5 text-[13px] text-moss-700 hover:bg-moss-50">
              Discard
            </button>
          </div>
        </div>
      </Panel>
    );
  }

  const progress = Math.min(100, (state.comparisons / Math.max(1, state.estimate)) * 100);
  return (
    <Panel
      title="Rank by comparing"
      aside={
        <button onClick={() => onChange(null)} className="text-[12px] text-moss-600 underline hover:text-moss-900">
          Cancel
        </button>
      }
    >
      <div className="px-4 py-4">
        <p className="text-[13px] text-moss-700">
          Which should come first this quarter? Pick one, or press ← / →. Each choice narrows down where the project belongs.
        </p>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-moss-500">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-moss-100" aria-hidden="true">
            <div className="h-full rounded-full bg-moss-600" style={{ width: `${progress}%` }} />
          </div>
          <span className="num">
            Choice {state.comparisons + 1} of about {state.estimate} · {state.sorted.length} placed, {state.remaining.length} to go
          </span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CompareCard id={pair[0]} onPick={() => onChange(choose(state, true))} keyHint="←" />
          <CompareCard id={pair[1]} onPick={() => onChange(choose(state, false))} keyHint="→" />
        </div>
      </div>
    </Panel>
  );
}

function ProjectName({ id }: { id: string }) {
  const name = useApp((s) => s.data.projects.find((p) => p.id === id)?.name ?? id);
  return <li>{name}</li>;
}

function CompareCard({ id, onPick, keyHint }: { id: string; onPick: () => void; keyHint: string }) {
  const { data, plan } = useApp();
  const r = useRoiFor()(id);
  const p = data.projects.find((x) => x.id === id)!;
  const entry = plan.entries.find((e) => e.projectId === id);
  const platform = data.platforms.find((pl) => pl.id === p.platformId)?.name;

  return (
    <div className="flex flex-col rounded-[10px] border border-moss-200 bg-white p-4">
      <div className="text-[15px] font-semibold text-moss-900">{p.name}</div>
      <div className="mt-0.5 flex flex-wrap gap-x-3 text-[12px] text-moss-500">
        <span>{platform}</span>
        <PhaseMarker phase={p.phase} />
        <span>{personName(data, p.ownerId)}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="NPV" value={r ? formatK(r.npv) : '—'} />
        <Stat label="ROI" value={r?.roiPct != null ? `${r.roiPct.toFixed(0)}%` : '—'} />
        <Stat label="Payback" value={r?.paybackYears != null ? `${r.paybackYears.toFixed(1)} yrs` : '—'} />
      </div>
      <p className="mt-3 text-[13px] text-moss-700">{p.description}</p>
      {entry && (
        <p className="mt-2 text-[13px] text-moss-700">
          <span className="font-semibold text-moss-900">PM goal:</span> {entry.goal}
        </p>
      )}
      <div className="mt-auto pt-4">
        <button onClick={onPick} className="w-full rounded-md bg-moss-800 px-3 py-2 text-[13px] font-medium text-white hover:bg-moss-700">
          Prioritise this one <span className="opacity-60">({keyHint})</span>
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-moss-50 px-2.5 py-1.5">
      <div className="text-[11px] text-moss-500">{label}</div>
      <div className="num text-[15px] font-semibold text-moss-900">{value}</div>
    </div>
  );
}

/** Versions and mid-quarter pull-ins, once the plan is published. */
function PublishedSection() {
  const { data, role, actingAsId, plan, proposePullIn, decidePullIn } = useApp();
  const candidates = data.projects.filter(
    (p) =>
      SUBMITTABLE_PHASES.includes(p.phase) &&
      !plan.committed.includes(p.id) &&
      !plan.pullIns.some((x) => x.projectId === p.id && x.status === 'Pending') &&
      (role !== 'Product Manager' || p.ownerId === actingAsId),
  );
  const canPropose = role === 'Leadership' || role === 'Product Manager';
  const [projectId, setProjectId] = useState('');
  const [reason, setReason] = useState('');
  const chosen = candidates.find((c) => c.id === projectId) ?? candidates[0];
  const name = (id: string) => data.projects.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <Panel title="Mid-quarter pull-ins" aside={<span className="text-[12px] text-moss-500">Approved pull-ins create a new version</span>}>
        <div className="space-y-3 px-4 py-3">
          {plan.pullIns.length === 0 && <p className="text-[13px] text-moss-500">No pull-ins yet.</p>}
          {plan.pullIns.map((x) => (
            <div key={x.id} className="rounded-lg border border-moss-200 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-moss-900">{name(x.projectId)}</span>
                <Tag tone={x.status === 'Approved' ? 'solid' : 'neutral'}>{x.status}</Tag>
              </div>
              <p className="mt-1 text-[12px] text-moss-600">
                “{x.reason}” · {personName(data, x.proposedBy)}, <span className="num">{x.at}</span>
              </p>
              {x.status === 'Pending' && role === 'Leadership' && (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => decidePullIn(x.id, true)} className="rounded-md bg-moss-800 px-3 py-1 text-[12px] font-medium text-white hover:bg-moss-700">
                    Approve pull-in
                  </button>
                  <button onClick={() => decidePullIn(x.id, false)} className="rounded-md border border-moss-300 px-3 py-1 text-[12px] text-moss-700 hover:border-rust hover:text-rust">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}

          {canPropose && candidates.length > 0 && chosen && (
            <div className="rounded-lg border border-dashed border-moss-300 p-3">
              <div className="mb-2 text-[13px] font-semibold text-moss-900">Propose an urgent must-do</div>
              <div className="flex flex-col gap-2">
                <select
                  value={chosen.id}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="rounded-md border border-moss-300 bg-white px-2 py-1 text-[13px]"
                  aria-label="Project to pull in"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Why it can’t wait for next quarter"
                  aria-label="Reason"
                  className="rounded-md border border-moss-300 bg-white px-2 py-1.5 text-[13px]"
                />
                <button
                  disabled={!reason.trim()}
                  onClick={() => {
                    proposePullIn(chosen.id, reason.trim());
                    setReason('');
                  }}
                  className="self-start rounded-md bg-moss-800 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-moss-700 disabled:opacity-40"
                >
                  Propose pull-in
                </button>
              </div>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Versions">
        <ol className="space-y-2 px-4 py-3">
          {[...plan.versions].reverse().map((v) => (
            <li key={v.version} className="rounded-lg border border-moss-200 px-3 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold text-moss-900">Version {v.version}</span>
                <span className="num text-[12px] text-moss-500">
                  {v.at} · {personName(data, v.by)}
                </span>
              </div>
              <p className="text-[12px] text-moss-600">
                {v.note} · {v.committed.length} committed
              </p>
              <p className="mt-1 text-[12px] text-moss-500">
                {v.ranking
                  .filter((id) => v.committed.includes(id))
                  .map((id, i) => `${i + 1}. ${name(id)}`)
                  .join(' · ')}
              </p>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function History() {
  const { data, plan } = useApp();
  return (
    <details className="mt-5 rounded-[10px] border border-moss-200 bg-white px-4 py-3">
      <summary className="cursor-pointer text-[13px] font-semibold text-moss-900 select-none">
        Plan history <span className="num font-normal text-moss-500">· {plan.history.length} changes</span>
      </summary>
      <ol className="mt-2 space-y-1 text-[12px] text-moss-600">
        {[...plan.history].reverse().map((h, i) => (
          <li key={i}>
            <span className="num text-moss-500">{h.at}</span> · {h.action} · {personName(data, h.by)}
          </li>
        ))}
      </ol>
    </details>
  );
}
