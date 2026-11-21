/**
 * NEW PROJECT (spec section 10)
 * -----------------------------
 * Product and project managers add a project. The form checks the same
 * rules as the data self-check (dates, two-year limit, price and margin for
 * revenue projects, a business case once past Scoping), so new projects
 * slot into every view: Summary, Roadmap, planning, Sales and resourcing.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { canCreateProject } from '../data/access';
import type { Component, Phase, ProjectType } from '../data/types';
import { useApp } from '../store';
import { PageHeader, Panel } from '../components/ui';

const MAX_MONTHS = 24;

function monthsBetween(start: string, end: string): number {
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  return (ey - sy) * 12 + (em - sm) + 1;
}

export default function NewProjectPage() {
  const { data, role, actingAsId, addProject } = useApp();
  const navigate = useNavigate();
  const productManagers = data.users.filter((u) => u.role === 'Product Manager').map((u) => data.people.find((p) => p.id === u.personId)!).filter(Boolean);
  const projectManagers = data.users.filter((u) => u.role === 'Project Manager').map((u) => data.people.find((p) => p.id === u.personId)!).filter(Boolean);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platformId, setPlatformId] = useState(data.platforms[0].id);
  const [type, setType] = useState<ProjectType>('revenue');
  const [component, setComponent] = useState<Component>('software');
  const [recurring, setRecurring] = useState(false);
  const [price, setPrice] = useState('');
  const [margin, setMargin] = useState(String(useApp.getState().assumptions.defaultGrossMarginPct));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [plannedHours, setPlannedHours] = useState('');
  const [phase, setPhase] = useState<Phase>('Scoping');
  const [ownerId, setOwnerId] = useState(role === 'Product Manager' ? actingAsId : (productManagers[0]?.id ?? ''));
  const [projectManagerId, setProjectManagerId] = useState(role === 'Project Manager' ? actingAsId : (projectManagers[0]?.id ?? ''));
  const [goal, setGoal] = useState('');
  const [businessCase, setBusinessCase] = useState('');
  const [tried, setTried] = useState(false);

  if (!canCreateProject(role)) {
    return (
      <>
        <PageHeader title="New project" />
        <p className="rounded-[10px] border border-dashed border-moss-300 bg-white px-4 py-5 text-[13px] text-moss-600">
          Product and project managers add projects. Switch to one of those roles with “View as” at the top.
        </p>
      </>
    );
  }

  // Validation: the same rules the data self-check uses.
  const errors: Partial<Record<string, string>> = {};
  if (!name.trim()) errors.name = 'Enter a project name.';
  else if (data.projects.some((p) => p.name.toLowerCase() === name.trim().toLowerCase())) errors.name = 'A project with that name already exists.';
  if (!description.trim()) errors.description = 'Add a short description.';
  if (!startDate) errors.startDate = 'Choose a start date.';
  if (!endDate) errors.endDate = 'Choose an end date.';
  else if (startDate && endDate <= startDate) errors.endDate = 'The end date must be after the start date.';
  else if (startDate && monthsBetween(startDate, endDate) > MAX_MONTHS) errors.endDate = `Projects can run at most ${MAX_MONTHS} months.`;
  if (!(Number(plannedHours) > 0)) errors.plannedHours = 'Enter the planned hours (more than 0).';
  if (type === 'revenue') {
    if (!(Number(price) > 0)) errors.price = 'Revenue projects need a default price.';
    if (!(Number(margin) >= 0 && Number(margin) <= 100) || margin === '') errors.margin = 'Enter a margin between 0 and 100%.';
  }
  if (phase !== 'Scoping' && !businessCase.trim()) errors.businessCase = 'Projects past Scoping need a business case.';
  if (!ownerId) errors.ownerId = 'Choose a product manager.';
  if (!projectManagerId) errors.projectManagerId = 'Choose a project manager.';
  const valid = Object.keys(errors).length === 0;

  const submit = () => {
    setTried(true);
    if (!valid) return;
    const id = addProject({
      platformId,
      name: name.trim(),
      description: description.trim(),
      ownerId,
      projectManagerId,
      phase,
      startDate,
      endDate,
      type,
      component,
      quarterlyGoal: goal.trim(),
      plannedHours: Math.round(Number(plannedHours)),
      defaultPricePerUnit: type === 'revenue' ? Number(price) : null,
      grossMarginPct: type === 'revenue' ? Number(margin) : null,
      recurring: type === 'revenue' && recurring,
      businessCaseFile: businessCase,
    });
    navigate(`/project/${id}`);
  };

  const field = 'flex flex-col gap-1 text-[12px] text-moss-600';
  const control = 'rounded-md border border-moss-300 bg-white px-2 py-1.5 text-[13px] text-moss-900 focus:border-moss-600 focus:outline-none';
  const err = (key: string) =>
    tried && errors[key] ? (
      <span className="text-[12px] text-rust" role="alert">
        {errors[key]}
      </span>
    ) : null;
  const segmented = <T extends string>(value: T, set: (v: T) => void, options: { value: T; label: string }[], label: string) => (
    <div className="flex overflow-hidden rounded-md" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => set(o.value)}
          className={`border px-2.5 py-1 text-[12px] first:rounded-l-md not-last:border-r-0 last:rounded-r-md ${
            value === o.value ? 'border-moss-800 bg-moss-800 text-white' : 'border-moss-300 bg-white text-moss-700 hover:bg-moss-50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader title="New project" subtitle="Add a project to a product platform. It appears in the Summary, Roadmap, planning and resourcing straight away." />

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Panel title="About the project">
          <div className="grid gap-4 px-4 py-4 md:grid-cols-2">
            <label className={field}>
              Project name
              <input className={control} value={name} onChange={(e) => setName(e.target.value)} placeholder="Smart Leak Shut-off" />
              {err('name')}
            </label>
            <label className={field}>
              Product platform
              <select className={control} value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
                {data.platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${field} md:col-span-2`}>
              Description
              <textarea className={control} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What it does and why it matters." />
              {err('description')}
            </label>
            <div className={field}>
              Type
              {segmented<ProjectType>(type, setType, [{ value: 'revenue', label: 'Revenue-generating' }, { value: 'cost-only', label: 'Cost-only' }], 'Project type')}
            </div>
            <div className={field}>
              Main piece
              {segmented<Component>(component, setComponent, [{ value: 'hardware', label: 'Hardware' }, { value: 'software', label: 'Software' }], 'Hardware or software')}
            </div>
            {type === 'revenue' && (
              <>
                <label className={field}>
                  Default price per unit ($)
                  <input className={control} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="99" />
                  {err('price')}
                </label>
                <label className={field}>
                  Gross margin (%)
                  <input className={control} inputMode="decimal" value={margin} onChange={(e) => setMargin(e.target.value)} />
                  {err('margin')}
                </label>
                <label className="flex items-center gap-2 text-[13px] text-moss-700 md:col-span-2">
                  <input type="checkbox" className="size-4 accent-moss-700" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
                  Recurring revenue (subscription or warranty), priced per year
                </label>
              </>
            )}
          </div>
        </Panel>

        <Panel title="Plan">
          <div className="grid gap-4 px-4 py-4 md:grid-cols-3">
            <label className={field}>
              Start date
              <input type="date" className={control} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              {err('startDate')}
            </label>
            <label className={field}>
              End date
              <input type="date" className={control} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              {err('endDate')}
              {!errors.endDate && startDate && endDate && <span className="text-[12px] text-moss-500">{monthsBetween(startDate, endDate)} months</span>}
            </label>
            <label className={field}>
              Planned hours (whole project)
              <input className={control} inputMode="numeric" value={plannedHours} onChange={(e) => setPlannedHours(e.target.value)} placeholder="2400" />
              {err('plannedHours')}
            </label>
            <div className={field}>
              Starting phase
              {segmented<Phase>(phase, setPhase, [{ value: 'Scoping', label: 'Scoping' }, { value: 'Proposed', label: 'Proposed' }], 'Starting phase')}
              <span className="text-[12px] text-moss-500">Later phases follow approval in quarterly planning.</span>
            </div>
            <label className={field}>
              Product manager (owner)
              <select className={control} value={ownerId} onChange={(e) => setOwnerId(e.target.value)} disabled={role === 'Product Manager'}>
                {productManagers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {err('ownerId')}
            </label>
            <label className={field}>
              Project manager
              <select className={control} value={projectManagerId} onChange={(e) => setProjectManagerId(e.target.value)} disabled={role === 'Project Manager'}>
                {projectManagers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {err('projectManagerId')}
            </label>
            <label className={`${field} md:col-span-2`}>
              Quarterly goal
              <input className={control} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Prototype validated with five pilot customers" />
            </label>
            <label className={field}>
              Business case file {phase === 'Scoping' && <span className="text-moss-400">(optional while scoping)</span>}
              <input className={control} value={businessCase} onChange={(e) => setBusinessCase(e.target.value)} placeholder="smart-leak-business-case.pdf" />
              {err('businessCase')}
            </label>
          </div>
        </Panel>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="rounded-md bg-moss-800 px-4 py-2 text-[13px] font-medium text-white hover:bg-moss-700">
            Create project
          </button>
          <Link to="/project" className="text-[13px] text-moss-600 underline hover:text-moss-900">
            Cancel
          </Link>
          {tried && !valid && (
            <span className="text-[12px] text-rust" role="alert">
              Fix the highlighted fields to continue.
            </span>
          )}
        </div>
      </form>
    </>
  );
}
