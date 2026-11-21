/**
 * QUARTERLY PLANNING · PROJECT SUBMISSION (spec section 7, stage 1)
 * -----------------------------------------------------------------
 * Product managers submit projects for the quarter, each with its ROI,
 * description and quarterly goal. Everyone else sees what's been submitted.
 */
import { useState } from 'react';
import { peopleForRole, visibleProjects } from '../data/access';
import { personName } from '../data/model';
import { SUBMITTABLE_PHASES } from '../data/planning';
import { formatK } from '../data/roi';
import type { Project } from '../data/types';
import { useApp, useRoiFor } from '../store';
import { PageHeader, Panel, PhaseMarker, Tag, right, table, td, th } from '../components/ui';
import { useQuarterName } from '../components/YearLabel';
import { PlanStatus } from '../components/PlanStatus';

export default function SubmissionPage() {
  const { data, role, actingAsId, plan } = useApp();
  const qn = useQuarterName();
  const roiFor = useRoiFor();
  const isPm = role === 'Product Manager';
  const mine = visibleProjects(data, role, actingAsId).filter((p) => SUBMITTABLE_PHASES.includes(p.phase));
  const visibleIds = new Set(visibleProjects(data, role, actingAsId).map((p) => p.id));
  const entries = plan.entries.filter((e) => visibleIds.has(e.projectId));
  const hidden = plan.entries.length - entries.length;

  return (
    <>
      <PageHeader
        title={`Project submission · ${qn(plan.quarter)}`}
        subtitle="Product managers submit projects for the quarter, each with its ROI, description and quarterly goal."
      />
      <PlanStatus />

      {isPm && (
        <section className="mb-6">
          <h2 className="mb-2 text-[15px] font-semibold text-moss-900">Your projects</h2>
          {mine.length === 0 ? (
            <NothingToSubmit />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {mine.map((p) => (
                <SubmissionCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </section>
      )}

      <Panel
        title={`Submitted for ${qn(plan.quarter)}`}
        aside={
          <span className="num text-[12px] text-moss-500">
            {hidden > 0 ? `${entries.length} of ${plan.entries.length} projects` : `${entries.length} projects`}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className={table}>
            <thead>
              <tr>
                <th className={`${th} min-w-[200px]`}>Project</th>
                <th className={th}>Product mgr</th>
                <th className={`${th} min-w-[220px]`}>Quarterly goal</th>
                <th className={`${th} ${right}`}>NPV</th>
                <th className={`${th} ${right}`}>ROI</th>
                <th className={th}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const p = data.projects.find((x) => x.id === e.projectId)!;
                const r = roiFor(p.id);
                return (
                  <tr key={e.projectId} className="hover:bg-moss-50">
                    <td className={td}>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-[12px] text-moss-500">
                        <PhaseMarker phase={p.phase} />
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{personName(data, p.ownerId)}</td>
                    <td className={td}>{e.goal}</td>
                    <td className={`${td} num ${right}`}>{r ? formatK(r.npv) : <span className="text-moss-400">No model</span>}</td>
                    <td className={`${td} num ${right}`}>{r?.roiPct != null ? `${r.roiPct.toFixed(0)}%` : '—'}</td>
                    <td className={`${td} num whitespace-nowrap text-moss-500`}>{e.submittedAt}</td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className={`${td} text-moss-500`}>
                    {hidden > 0 ? 'None of your visible projects are submitted yet.' : 'Nothing submitted yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {hidden > 0 && (
          <p className="border-t border-moss-200 px-4 py-2.5 text-[12px] text-moss-500">
            {hidden} more {hidden === 1 ? 'project was' : 'projects were'} submitted by other product managers. You only see the projects Admin has
            shared with you.
          </p>
        )}
      </Panel>
    </>
  );
}

/**
 * Shown when this product manager has nothing in a submittable phase (e.g.
 * every project is completed): says why, and offers the managers who do.
 */
function NothingToSubmit() {
  const { data, setActingAs } = useApp();
  const others = peopleForRole(data, 'Product Manager').filter((person) =>
    visibleProjects(data, 'Product Manager', person.id).some((p) => SUBMITTABLE_PHASES.includes(p.phase)),
  );
  return (
    <div className="rounded-[10px] border border-dashed border-moss-300 bg-white px-4 py-3 text-[13px] text-moss-700">
      <p>
        None of your projects can be submitted this quarter. Only projects that are {SUBMITTABLE_PHASES.join(', ').replace(/, ([^,]*)$/, ' or $1')} take part
        in quarterly planning, and yours are all completed.
      </p>
      {others.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-moss-600">Try it as:</span>
          {others.map((person) => (
            <button
              key={person.id}
              onClick={() => setActingAs(person.id)}
              className="rounded-md border border-moss-300 bg-white px-2.5 py-1 text-[12px] font-medium text-moss-800 hover:bg-moss-50"
            >
              {person.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** One of the product manager's projects: its numbers, its goal, and Submit / Withdraw. */
function SubmissionCard({ project }: { project: Project }) {
  const { plan, submitToPlan, withdrawFromPlan, updatePlanGoal } = useApp();
  const qn = useQuarterName();
  const r = useRoiFor()(project.id);
  const entry = plan.entries.find((e) => e.projectId === project.id);
  const [draft, setDraft] = useState(project.quarterlyGoal);
  const open = plan.stage === 'Propose';
  const goal = entry ? entry.goal : draft;

  return (
    <div className={`rounded-[10px] border bg-white p-4 ${entry ? 'border-moss-500' : 'border-moss-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[14px] font-semibold text-moss-900">{project.name}</div>
        {entry ? <Tag tone="solid">Submitted</Tag> : <Tag>Not submitted</Tag>}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 text-[12px] text-moss-600">
        <PhaseMarker phase={project.phase} />
        <span className="num">NPV {r ? formatK(r.npv) : '—'}</span>
        <span className="num">ROI {r?.roiPct != null ? `${r.roiPct.toFixed(0)}%` : '—'}</span>
      </div>
      <p className="mt-2 text-[13px] text-moss-600">{project.description}</p>
      <label className="mt-3 block text-[12px] text-moss-600">
        Quarterly goal
        <textarea
          value={goal}
          disabled={!open}
          rows={2}
          onChange={(e) => (entry ? updatePlanGoal(project.id, e.target.value) : setDraft(e.target.value))}
          className="mt-1 block w-full rounded-md border border-moss-300 bg-white px-2 py-1.5 text-[13px] text-moss-900 focus:border-moss-600 focus:outline-none disabled:bg-moss-50"
        />
      </label>
      <div className="mt-3">
        {!open ? (
          <span className="text-[12px] text-moss-500">Submissions are closed for {qn(plan.quarter)}.</span>
        ) : entry ? (
          <button onClick={() => withdrawFromPlan(project.id)} className="rounded-md border border-moss-300 px-3 py-1 text-[13px] text-moss-700 hover:border-rust hover:text-rust">
            Withdraw
          </button>
        ) : (
          <button
            disabled={!goal.trim()}
            onClick={() => submitToPlan(project.id, goal.trim())}
            className="rounded-md bg-moss-800 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-moss-700 disabled:opacity-40"
          >
            Submit for {qn(plan.quarter)}
          </button>
        )}
      </div>
    </div>
  );
}
