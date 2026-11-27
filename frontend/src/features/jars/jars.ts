import {
  IconBeach,
  IconCar,
  IconCoins,
  IconDeviceLaptop,
  IconGift,
  IconHome,
  IconPlane,
  IconSchool,
  type Icon,
} from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import type { Account } from '../accounts/accountsApi';
import { today } from '../transactions/days';
import type { Jar, JarColor, JarIconName } from './jarsApi';

/** F-034's numbers, worked out from the jars and accounts the API sends. Pure, so they are tested alone. */

export const JAR_ICONS: Record<JarIconName, Icon> = {
  Car: IconCar,
  Home: IconHome,
  Plane: IconPlane,
  Beach: IconBeach,
  Device: IconDeviceLaptop,
  Coins: IconCoins,
  Gift: IconGift,
  School: IconSchool,
};

export const JAR_ICON_NAMES = Object.keys(JAR_ICONS) as JarIconName[];

/** One of Mantine's palette colours from the theme, true in both schemes; the names are said in i18n. */
export const JAR_COLORS: readonly JarColor[] = ['Blue', 'Teal', 'Orange', 'Yellow', 'Pink', 'Gray'];

/** The jar's colour as CSS variables: `--jar` (strong), `--jar-soft` (its tint) and `--jar-text`, from Mantine's palette. */
export function jarStyle(color: JarColor): CSSProperties {
  const name = color.toLowerCase();
  return {
    '--jar': `var(--mantine-color-${name}-filled)`,
    '--jar-soft': `var(--mantine-color-${name}-light)`,
    '--jar-text': `var(--mantine-color-${name}-light-color)`,
  } as CSSProperties;
}

/** This month, `2026-11`. */
export const thisMonth = () => today().slice(0, 7);

/** Months from this one to the target month, both counted: Nov 2026 → Dec 2027 is 14. */
export function monthsLeft(by: string, from: string = thisMonth()): number {
  const [y1, m1] = from.split('-').map(Number) as [number, number];
  const [y2, m2] = by.split('-').map(Number) as [number, number];
  return Math.max(0, (y2 - y1) * 12 + (m2 - m1) + 1);
}

/** What to save a month to make the goal by its month; nothing without a goal and a date, or once it is reached. */
export function perMonth(
  jar: Pick<Jar, 'goal' | 'by'>,
  saved: number,
  from: string = thisMonth(),
): number | null {
  if (jar.goal === null || jar.by === null) return null;
  const left = monthsLeft(jar.by, from);
  const toGo = jar.goal - saved;
  if (toGo <= 0 || left === 0) return null;
  return Math.ceil(toGo / left);
}

/** Saved / goal, at most 1; 0 without a goal. */
export function progress(jar: Pick<Jar, 'goal'>, saved: number): number {
  return jar.goal ? Math.min(1, Math.max(0, saved / jar.goal)) : 0;
}

export function reached(jar: Pick<Jar, 'goal'>, saved: number): boolean {
  return jar.goal !== null && saved >= jar.goal;
}

/** An account with what of it is free: its balance less its jar money; below zero when spending ate into it. */
export interface FreeAccount {
  account: Account;
  free: number;
}

export const freeOf = (account: Account): number => account.balance - account.inJars;

/** Hryvnias for an amount at the NBU rates (hryvnias for one unit); none without a rate. */
function inHryvnias(amount: number, currency: string, rates: Record<string, number>) {
  if (currency === 'UAH') return amount;
  const rate = rates[currency];
  return rate === undefined ? 0 : amount * rate;
}

/**
 * The accounts a jar's money can come from (Q-014, 5): those with money on them, the jar's currency first, each part
 * with the most free money first (another currency's by its worth in hryvnias at the rates given).
 */
export function accountsFor(
  jar: Pick<Jar, 'currency'>,
  accounts: Account[],
  rates: Record<string, number> = {},
): FreeAccount[] {
  const withFree = accounts
    .filter((account) => account.balance > 0 && account.archivedAt === null)
    .map((account) => ({ account, free: freeOf(account) }));
  const own = withFree.filter((a) => a.account.currency === jar.currency);
  const others = withFree.filter((a) => a.account.currency !== jar.currency);
  return [
    ...own.sort((a, b) => b.free - a.free),
    ...others.sort(
      (a, b) =>
        inHryvnias(b.free, b.account.currency, rates) -
        inHryvnias(a.free, a.account.currency, rates),
    ),
  ];
}

/** Darkest for the biggest part, lighter for each next: shades of the text colour, as the Budget's split. */
export const shade = (index: number) => `${String(Math.max(24, 92 - index * 30))}%`;

/** One account holding jar money: its balance, a piece per jar (biggest first, in its currency) and what is free. */
export interface HoldingAccount {
  account: Account;
  pieces: { jar: Jar; amount: number }[];
  inJars: number;
  free: number;
}

/** The accounts the jar money lies on, in the accounts' order, for *Where the jar money lies*. */
export function holdingAccounts(jars: Jar[], accounts: Account[]): HoldingAccount[] {
  return accounts.flatMap((account) => {
    const pieces = jars
      .map((jar) => ({
        jar,
        amount: jar.places.find((p) => p.accountId === account.id)?.accountAmount ?? 0,
      }))
      .filter((piece) => piece.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    if (pieces.length === 0) return [];
    const inJars = pieces.reduce((sum, piece) => sum + piece.amount, 0);
    return [{ account, pieces, inJars, free: account.balance - inJars }];
  });
}

/**
 * "Fill by this month's plan" (F-034): each planned jar, in the plan's order, gets what is still to go of its planned
 * amount, as far as the money reaches.
 */
export function splitByPlan(
  money: number,
  plan: { id: string; planned: number; setAside: number }[],
): Record<string, number> {
  let left = Math.max(0, money);
  const out: Record<string, number> = {};
  for (const jar of plan) {
    const toGo = Math.max(0, jar.planned - jar.setAside);
    const amount = Math.min(toGo, left);
    if (amount > 0) out[jar.id] = amount;
    left -= amount;
  }
  return out;
}
