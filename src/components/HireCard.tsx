/**
 * One proposed hire: what it is, what it costs, where it sits in the
 * Director → CTO → Finance approval chain, and Approve / Reject buttons
 * for whoever decides next.
 */
import { formatDay, personName } from '../data/model';
import { APPROVAL_STEPS, canDecide, hireAnnualCost } from '../data/resourcing';
import type { ProposedHire } from '../data/types';
import { useApp } from '../store';

const money = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

export function HireCard({ hire, showProject = false }: { hire: ProposedHire; showProject?: boolean }) {
  const { data, role, decideHire } = useApp();
  const dept = data.departments.find((d) => d.id === hire.departmentId);
  const project = data.projects.find((p) => p.id === hire.projectId);
  const stepIndex = APPROVAL_STEPS.findIndex((s) => s.status === hire.status);
  const approved = hire.status === 'Approved';
  const rejected = hire.status === 'Rejected';

  return (
    <div className="rounded-lg border border-moss-200 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="text-[13px] font-semibold text-moss-900">
          {dept?.name ?? 'Hire'} hire
          {showProject && project && <span className="font-normal text-moss-500"> · {project.name}</span>}
        </div>
        <span
          className={`rounded-full px-2 py-px text-[11px] font-medium ${
            approved ? 'bg-moss-800 text-white' : rejected ? 'bg-rust/10 text-rust' : 'border border-ochre/50 text-ochre'
          }`}
        >
          {approved ? 'Approved · firm cost' : rejected ? 'Rejected' : `Proposed · ${hire.status.toLowerCase()}`}
        </span>
      </div>
      <div className="num mt-0.5 text-[12px] text-moss-600">
        {hire.hours.toLocaleString('en-US')} hrs/yr · from {formatDay(hire.startDate)} · {money(hireAnnualCost(hire, data.departments))}/yr
      </div>

      {/* Approval chain */}
      <ol className="mt-2 flex flex-wrap items-center gap-1 text-[11px]" aria-label="Approval chain">
        {APPROVAL_STEPS.map((s, i) => {
          const done = approved || (stepIndex !== -1 && i < stepIndex);
          const current = i === stepIndex;
          return (
            <li key={s.status} className="flex items-center gap-1">
              {i > 0 && <span className="text-moss-300" aria-hidden="true">→</span>}
              <span
                className={`rounded-full px-2 py-px ${
                  done
                    ? 'bg-moss-600 text-white'
                    : current
                      ? 'border border-ochre text-ochre'
                      : rejected
                        ? 'bg-moss-50 text-moss-400 line-through'
                        : 'bg-moss-50 text-moss-500'
                }`}
              >
                {done ? '✓ ' : ''}
                {s.approver}
              </span>
            </li>
          );
        })}
      </ol>

      {canDecide(role, hire.status) && (
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={() => decideHire(hire.id, true)}
            className="rounded-md bg-moss-800 px-3 py-1 text-[12px] font-medium text-white hover:bg-moss-700"
          >
            Approve as {APPROVAL_STEPS[stepIndex].approver}
          </button>
          <button
            onClick={() => decideHire(hire.id, false)}
            className="rounded-md border border-moss-300 bg-white px-3 py-1 text-[12px] text-moss-700 hover:border-rust hover:text-rust"
          >
            Reject
          </button>
        </div>
      )}

      <details className="mt-2 text-[12px] text-moss-500">
        <summary className="cursor-pointer select-none">History</summary>
        <ul className="mt-1 space-y-0.5">
          {hire.history.map((h, i) => (
            <li key={i}>
              <span className="num">{h.at}</span> · {h.action} · {personName(data, h.by)}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
