import type { Account } from '../../features/accounts/accountsApi';
import { ACCOUNTS } from '../../features/accounts/accountsTestData';

/** F-034's prototype: saving jars that set money aside inside real accounts (option B). */

/** One of Mantine's palette colours from the theme: a jar's colour, true in both schemes. */
export type JarColor = 'blue' | 'teal' | 'orange' | 'yellow' | 'pink' | 'gray';

export const JAR_COLORS: { value: JarColor; name: string }[] = [
  { value: 'blue', name: 'Sky' },
  { value: 'teal', name: 'Mint' },
  { value: 'orange', name: 'Amber' },
  { value: 'yellow', name: 'Sun' },
  { value: 'pink', name: 'Rose' },
  { value: 'gray', name: 'Stone' },
];

export type JarIconName =
  'car' | 'home' | 'plane' | 'beach' | 'device' | 'coins' | 'gift' | 'school';

export interface Jar {
  id: string;
  name: string;
  icon: JarIconName;
  color: JarColor;
  currency: string;
  /** Optional, as the target date. */
  goal: number | null;
  /** `YYYY-MM`: the month the goal is meant for. */
  by: string | null;
  note: string;
  closed?: boolean;
}

/** Money put into a jar (positive) or taken out of it (negative), from or back to one account. */
export interface Move {
  id: string;
  jarId: string;
  accountId: string;
  amount: number;
  date: string;
  /** Why, when it isn't a plain put in or take out: "Moved to Apartment", "November's saved money". */
  note?: string;
  /** Set aside from an account in another currency: what left the account, in its currency (NBU rate of that day). */
  accountAmount?: number;
}

/** The prototype's today: stable screenshots. */
export const TODAY = '2026-11-17';

export const JARS: Jar[] = [
  {
    id: 'car',
    name: 'Car',
    icon: 'car',
    color: 'blue',
    currency: 'UAH',
    goal: 400000,
    by: '2027-12',
    note: 'A used Škoda Octavia, about 2019',
  },
  {
    id: 'apartment',
    name: 'Apartment',
    icon: 'home',
    color: 'teal',
    currency: 'UAH',
    goal: 1200000,
    by: null,
    note: 'The first payment',
  },
  {
    id: 'carpathians',
    name: 'Summer in the Carpathians',
    icon: 'beach',
    color: 'orange',
    currency: 'UAH',
    goal: 40000,
    by: '2027-07',
    note: '',
  },
  {
    id: 'cushion',
    name: 'Dollar cushion',
    icon: 'coins',
    color: 'gray',
    currency: 'USD',
    goal: 3000,
    by: null,
    note: 'Three months of rent, just in case',
  },
  {
    id: 'laptop',
    name: 'New laptop',
    icon: 'device',
    color: 'yellow',
    currency: 'UAH',
    goal: 32000,
    by: '2026-12',
    note: '',
  },
];

const move = (
  id: string,
  jarId: string,
  accountId: string,
  amount: number,
  date: string,
): Move => ({ id, jarId, accountId, amount, date });

/**
 * Car 138 000 (120 000 in the Deposit, 18 000 on Mono black), Apartment 100 000 (Deposit), Carpathians 12 000 (Privat
 * card), the cushion $1 400 (Mono dollars, dollars at home), the laptop 32 000 (Mono black, its goal reached). Mono
 * black has 48 211 ₴ with 50 000 ₴ in jars: 1 789 ₴ of the jar money was spent.
 */
export const MOVES: Move[] = [
  // The apartment jar is the old one: almost two years of 5 000 a month after a first 40 000, so the table has many months
  move('m1', 'apartment', 'deposit', 40000, '2025-01-05'),
  ...Array.from({ length: 12 }, (_, i) =>
    move(
      `m1-${String(i)}`,
      'apartment',
      'deposit',
      5000,
      `${i < 11 ? '2025' : '2026'}-${String(((i + 1) % 12) + 1).padStart(2, '0')}-02`,
    ),
  ),
  move('m2', 'car', 'deposit', 80000, '2026-04-01'),
  move('m3', 'car', 'deposit', 40000, '2026-07-01'),
  move('m4', 'car', 'mono', 10000, '2026-09-01'),
  move('m5', 'car', 'mono', 12000, '2026-10-01'),
  move('m6', 'car', 'mono', -4000, '2026-10-18'),
  move('m7', 'carpathians', 'privat', 6000, '2026-09-03'),
  move('m8', 'carpathians', 'privat', 6000, '2026-10-02'),
  move('m9', 'cushion', 'mono-usd', 600, '2026-06-05'),
  move('m10', 'cushion', 'mono-usd', 300, '2026-09-05'),
  move('m11', 'cushion', 'cash-usd', 500, '2026-10-12'),
  move('m12', 'laptop', 'mono', 20000, '2026-08-01'),
  move('m13', 'laptop', 'mono', 12000, '2026-11-01'),
];

