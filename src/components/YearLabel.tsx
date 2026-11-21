/**
 * Year and quarter labels that follow Assumptions: "2027" (calendar) or
 * "FY27" (fiscal). In fiscal view, hovering shows the months the year covers.
 * Each model's yearly figures are treated as fiscal years in fiscal view.
 */
import { fiscalRange, quarterName, yearLabel } from '../data/access';
import { useApp } from '../store';

export function YearLabel({ year }: { year: number }) {
  const { periodView, fiscalStartMonth } = useApp((s) => s.assumptions);
  return (
    <span className="num" title={periodView === 'fiscal' ? fiscalRange(year, fiscalStartMonth) : undefined}>
      {yearLabel(year, periodView)}
    </span>
  );
}

/** Returns a function that names a planning quarter ("Q1 2027") the way Assumptions says. */
export function useQuarterName(): (calendarQuarter: string) => string {
  const { periodView, fiscalStartMonth } = useApp((s) => s.assumptions);
  return (q) => quarterName(q, periodView, fiscalStartMonth);
}

/** Returns a function that labels a year the way Assumptions says ("2027" or "FY27"). */
export function useYearLabel(): (year: number) => string {
  const periodView = useApp((s) => s.assumptions.periodView);
  return (y) => yearLabel(y, periodView);
}
