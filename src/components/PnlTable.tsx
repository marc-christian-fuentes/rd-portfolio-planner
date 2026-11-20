/**
 * A P&L-style table by year: revenue down to operating income, then cash flow.
 * Used by Platform view and Forecast.
 */
import type { ReactNode } from 'react';
import { formatAccounting, type Pnl, type PnlYear } from '../data/rollup';
import { Panel, right, table, td as baseTd, th as baseTh } from './ui';

// Slightly tighter cells than other tables, so a 7–8 year P&L fits without scrolling.
const td = baseTd.replace('px-3', 'px-2');
const th = baseTh.replace('px-3', 'px-2');

interface Row {
  label: string;
  value: (y: PnlYear) => number;
  /** Costs are stored as positive numbers but shown in brackets. */
  outflow?: boolean;
  strong?: boolean;
  rule?: boolean;
  total?: 'sum' | 'margin';
  pct?: boolean;
  /** A heading row shown above this row. */
  section?: string;
  /** Hide the row when it is zero in every year. */
  onlyIfUsed?: boolean;
}

const ROWS: Row[] = [
  { label: 'Revenue', value: (y) => y.revenue, total: 'sum' },
  { label: 'Cost of goods sold', value: (y) => y.cogs, outflow: true, total: 'sum' },
  { label: 'Gross profit', value: (y) => y.grossProfit, strong: true, rule: true, total: 'sum' },
  { label: 'Gross margin', value: (y) => (y.revenue > 0 ? (y.grossProfit / y.revenue) * 100 : NaN), pct: true, total: 'margin' },
  { label: 'R&D expense', value: (y) => y.rdCost, outflow: true, rule: true, total: 'sum' },
  { label: 'New hires (R&D)', value: (y) => y.hireCost, outflow: true, total: 'sum', onlyIfUsed: true },
  { label: 'Operating expense', value: (y) => y.opex, outflow: true, total: 'sum' },
  { label: 'Cost savings', value: (y) => y.savings, total: 'sum' },
  { label: 'Operating income (pre-tax)', value: (y) => y.operatingIncome, strong: true, rule: true, total: 'sum' },
  { section: 'Cash flow', label: 'Net cash flow', value: (y) => y.operatingIncome, total: 'sum' },
  { label: 'Cumulative cash flow', value: (y) => y.cumulative },
];

export function PnlTable({ pnl, title, aside }: { pnl: Pnl; title: string; aside?: ReactNode }) {
  if (pnl.years.length === 0) {
    return (
      <Panel title={title}>
        <p className="px-4 py-5 text-[13px] text-moss-500">None of these projects has an ROI model yet.</p>
      </Panel>
    );
  }

  const sum = (f: (y: PnlYear) => number) => pnl.years.reduce((s, y) => s + f(y), 0);
  const totalRevenue = sum((y) => y.revenue);
  const totalMargin = totalRevenue > 0 ? (sum((y) => y.grossProfit) / totalRevenue) * 100 : NaN;

  const show = (row: Row, v: number) => {
    if (row.pct) return Number.isNaN(v) ? '—' : `${v.toFixed(0)}%`;
    return formatAccounting(row.outflow ? -v : v);
  };

  return (
    <Panel title={title} aside={aside ?? <span className="text-[12px] text-moss-500">$ thousands</span>}>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className={`${th} min-w-[150px] pl-3`}>Line item</th>
              {pnl.years.map((y) => (
                <th key={y.year} className={`${th} ${right} num`}>
                  {y.year}
                </th>
              ))}
              <th className={`${th} ${right} border-l border-moss-200`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.filter((row) => !row.onlyIfUsed || pnl.years.some((y) => Math.abs(row.value(y)) >= 0.5)).map((row) => {
              const rule = row.rule ? 'border-t-moss-300' : '';
              const weight = row.strong ? 'font-semibold' : '';
              const muted = row.pct ? 'text-moss-500' : '';
              const total = row.total === 'sum' ? show(row, sum(row.value)) : row.total === 'margin' ? show(row, totalMargin) : '';
              return [
                row.section && (
                  <tr key={`${row.label}-section`}>
                    <td colSpan={pnl.years.length + 2} className="bg-moss-50 px-3 pt-3 pb-1 text-[11px] font-semibold text-moss-600">
                      {row.section}
                    </td>
                  </tr>
                ),
                <tr key={row.label}>
                  <td className={`${td} ${rule} ${weight} ${muted} whitespace-nowrap pl-3`}>{row.label}</td>
                  {pnl.years.map((y) => (
                    <td key={y.year} className={`${td} ${rule} ${weight} ${muted} num ${right}`}>
                      {show(row, row.value(y))}
                    </td>
                  ))}
                  <td className={`${td} ${rule} ${weight} ${muted} num ${right} border-l border-moss-200`}>{total}</td>
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
