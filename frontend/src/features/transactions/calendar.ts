import dayjs from 'dayjs';
import { addDays, mondayOf, today } from './days';

/** The spending calendar's heat (F-020, variant 5): none, then four steps of red. */
export type Heat = 0 | 1 | 2 | 3 | 4;

/**
 * Each day as deep a red as what it cost, by the month's quarters: the cheapest quarter of the days with spending is
 * 1, the dearest 4, so one rent day doesn't wash the rest out (variant 5's review).
 */
export function heatOf(spentByDay: ReadonlyMap<string, number>): (spent: number) => Heat {
  const sorted = [...spentByDay.values()].filter((spent) => spent > 0).sort((a, b) => a - b);
  return (spent) =>
    spent > 0
      ? ((1 + Math.min(3, Math.floor((sorted.indexOf(spent) / sorted.length) * 4))) as Heat)
      : 0;
}

/** The days of a month (`2026-10`), and how many empty places come before the first so weeks start on Monday. */
export function monthGrid(month: string): { lead: number; days: string[] } {
  const first = `${month}-01`;
  const length = dayjs(first).daysInMonth();
  return {
    lead: dayjs(first).diff(dayjs(mondayOf(first)), 'day'),
    days: Array.from({ length }, (_, i) => addDays(first, i)),
  };
}

/**
 * One week of the month (from its Monday): its days in the month, with the empty places before and after them for
 * the days of another month.
 */
export function weekGrid(
  month: string,
  monday: string,
): { lead: number; days: string[]; tail: number } {
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const days = week.filter((day) => day.startsWith(month));
  const lead = days.length ? week.indexOf(days[0] ?? '') : 0;
  return { lead, days, tail: 7 - lead - days.length };
}

/**
 * The day the folded calendar's week shows: the picked one, else today in this month, else the month's latest day
 * with transactions, else its last day.
 */
export function foldDayOf(
  month: string,
  picked: string | undefined,
  daysWithTransactions: readonly string[],
  now: string = today(),
): string {
  if (picked) return picked;
  if (now.startsWith(month)) return now;
  const latest = [...daysWithTransactions]
    .filter((day) => day.startsWith(month))
    .sort()
    .at(-1);
  return latest ?? dayjs(`${month}-01`).endOf('month').format('YYYY-MM-DD');
}

/** A share of the period's spending as the bars write it: `33%`, `<1%`. */
export function shareText(amount: number, sum: number): string {
  if (sum <= 0) return '0%';
  const share = (amount / sum) * 100;
  return share < 1 ? '<1%' : `${String(Math.round(share))}%`;
}

/** The calendar's short amounts: `455`, `2 338`, `19k` from ten thousand. */
export function shortAmount(value: number): string {
  const whole = Math.round(value);
  return whole >= 10000
    ? `${String(Math.round(whole / 1000))}k`
    : String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
