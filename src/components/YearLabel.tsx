/**
 * Year column labels that follow Assumptions: "2027" (calendar) or "FY27"
 * (fiscal). In fiscal view, hovering shows the months the year covers.
 * Each model's yearly figures are treated as fiscal years in fiscal view.
 */
import { fiscalRange, yearLabel } from '../data/access';
import { useApp } from '../store';

export function YearLabel({ year }: { year: number }) {
  const { periodView, fiscalStartMonth } = useApp((s) => s.assumptions);
  return (
    <span className="num" title={periodView === 'fiscal' ? fiscalRange(year, fiscalStartMonth) : undefined}>
      {yearLabel(year, periodView)}
    </span>
  );
}
