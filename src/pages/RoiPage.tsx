/**
 * ROI CALCULATOR
 * --------------
 * Pick a project (using the shared phase tabs), then see its multi-year cash
 * flow model. Product managers can create and edit models for their own
 * projects; every figure recalculates live. Other roles see it read-only.
 */
import { useNavigate, useParams } from 'react-router-dom';
import { canEditRoi, visibleProjects } from '../data/access';
import { durationMonths, formatDate, formatDay, personName, scheduleStatus } from '../data/model';
import { MAX_YEARS, MIN_YEARS, formatK, type RoiResult, type RoiRow } from '../data/roi';
import type { Project, RoiModel, RoiYear } from '../data/types';
import { effectiveModel, useApp, useRoiFor } from '../store';
import { HiresToggle } from '../components/Filters';
import { KpiStrip, PageHeader, Panel, PhaseMarker, Tag, right, table, td, th } from '../components/ui';
import { PhaseTabs, usePhaseTab, withPhase } from '../components/PhaseTabs';
import { NumberInput } from '../components/NumberInput';

export default function RoiPage() {
  const { data, role, actingAsId } = useApp();
  const roiFor = useRoiFor();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [phase] = usePhaseTab();

  const projects = visibleProjects(data, role, actingAsId);
  const inTab = projects.filter((p) => p.phase === phase);
  const selected = projects.find((p) => p.id === projectId) ?? inTab[0];
  const platformName = (id: string) => data.platforms.find((pl) => pl.id === id)?.name ?? '—';
  const selectedResult = selected ? roiFor(selected.id) : null;

  return (
    <>
      <PageHeader
        title="Project view · ROI calculator"
        subtitle="Pick a project to see its cash flow model. Product managers build and edit models for their own projects; every figure updates as you type."
        aside={
          selected && (
            <span className="text-[13px] text-moss-600">
              <span className="font-semibold text-moss-900">{selected.name}</span>
              <span className="num">
                {' '}
                · {formatDate(selected.startDate)} – {formatDate(selected.endDate)} · NPV{' '}
                {selectedResult ? formatK(selectedResult.npv) : 'no model yet'}
              </span>
            </span>
          )
        }
      >
        <HiresToggle />
      </PageHeader>

      <Panel>
        <PhaseTabs projects={projects} active={phase} onChange={(p) => navigate(withPhase('/project', p), { replace: true })} />
        <div role="tabpanel" aria-label={phase} className="overflow-x-auto">
          {inTab.length === 0 ? (
            <p className="px-4 py-5 text-[13px] text-moss-500">No projects in {phase} for this role.</p>
          ) : (
            <table className={table}>
              <thead>
                <tr>
                  <th className={`${th} min-w-[200px]`}>Project</th>
                  <th className={th}>Platform</th>
                  <th className={th}>Product mgr</th>
                  <th className={`${th} ${right}`}>NPV</th>
                  <th className={`${th} ${right}`}>ROI</th>
                </tr>
              </thead>
              <tbody>
                {inTab.map((p) => {
                  const result = roiFor(p.id);
                  const isSelected = p.id === selected?.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(withPhase(`/project/${p.id}`, phase))}
                      className={`cursor-pointer ${isSelected ? 'bg-moss-100' : 'hover:bg-moss-50'}`}
                    >
                      <td className={`${td} ${isSelected ? 'shadow-[inset_3px_0_0_var(--color-moss-600)]' : ''}`}>
                        <span className={isSelected ? 'font-semibold' : 'font-medium'}>{p.name}</span>
                      </td>
                      <td className={td}>{platformName(p.platformId)}</td>
                      <td className={`${td} whitespace-nowrap`}>{personName(data, p.ownerId)}</td>
                      <td className={`${td} num ${right}`}>{result ? formatK(result.npv) : <span className="text-moss-400">No model</span>}</td>
                      <td className={`${td} num ${right}`}>{result?.roiPct != null ? `${result.roiPct.toFixed(0)}%` : <span className="text-moss-400">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Panel>

      {selected && <ProjectRoi key={selected.id} project={selected} />}
    </>
  );
}

/** The selected project's model, or a "create" prompt if it has none. */
function ProjectRoi({ project }: { project: Project }) {
  const { data, role, actingAsId, roiModels, createRoiModel } = useApp();
  const model = roiModels[project.id];
  const canEdit = canEditRoi(role, actingAsId, project);

  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold text-moss-900">{project.name}</h2>
        <PhaseMarker phase={project.phase} />
        <Tag tone={canEdit ? 'solid' : 'neutral'}>{canEdit ? 'You can edit' : 'View only'}</Tag>
        {model && (
          <span className="text-[12px] text-moss-500">
            Model by {personName(data, model.createdBy)} · updated <span className="num">{model.updatedAt}</span>
          </span>
        )}
      </div>

      <Schedule project={project} />

      {!model ? (
        <div className="rounded-[10px] border border-dashed border-moss-300 bg-white px-4 py-5 text-[13px] text-moss-700">
          <p className="mb-3">This project has no ROI model yet.</p>
          {canEdit ? (
            <button
              onClick={() => createRoiModel(project.id)}
              className="rounded-md bg-moss-800 px-3 py-1.5 text-[13px] font-medium text-moss-50 hover:bg-moss-700"
            >
              Create ROI model
            </button>
          ) : (
            <p className="text-moss-500">
              Only its product manager, {personName(data, project.ownerId)}, can create one. Switch to “Product Manager” and pick them to try it.
            </p>
          )}
        </div>
      ) : (
        <ModelView project={project} model={model} canEdit={canEdit} />
      )}
    </section>
  );
}

/** Start, (expected) completion, duration and how far through the schedule the project is. */
function Schedule({ project }: { project: Project }) {
  const s = scheduleStatus(project);
  const startLabel = s.notStarted ? 'Planned start' : 'Started';
  const endLabel = s.done ? 'Completed' : 'Expected completion';
  const progressText = s.done
    ? 'Done'
    : s.notStarted
      ? 'Not started yet'
      : s.overdue
        ? 'Past expected completion'
        : `${s.elapsedPct}% of schedule elapsed · ${s.monthsLeft} month${s.monthsLeft === 1 ? '' : 's'} left`;

  const item = 'min-w-0';
  const label = 'text-[12px] text-moss-500';
  const value = 'num mt-0.5 text-[15px] font-semibold text-moss-900';

  return (
    <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-3 rounded-[10px] border border-moss-200 bg-white px-4 py-3 md:grid-cols-[repeat(3,auto)_minmax(0,1fr)]">
      <div className={item}>
        <div className={label}>{startLabel}</div>
        <div className={value}>{formatDay(project.startDate)}</div>
      </div>
      <div className={item}>
        <div className={label}>{endLabel}</div>
        <div className={value}>{formatDay(project.endDate)}</div>
      </div>
      <div className={item}>
        <div className={label}>Duration</div>
        <div className={value}>{durationMonths(project)} months</div>
      </div>
      <div className={`${item} col-span-2 md:col-span-1`}>
        <div className={label}>Progress</div>
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-moss-100"
          role="progressbar"
          aria-valuenow={s.elapsedPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Share of schedule elapsed"
        >
          <div className={`h-full rounded-full ${s.overdue ? 'bg-rust' : 'bg-moss-600'}`} style={{ width: `${s.elapsedPct}%` }} />
        </div>
        <div className={`mt-1 text-[12px] ${s.overdue ? 'text-rust' : 'text-moss-600'}`}>{progressText}</div>
      </div>
    </div>
  );
}

function ModelView({ project, model, canEdit }: { project: Project; model: RoiModel; canEdit: boolean }) {
  // Includes this project's hire costs (pending ones when the switch is on).
  const result = useRoiFor()(project.id)!;

  return (
    <>
      <KpiStrip
        items={[
          { label: 'Net present value', value: formatK(result.npv) },
          { label: 'Discounted ROI', value: result.roiPct != null ? `${result.roiPct.toFixed(0)}%` : '—' },
          { label: 'IRR', value: result.irrPct != null ? `${result.irrPct.toFixed(1)}%` : 'n/a' },
          { label: 'Discounted payback', value: result.paybackYears != null ? `${result.paybackYears.toFixed(1)} yrs` : 'Beyond horizon' },
        ]}
      />
      <div className="space-y-4">
        <Assumptions project={project} model={model} canEdit={canEdit} />
        <CashFlowTable project={project} model={model} result={result} canEdit={canEdit} />
      </div>
    </>
  );
}

function Assumptions({ project, model, canEdit }: { project: Project; model: RoiModel; canEdit: boolean }) {
  const { updateRoiModel, setRoiHorizon } = useApp();
  const field = 'flex items-center gap-2 text-[13px] text-moss-700';

  return (
    <Panel title="Assumptions">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
        <label className={field}>
          WACC
          {canEdit ? (
            <NumberInput ariaLabel="WACC percent" value={model.waccPct} min={0} max={50} className="w-16" onChange={(v) => updateRoiModel(project.id, { waccPct: v })} />
          ) : (
            <span className="num font-medium text-moss-900">{model.waccPct}</span>
          )}
          %
        </label>

        <div className={field}>
          Discounting
          <div className="flex overflow-hidden rounded-md" role="group" aria-label="Discounting convention">
            {(['mid-year', 'end-of-year'] as const).map((c) => {
              const on = model.convention === c;
              return (
                <button
                  key={c}
                  disabled={!canEdit}
                  aria-pressed={on}
                  onClick={() => updateRoiModel(project.id, { convention: c })}
                  className={`border px-2.5 py-0.5 text-[12px] first:rounded-l-md first:border-r-0 last:rounded-r-md ${
                    on ? 'border-moss-800 bg-moss-800 text-moss-50' : 'border-moss-300 bg-white text-moss-700'
                  } ${canEdit && !on ? 'hover:bg-moss-50' : ''} disabled:cursor-default`}
                >
                  {c === 'mid-year' ? 'Mid-year' : 'End of year'}
                </button>
              );
            })}
          </div>
        </div>

        <label className={field}>
          First year
          {canEdit ? (
            <NumberInput ariaLabel="First year" value={model.startYear} min={2000} max={2100} className="w-16" onChange={(v) => updateRoiModel(project.id, { startYear: Math.round(v) })} />
          ) : (
            <span className="num font-medium text-moss-900">{model.startYear}</span>
          )}
        </label>

        <div className={field}>
          Years
          {canEdit && (
            <button
              aria-label="Remove a year"
              disabled={model.years.length <= MIN_YEARS}
              onClick={() => setRoiHorizon(project.id, model.years.length - 1)}
              className="size-6 rounded-md border border-moss-300 bg-white leading-none hover:bg-moss-50 disabled:opacity-40"
            >
              −
            </button>
          )}
          <span className="num w-5 text-center font-medium text-moss-900">{model.years.length}</span>
          {canEdit && (
            <button
              aria-label="Add a year"
              disabled={model.years.length >= MAX_YEARS}
              onClick={() => setRoiHorizon(project.id, model.years.length + 1)}
              className="size-6 rounded-md border border-moss-300 bg-white leading-none hover:bg-moss-50 disabled:opacity-40"
            >
              +
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}

type Format = 'int' | 'money' | 'price' | 'pct' | 'factor';

interface RowDef {
  label: string;
  /** An input row edits this field of each year. */
  input?: keyof RoiYear;
  /** A calculated row reads this from the results. */
  calc?: keyof RoiRow;
  format: Format;
  total: boolean;
  strong?: boolean;
  rule?: boolean;
  negate?: boolean;
  /** Shown from the sales plan instead of typed in here. */
  fromPlan?: boolean;
}

function fmt(v: number, f: Format): string {
  switch (f) {
    case 'int':
      return Math.round(v).toLocaleString('en-US');
    case 'money': {
      const s = Math.abs(Math.round(v)).toLocaleString('en-US');
      return v < -0.5 ? `(${s})` : s;
    }
    case 'price':
      return `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    case 'pct':
      return `${v}%`;
    case 'factor':
      return v.toFixed(3);
  }
}

function CashFlowTable({ project, model, result, canEdit }: { project: Project; model: RoiModel; result: RoiResult; canEdit: boolean }) {
  const state = useApp();
  const { updateRoiYear } = state;
  const revenue = project.type === 'revenue';
  // With a sales plan, units and price come from Sales (one shared model).
  const plan = state.revenuePlans[project.id];
  const effective = effectiveModel(state, project.id) ?? model;
  const unitsLabel = plan?.recurringMode && plan.recurringMode !== 'none' ? 'Active subscribers' : 'Units sold';

  const rows: RowDef[] = [
    ...(revenue
      ? [
          { label: plan ? `${unitsLabel} · from sales plan` : 'Units sold', input: 'units', format: 'int', total: true, fromPlan: !!plan },
          { label: plan ? 'Price per unit ($) · from sales plan' : 'Price per unit ($)', input: 'price', format: 'price', total: false, fromPlan: !!plan },
          { label: 'Revenue', calc: 'revenue', format: 'money', total: true },
          { label: 'Gross margin (%)', input: 'marginPct', format: 'pct', total: false },
          { label: 'Cost of goods sold', calc: 'cogs', format: 'money', total: true, negate: true },
          { label: 'Gross profit', calc: 'grossProfit', format: 'money', total: true, strong: true },
        ]
      : [{ label: 'Cost savings', input: 'savings', format: 'money', total: true }]),
    { label: 'R&D cost', input: 'rdCost', format: 'money', total: true, rule: true },
    ...(result.rows.some((r) => r.hireCost >= 0.5)
      ? [{ label: 'New hires (from resourcing)', calc: 'hireCost', format: 'money', total: true, negate: true }]
      : []),
    { label: 'Operating cost', input: 'opex', format: 'money', total: true },
    { label: 'Net cash flow', calc: 'netCashFlow', format: 'money', total: true, strong: true, rule: true },
    { label: `Discount factor (${model.convention === 'mid-year' ? 'mid-year' : 'end of year'})`, calc: 'discountFactor', format: 'factor', total: false },
    { label: 'Present value', calc: 'presentValue', format: 'money', total: true, strong: true },
    { label: 'Cumulative present value', calc: 'cumulativePv', format: 'money', total: false },
  ] as RowDef[];

  // Costs are entered as positive numbers but shown in brackets as outflows.
  const shownAsOutflow = (r: RowDef) => r.negate || r.input === 'rdCost' || r.input === 'opex';

  return (
    <Panel
      title="Cash flow model"
      aside={
        <span className="text-[12px] text-moss-500">
          $ thousands · <span className="text-slateblue">blue = input</span> · black = calculated
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className={`${th} sticky left-0 min-w-[190px]`}>Line item</th>
              {result.rows.map((r, i) => (
                <th key={r.year} className={`${th} ${right}`}>
                  <span className="num">{r.year}</span>
                  <span className="ml-1 font-normal text-moss-500">Y{i + 1}</span>
                </th>
              ))}
              <th className={`${th} ${right} border-l border-moss-200`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const values = result.rows.map((r, i) =>
                row.input ? (row.fromPlan ? effective : model).years[i][row.input] : (r[row.calc!] as number),
              );
              const total = values.reduce((s, v) => s + v, 0);
              const rule = row.rule ? 'border-t border-t-moss-300' : '';
              return (
                <tr key={row.label}>
                  <td className={`${td} ${rule} sticky left-0 bg-white whitespace-nowrap ${row.strong ? 'font-semibold' : ''}`}>{row.label}</td>
                  {values.map((v, i) => (
                    <td key={i} className={`${td} ${rule} num ${right} whitespace-nowrap ${row.strong ? 'font-semibold' : ''}`}>
                      {row.input && canEdit && !row.fromPlan ? (
                        <NumberInput
                          ariaLabel={`${row.label}, ${model.startYear + i}`}
                          value={v}
                          min={0}
                          max={row.input === 'marginPct' ? 100 : undefined}
                          onChange={(nv) => updateRoiYear(project.id, i, { [row.input!]: nv })}
                        />
                      ) : (
                        <span className={row.input && !row.fromPlan ? 'text-slateblue' : ''}>{fmt(shownAsOutflow(row) ? -v : v, row.format)}</span>
                      )}
                    </td>
                  ))}
                  <td className={`${td} ${rule} num ${right} border-l border-moss-200 ${row.strong ? 'font-semibold' : ''}`}>
                    {row.total ? fmt(shownAsOutflow(row) ? -total : total, row.format) : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-1 border-t border-moss-200 px-4 py-2.5 text-[12px] text-moss-600">
        <p>
          <span className="font-medium text-moss-800">Discount factor</span> = 1 ÷ (1 + WACC)
          <sup>{model.convention === 'mid-year' ? 't − 0.5' : 't'}</sup>
          {model.convention === 'mid-year'
            ? '. Mid-year discounting treats each year’s cash as arriving evenly through the year, not all on the last day, so it is discounted half a year less.'
            : '. End-of-year discounting treats all of a year’s cash as arriving on its last day.'}
        </p>
        <p>
          <span className="font-medium text-moss-800">NPV</span> = sum of present values ·{' '}
          <span className="font-medium text-moss-800">Discounted ROI</span> = NPV ÷ present value of R&amp;D and operating costs ·{' '}
          <span className="font-medium text-moss-800">IRR</span> = the rate at which NPV is zero, using the same timing.
        </p>
      </div>
    </Panel>
  );
}
