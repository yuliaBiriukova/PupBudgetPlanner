import dayjs from 'dayjs';
import { formatMoney } from '../../shared/format/money';
import { today } from '../transactions/days';
import type { BudgetTarget, MonthBudgetData } from './budgetApi';

/**
 * F-033's numbers as the Budget page, the quick-add form and the Transactions page show them, worked out from the
 * month the API sends. Amounts in the report currency; "left" is budget − spent, negative when over.
 */

/** A month's plan on its three levels, each optional; ids to amounts. */
export interface Plan {
  total: number | null;
  groups: Record<string, number>;
  categories: Record<string, number>;
  /** What the month plans to set aside into jars (F-034): within the total, not spending. */
  jars: Record<string, number>;
}

export interface Line {
  id: string;
  name: string;
  /** What it is measured against; none without a budget. */
  budget: number | null;
  spent: number;
  /** budget − spent; negative when over; none without a budget. */
  left: number | null;
}

export interface GroupLine extends Line {
  /** Its own budget; none when it shows its categories' sum. */
  own: number | null;
  /** The sum of its categories' budgets. */
  inside: number;
  categories: Line[];
}

export interface MonthLines {
  month: string;
  currency: string;
  total: Line;
  groups: GroupLine[];
  /** What the groups take of the total. */
  planned: number;
  /** What the month plans for jars (F-034): a part of the total beside the groups (Q-015), not spending. */
  jarsPlanned: number;
  /** total − planned − jarsPlanned; none without a total. */
  unplanned: number | null;
  /** Nothing planned on any level. */
  isEmpty: boolean;
}

/** This month, `2026-11`. */
export const thisMonth = () => today().slice(0, 7);

export const shiftMonth = (month: string, by: number) =>
  dayjs(`${month}-01`).add(by, 'month').format('YYYY-MM');

/** `November`, or `Nov`. */
export const monthName = (month: string, style: 'long' | 'short' = 'long') =>
  dayjs(`${month}-01`).format(style === 'long' ? 'MMMM' : 'MMM');

/** Days left in the month, today counted; 0 for a past month, all of them for one to come. */
export function daysLeft(month: string, now: string = today()) {
  const days = dayjs(`${month}-01`).daysInMonth();
  if (month < now.slice(0, 7)) return 0;
  if (month > now.slice(0, 7)) return days;
  return days - Number(now.slice(8)) + 1;
}

const line = (id: string, name: string, budget: number | null, spent: number): Line => ({
  id,
  name,
  budget,
  spent,
  left: budget == null ? null : budget - spent,
});

/** The plan of the month the API sent. */
export function planOf(data: MonthBudgetData): Plan {
  const groups: Record<string, number> = {};
  const categories: Record<string, number> = {};
  for (const group of data.groups) {
    if (group.budget != null) groups[group.id] = group.budget;
    for (const category of group.categories)
      if (category.budget != null) categories[category.id] = category.budget;
  }
  const jars = Object.fromEntries(data.jars.map((jar) => [jar.id, jar.planned]));
  return { total: data.total, groups, categories, jars };
}

/** Every level with its budget, spent and left; a group without its own budget counts with its categories' sum. */
export function linesOf(data: MonthBudgetData): MonthLines {
  const groups = data.groups.map((group): GroupLine => {
    const categories = group.categories.map((c) => line(c.id, c.name, c.budget, c.spent));
    const inside = categories.reduce((sum, c) => sum + (c.budget ?? 0), 0);
    const budget = group.budget ?? (inside > 0 ? inside : null);
    return {
      ...line(group.id, group.name, budget, group.spent),
      own: group.budget,
      inside,
      categories,
    };
  });
  const planned = groups.reduce((sum, g) => sum + (g.budget ?? 0), 0);
  const jarsPlanned = data.jars.reduce((sum, jar) => sum + jar.planned, 0);
  return {
    month: data.month,
    currency: data.currency,
    total: line('total', '', data.total, data.spent),
    groups,
    planned,
    jarsPlanned,
    unplanned: data.total == null ? null : data.total - planned - jarsPlanned,
    isEmpty: data.total == null && planned === 0,
  };
}

