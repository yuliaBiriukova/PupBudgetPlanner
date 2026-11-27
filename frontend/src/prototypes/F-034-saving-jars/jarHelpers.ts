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
import { OVERVIEW, TOTAL } from '../../features/accounts/accountsTestData';
import { formatMoney } from '../../shared/format/money';
import {
  inJarsOf,
  monthName,
  perMonth,
  progress,
  PROTO_ACCOUNTS,
  reached,
  type Jar,
  type JarColor,
  type JarIconName,
  type Move,
} from './jars';

export const JAR_ICONS: Record<JarIconName, Icon> = {
  car: IconCar,
  home: IconHome,
  plane: IconPlane,
  beach: IconBeach,
  device: IconDeviceLaptop,
  coins: IconCoins,
  gift: IconGift,
  school: IconSchool,
};

/** The jar's colour as CSS variables: `--jar` (strong) and `--jar-soft` (its tint), from Mantine's palette. */
export function jarStyle(color: JarColor): CSSProperties {
  return {
    '--jar': `var(--mantine-color-${color}-filled)`,
    '--jar-soft': `var(--mantine-color-${color}-light)`,
    '--jar-text': `var(--mantine-color-${color}-light-color)`,
  } as CSSProperties;
}

/** "45% of 400 000 ₴", "Goal reached", or "No goal". */
export function goalText(jar: Jar, saved: number): string {
  if (jar.goal === null) return 'No goal';
  if (reached(jar, saved)) return 'Goal reached';
  return `${String(Math.floor(progress(jar, saved) * 100))}% of ${formatMoney(jar.goal, jar.currency)}`;
}

/** "Save 18 715 ₴ a month to make it by Dec 2027"; by itself "by Dec 2027" with no goal left. */
export function paceText(jar: Jar, saved: number): string | null {
  const month = perMonth(jar, saved);
  if (month === null || jar.by === null) return null;
  return `Save ${formatMoney(month, jar.currency)} a month to make it by ${monthName(jar.by)}`;
}

/** The accounts a jar's money can come from: its currency, the most free money first. */
export function accountsFor(jar: Jar, moves: Move[]) {
  const withFree = PROTO_ACCOUNTS.filter((a) => a.balance > 0).map((account) => ({
    account,
    free: account.balance - inJarsOf(account, moves),
  }));
  const own = withFree.filter((a) => a.account.currency === jar.currency);
  const others = withFree.filter((a) => a.account.currency !== jar.currency);
  return [
    ...own.sort((a, b) => b.free - a.free),
    ...others.sort(
      (a, b) => inHryvnias(b.free, b.account.currency) - inHryvnias(a.free, a.account.currency),
    ),
  ];
}

/** Hryvnias for an amount at the prototype's NBU rates (F-017). */
export function inHryvnias(amount: number, currency: string): number {
  if (currency === 'UAH') return amount;
  return amount * (TOTAL.rates.find((r) => r.currency === currency)?.rate ?? 0);
}

/** Everything in jars and everything free, in hryvnias. */
export function splitTotal(moves: Move[]) {
  const inJars = OVERVIEW.accounts.reduce(
    (sum, a) => sum + inHryvnias(inJarsOf(a, moves), a.currency),
    0,
  );
  return { inJars, free: (TOTAL.total ?? 0) - inJars };
}

/** An amount in another currency at the prototype's NBU rates (F-017), whole. */
export function convert(amount: number, from: string, to: string): number {
  return Math.round(inHryvnias(amount, from) / inHryvnias(1, to));
}

/** One unit of `from` in `to` at the prototype's NBU rates. */
export function rateOf(from: string, to: string): number {
  return inHryvnias(1, from) / inHryvnias(1, to);
}
