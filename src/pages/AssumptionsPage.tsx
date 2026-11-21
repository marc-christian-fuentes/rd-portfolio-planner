/**
 * ASSUMPTIONS (spec section 9)
 * ----------------------------
 *   - Fiscal year: start month, and whether years show as fiscal or calendar.
 *   - Departments: name, rate per hour, capacity hours per year (rates feed
 *     labour and hire costs straight away).
 *   - Default revenue settings used for new models and plans.
 * Finance and Admin can edit; Leadership and the CTO can view.
 */
import { accessFor, fiscalRange, yearLabel } from '../data/access';
import { departmentMembers } from '../data/model';
import { useApp } from '../store';
import { PageHeader, Panel, right, table, td, th } from '../components/ui';
import { NumberInput } from '../components/NumberInput';

const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' }));

export default function AssumptionsPage() {
  const { data, role, assumptions, setAssumptions, updateDepartment, addDepartment } = useApp();
  const canEdit = accessFor(role, 'assumptions') === 'edit';
  const a = assumptions;
  const sampleYear = new Date().getFullYear() + 1;
  const field = 'flex items-center gap-2 text-[13px] text-moss-700';

  const defaults: { key: 'defaultGrossMarginPct' | 'defaultWarrantyPrice' | 'defaultAttachRatePct' | 'defaultRetentionPct'; label: string; unit: string; note: string }[] = [
    { key: 'defaultGrossMarginPct', label: 'Gross margin', unit: '%', note: 'Used for new ROI models when a project has no margin of its own.' },
    { key: 'defaultWarrantyPrice', label: 'Warranty price', unit: '$ / yr', note: 'Pre-fills the yearly price when you create a new recurring (warranty or subscription) project.' },
    { key: 'defaultAttachRatePct', label: 'Attach rate', unit: '%', note: 'Starting attach rate for new linked subscription or warranty plans.' },
    { key: 'defaultRetentionPct', label: 'Retention', unit: '%', note: 'Starting yearly renewal rate for new linked plans.' },
  ];

  return (
    <>
      <PageHeader
        title="Assumptions"
        subtitle={`The shared settings every model uses. ${canEdit ? 'You can edit these.' : 'Finance and Admin can edit these.'}`}
      />

      <div className="space-y-5">
        <Panel title="Fiscal year">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
            <label className={field}>
              Fiscal year starts in
              <select
                disabled={!canEdit}
                value={a.fiscalStartMonth}
                onChange={(e) => setAssumptions({ fiscalStartMonth: Number(e.target.value) })}
                className="rounded-md border border-moss-300 bg-white px-2 py-1 text-[13px] disabled:bg-moss-50"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <div className={field}>
              Show years as
              <div className="flex overflow-hidden rounded-md" role="group" aria-label="Year labels">
                {(['calendar', 'fiscal'] as const).map((v) => {
                  const on = a.periodView === v;
                  return (
                    <button
                      key={v}
                      disabled={!canEdit}
                      aria-pressed={on}
                      onClick={() => setAssumptions({ periodView: v })}
                      className={`border px-2.5 py-1 text-[12px] first:rounded-l-md first:border-r-0 last:rounded-r-md disabled:cursor-default ${
                        on ? 'border-moss-800 bg-moss-800 text-white' : 'border-moss-300 bg-white text-moss-700 hover:bg-moss-50'
                      }`}
                    >
                      {v === 'calendar' ? 'Calendar year' : 'Fiscal year'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="border-t border-moss-200 px-4 py-2.5 text-[12px] text-moss-600">
            Example: {yearLabel(sampleYear, 'fiscal')} runs {fiscalRange(sampleYear, a.fiscalStartMonth)}. Each model’s yearly figures are fiscal
            years. In fiscal view, the ROI, Forecast, Platform and Sales tables, the Roadmap timeline and the planning quarters all use fiscal names,
            and monthly sales plans run from the first fiscal month, {MONTHS[a.fiscalStartMonth - 1]}.
          </p>
        </Panel>

        <Panel title="Discounting" aside={<span className="text-[12px] text-moss-500">Applies to every project’s ROI model</span>}>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
            <label className={field}>
              WACC
              {canEdit ? (
                <NumberInput ariaLabel="Portfolio WACC percent" value={a.waccPct} min={0} max={50} className="w-16" onChange={(v) => setAssumptions({ waccPct: v })} />
              ) : (
                <span className="num font-medium text-moss-900">{a.waccPct}</span>
              )}
              %
            </label>
            <div className={field}>
              Cash flow timing
              <div className="flex overflow-hidden rounded-md" role="group" aria-label="Portfolio discounting convention">
                {(['mid-year', 'end-of-year'] as const).map((c) => {
                  const on = a.convention === c;
                  return (
                    <button
                      key={c}
                      disabled={!canEdit}
                      aria-pressed={on}
                      onClick={() => setAssumptions({ convention: c })}
                      className={`border px-2.5 py-1 text-[12px] first:rounded-l-md first:border-r-0 last:rounded-r-md disabled:cursor-default ${
                        on ? 'border-moss-800 bg-moss-800 text-white' : 'border-moss-300 bg-white text-moss-700 hover:bg-moss-50'
                      }`}
                    >
                      {c === 'mid-year' ? 'Mid-year' : 'End of year'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="border-t border-moss-200 px-4 py-2.5 text-[12px] text-moss-600">
            Changing either setting updates every project’s NPV, ROI, IRR and payback straight away. Mid-year treats each year’s cash as arriving
            evenly through the year (discounted by t − 0.5 years); end of year treats it as arriving on the last day (t years). A product manager can
            still fine-tune their own project on the Project view.
          </p>
        </Panel>

        <Panel title="Departments" aside={<span className="text-[12px] text-moss-500">Rates feed labour, hire costs and every ROI model’s R&amp;D cost straight away</span>}>
          <div className="overflow-x-auto">
            <table className={table}>
              <thead>
                <tr>
                  <th className={`${th} min-w-[200px]`}>Department</th>
                  <th className={`${th} ${right}`}>Rate / hour ($)</th>
                  <th className={`${th} ${right}`}>Hours / person / year</th>
                  <th className={`${th} ${right}`}>People</th>
                </tr>
              </thead>
              <tbody>
                {data.departments.map((d) => (
                  <tr key={d.id} className="hover:bg-moss-50">
                    <td className={td}>
                      {canEdit ? (
                        <input
                          aria-label="Department name"
                          value={d.name}
                          onChange={(e) => updateDepartment(d.id, { name: e.target.value })}
                          className="w-full rounded-md border border-moss-200 bg-moss-50 px-1.5 py-0.5 text-[13px] text-slateblue focus:border-moss-600 focus:bg-white focus:outline-none"
                        />
                      ) : (
                        d.name
                      )}
                    </td>
                    <td className={`${td} ${right}`}>
                      {canEdit ? (
                        <NumberInput ariaLabel={`${d.name} rate per hour`} value={d.ratePerHour} min={0} className="w-20" onChange={(v) => updateDepartment(d.id, { ratePerHour: v })} />
                      ) : (
                        <span className="num">${d.ratePerHour}</span>
                      )}
                    </td>
                    <td className={`${td} ${right}`}>
                      {canEdit ? (
                        <NumberInput
                          ariaLabel={`${d.name} hours per person per year`}
                          value={d.capacityHoursPerYear}
                          min={0}
                          max={3000}
                          className="w-20"
                          onChange={(v) => updateDepartment(d.id, { capacityHoursPerYear: v })}
                        />
                      ) : (
                        <span className="num">{d.capacityHoursPerYear.toLocaleString('en-US')}</span>
                      )}
                    </td>
                    <td className={`${td} num ${right}`}>{departmentMembers(data, d.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canEdit && (
            <div className="border-t border-moss-200 px-4 py-2.5">
              <button onClick={addDepartment} className="text-[12px] font-medium text-moss-600 hover:text-moss-900">
                + Add department
              </button>
            </div>
          )}
        </Panel>

        <Panel title="Default revenue settings">
          <div className="grid gap-x-8 gap-y-3 px-4 py-3 sm:grid-cols-2">
            {defaults.map((d) => (
              <div key={d.key}>
                <label className={field}>
                  <span className="w-28">{d.label}</span>
                  {canEdit ? (
                    <NumberInput ariaLabel={d.label} value={a[d.key]} min={0} max={d.unit === '%' ? 100 : undefined} className="w-20" onChange={(v) => setAssumptions({ [d.key]: v })} />
                  ) : (
                    <span className="num font-medium text-moss-900">{a[d.key]}</span>
                  )}
                  <span className="text-moss-500">{d.unit}</span>
                </label>
                <p className="mt-0.5 text-[12px] text-moss-500">{d.note}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
