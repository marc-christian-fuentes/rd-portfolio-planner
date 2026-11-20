/**
 * The quarterly plan's stage tracker: Propose → Prioritise → Resource →
 * Adjust → Published, who acts now, and the button to move on (shown only
 * to the role whose turn it is).
 */
import { PLAN_STAGES, STAGE_INFO, STAGE_ROLES, nextStageAction } from '../data/planning';
import { useApp } from '../store';

export function PlanStatus() {
  const { plan, role, advancePlanStage, restartPlan } = useApp();
  const current = PLAN_STAGES.indexOf(plan.stage);
  const info = STAGE_INFO[plan.stage];
  const action = nextStageAction(role, plan.stage);
  const latest = plan.versions[plan.versions.length - 1];

  return (
    <section className="mb-5 rounded-[10px] border border-moss-200 bg-white px-4 py-3" aria-label="Plan stage">
      <ol className="flex flex-wrap items-center gap-1.5 text-[12px]">
        {PLAN_STAGES.map((s, i) => {
          const done = i < current || plan.stage === 'Published';
          const now = i === current;
          return (
            <li key={s} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-moss-300" aria-hidden="true">→</span>}
              <span
                aria-current={now ? 'step' : undefined}
                className={`rounded-full px-2.5 py-0.5 ${
                  now ? 'bg-moss-800 font-semibold text-white' : done ? 'bg-sage-200 text-moss-800' : 'bg-moss-50 text-moss-500'
                }`}
              >
                {done && !now ? '✓ ' : ''}
                {STAGE_INFO[s].title}
              </span>
            </li>
          );
        })}
        {latest && <li className="ml-2 text-moss-500">Version {latest.version}</li>}
      </ol>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-[13px] text-moss-700">
          <span className="font-semibold text-moss-900">Now: {info.who}.</span> {info.hint}
        </p>
        <div className="flex items-center gap-3">
          {action ? (
            <button onClick={advancePlanStage} className="rounded-md bg-moss-800 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-moss-700">
              {action.label}
            </button>
          ) : (
            !STAGE_ROLES[plan.stage].includes(role) && (
              <span className="text-[12px] text-moss-500">Switch role to {info.who} to act.</span>
            )
          )}
          <button
            onClick={() => {
              if (window.confirm('Restart the demo planning cycle? This clears the ranking, commitments and versions.')) restartPlan();
            }}
            className="text-[12px] text-moss-500 underline hover:text-moss-900"
          >
            Restart demo cycle
          </button>
        </div>
      </div>
    </section>
  );
}
