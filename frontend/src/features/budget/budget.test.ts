import { describe, expect, it } from 'vitest';
import {
  budgetText,
  daysLeft,
  leftFor,
  linesOf,
  newOverflows,
  overflowsOf,
  parseBudget,
  planOf,
  shiftMonth,
  tightest,
  withBudget,
} from './budget';
import { toMonthBudget } from './budgetApi';
import { notPlannedMonth, plannedMonth } from './budgetTestData';

const data = toMonthBudget(plannedMonth('2026-11'));

describe('a month’s lines', () => {
  it('give each level its budget, spent and left; a group without its own counts its categories’', () => {
    const lines = linesOf(data);

    expect(lines.total).toMatchObject({ budget: 50_000, spent: 31_482, left: 18_518 });
    const daily = lines.groups.find((g) => g.id === 'g-daily');
    expect(daily).toMatchObject({ own: 22_000, inside: 16_500, budget: 22_000, left: 9_714 });
    expect(daily?.categories.find((c) => c.id === 'c-eating')?.left).toBe(-607);
    const subs = lines.groups.find((g) => g.id === 'g-subs');
    expect(subs).toMatchObject({ own: null, inside: 500, budget: 500, left: 0 });
    // Home 23 000 + Daily 22 000 + Entertainment 2 000 + Subscriptions' 500
    expect(lines.planned).toBe(47_500);
    expect(lines.unplanned).toBe(2_500);
    expect(lines.isEmpty).toBe(false);
  });

  it('are empty for a month not planned', () => {
    expect(linesOf(toMonthBudget(notPlannedMonth('2026-12', '2026-11'))).isEmpty).toBe(true);
  });

  it('put the categories closest to running out first', () => {
    expect(tightest(linesOf(data), 2).map((c) => c.name)).toEqual(['Eating out', 'Rent']);
  });
});

describe('each level fits within the one above it', () => {
  const plan = planOf(data);

  it('holds for the month as planned', () => {
    expect(overflowsOf(plan, data)).toEqual([]);
  });

  it('says by how much a group’s categories go over it', () => {
    const next = withBudget(plan, { kind: 'category', id: 'c-eating' }, 9_000);

    expect(newOverflows(plan, next, data)).toEqual([
      { groupId: 'g-daily', name: 'Daily living', inside: 23_500, budget: 22_000 },
    ]);
  });

  it('counts a group without its own budget with its categories’ sum in the total', () => {
    const next = withBudget(plan, { kind: 'category', id: 'c-phone' }, 3_000);

    expect(newOverflows(plan, next, data)).toEqual([
      { groupId: null, name: '', inside: 50_200, budget: 50_000 },
    ]);
  });

  it('blocks lowering the total below the groups, and lets a level already over be put right', () => {
    expect(newOverflows(plan, withBudget(plan, { kind: 'total' }, 40_000), data)).toHaveLength(1);
    const over = withBudget(plan, { kind: 'category', id: 'c-eating' }, 9_000);
    const better = withBudget(over, { kind: 'category', id: 'c-eating' }, 8_000);
    expect(newOverflows(over, better, data)).toEqual([]);
  });

  it('removes a budget with none', () => {
    const next = withBudget(plan, { kind: 'group', id: 'g-daily' }, null);
    expect(next.groups).not.toHaveProperty('g-daily');
    expect(next.groups['g-home']).toBe(23_000);
  });
});

describe('what the quick-add form shows (Q-015)', () => {
  const lines = linesOf(data);

  it('is the category’s own left, else its group’s, else the month’s', () => {
    expect(leftFor(lines, 'c-eating')).toEqual({
      of: 'category',
      name: 'Eating out',
      budget: 2_000,
      left: -607,
    });
    expect(leftFor(lines, 'c-clothing')).toEqual({
      of: 'group',
      name: 'Daily living',
      budget: 22_000,
      left: 9_714,
    });
    expect(leftFor(lines, 'c-doctor')).toEqual({
      of: 'total',
      name: '',
      budget: 50_000,
      left: 18_518,
    });
  });

  it('is nothing for an income category or in a month not planned', () => {
    expect(leftFor(lines, 'c-salary')).toBeNull();
    expect(leftFor(linesOf(toMonthBudget(notPlannedMonth('2026-12', null))), 'c-food')).toBeNull();
  });
});

describe('months and amounts', () => {
  it('count the days left, today included', () => {
    expect(daysLeft('2026-11', '2026-11-16')).toBe(15);
    expect(daysLeft('2026-11', '2026-11-30')).toBe(1);
    expect(daysLeft('2026-10', '2026-11-16')).toBe(0);
    expect(daysLeft('2026-12', '2026-11-16')).toBe(31);
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('read a typed budget and write it back with spaces', () => {
    expect(parseBudget('13 000')).toBe(13_000);
    expect(parseBudget('12,5x')).toBe(125);
    expect(parseBudget('')).toBeNull();
    expect(budgetText(13_000)).toBe('13 000');
    expect(budgetText(null)).toBe('');
  });
});
