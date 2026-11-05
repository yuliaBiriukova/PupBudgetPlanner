import dayjs from 'dayjs';
import { formatMoney, wholeAmount } from '../../shared/format/money';
import { today } from '../transactions/days';
import { paramsOf } from '../transactions/filters';
import type { Report } from './reportsApi';

/**
 * The Reports page's period and currency (F-022). They are the page's address (`/reports?month=2026-10&currency=USD`),
 * so Back from a category's transactions comes back to the same report. The page opens on this year in the person's
 * report currency; another currency is for this visit only (open point 2).
 */

/** A year (January to December) or one month (`2026-10`). */
export type ReportPeriod = { kind: 'year'; year: number } | { kind: 'month'; month: string };

export interface ReportAddress {
  period: ReportPeriod;
  /** Another currency than the report currency, picked on the page. */
  currency?: string;
}

/** Reports start in 2000 (the API's `ReportLimits`). */
const FIRST_YEAR = 2000;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const CURRENCY = /^[A-Z]{3}$/;

const monthOf = (day: string) => day.slice(0, 7);
const yearOf = (monthOrDay: string) => Number(monthOrDay.slice(0, 4));

/** The report in the address; anything it can't read is left out (this year at most). */
export function addressFrom(params: URLSearchParams, now: string = today()): ReportAddress {
  const month = params.get('month');
  const year = Number(params.get('year'));
  const currency = params.get('currency');
  let period: ReportPeriod = { kind: 'year', year: yearOf(now) };
  if (month && MONTH.test(month) && yearOf(month) >= FIRST_YEAR && month <= monthOf(now))
    period = { kind: 'month', month };
  else if (Number.isInteger(year) && year >= FIRST_YEAR && year <= yearOf(now))
    period = { kind: 'year', year };
  return { period, currency: currency && CURRENCY.test(currency) ? currency : undefined };
}

/** The address for the report: this year is left out, as the page opens on it. */
export function reportParams(address: ReportAddress, now: string = today()): URLSearchParams {
  const params = new URLSearchParams();
  const { period } = address;
  if (period.kind === 'month') params.set('month', period.month);
  else if (period.year !== yearOf(now)) params.set('year', String(period.year));
  if (address.currency) params.set('currency', address.currency);
  return params;
}

/**
 * The year or month before (−1) or after (+1), or null when there is nothing there: after this month or year, or
 * before the person's first month with data (`firstMonth`, `2026-02-01`; none: no data at all).
 */
export function stepped(
  period: ReportPeriod,
  step: -1 | 1,
  firstMonth: string | null,
  now: string = today(),
): ReportPeriod | null {
  if (period.kind === 'year') {
    const year = period.year + step;
    if (year > yearOf(now)) return null;
    if (step < 0 && (firstMonth === null || year < yearOf(firstMonth))) return null;
    return { kind: 'year', year };
  }
  const month = dayjs(`${period.month}-01`).add(step, 'month').format('YYYY-MM');
  if (month > monthOf(now)) return null;
  if (step < 0 && (firstMonth === null || month < monthOf(firstMonth))) return null;
  return { kind: 'month', month };
}

/** Year ↔ Month: a year opens on this month when it is this year, otherwise on its December; a month on its year. */
export function switched(
  period: ReportPeriod,
  kind: ReportPeriod['kind'],
  now: string = today(),
): ReportPeriod {
  if (period.kind === kind) return period;
  if (period.kind === 'month') return { kind: 'year', year: yearOf(period.month) };
  return {
    kind: 'month',
    month: period.year === yearOf(now) ? monthOf(now) : `${String(period.year)}-12`,
  };
}

/** `2026` or `October 2026`. */
export function periodName(period: ReportPeriod): string {
  return period.kind === 'year'
    ? String(period.year)
    : dayjs(`${period.month}-01`).format('MMMM YYYY');
}

/**
 * The Transactions page with one category in a month or a year (F-020's address): a category's amount in the report
 * opens the transactions it is made of (open point 4).
 */
export function transactionsLink(period: ReportPeriod, categoryId: string): string {
  return `/transactions?${paramsOf({ period, categoryId }).toString()}`;
}

/**
 * The report without the categories that have nothing in the whole period, and without a group left with none
 * (owner, 2026-11-04). The API gives every category in use (F-021); the screen leaves the empty ones out.
 */
export function usedOnly(report: Report): Report {
  const used = (total: number | null) => wholeAmount(total ?? 0) !== 0;
  return {
    ...report,
    groups: report.groups
      .map((group) => ({
        ...group,
        categories: group.categories.filter((category) => used(category.amounts.total)),
      }))
      .filter((group) => group.categories.length > 0),
  };
}

/** How far over the category's usual month (its Avg) a month went: none, then four steps (1.25×, 1.5×, 2×, 3×). */
export function heatLevel(value: number, average: number): number {
  if (average <= 0) return 0;
  const ratio = value / average;
  if (ratio >= 3) return 4;
  if (ratio >= 2) return 3;
  if (ratio >= 1.5) return 2;
  if (ratio >= 1.25) return 1;
  return 0;
}

const NBSP = ' ';
const MINUS = '−';

/** An amount without its currency, for the table that names the currency once: `17 000`, `−4 312`. */
export function plain(value: number): string {
  const whole = wholeAmount(value);
  const number = String(Math.abs(whole)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return whole < 0 ? `${MINUS}${number}` : number;
}

/** A change, signed both ways: `+12 300 ₴`, `−4 312 ₴`, `0 ₴`. */
export function signed(value: number, currency: string): string {
  const text = formatMoney(value, currency);
  return wholeAmount(value) > 0 ? `+${text}` : text;
}

/**
 * How many of the report's first months are before the person's first month with data: the year shows them folded
 * into one column (owner's review of PR #60). None without any data (the page says there is nothing yet).
 */
export function monthsBefore(report: Report): number {
  if (report.firstMonth === null) return 0;
  const first = monthOf(report.firstMonth);
  const index = report.months.findIndex((month) => monthOf(month.month) >= first);
  return index < 0 ? report.months.length : index;
}

/** The report's month that is under way (Kyiv's today), or −1 when the report has none. */
export function currentIndex(report: Report): number {
  return report.months.findIndex((month) => month.state === 'Current');
}
