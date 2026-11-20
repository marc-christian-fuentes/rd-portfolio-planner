/**
 * PROJECT MANAGEMENT · COSTS & RESOURCING (spec section 6)
 * --------------------------------------------------------
 * A project manager's team and active projects:
 *   1. Team allocation: % of each person to each project; free time updates live.
 *   2. For the chosen project: hours needed vs allocated, the gap, and a form
 *      to turn the gap into a proposed hire.
 *   3. Proposed hires and their Director → CTO → Finance approval chain.
 *   4. Costs: labour by person, non-labour lines, and hire costs.
 * Approvers (Leadership, CTO, Finance) also see hires waiting on them.
 */
import { useState } from 'react';
import { accessFor } from '../data/access';
import { formatMoney } from '../data/model';
import {
  annualAmount,
  allocatedHoursPerYear,
  canDecide,
  hireAnnualCost,
  hireHoursPerYear,
  hoursNeededPerYear,
  isActive,
  labourCostPerYear,
  personLoadPct,
  rateOf,
} from '../data/resourcing';
import type { Granularity, Project } from '../data/types';
import { useApp } from '../store';
import { KpiStrip, PageHeader, Panel, right, table, td, th } from '../components/ui';
import { FilterSelect, useQueryParam } from '../components/Filters';
import { NumberInput } from '../components/NumberInput';
import { HireCard } from '../components/HireCard';

const hrs = (v: number) => `${Math.round(v).toLocaleString('en-US')} h`;

