import { describe, expect, it } from 'vitest';
import {
  boundsOf,
  choiceOf,
  cleared,
  filterCount,
  filtersFrom,
  listQueryOf,
  paramsOf,
  periodName,
  periodOf,
  stepped,
  summaryQueryOf,
  withCategory,
  withPeriod,
  withType,
  type Filters,
} from './filters';

const NOW = '2026-10-29';
const params = (search: string) => new URLSearchParams(search);
const OCTOBER: Filters = { period: { kind: 'month', month: '2026-10' } };

describe('the filters in the address', () => {
  it('open on this month, with nothing else picked', () => {
    expect(filtersFrom(params(''), NOW)).toEqual(OCTOBER);
    expect(paramsOf(OCTOBER, NOW).toString()).toBe('');
  });

  it('keep every filter there and back', () => {
    const filters: Filters = {
      period: { kind: 'month', month: '2026-09' },
      accountId: 'cash',
      categoryId: 'eating-out',
      type: 'Expense',
      day: '2026-09-24',
    };
    const search = paramsOf(filters, NOW).toString();

    expect(search).toBe(
      'month=2026-09&account=cash&category=eating-out&type=expense&day=2026-09-24',
    );
    expect(filtersFrom(params(search), NOW)).toEqual(filters);
  });

  it('read a year, everything and a range, the range in order', () => {
    expect(filtersFrom(params('year=2025'), NOW).period).toEqual({ kind: 'year', year: 2025 });
    expect(filtersFrom(params('period=all'), NOW).period).toEqual({ kind: 'all' });
    expect(filtersFrom(params('from=2026-10-20&to=2026-10-01'), NOW).period).toEqual({
      kind: 'range',
      from: '2026-10-01',
      to: '2026-10-20',
    });
  });

  it('leave out what they cannot read: after today, made-up days, a day outside the month', () => {
    expect(filtersFrom(params('month=2026-11'), NOW).period).toEqual(OCTOBER.period);
    expect(filtersFrom(params('month=2026-13'), NOW).period).toEqual(OCTOBER.period);
    expect(filtersFrom(params('year=2027'), NOW).period).toEqual(OCTOBER.period);
    expect(filtersFrom(params('from=2026-02-30&to=2026-03-01'), NOW).period).toEqual(
      OCTOBER.period,
    );
    expect(filtersFrom(params('type=fee'), NOW).type).toBeUndefined();
    expect(filtersFrom(params('month=2026-09&day=2026-10-02'), NOW).day).toBeUndefined();
    expect(filtersFrom(params('period=all&day=2026-10-02'), NOW).day).toBeUndefined();
  });
});

describe('what the API is asked for', () => {
  it('is the period as days, the picked day only for the receipts', () => {
    const filters: Filters = { ...OCTOBER, accountId: 'mono', day: '2026-10-24' };

    expect(summaryQueryOf(filters)).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
      accountId: 'mono',
      categoryId: undefined,
      type: undefined,
    });
    expect(listQueryOf(filters)).toMatchObject({ from: '2026-10-24', to: '2026-10-24' });
  });

  it('has no days for everything, and a year from January to December', () => {
    expect(boundsOf({ kind: 'all' })).toEqual({});
    expect(boundsOf({ kind: 'year', year: 2026 })).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    });
    expect(boundsOf({ kind: 'month', month: '2026-02' })).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });
});

describe('the period', () => {
  it('steps a month or a year, never past this one', () => {
    expect(stepped(OCTOBER.period, -1, NOW)).toEqual({ kind: 'month', month: '2026-09' });
    expect(stepped({ kind: 'month', month: '2026-01' }, -1, NOW)).toEqual({
      kind: 'month',
      month: '2025-12',
    });
    expect(stepped(OCTOBER.period, 1, NOW)).toBeNull();
    expect(stepped({ kind: 'year', year: 2025 }, 1, NOW)).toEqual({ kind: 'year', year: 2026 });
    expect(stepped({ kind: 'year', year: 2026 }, 1, NOW)).toBeNull();
    expect(stepped({ kind: 'all' }, -1, NOW)).toBeNull();
  });

  it('is one of the list’s choices or none', () => {
    expect(choiceOf(OCTOBER.period, NOW)).toBe('this-month');
    expect(choiceOf({ kind: 'month', month: '2026-09' }, NOW)).toBe('last-month');
    expect(choiceOf({ kind: 'month', month: '2026-08' }, NOW)).toBeNull();
    expect(choiceOf({ kind: 'year', year: 2026 }, NOW)).toBe('this-year');
    expect(choiceOf({ kind: 'year', year: 2025 }, NOW)).toBeNull();
    expect(periodOf('last-month', OCTOBER.period, NOW)).toEqual({
      kind: 'month',
      month: '2026-09',
    });
    expect(periodOf('range', OCTOBER.period, NOW)).toEqual({
      kind: 'range',
      from: '2026-10-16',
      to: NOW,
    });
  });

  it('is named as the slip shows it', () => {
    expect(periodName(OCTOBER.period, 'All time')).toBe('October 2026');
    expect(periodName({ kind: 'all' }, 'All time')).toBe('All time');
    expect(periodName({ kind: 'range', from: '2026-10-13', to: '2026-10-26' }, '')).toBe(
      '13 Oct – 26 Oct 2026',
    );
    expect(periodName({ kind: 'range', from: '2025-12-20', to: '2026-01-05' }, '')).toBe(
      '20 Dec 2025 – 5 Jan 2026',
    );
  });

  it('takes the picked day with it when it changes', () => {
    expect(withPeriod({ ...OCTOBER, day: '2026-10-24' }, { kind: 'all' })).toEqual({
      period: { kind: 'all' },
      day: undefined,
    });
  });
});

describe('the type and the category', () => {
  const kindOf = (id: string): 'Expense' | 'Income' => (id === 'salary' ? 'Income' : 'Expense');

  it('drop a category of another kind, or any for Transfers', () => {
    const eatingOut: Filters = { ...OCTOBER, categoryId: 'eating-out' };

    expect(withType(eatingOut, 'Expense', kindOf).categoryId).toBe('eating-out');
    expect(withType(eatingOut, 'Income', kindOf).categoryId).toBeUndefined();
    expect(withType(eatingOut, 'Transfer', kindOf).categoryId).toBeUndefined();
    expect(withType(eatingOut, undefined, kindOf).categoryId).toBe('eating-out');
  });

  it('a picked category drops Transfers', () => {
    expect(withCategory({ ...OCTOBER, type: 'Transfer' }, 'groceries')).toMatchObject({
      categoryId: 'groceries',
      type: undefined,
    });
    expect(withCategory({ ...OCTOBER, type: 'Expense' }, 'groceries').type).toBe('Expense');
  });

  it('count for the Filters button, and Clear all keeps the period', () => {
    const all: Filters = {
      ...OCTOBER,
      accountId: 'cash',
      categoryId: 'eating-out',
      type: 'Expense',
    };

    expect(filterCount(all)).toBe(3);
    expect(filterCount({ ...OCTOBER, day: '2026-10-24' })).toBe(0);
    expect(cleared(all)).toEqual(OCTOBER);
  });
});
