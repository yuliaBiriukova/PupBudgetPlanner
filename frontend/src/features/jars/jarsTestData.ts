import type { components } from '../../shared/api/schema';
import { OVERVIEW, TOTAL } from '../accounts/accountsTestData';
import type { AccountsOverview, AccountsTotal } from '../accounts/accountsApi';

type JarItem = components['schemas']['JarItem'];
type JarMoveItem = components['schemas']['JarMoveItem'];

/**
 * The final prototype's jars (F-034), for tests and stories, on Olena's accounts (accountsTestData): Car 138 000 (120 000
 * in the Deposit, 18 000 on Mono black), Apartment 100 000 (Deposit), Summer in the Carpathians 12 000 (Privat card),
 * the dollar cushion $1 400 (Mono dollars, dollars at home), the laptop 32 000 (Mono black, its goal reached). Mono
 * black has 48 211 ₴ with 50 000 ₴ in jars: 1 789 ₴ of the jar money was spent.
 */
const line = (
  id: string,
  date: string,
  kind: JarMoveItem['kind'],
  amount: number,
  account: [string, string],
  extra: Partial<JarMoveItem> = {},
): JarMoveItem => ({
  id,
  date,
  kind,
  amount,
  accountId: account[0],
  accountName: account[1],
  accountCurrency: 'UAH',
  accountAmount: amount,
  otherJarId: null,
  otherJarName: null,
  month: null,
  ...extra,
});

const MONO: [string, string] = ['mono', 'Mono black'];
const DEPOSIT: [string, string] = ['deposit', 'Deposit for the new apartment'];
const PRIVAT: [string, string] = ['privat', 'Privat card'];
const place = (account: [string, string], amount: number, currency = 'UAH') => ({
  accountId: account[0],
  accountName: account[1],
  accountCurrency: currency,
  amount,
  accountAmount: amount,
});

export const JARS: JarItem[] = [
  {
    id: 'car',
    name: 'Car',
    icon: 'Car',
    color: 'Blue',
    currency: 'UAH',
    goal: 400_000,
    by: '2027-12',
    note: 'A used Škoda Octavia, about 2019',
    saved: 138_000,
    places: [place(DEPOSIT, 120_000), place(MONO, 18_000)],
    history: [
      line('m6', '2026-10-18', 'TakeOut', -4_000, MONO),
      line('m5', '2026-10-01', 'PutIn', 12_000, MONO),
      line('m4', '2026-09-01', 'PutIn', 10_000, MONO),
      line('m3', '2026-07-01', 'PutIn', 40_000, DEPOSIT),
      line('m2', '2026-04-01', 'PutIn', 80_000, DEPOSIT),
    ],
    plannedThisMonth: 15_000,
    setAsideThisMonth: 0,
    closedAt: null,
  },
  {
    id: 'apartment',
    name: 'Apartment',
    icon: 'Home',
    color: 'Teal',
    currency: 'UAH',
    goal: 1_200_000,
    by: null,
    note: 'The first payment',
    saved: 100_000,
    places: [place(DEPOSIT, 100_000)],
    history: [line('m1', '2025-01-05', 'PutIn', 100_000, DEPOSIT)],
    plannedThisMonth: null,
    setAsideThisMonth: 0,
    closedAt: null,
  },
  {
    id: 'carpathians',
    name: 'Summer in the Carpathians',
    icon: 'Beach',
    color: 'Orange',
    currency: 'UAH',
    goal: 40_000,
    by: '2027-07',
    note: null,
    saved: 12_000,
    places: [place(PRIVAT, 12_000)],
    history: [
      line('m8', '2026-10-02', 'SavedMoney', 6_000, PRIVAT, { month: '2026-09' }),
      line('m7', '2026-09-03', 'PutIn', 6_000, PRIVAT),
    ],
    plannedThisMonth: 5_000,
    setAsideThisMonth: 0,
    closedAt: null,
  },
  {
    id: 'cushion',
    name: 'Dollar cushion',
    icon: 'Coins',
    color: 'Gray',
    currency: 'USD',
    goal: 3_000,
    by: null,
    note: 'Three months of rent, just in case',
    saved: 1_400,
    places: [
      place(['mono-usd', 'Mono dollars'], 900, 'USD'),
      place(['cash-usd', 'Dollars at home'], 500, 'USD'),
    ],
    history: [],
    plannedThisMonth: null,
    setAsideThisMonth: 0,
    closedAt: null,
  },
  {
    id: 'laptop',
    name: 'New laptop',
    icon: 'Device',
    color: 'Yellow',
    currency: 'UAH',
    goal: 32_000,
    by: '2026-12',
    note: null,
    saved: 32_000,
    places: [place(MONO, 32_000)],
    history: [
      line('m13', '2026-11-01', 'PutIn', 12_000, MONO),
      line('m12', '2026-08-01', 'MovedIn', 20_000, MONO, { otherJarName: 'Car' }),
    ],
    plannedThisMonth: 12_000,
    setAsideThisMonth: 12_000,
    closedAt: null,
  },
];

/** What of each account is in these jars. */
const IN_JARS: Record<string, number> = {
  mono: 50_000,
  deposit: 220_000,
  privat: 12_000,
  'mono-usd': 900,
  'cash-usd': 500,
};

/** Olena's accounts with the jars' money on them. */
export const OVERVIEW_WITH_JARS: AccountsOverview = {
  ...OVERVIEW,
  accounts: OVERVIEW.accounts.map((account) => ({
    ...account,
    inJars: IN_JARS[account.id] ?? 0,
  })),
};

/** In total, with what of it is in jars at the same rates: 282 000 ₴ and $1 400. */
export const TOTAL_WITH_JARS: AccountsTotal = { ...TOTAL, inJars: 282_000 + 1_400 * 41.35 };