export default function ResourcingPage() {
  const { data, role, actingAsId, allocations, hires, setAllocation } = useApp();
  const canEdit = accessFor(role, 'resourcing') === 'edit';
  const pms = data.people.filter((p) => p.kind === 'project-manager');
  const [pjmParam, setPjm] = useQueryParam('pjm', pms[0].id);
  const pjm = role === 'Project Manager' ? actingAsId : pjmParam;

  const team = data.people.filter((p) => p.kind === 'resource' && p.managerId === pjm);
  const projects = data.projects.filter((p) => p.projectManagerId === pjm && isActive(p));
  const [projectParam, setProjectParam] = useQueryParam('project', '');
  const selected = projects.find((p) => p.id === projectParam) ?? projects[0];

  const teamCapacity = team.reduce((s, p) => s + p.capacityHoursPerYear, 0);
  const teamAllocated = team.reduce((s, p) => s + (p.capacityHoursPerYear * personLoadPct(p.id, allocations)) / 100, 0);
  const openGap = projects.reduce(
    (s, p) => s + Math.max(0, hoursNeededPerYear(p) - allocatedHoursPerYear(p.id, allocations, data.people) - hireHoursPerYear(p.id, hires)),
    0,
  );
  const waitingOnMe = hires.filter((h) => canDecide(role, h.status));

  return (
    <>
      <PageHeader
        title="Costs & resourcing"
        subtitle="Assign your team to projects, close staffing gaps with proposed hires, and see what each project costs per year."
      >
        {role !== 'Project Manager' && (
          <FilterSelect label="Project manager" value={pjm} onChange={setPjm} options={pms.map((p) => ({ value: p.id, label: p.name }))} />
        )}
        {selected && (
          <FilterSelect
            label="Project"
            value={selected.id}
            onChange={setProjectParam}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
        )}
      </PageHeader>

      {waitingOnMe.length > 0 && (
        <section className="mb-5 rounded-[10px] border border-ochre/40 bg-white p-4">
          <h2 className="mb-2 text-[14px] font-semibold text-moss-900">
            Waiting on you <span className="num font-normal text-moss-500">· {waitingOnMe.length}</span>
          </h2>
          <div className="grid gap-2 md:grid-cols-2">
            {waitingOnMe.map((h) => (
              <HireCard key={h.id} hire={h} showProject />
            ))}
          </div>
        </section>
      )}

      <KpiStrip
        items={[
          { label: 'Team capacity / yr', value: hrs(teamCapacity) },
          { label: 'Allocated', value: hrs(teamAllocated) },
          { label: 'Utilisation', value: teamCapacity ? `${Math.round((teamAllocated / teamCapacity) * 100)}%` : '—' },
          { label: 'Unfilled gap / yr', value: hrs(openGap) },
        ]}
      />

      <Panel title="Team allocation" aside={<span className="text-[12px] text-moss-500">% of each person’s year, per project</span>}>
        {projects.length === 0 ? (
          <p className="px-4 py-5 text-[13px] text-moss-500">No active projects for this project manager.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={table}>
              <thead>
                <tr>
                  <th className={`${th} min-w-[170px]`}>Person</th>
                  <th className={`${th} ${right}`}>Capacity</th>
                  {projects.map((p) => (
                    <th key={p.id} className={`${th.replace('whitespace-nowrap', '')} ${right} w-[120px] leading-tight`} title={p.name}>
                      <button
                        onClick={() => setProjectParam(p.id)}
                        className={`text-right hover:text-moss-900 ${p.id === selected?.id ? 'font-semibold text-moss-900' : ''}`}
                      >
                        {p.name}
                      </button>
                    </th>
                  ))}
                  <th className={`${th} ${right} border-l border-moss-200`}>Total</th>
                  <th className={`${th} ${right}`}>Free</th>
                </tr>
              </thead>
              <tbody>
                {team.map((person) => {
                  const load = personLoadPct(person.id, allocations);
                  const over = load > 100;
                  const free = (person.capacityHoursPerYear * Math.max(0, 100 - load)) / 100;
                  return (
                    <tr key={person.id} className="hover:bg-moss-50">
                      <td className={td}>
                        <div className="font-medium">{person.name}</div>
                        <div className="text-[12px] text-moss-500">
                          {data.departments.find((d) => d.id === person.departmentId)?.name}
                        </div>
                      </td>
                      <td className={`${td} num ${right}`}>{hrs(person.capacityHoursPerYear)}</td>
                      {projects.map((p) => {
                        const pct = allocations.find((a) => a.personId === person.id && a.projectId === p.id)?.percent ?? 0;
                        return (
                          <td key={p.id} className={`${td} num ${right} ${p.id === selected?.id ? 'bg-moss-50' : ''}`}>
                            {canEdit ? (
                              <span className="inline-flex items-center gap-1">
                                <NumberInput
                                  ariaLabel={`${person.name} on ${p.name}, percent`}
                                  value={pct}
                                  min={0}
                                  max={100}
                                  className="w-12"
                                  onChange={(v) => setAllocation(person.id, p.id, v)}
                                />
                                <span className="text-moss-500">%</span>
                              </span>
                            ) : pct ? (
                              `${pct}%`
                            ) : (
                              <span className="text-moss-300">–</span>
                            )}
                          </td>
                        );
                      })}
                      <td className={`${td} num ${right} border-l border-moss-200 font-semibold ${over ? 'text-rust' : ''}`}>
                        {load}%{over && <div className="text-[11px] font-normal">over-allocated</div>}
                      </td>
                      <td className={`${td} num ${right} ${free > 0 ? 'text-moss-700' : 'text-moss-400'}`}>{hrs(free)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td className={`${td} border-t-moss-300 font-semibold`} colSpan={2}>
                    Allocated / needed per year
                  </td>
                  {projects.map((p) => {
                    const have = allocatedHoursPerYear(p.id, allocations, data.people);
                    const need = hoursNeededPerYear(p);
                    return (
                      <td key={p.id} className={`${td} border-t-moss-300 num ${right} text-[12px] ${have < need ? 'text-rust' : 'text-moss-700'}`}>
                        {Math.round(have).toLocaleString('en-US')} / {need.toLocaleString('en-US')}
                      </td>
                    );
                  })}
                  <td className={`${td} border-t-moss-300 border-l border-moss-200`} colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selected && <ProjectDetail key={selected.id} project={selected} />}
    </>
  );
}

/** Staffing, hires and costs for one project. */
function ProjectDetail({ project }: { project: Project }) {
  const { data, role, allocations, hires } = useApp();
  const need = hoursNeededPerYear(project);
  const have = allocatedHoursPerYear(project.id, allocations, data.people);
  const hired = hireHoursPerYear(project.id, hires);
  const gap = Math.max(0, need - have - hired);
  const projectHires = hires.filter((h) => h.projectId === project.id);
  const pct = (v: number) => `${Math.min(100, (v / Math.max(need, have + hired)) * 100)}%`;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-moss-900">{project.name}</h2>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Staffing">
          <div className="space-y-3 px-4 py-3">
            <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
              <Figure label="Needed / yr" value={hrs(need)} />
              <Figure label="Allocated" value={hrs(have)} />
              <Figure label="Hires (proposed + approved)" value={hrs(hired)} />
              <Figure label="Remaining gap" value={hrs(gap)} tone={gap > 0 ? 'rust' : 'moss'} />
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-moss-100" aria-hidden="true">
              <div className="bg-moss-600" style={{ width: pct(have) }} />
              <div className="bg-ochre/70" style={{ width: pct(hired) }} />
            </div>
            <p className="text-[12px] text-moss-500">
              Needed per year = planned hours ÷ project length. Gap = needed − allocated − hires.
            </p>
            {role === 'Project Manager' ? (
              <ProposeHireForm project={project} gap={gap} />
            ) : (
              <p className="text-[12px] text-moss-500">Project managers propose hires from here.</p>
            )}
          </div>
        </Panel>

        <Panel title="Proposed hires" aside={<span className="text-[12px] text-moss-500">Director → CTO → Finance</span>}>
          <div className="space-y-2 px-4 py-3">
            {projectHires.length === 0 ? (
              <p className="text-[13px] text-moss-500">No hires for this project.</p>
            ) : (
              projectHires.map((h) => <HireCard key={h.id} hire={h} />)
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-5">
        <CostsPanel project={project} />
      </div>
    </section>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: 'rust' | 'moss' }) {
  return (
    <div>
      <div className="text-[12px] text-moss-500">{label}</div>
      <div className={`num text-[16px] font-semibold ${tone === 'rust' ? 'text-rust' : 'text-moss-900'}`}>{value}</div>
    </div>
  );
}

/** Turn a staffing gap into a proposed hire. */
function ProposeHireForm({ project, gap }: { project: Project; gap: number }) {
  const { data, proposeHire } = useApp();
  const rdDepartments = data.departments.filter((d) => d.id !== 'dept-prod');
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
  const [departmentId, setDepartmentId] = useState(rdDepartments[0].id);
  const [startDate, setStartDate] = useState(nextMonth.toISOString().slice(0, 10));
  const [hours, setHours] = useState(Math.min(1600, Math.max(100, Math.round(gap / 100) * 100)));
  const [sent, setSent] = useState(false);
  const cost = hours * rateOf(data.departments, departmentId);
  const tooLate = startDate > project.endDate;

  const field = 'flex flex-col gap-1 text-[12px] text-moss-600';
  const control = 'rounded-md border border-moss-300 bg-white px-2 py-1 text-[13px] text-moss-900';

  return (
    <div className="rounded-lg border border-dashed border-moss-300 p-3">
      <div className="mb-2 text-[13px] font-semibold text-moss-900">Propose a hire</div>
      <div className="flex flex-wrap items-end gap-3">
        <label className={field}>
          Department
          <select className={control} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            {rdDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className={field}>
          Start date
          <input type="date" className={control} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className={field}>
          Hours / yr
          <NumberInput ariaLabel="Hire hours per year" value={hours} min={0} max={2000} className="w-20" onChange={setHours} />
        </label>
        <button
          disabled={hours <= 0 || tooLate}
          onClick={() => {
            proposeHire({ projectId: project.id, departmentId, startDate, hours });
            setSent(true);
          }}
          className="rounded-md bg-moss-800 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-moss-700 disabled:opacity-40"
        >
          Propose hire
        </button>
      </div>
      <p className="mt-2 text-[12px] text-moss-500">
        {tooLate
          ? 'That start date is after the project ends.'
          : `About ${formatMoney(cost)} a year. It goes to the Director, then the CTO, then Finance, and shows in this project’s ROI straight away as a proposed cost.`}
      </p>
      {sent && <p className="mt-1 text-[12px] font-medium text-moss-700" role="status">Hire proposed. It now waits for the Director.</p>}
    </div>
  );
}

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: 'monthly', label: 'per month' },
  { value: 'quarterly', label: 'per quarter' },
  { value: 'annual', label: 'per year' },
];

/** Labour by person, non-labour lines and hires, as a yearly run-rate. */
function CostsPanel({ project }: { project: Project }) {
  const { data, role, allocations, costLines, hires, roiModels, addCostLine, updateCostLine, removeCostLine } = useApp();
  const canEdit = accessFor(role, 'resourcing') === 'edit';
  const labour = allocations.filter((a) => a.projectId === project.id);
  const lines = costLines.filter((c) => c.projectId === project.id);
  const projectHires = hires.filter((h) => h.projectId === project.id && h.status !== 'Rejected');

  const labourTotal = labourCostPerYear(project.id, allocations, data.people, data.departments);
  const otherTotal = lines.reduce((s, c) => s + annualAmount(c), 0);
  const hireTotal = projectHires.reduce((s, h) => s + hireAnnualCost(h, data.departments), 0);
  const total = labourTotal + otherTotal + hireTotal;

  const year = new Date().getFullYear();
  const model = roiModels[project.id];
  const budgetK = model ? model.years[year - model.startYear]?.rdCost : undefined;

  const section = (label: string, colSpan = 5) => (
    <tr>
      <td colSpan={colSpan} className="bg-moss-50 px-3 pt-3 pb-1 text-[11px] font-semibold text-moss-600">
        {label}
      </td>
    </tr>
  );

  return (
    <Panel title="Costs per year" aside={<span className="text-[12px] text-moss-500">Run-rate in $ · labour from allocations above</span>}>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className={`${th} min-w-[200px]`}>Item</th>
              <th className={th}>Detail</th>
              <th className={`${th} ${right}`}>Amount</th>
              <th className={th}>Per</th>
              <th className={`${th} ${right}`}>Per year</th>
            </tr>
          </thead>
          <tbody>
            {section('Labour, by person')}
            {labour.length === 0 && (
              <tr>
                <td colSpan={5} className={`${td} text-moss-500`}>
                  Nobody is allocated yet.
                </td>
              </tr>
            )}
            {labour.map((a) => {
              const person = data.people.find((p) => p.id === a.personId)!;
              const hours = (person.capacityHoursPerYear * a.percent) / 100;
              const rate = rateOf(data.departments, person.departmentId);
              return (
                <tr key={a.id}>
                  <td className={td}>{person.name}</td>
                  <td className={`${td} text-moss-500`}>
                    {a.percent}% · {hrs(hours)}
                  </td>
                  <td className={`${td} num ${right}`}>{formatMoney(rate)}</td>
                  <td className={td}>per hour</td>
                  <td className={`${td} num ${right}`}>{formatMoney(hours * rate)}</td>
                </tr>
              );
            })}

            {section('Non-labour')}
            {lines.map((c) => (
              <tr key={c.id}>
                <td className={td}>
                  {canEdit ? (
                    <input
                      aria-label="Cost item"
                      value={c.label}
                      onChange={(e) => updateCostLine(c.id, { label: e.target.value })}
                      className="w-full rounded-md border border-moss-200 bg-moss-50 px-1.5 py-0.5 text-[13px] focus:border-moss-600 focus:bg-white focus:outline-none"
                    />
                  ) : (
                    c.label
                  )}
                </td>
                <td className={`${td} text-moss-500`}>
                  {canEdit && (
                    <button onClick={() => removeCostLine(c.id)} className="text-[12px] hover:text-rust" aria-label={`Remove ${c.label}`}>
                      Remove
                    </button>
                  )}
                </td>
                <td className={`${td} ${right}`}>
                  {canEdit ? (
                    <NumberInput ariaLabel={`${c.label} amount`} value={c.amount} min={0} className="w-24" onChange={(v) => updateCostLine(c.id, { amount: v })} />
                  ) : (
                    <span className="num">{formatMoney(c.amount)}</span>
                  )}
                </td>
                <td className={td}>
                  {canEdit ? (
                    <select
                      aria-label={`${c.label} granularity`}
                      value={c.granularity}
                      onChange={(e) => updateCostLine(c.id, { granularity: e.target.value as Granularity })}
                      className="rounded-md border border-moss-200 bg-white px-1.5 py-0.5 text-[13px]"
                    >
                      {GRANULARITIES.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    GRANULARITIES.find((g) => g.value === c.granularity)?.label
                  )}
                </td>
                <td className={`${td} num ${right}`}>{formatMoney(annualAmount(c))}</td>
              </tr>
            ))}
            {canEdit && (
              <tr>
                <td colSpan={5} className={td}>
                  <button onClick={() => addCostLine(project.id)} className="text-[12px] font-medium text-moss-600 hover:text-moss-900">
                    + Add cost line
                  </button>
                </td>
              </tr>
            )}

            {projectHires.length > 0 && section('New hires')}
            {projectHires.map((h) => {
              const dept = data.departments.find((d) => d.id === h.departmentId);
              return (
                <tr key={h.id}>
                  <td className={td}>
                    {dept?.name} hire{' '}
                    <span className={`ml-1 text-[11px] ${h.status === 'Approved' ? 'text-moss-600' : 'text-ochre'}`}>
                      {h.status === 'Approved' ? 'approved' : 'proposed'}
                    </span>
                  </td>
                  <td className={`${td} text-moss-500`}>{hrs(h.hours)}</td>
                  <td className={`${td} num ${right}`}>{formatMoney(dept?.ratePerHour ?? 0)}</td>
                  <td className={td}>per hour</td>
                  <td className={`${td} num ${right}`}>{formatMoney(hireAnnualCost(h, data.departments))}</td>
                </tr>
              );
            })}

            <tr>
              <td colSpan={4} className={`${td} border-t-moss-300 font-semibold`}>
                Total per year
              </td>
              <td className={`${td} border-t-moss-300 num ${right} font-semibold`}>{formatMoney(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {budgetK !== undefined && (
        <p className="border-t border-moss-200 px-4 py-2.5 text-[12px] text-moss-600">
          ROI model R&amp;D budget for {year}: <span className="num font-medium">{formatMoney(budgetK * 1000)}</span>. This bottom-up run-rate is{' '}
          <span className={`num font-medium ${total > budgetK * 1000 ? 'text-rust' : 'text-moss-800'}`}>
            {formatMoney(Math.abs(total - budgetK * 1000))} {total > budgetK * 1000 ? 'over' : 'under'}
          </span>
          .
        </p>
      )}
    </Panel>
  );
}