export const PROTO_ACCOUNTS: Account[] = ACCOUNTS;

export function accountOf(id: string): Account | undefined {
  return PROTO_ACCOUNTS.find((account) => account.id === id);
}

export function savedIn(jar: Jar, moves: Move[]): number {
  return moves.filter((m) => m.jarId === jar.id).reduce((sum, m) => sum + m.amount, 0);
}

/** What of an account is in jars. */
export function inJarsOf(account: Account, moves: Move[]): number {
  return moves
    .filter((m) => m.accountId === account.id)
    .reduce((sum, m) => sum + (m.accountAmount ?? m.amount), 0);
}

/** Where a jar's money lies: per account, biggest first. */
export function placesOf(jar: Jar, moves: Move[]): { account: Account; amount: number }[] {
  const by = new Map<string, number>();
  for (const m of moves.filter((item) => item.jarId === jar.id))
    by.set(m.accountId, (by.get(m.accountId) ?? 0) + m.amount);
  return [...by.entries()]
    .flatMap(([id, amount]) => {
      const account = accountOf(id);
      return account && amount !== 0 ? [{ account, amount }] : [];
    })
    .sort((a, b) => b.amount - a.amount);
}

/** Months from this one to the target month, both counted: Nov 2026 → Dec 2027 is 14. */
export function monthsLeft(by: string, today = TODAY): number {
  const [y1, m1] = today.split('-').map(Number) as [number, number];
  const [y2, m2] = by.split('-').map(Number) as [number, number];
  return Math.max(0, (y2 - y1) * 12 + (m2 - m1) + 1);
}

/** "Save … a month to make it": what is still to go over the months left; nothing without a goal and a date. */
export function perMonth(jar: Jar, saved: number): number | null {
  if (jar.goal === null || jar.by === null) return null;
  const left = monthsLeft(jar.by);
  const toGo = jar.goal - saved;
  if (toGo <= 0 || left === 0) return null;
  return Math.ceil(toGo / left);
}

export function progress(jar: Jar, saved: number): number {
  return jar.goal ? Math.min(1, saved / jar.goal) : 0;
}

export function reached(jar: Jar, saved: number): boolean {
  return jar.goal !== null && saved >= jar.goal;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2027-12` → `Dec 2027`. */
export function monthName(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return `${MONTHS[m - 1] ?? ''} ${String(y)}`;
}

/** November's plan for jars (F-033's month): 32 000 ₴ within the month's total; the cushion isn't planned. */
export const PLAN: Record<string, number> = { car: 15000, carpathians: 5000, laptop: 12000 };

/** The month's income in the prototype, for "income minus expenses". */
export const MONTH_INCOME = 52000;

/** What went into a jar this month (out taken off). */
export function setAsideThisMonth(jarId: string, moves: Move[], month = TODAY.slice(0, 7)): number {
  return moves
    .filter((m) => m.jarId === jarId && m.date.startsWith(month))
    .reduce((sum, m) => sum + m.amount, 0);
}

/**
 * "By this month's plan": each jar in the plan's order gets what is still to go of its planned amount, as far as the
 * money reaches.
 */
export function splitByPlan(
  money: number,
  plan: Record<string, number>,
  moves: Move[],
): Record<string, number> {
  let left = money;
  const out: Record<string, number> = {};
  for (const [jarId, planned] of Object.entries(plan)) {
    const toGo = Math.max(0, planned - setAsideThisMonth(jarId, moves));
    const amount = Math.min(toGo, left);
    if (amount > 0) out[jarId] = amount;
    left -= amount;
  }
  return out;
}
