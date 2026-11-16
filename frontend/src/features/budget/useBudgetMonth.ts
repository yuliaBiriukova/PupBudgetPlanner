import { useSearchParams } from 'react-router';
import { shiftMonth, thisMonth } from './budget';

/** The month the Budget page shows: `?month=2026-10`, or this one; next month is the furthest it goes. */
export function useBudgetMonth(): [string, (month: string) => void] {
  const [params, setParams] = useSearchParams();
  const now = thisMonth();
  const asked = params.get('month');
  const month =
    asked &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) &&
    asked >= '2000-01' &&
    asked <= shiftMonth(now, 1)
      ? asked
      : now;
  return [
    month,
    (next) => {
      setParams(next === thisMonth() ? {} : { month: next }, { replace: true });
    },
  ];
}