/** A level holding more than it may: a group (`groupId`) or the total; `inside` what it holds, `budget` its own. */
export interface Overflow {
  groupId: string | null;
  name: string;
  inside: number;
  budget: number;
  /** For the total: the part of `inside` planned for jars (F-034). */
  jars?: number;
}

/**
 * Each level fits within the one above it (F-033): a group's own budget holds its categories' budgets, and the groups
 * (one without its own counting with its categories' sum) and the jars (F-034) hold within the total.
 */
export function overflowsOf(plan: Plan, data: MonthBudgetData): Overflow[] {
  const overflows: Overflow[] = [];
  let planned = 0;
  for (const group of data.groups) {
    const inside = group.categories.reduce((sum, c) => sum + (plan.categories[c.id] ?? 0), 0);
    const own = plan.groups[group.id];
    if (own != null && inside > own)
      overflows.push({ groupId: group.id, name: group.name, inside, budget: own });
    planned += own ?? inside;
  }
  const jars = Object.values(plan.jars).reduce((sum, amount) => sum + amount, 0);
  planned += jars;
  if (plan.total != null && planned > plan.total)
    overflows.push({ groupId: null, name: '', inside: planned, budget: plan.total, jars });
  return overflows;
}

/** What a change makes worse than it was: the API refuses only that, so a plan already over can be put right. */
export function newOverflows(before: Plan, after: Plan, data: MonthBudgetData): Overflow[] {
  const earlier = overflowsOf(before, data);
  return overflowsOf(after, data).filter((overflow) => {
    const old = earlier.find((o) => o.groupId === overflow.groupId);
    return !old || overflow.inside - overflow.budget > old.inside - old.budget;
  });
}

/** The plan with one budget changed; none removes it. */
export function withBudget(plan: Plan, target: BudgetTarget, value: number | null): Plan {
  if (target.kind === 'total') return { ...plan, total: value };
  const key = target.kind === 'group' ? 'groups' : target.kind === 'jar' ? 'jars' : 'categories';
  const others = Object.entries(plan[key]).filter(([id]) => id !== target.id);
  return {
    ...plan,
    [key]: Object.fromEntries(value == null ? others : [...others, [target.id, value]]),
  };
}

/** What the quick-add form shows for a category: its own budget, else its group's own, else the month's (Q-015). */
export interface LeftFor {
  of: 'category' | 'group' | 'total';
  name: string;
  budget: number;
  left: number;
}

/** Nothing in a month not planned, or for a category in no level with a budget. */
export function leftFor(lines: MonthLines | undefined, categoryId: string): LeftFor | null {
  if (!lines || lines.isEmpty) return null;
  // Only expense categories are in the budget: an income one shows nothing
  const group = lines.groups.find((g) => g.categories.some((c) => c.id === categoryId));
  if (!group) return null;
  const category = group.categories.find((c) => c.id === categoryId);
  if (category?.budget != null && category.left != null)
    return { of: 'category', name: category.name, budget: category.budget, left: category.left };
  if (group.own != null && group.left != null)
    return { of: 'group', name: group.name, budget: group.own, left: group.left };
  if (lines.total.budget != null && lines.total.left != null)
    return { of: 'total', name: '', budget: lines.total.budget, left: lines.total.left };
  return null;
}

/** The categories closest to running out, by the share of their budget left (over first). */
export function tightest(lines: MonthLines, count: number): Line[] {
  return lines.groups
    .flatMap((g) => g.categories)
    .filter((c): c is Line & { budget: number; left: number } => c.budget != null && c.left != null)
    .sort((a, b) => a.left / a.budget - b.left / b.budget)
    .slice(0, count);
}

/** A typed budget: digits with spaces; empty is no budget. */
export function parseBudget(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : null;
}

/** A budget as its field shows it: `13 000`. */
export const budgetText = (value: number | null | undefined) =>
  value == null ? '' : String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** An amount in the month's report currency, as the app shows them (`13 000 ₴`). */
export const moneyIn = (currency: string) => (value: number) => formatMoney(value, currency);
