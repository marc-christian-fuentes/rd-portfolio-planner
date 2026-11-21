/**
 * SALES PIPELINE (spec section 5)
 * -------------------------------
 * A pipeline board of projects from Proposed onwards, read as a progress
 * report (Proposed and Approved are tentative). Pick a project to plan its
 * revenue: units per month, quarter or year, price overrides, and recurring
 * subscriptions or warranty linked to hardware sales.
 * The plan feeds the project's ROI model. Sales sees revenue only, no costs.
 */
import { useState } from 'react';
import { accessFor, visibleProjects } from '../data/access';
import { formatMoney } from '../data/model';
import {
  canPlanRevenue,
  enteredForYear,
  periodKeys,
  periodLabel,
  priceOf,
  revenueByYear,
  type RevenueYear,
} from '../data/revenue';
import { formatK } from '../data/roi';
import type { Granularity, Phase, Project, RevenuePlan } from '../data/types';
import { useApp, useHardwareUnits } from '../store';
import { KpiStrip, PageHeader, Panel, Tag, right, table, td, th } from '../components/ui';
import { FilterSelect, useQueryParam } from '../components/Filters';
import { PHASE_TABS } from '../components/PhaseTabs';
import { NumberInput } from '../components/NumberInput';
import { unitCostOf } from '../data/unitcost';
import { YearLabel } from '../components/YearLabel';
import { CommentThread } from '../components/CommentThread';

const TENTATIVE: Phase[] = ['Proposed', 'Approved'];
const int = (v: number) => Math.round(v).toLocaleString('en-US');

/** The years a plan covers: the ROI model's years, or six years from the project start. */
function usePlanYears(): (project: Project) => number[] {
  const roiModels = useApp((s) => s.roiModels);
  return (project) => {
    const m = roiModels[project.id];
    const start = m ? m.startYear : Number(project.startDate.slice(0, 4));
    const length = m ? m.years.length : 6;
    return Array.from({ length }, (_, i) => start + i);
  };
}

/** Revenue by year for a project's plan, or null if it has none. */
function usePlanRevenue(): (project: Project) => RevenueYear[] | null {
  const revenuePlans = useApp((s) => s.revenuePlans);
  const hardwareUnits = useHardwareUnits();
  const planYears = usePlanYears();
  return (project) => {
    const plan = revenuePlans[project.id];
    if (!plan) return null;
    const years = planYears(project);
    const hw = plan.linkedHardwareProjectId ? hardwareUnits(plan.linkedHardwareProjectId, years) : [];
    return revenueByYear(plan, project, years, hw);
  };
}

