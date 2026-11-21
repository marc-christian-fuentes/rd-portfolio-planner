/**
 * FORECAST
 * --------
 * What the R&D portfolio feeds into the corporate P&L: revenue, cost of
 * goods, gross profit, R&D and operating expense down to operating income,
 * year by year. Then the cash flow, and each project's share of it.
 */
import { Link } from 'react-router-dom';
import { visibleProjects } from '../data/access';
import { formatK } from '../data/roi';
import { formatAccounting, yearlyPnl } from '../data/rollup';
import { useApp, useRoiFor } from '../store';
import { KpiStrip, PageHeader, Panel, right, table, td, th } from '../components/ui';
import { FilterSelect, HiresToggle, PmFilter, byPm, usePmFilter, useQueryParam } from '../components/Filters';
import { PnlTable } from '../components/PnlTable';
import { YearLabel } from '../components/YearLabel';

export default function ForecastPage() {
  const { data, role, actingAsId } = useApp();
  const roiFor = useRoiFor();
  const [pm] = usePmFilter();
  const [platformId, setPlatformId] = useQueryParam('platform', 'all');

  const projects = byPm(visibleProjects(data, role, actingAsId), pm).filter((p) => platformId === 'all' || p.platformId === platformId);
  const pnl = yearlyPnl(projects, roiFor);

  const sum = (f: (y: (typeof pnl.years)[number]) => number) => pnl.years.reduce((s, y) => s + f(y), 0);
  const lowest = pnl.years.reduce((m, y) => Math.min(m, y.cumulative), 0);
  const firstNegative = pnl.years.findIndex((y) => y.cumulative < 0);
  const breakEven = firstNegative === -1 ? pnl.years[0] : pnl.years.slice(firstNegative).find((y) => y.cumulative >= 0);

  return (
    <>
      <PageHeader
        title="Forecast"
        subtitle="What the R&D portfolio feeds into the corporate P&L, year by year, and the cash flow behind it. Pre-tax, in $ thousands."
      >
        <PmFilter />
        <FilterSelect
          label="Platform"
          value={platformId}
          onChange={setPlatformId}
          options={[{ value: 'all', label: 'All' }, ...data.platforms.map((pl) => ({ value: pl.id, label: pl.name }))]}
        />
        <HiresToggle />
      </PageHeader>

      <KpiStrip
        items={[
          { label: 'Revenue', value: formatK(sum((y) => y.revenue)) },
          { label: 'Operating income', value: formatK(sum((y) => y.operatingIncome)) },
          { label: 'Peak funding need', value: lowest < 0 ? formatK(-lowest) : 'None' },
          { label: 'Cash break-even', value: breakEven ? String(breakEven.year) : 'Beyond forecast' },
        ]}
      />

      <div className="space-y-5">
        <PnlTable pnl={pnl} title="P&L forecast" />

        {pnl.byProject.length > 0 && (
          <Panel title="Cash flow by project" aside={<span className="text-[12px] text-moss-500">Net cash flow · $ thousands</span>}>
            <div className="overflow-x-auto">
              <table className={table}>
                <thead>
                  <tr>
                    <th className={`${th} min-w-[200px]`}>Project</th>
                    {pnl.years.map((y) => (
                      <th key={y.year} className={`${th} ${right} num`}>
                        <YearLabel year={y.year} />
                      </th>
                    ))}
                    <th className={`${th} ${right} border-l border-moss-200`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.platforms.map((pl) => {
                    const rows = pnl.byProject.filter((r) => r.project.platformId === pl.id);
                    if (rows.length === 0) return null;
                    return [
                      <tr key={pl.id}>
                        <td colSpan={pnl.years.length + 2} className="bg-moss-50 px-3 pt-3 pb-1 text-[11px] font-semibold text-moss-600">
                          {pl.name}
                        </td>
                      </tr>,
                      ...rows.map((r) => (
                        <tr key={r.project.id} className="hover:bg-moss-50">
                          <td className={`${td} whitespace-nowrap`}>
                            <Link to={`/project/${r.project.id}?phase=${encodeURIComponent(r.project.phase)}`} className="hover:underline">
                              {r.project.name}
                            </Link>
                          </td>
                          {r.cashFlow.map((v, i) => (
                            <td key={i} className={`${td} num ${right} ${Math.abs(v) < 0.5 ? 'text-moss-300' : ''}`}>
                              {Math.abs(v) < 0.5 ? '–' : formatAccounting(v)}
                            </td>
                          ))}
                          <td className={`${td} num ${right} border-l border-moss-200`}>{formatAccounting(r.cashFlow.reduce((s, v) => s + v, 0))}</td>
                        </tr>
                      )),
                    ];
                  })}
                  <tr>
                    <td className={`${td} border-t-moss-300 font-semibold`}>Total</td>
                    {pnl.years.map((y) => (
                      <td key={y.year} className={`${td} num ${right} border-t-moss-300 font-semibold`}>
                        {formatAccounting(y.operatingIncome)}
                      </td>
                    ))}
                    <td className={`${td} num ${right} border-l border-moss-200 border-t-moss-300 font-semibold`}>
                      {formatAccounting(sum((y) => y.operatingIncome))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        <p className="text-[12px] text-moss-500">
          Built from each project’s ROI model. Projects without a model aren’t included yet. New hires show as their own cost line; approved hires always count, pending ones when the switch is on.
        </p>
      </div>
    </>
  );
}
