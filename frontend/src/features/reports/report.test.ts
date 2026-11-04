import { describe, expect, it } from 'vitest';
import {
  addressFrom,
  heatLevel,
  periodName,
  plain,
  reportParams,
  signed,
  stepped,
  switched,
  transactionsLink,
  usedOnly,
} from './report';
import { toReport } from './reportsApi';
import { fakeYearReport } from './reportsTestData';

const NOW = '2026-11-04';

describe('the address', () => {
  it('opens on this year in the report currency', () => {
    expect(addressFrom(new URLSearchParams(), NOW)).toEqual({
      period: { kind: 'year', year: 2026 },
      currency: undefined,
    });
  });

  it('reads a month, a year and a currency', () => {
    expect(addressFrom(new URLSearchParams('month=2026-10&currency=USD'), NOW)).toEqual({
      period: { kind: 'month', month: '2026-10' },
      currency: 'USD',
    });
    expect(addressFrom(new URLSearchParams('year=2025'), NOW).period).toEqual({
      kind: 'year',
      year: 2025,
    });
  });

  it('leaves out what it cannot read: a month to come, a year before 2000, a made-up currency', () => {
    expect(addressFrom(new URLSearchParams('month=2026-12'), NOW).period).toEqual({
      kind: 'year',
      year: 2026,
    });
    expect(addressFrom(new URLSearchParams('year=1999'), NOW).period).toEqual({
      kind: 'year',
      year: 2026,
    });
    expect(addressFrom(new URLSearchParams('currency=dollars'), NOW).currency).toBeUndefined();
  });

  it('writes this year as nothing, and the rest as it is', () => {
    expect(reportParams({ period: { kind: 'year', year: 2026 } }, NOW).toString()).toBe('');
    expect(
      reportParams({ period: { kind: 'year', year: 2025 }, currency: 'EUR' }, NOW).toString(),
    ).toBe('year=2025&currency=EUR');
    expect(reportParams({ period: { kind: 'month', month: '2026-11' } }, NOW).toString()).toBe(
      'month=2026-11',
    );
  });
});

describe('‹ ›', () => {
  it('go over the years with data, up to this one', () => {
    const year = { kind: 'year', year: 2026 } as const;
    expect(stepped(year, 1, '2025-03-01', NOW)).toBeNull();
    expect(stepped(year, -1, '2025-03-01', NOW)).toEqual({ kind: 'year', year: 2025 });
    expect(stepped({ kind: 'year', year: 2025 }, -1, '2025-03-01', NOW)).toBeNull();
  });

  it('go over the months with data, up to this one', () => {
    expect(stepped({ kind: 'month', month: '2026-11' }, 1, '2025-03-01', NOW)).toBeNull();
    expect(stepped({ kind: 'month', month: '2026-01' }, -1, '2025-03-01', NOW)).toEqual({
      kind: 'month',
      month: '2025-12',
    });
    expect(stepped({ kind: 'month', month: '2025-03' }, -1, '2025-03-01', NOW)).toBeNull();
  });

  it('go nowhere back without any data', () => {
    expect(stepped({ kind: 'year', year: 2026 }, -1, null, NOW)).toBeNull();
    expect(stepped({ kind: 'month', month: '2026-11' }, -1, null, NOW)).toBeNull();
  });
});

describe('Year / Month', () => {
  it('opens this month in this year, and December in an earlier one', () => {
    expect(switched({ kind: 'year', year: 2026 }, 'month', NOW)).toEqual({
      kind: 'month',
      month: '2026-11',
    });
    expect(switched({ kind: 'year', year: 2025 }, 'month', NOW)).toEqual({
      kind: 'month',
      month: '2025-12',
    });
    expect(switched({ kind: 'month', month: '2025-04' }, 'year', NOW)).toEqual({
      kind: 'year',
      year: 2025,
    });
  });

  it('names the period', () => {
    expect(periodName({ kind: 'year', year: 2026 })).toBe('2026');
    expect(periodName({ kind: 'month', month: '2026-10' })).toBe('October 2026');
  });
});

describe('a category opens its transactions', () => {
  it('in a month or a year', () => {
    expect(transactionsLink({ kind: 'month', month: '2020-10' }, 'c1')).toBe(
      '/transactions?month=2020-10&category=c1',
    );
    expect(transactionsLink({ kind: 'year', year: 2025 }, 'c1')).toBe(
      '/transactions?year=2025&category=c1',
    );
  });
});

describe('the report on screen', () => {
  it('leaves out the categories with nothing in the year, and a group left with none', () => {
    const report = usedOnly(toReport(fakeYearReport(2026, NOW)));
    const names = report.groups.flatMap((group) => group.categories.map((c) => c.name));

    expect(names).toContain('Groceries');
    expect(names).not.toContain('Sport');
    expect(names).not.toContain('Spotify');
    expect(report.groups.map((group) => group.name)).toContain('Subscriptions');
    const empty = toReport(fakeYearReport(2026, NOW));
    const onlySpotify = {
      ...empty,
      groups: empty.groups
        .filter((group) => group.name === 'Subscriptions')
        .map((group) => ({
          ...group,
          categories: group.categories.filter((c) => c.name === 'Spotify'),
        })),
    };
    expect(usedOnly(onlySpotify).groups).toEqual([]);
  });

  it('reddens a month by how far it is over the usual', () => {
    expect(heatLevel(1200, 1000)).toBe(0);
    expect(heatLevel(1250, 1000)).toBe(1);
    expect(heatLevel(1500, 1000)).toBe(2);
    expect(heatLevel(2000, 1000)).toBe(3);
    expect(heatLevel(3000, 1000)).toBe(4);
    expect(heatLevel(500, 0)).toBe(0);
  });

  it('writes amounts whole: without the currency in the table, signed both ways for a change', () => {
    expect(plain(17000.4)).toBe('17 000');
    expect(plain(-4312)).toBe('−4 312');
    expect(signed(12300, 'UAH')).toBe('+12 300 ₴');
    expect(signed(-40, 'USD')).toBe('−$40');
    expect(signed(0.2, 'UAH')).toBe('0 ₴');
  });
});
