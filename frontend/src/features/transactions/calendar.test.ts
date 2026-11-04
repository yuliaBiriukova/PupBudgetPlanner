import { describe, expect, it } from 'vitest';
import { foldDayOf, heatOf, monthGrid, shareText, shortAmount, weekGrid } from './calendar';

describe('the spending calendar', () => {
  it('colours the days by the month’s quarters, so one rent day doesn’t wash out the rest', () => {
    const heat = heatOf(
      new Map([
        ['2026-10-01', 19000],
        ['2026-10-02', 79],
        ['2026-10-03', 514],
        ['2026-10-04', 990],
        ['2026-10-05', 0],
      ]),
    );

    expect([79, 514, 990, 19000].map(heat)).toEqual([1, 2, 3, 4]);
    expect(heat(0)).toBe(0);
  });

  it('starts its weeks on Monday', () => {
    // 1 October 2026 is a Thursday
    const october = monthGrid('2026-10');

    expect(october.lead).toBe(3);
    expect(october.days).toHaveLength(31);
    expect(october.days[0]).toBe('2026-10-01');
  });

  it('folds to one week of the month, the other month’s days left empty', () => {
    expect(weekGrid('2026-10', '2026-10-26')).toEqual({
      lead: 0,
      days: ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
      tail: 1,
    });
    expect(weekGrid('2026-10', '2026-09-28')).toMatchObject({ lead: 3, tail: 0 });
  });

  it('folds to the picked day’s week, else today’s, else the month’s last day with transactions', () => {
    expect(foldDayOf('2026-10', '2026-10-10', [], '2026-10-29')).toBe('2026-10-10');
    expect(foldDayOf('2026-10', undefined, [], '2026-10-29')).toBe('2026-10-29');
    expect(foldDayOf('2026-09', undefined, ['2026-09-02', '2026-09-27'], '2026-10-29')).toBe(
      '2026-09-27',
    );
    expect(foldDayOf('2026-08', undefined, [], '2026-10-29')).toBe('2026-08-31');
  });

  it('writes shares and short amounts as the prototype', () => {
    expect(shareText(18000, 54813)).toBe('33%');
    expect(shareText(199, 54813)).toBe('<1%');
    expect(shareText(0, 0)).toBe('0%');
    expect(shortAmount(455)).toBe('455');
    expect(shortAmount(2338)).toBe('2 338');
    expect(shortAmount(19034)).toBe('19k');
  });
});