export default function SalesPage() {
  const { data, role, actingAsId } = useApp();
  const planRevenue = usePlanRevenue();
  const [platformId, setPlatformId] = useQueryParam('platform', 'all');
  const [selectedId, setSelectedId] = useQueryParam('project', '');

  const projects = visibleProjects(data, role, actingAsId).filter(
    (p) => p.phase !== 'Scoping' && (platformId === 'all' || p.platformId === platformId),
  );
  const selected = projects.find((p) => p.id === selectedId);
  const platformName = (id: string) => data.platforms.find((pl) => pl.id === id)?.name ?? '';

  return (
    <>
      <PageHeader
        title="Sales pipeline"
        subtitle="Projects from Proposed onwards, as a progress report. Pick a project to plan its revenue; plans open once a project is in development."
      >
        <FilterSelect
          label="Platform"
          value={platformId}
          onChange={setPlatformId}
          options={[{ value: 'all', label: 'All' }, ...data.platforms.map((pl) => ({ value: pl.id, label: pl.name }))]}
        />
      </PageHeader>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        {PHASE_TABS.map((phase) => {
          const column = projects.filter((p) => p.phase === phase);
          return (
            <section key={phase} aria-label={`${phase}, ${column.length} projects`} className="min-w-0">
              <h2 className="rounded-lg bg-moss-100 px-3 py-1.5 text-[13px] font-semibold text-moss-900">
                {phase} <span className="num font-normal text-moss-500">· {column.length}</span>
              </h2>
              <p className="h-6 px-1 pt-1 text-[12px] text-moss-500">{TENTATIVE.includes(phase) ? 'Tentative' : ''}</p>
              <ul className="space-y-2">
                {column.map((p) => {
                  const rev = planRevenue(p);
                  const total = rev?.reduce((s, r) => s + r.revenue, 0);
                  const isSelected = p.id === selected?.id;
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => setSelectedId(p.id)}
                        aria-pressed={isSelected}
                        className={`block w-full rounded-lg border bg-white px-3 py-2 text-left ${
                          isSelected ? 'border-moss-700 shadow-[0_0_0_1px_var(--color-moss-700)]' : 'border-moss-200 hover:border-moss-500'
                        }`}
                      >
                        <div className="text-[13px] leading-snug font-semibold text-moss-900">{p.name}</div>
                        <div className="text-[12px] text-moss-500">{platformName(p.platformId)}</div>
                        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-moss-600">{p.description}</p>
                        <div className="mt-1.5 text-[12px]">
                          {p.type === 'cost-only' ? (
                            <span className="text-moss-400">Cost-only · no revenue</span>
                          ) : total !== undefined ? (
                            <span className="num font-medium text-moss-800">Plan {formatK(total)} revenue</span>
                          ) : canPlanRevenue(p) ? (
                            <span className="text-ochre">No plan yet</span>
                          ) : (
                            <span className="text-moss-400">Planning opens in development</span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
                {column.length === 0 && <li className="px-1 text-[12px] text-moss-400">None</li>}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-8">
        {selected ? (
          <RevenuePlanner key={selected.id} project={selected} />
        ) : (
          <p className="rounded-[10px] border border-dashed border-moss-300 bg-white px-4 py-5 text-[13px] text-moss-600">
            Pick a project above to see or plan its revenue.
          </p>
        )}
      </div>
    </>
  );
}

function RevenuePlanner({ project }: { project: Project }) {
  const { role, revenuePlans, createRevenuePlan } = useApp();
  const canEdit = accessFor(role, 'sales') === 'edit';
  const plan = revenuePlans[project.id];

  const header = (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="text-lg font-semibold text-moss-900">{project.name}</h2>
      <span className="text-[13px] text-moss-500">{project.phase}</span>
      {TENTATIVE.includes(project.phase) && <Tag>Tentative</Tag>}
      <Tag tone={canEdit ? 'solid' : 'neutral'}>{canEdit ? 'You can edit' : 'View only'}</Tag>
    </div>
  );
  const note = (text: string) => (
    <>
      {header}
      <p className="rounded-[10px] border border-dashed border-moss-300 bg-white px-4 py-5 text-[13px] text-moss-600">{text}</p>
    </>
  );

  if (project.type === 'cost-only') return note('This is a cost-only project, so there is no revenue to plan.');
  if (!canPlanRevenue(project)) {
    return note(
      `Revenue planning opens once this project reaches In Development. It is ${project.phase} today, so its numbers are tentative. Default price ${formatMoney(project.defaultPricePerUnit ?? 0)}.`,
    );
  }
  if (!plan) {
    return (
      <>
        {header}
        <div className="rounded-[10px] border border-dashed border-moss-300 bg-white px-4 py-5 text-[13px] text-moss-700">
          <p className="mb-3">No revenue plan yet. Starting one copies the units from the project’s ROI model.</p>
          {canEdit ? (
            <button onClick={() => createRevenuePlan(project.id)} className="rounded-md bg-moss-800 px-3 py-1.5 font-medium text-white hover:bg-moss-700">
              Start revenue plan
            </button>
          ) : (
            <p className="text-moss-500">Switch to the Sales role to start one.</p>
          )}
        </div>
      </>
    );
  }
  return (
    <>
      {header}
      <PlanEditor project={project} plan={plan} canEdit={canEdit} />
      <div className="mt-6 max-w-3xl">
        <CommentThread itemType="revenue-plan" itemId={project.id} title="Plan comments" />
      </div>
    </>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex overflow-hidden rounded-md" role="group" aria-label={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            disabled={disabled}
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`border px-2.5 py-1 text-[12px] first:rounded-l-md not-last:border-r-0 last:rounded-r-md disabled:cursor-default ${
              on ? 'border-moss-800 bg-moss-800 text-white' : 'border-moss-300 bg-white text-moss-700'
            } ${!disabled && !on ? 'hover:bg-moss-50' : ''}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function PlanEditor({ project, plan, canEdit }: { project: Project; plan: RevenuePlan; canEdit: boolean }) {
  const { data, role, unitCosts, updateRevenuePlan, setPlanUnits, setPlanGranularity } = useApp();
  const planYears = usePlanYears();
  const hardwareUnits = useHardwareUnits();
  const years = planYears(project);
  const [entryYear, setEntryYear] = useState(years.find((y) => enteredForYear(plan, y) > 0) ?? years[0]);

  const linked = plan.recurringMode === 'linked-to-hardware';
  const hw = plan.linkedHardwareProjectId ? hardwareUnits(plan.linkedHardwareProjectId, years) : [];
  const rows = revenueByYear(plan, project, years, hw);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const peak = rows.reduce((best, r) => (r.revenue > best.revenue ? r : best), rows[0]);
  const price = priceOf(plan, project);
  const margin = project.grossMarginPct ?? 0;
  // COGS v2: an itemised unit cost from Manufacturing replaces the margin estimate.
  const unitCost = unitCostOf(unitCosts, project.id);
  const cogsOf = (r: RevenueYear) => (unitCost !== null ? (r.billedUnits * unitCost) / 1000 : r.revenue * (1 - margin / 100));
  const showCosts = role !== 'Sales';
  const hardwareOptions = data.projects.filter((p) => p.type === 'revenue' && p.component === 'hardware' && !p.recurring && p.id !== project.id);
  const field = 'flex items-center gap-2 text-[13px] text-moss-700';
  const billedLabel = plan.recurringMode === 'none' ? 'Units sold' : 'Active subscribers (billed)';

  return (
    <>
      <KpiStrip
        items={[
          { label: 'Planned revenue', value: formatK(totalRevenue) },
          { label: `Peak year (${peak.year})`, value: formatK(peak.revenue) },
          { label: plan.priceOverride != null ? 'Price (Sales override)' : 'Price (project default)', value: formatMoney(price) },
          showCosts
            ? { label: 'COGS method', value: unitCost !== null ? `Itemised $${unitCost.toFixed(2)}` : `Margin ${margin}%` }
            : {
                label: plan.recurringMode === 'none' ? 'Units, peak year' : 'Subscribers, peak year',
                value: int(Math.max(...rows.map((r) => r.billedUnits))),
              },
        ]}
      />

      <div className="space-y-4">
        <Panel title="Plan settings" aside={<span className="text-[12px] text-moss-500">Feeds units and price into the project’s ROI model</span>}>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
            <label className={field}>
              Price per unit
              {canEdit ? (
                <NumberInput
                  ariaLabel="Price per unit"
                  value={price}
                  min={0}
                  className="w-20"
                  onChange={(v) => updateRevenuePlan(project.id, { priceOverride: v === project.defaultPricePerUnit ? null : v })}
                />
              ) : (
                <span className="num font-medium text-moss-900">{formatMoney(price)}</span>
              )}
              <span className="text-[12px] text-moss-500">default {formatMoney(project.defaultPricePerUnit ?? 0)}</span>
              {canEdit && plan.priceOverride != null && (
                <button onClick={() => updateRevenuePlan(project.id, { priceOverride: null })} className="text-[12px] text-moss-600 underline hover:text-moss-900">
                  Use default
                </button>
              )}
            </label>

            {project.recurring ? (
              <div className={field}>
                Recurring revenue
                <Segmented
                  label="Recurring mode"
                  disabled={!canEdit}
                  value={plan.recurringMode}
                  onChange={(v) =>
                    updateRevenuePlan(project.id, {
                      recurringMode: v,
                      linkedHardwareProjectId: v === 'linked-to-hardware' ? (plan.linkedHardwareProjectId ?? hardwareOptions[0]?.id ?? null) : plan.linkedHardwareProjectId,
                    })
                  }
                  options={[
                    { value: 'linked-to-hardware', label: 'Linked to hardware' },
                    { value: 'standalone', label: 'Standalone' },
                  ]}
                />
              </div>
            ) : (
              <span className="text-[13px] text-moss-600">One-off unit sales</span>
            )}

            {!linked && (
              <div className={field}>
                Plan by
                <Segmented<Granularity>
                  label="Planning granularity"
                  disabled={!canEdit}
                  value={plan.granularity}
                  onChange={(g) => setPlanGranularity(project.id, g, years)}
                  options={[
                    { value: 'monthly', label: 'Month' },
                    { value: 'quarterly', label: 'Quarter' },
                    { value: 'annual', label: 'Year' },
                  ]}
                />
              </div>
            )}
          </div>

          {linked && (
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-moss-200 px-4 py-3">
              <label className={field}>
                Hardware product
                <select
                  disabled={!canEdit}
                  value={plan.linkedHardwareProjectId ?? ''}
                  onChange={(e) => updateRevenuePlan(project.id, { linkedHardwareProjectId: e.target.value })}
                  className="rounded-md border border-moss-300 bg-white px-2 py-1 text-[13px] disabled:bg-moss-50"
                >
                  {hardwareOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={field}>
                Attach rate
                {canEdit ? (
                  <NumberInput ariaLabel="Attach rate percent" value={plan.attachRatePct} min={0} max={100} className="w-14" onChange={(v) => updateRevenuePlan(project.id, { attachRatePct: v })} />
                ) : (
                  <span className="num font-medium text-moss-900">{plan.attachRatePct}</span>
                )}
                %
              </label>
              <label className={field}>
                Yearly retention
                {canEdit ? (
                  <NumberInput ariaLabel="Retention percent" value={plan.retentionPct} min={0} max={100} className="w-14" onChange={(v) => updateRevenuePlan(project.id, { retentionPct: v })} />
                ) : (
                  <span className="num font-medium text-moss-900">{plan.retentionPct}</span>
                )}
                %
              </label>
              <p className="w-full text-[12px] text-moss-500">
                Each year, new subscribers = hardware units sold × attach rate, and last year’s subscribers renew at the retention rate.
                Revenue = active subscribers × price. Warranty works the same way: billed on the initial order (typically 70–75%), renewed yearly (typically 80%).
              </p>
            </div>
          )}
        </Panel>

        {!linked && (
          <Panel
            title={plan.recurringMode === 'standalone' ? 'Active subscribers' : 'Units sold'}
            aside={
              plan.granularity !== 'annual' ? (
                <div className="flex flex-wrap gap-1" role="group" aria-label="Year">
                  {years.map((y) => (
                    <button
                      key={y}
                      aria-pressed={y === entryYear}
                      onClick={() => setEntryYear(y)}
                      className={`num rounded-full px-2 py-0.5 text-[12px] ${y === entryYear ? 'bg-moss-800 text-white' : 'text-moss-600 hover:bg-moss-100'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              ) : undefined
            }
          >
            <div className="grid grid-cols-3 gap-3 px-4 py-3 sm:grid-cols-6">
              {(plan.granularity === 'annual' ? years.flatMap((y) => periodKeys(y, 'annual')) : periodKeys(entryYear, plan.granularity)).map((key) => (
                <label key={key} className="flex flex-col gap-1 text-[12px] text-moss-500">
                  <span className="num">{plan.granularity === 'annual' ? key : periodLabel(key)}</span>
                  {canEdit ? (
                    <NumberInput ariaLabel={`Units ${key}`} value={plan.unitsByPeriod[key] ?? 0} min={0} className="w-full" onChange={(v) => setPlanUnits(project.id, key, v)} />
                  ) : (
                    <span className="num text-[13px] text-moss-900">{int(plan.unitsByPeriod[key] ?? 0)}</span>
                  )}
                </label>
              ))}
            </div>
            {plan.recurringMode === 'standalone' && plan.granularity !== 'annual' && (
              <p className="px-4 pb-3 text-[12px] text-moss-500">Yearly revenue uses the average active subscribers across the year.</p>
            )}
          </Panel>
        )}

        <Panel title="Revenue by year" aside={<span className="text-[12px] text-moss-500">$ thousands</span>}>
          <div className="overflow-x-auto">
            <table className={table}>
              <thead>
                <tr>
                  <th className={`${th} min-w-[200px]`}>Line</th>
                  {rows.map((r) => (
                    <th key={r.year} className={`${th} ${right} num`}>
                      <YearLabel year={r.year} />
                    </th>
                  ))}
                  <th className={`${th} ${right} border-l border-moss-200`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {linked && (
                  <>
                    <Row label="Hardware units sold" values={hw} fmt={int} total />
                    <Row label="New subscribers" values={rows.map((r) => r.newUnits)} fmt={int} total />
                  </>
                )}
                <Row label={billedLabel} values={rows.map((r) => r.billedUnits)} fmt={int} total={plan.recurringMode === 'none'} />
                <Row label="Price per unit ($)" values={rows.map((r) => r.price)} fmt={(v) => `$${v.toLocaleString('en-US')}`} />
                <Row label="Revenue" values={rows.map((r) => r.revenue)} fmt={int} total strong />
                {showCosts && (
                  <>
                    <Row
                      label={unitCost !== null ? `Cost of goods sold (itemised, $${unitCost.toFixed(2)} a unit)` : `Cost of goods sold (${100 - margin}% of revenue)`}
                      values={rows.map((r) => -cogsOf(r))}
                      fmt={acct}
                      total
                    />
                    <Row label="Gross profit" values={rows.map((r) => r.revenue - cogsOf(r))} fmt={int} total strong />
                  </>
                )}
              </tbody>
            </table>
          </div>
          <p className="border-t border-moss-200 px-4 py-2.5 text-[12px] text-moss-500">
            {showCosts
              ? unitCost !== null
                ? `COGS uses Manufacturing’s itemised unit cost ($${unitCost.toFixed(2)}), so a lower price squeezes margin.`
                : `COGS uses the project’s fixed gross margin estimate (${margin}%), so it moves with price. It switches to itemised costs once Manufacturing builds a breakdown.`
              : 'Sales sees revenue only. Costs are handled by Finance and project management.'}
          </p>
        </Panel>
      </div>
    </>
  );
}

const acct = (v: number) => {
  const s = Math.abs(Math.round(v)).toLocaleString('en-US');
  return v < -0.5 ? `(${s})` : s;
};

function Row({ label, values, fmt, total, strong }: { label: string; values: number[]; fmt: (v: number) => string; total?: boolean; strong?: boolean }) {
  const weight = strong ? 'font-semibold' : '';
  return (
    <tr>
      <td className={`${td} ${weight}`}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`${td} num ${right} ${weight}`}>
          {fmt(v)}
        </td>
      ))}
      <td className={`${td} num ${right} border-l border-moss-200 ${weight}`}>{total ? fmt(values.reduce((s, v) => s + v, 0)) : ''}</td>
    </tr>
  );
}
