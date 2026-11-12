import dayjs from 'dayjs';
import { today } from './days';
import type { TransactionType } from './transactionsApi';

/**
 * The Transactions page's filters (F-020). They are the page's address (`/transactions?month=2026-10&account=…`),
 * so Back, a reload and a shared link keep them, and the Reports screen (F-022) can link to them; they aren't
 * remembered between visits (open point 5). The page opens on this month (open point 3).
 */

/** A month (`2026-10`), a year, everything, or the days from one to another, both included. */
export type Period =
  | { kind: 'month'; month: string }
  | { kind: 'year'; year: number }
  | { kind: 'all' }
  | { kind: 'range'; from: string; to: string };

export interface Filters {
  period: Period;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  /** A day of the month tapped in the calendar: only its receipt (a month only). */
  day?: string;
}

/**
 * What the API is asked for: the period as days, the other filters as they are, and whose money (F-024: a member's id
 * or `family`; none for your own).
 */
export interface TransactionQuery {
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  who?: string;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TYPES: Record<string, TransactionType> = {
  expense: 'Expense',
  income: 'Income',
  transfer: 'Transfer',
};

const monthOf = (day: string) => day.slice(0, 7);

/** A real day, not after `now`. */
const isDay = (value: string | null, now: string): value is string =>
  !!value && DAY.test(value) && dayjs(value).format('YYYY-MM-DD') === value && value <= now;

export function thisMonth(now: string = today()): Period {
  return { kind: 'month', month: monthOf(now) };
}

/** The filters in the address; anything it can't read is left out (this month at most). */
export function filtersFrom(params: URLSearchParams, now: string = today()): Filters {
  const month = params.get('month');
  const year = Number(params.get('year'));
  const from = params.get('from');
  const to = params.get('to');
  let period: Period = thisMonth(now);
  if (month && MONTH.test(month) && month <= monthOf(now)) period = { kind: 'month', month };
  else if (Number.isInteger(year) && year > 1900 && year <= dayjs(now).year())
    period = { kind: 'year', year };
  else if (params.get('period') === 'all') period = { kind: 'all' };
  else if (isDay(from, now) && isDay(to, now))
    period = from <= to ? { kind: 'range', from, to } : { kind: 'range', from: to, to: from };

  const day = params.get('day');
  return {
    period,
    accountId: params.get('account') ?? undefined,
    categoryId: params.get('category') ?? undefined,
    type: TYPES[params.get('type') ?? ''],
    day:
      period.kind === 'month' && isDay(day, now) && monthOf(day) === period.month ? day : undefined,
  };
}

/** The address for the filters: this month is left out, as the page opens on it. */
export function paramsOf(filters: Filters, now: string = today()): URLSearchParams {
  const params = new URLSearchParams();
  const { period } = filters;
  if (period.kind === 'month' && period.month !== monthOf(now)) params.set('month', period.month);
  if (period.kind === 'year') params.set('year', String(period.year));
  if (period.kind === 'all') params.set('period', 'all');
  if (period.kind === 'range') {
    params.set('from', period.from);
    params.set('to', period.to);
  }
  if (filters.accountId) params.set('account', filters.accountId);
  if (filters.categoryId) params.set('category', filters.categoryId);
  if (filters.type) params.set('type', filters.type.toLowerCase());
  if (filters.day && period.kind === 'month') params.set('day', filters.day);
  return params;
}

/** The period's first and last day; none for everything. */
export function boundsOf(period: Period): { from?: string; to?: string } {
  switch (period.kind) {
    case 'month': {
      const start = dayjs(`${period.month}-01`);
      return { from: start.format('YYYY-MM-DD'), to: start.endOf('month').format('YYYY-MM-DD') };
    }
    case 'year':
      return { from: `${String(period.year)}-01-01`, to: `${String(period.year)}-12-31` };
    case 'range':
      return { from: period.from, to: period.to };
    case 'all':
      return {};
  }
}

/** What the totals, the calendar and the categories are asked for: the whole period, a picked day or not. */
export function summaryQueryOf(filters: Filters): TransactionQuery {
  return {
    ...boundsOf(filters.period),
    accountId: filters.accountId,
    categoryId: filters.categoryId,
    type: filters.type,
  };
}

/** What the receipts are asked for: the picked day's only when there is one. */
export function listQueryOf(filters: Filters): TransactionQuery {
  const query = summaryQueryOf(filters);
  return filters.day ? { ...query, from: filters.day, to: filters.day } : query;
}

/**
 * The month or year before (−1) or after (+1), or null when it can't move: another kind of period, or past this
 * month or year (there are no transactions after today).
 */
export function stepped(period: Period, step: -1 | 1, now: string = today()): Period | null {
  if (period.kind === 'month') {
    const month = dayjs(`${period.month}-01`).add(step, 'month').format('YYYY-MM');
    return month > monthOf(now) ? null : { kind: 'month', month };
  }
  if (period.kind === 'year') {
    const year = period.year + step;
    return year > dayjs(now).year() ? null : { kind: 'year', year };
  }
  return null;
}

/** The period list's choices. */
export type PeriodChoice = 'this-month' | 'last-month' | 'this-year' | 'all' | 'range';

export const PERIOD_CHOICES: readonly PeriodChoice[] = [
  'this-month',
  'last-month',
  'this-year',
  'all',
  'range',
];

/** Which choice the period is, if any (October 2025 is none of them). */
export function choiceOf(period: Period, now: string = today()): PeriodChoice | null {
  if (period.kind === 'all') return 'all';
  if (period.kind === 'range') return 'range';
  if (period.kind === 'year') return period.year === dayjs(now).year() ? 'this-year' : null;
  if (period.month === monthOf(now)) return 'this-month';
  return period.month === dayjs(now).subtract(1, 'month').format('YYYY-MM') ? 'last-month' : null;
}

/** The period a choice picks; a range starts as the last two weeks, or keeps the one already picked. */
export function periodOf(choice: PeriodChoice, current: Period, now: string = today()): Period {
  switch (choice) {
    case 'this-month':
      return thisMonth(now);
    case 'last-month':
      return { kind: 'month', month: dayjs(now).subtract(1, 'month').format('YYYY-MM') };
    case 'this-year':
      return { kind: 'year', year: dayjs(now).year() };
    case 'all':
      return { kind: 'all' };
    case 'range':
      return current.kind === 'range'
        ? current
        : { kind: 'range', from: dayjs(now).subtract(13, 'day').format('YYYY-MM-DD'), to: now };
  }
}

/** How many filters are on besides the period: the Filters button's count. */
export function filterCount(filters: Filters): number {
  return [filters.accountId, filters.categoryId, filters.type].filter(Boolean).length;
}

/** The period changed: a picked day goes with the old one. */
export function withPeriod(filters: Filters, period: Period): Filters {
  return { ...filters, period, day: undefined };
}

/** A type picked: a category of another kind (or any, for Transfers) goes (owner's review of variant 8). */
export function withType(
  filters: Filters,
  type: TransactionType | undefined,
  kindOf: (categoryId: string) => 'Expense' | 'Income' | undefined,
): Filters {
  const keeps =
    !filters.categoryId || !type || (type !== 'Transfer' && kindOf(filters.categoryId) === type);
  return { ...filters, type, categoryId: keeps ? filters.categoryId : undefined };
}

/** A category picked: a transfer has none, so Transfers goes. */
export function withCategory(filters: Filters, categoryId: string | undefined): Filters {
  return {
    ...filters,
    categoryId,
    type: categoryId && filters.type === 'Transfer' ? undefined : filters.type,
  };
}

/** Clear filters: everything but the period. */
export function cleared(filters: Filters): Filters {
  return { period: filters.period };
}

/** The period as the slip and the slim bar name it: `October 2026`, `2026`, `All time`, `13 Oct – 26 Oct 2026`. */
export function periodName(period: Period, allTime: string): string {
  switch (period.kind) {
    case 'month':
      return dayjs(`${period.month}-01`).format('MMMM YYYY');
    case 'year':
      return String(period.year);
    case 'all':
      return allTime;
    case 'range': {
      const from = dayjs(period.from);
      const to = dayjs(period.to);
      return `${from.format(from.year() === to.year() ? 'D MMM' : 'D MMM YYYY')} – ${to.format('D MMM YYYY')}`;
    }
  }
}

/**
 * Leaves out an account or a category the person doesn't have (an old or hand-made address), once their lists are
 * known; until then the ids stay.
 */
export function withKnown(
  filters: Filters,
  accountIds: readonly string[] | undefined,
  categoryIds: readonly string[] | undefined,
): Filters {
  const known = (id: string | undefined, ids: readonly string[] | undefined) =>
    !id || !ids || ids.includes(id) ? id : undefined;
  return {
    ...filters,
    accountId: known(filters.accountId, accountIds),
    categoryId: known(filters.categoryId, categoryIds),
  };
}
