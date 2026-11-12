import dayjs from 'dayjs';
import { account, OVERVIEW, TOTAL } from '../../features/accounts/accountsTestData';
import type { Account, AccountsOverview, AccountsTotal } from '../../features/accounts/accountsApi';
import { DEFAULT_CATEGORIES } from '../../features/categories/categoriesTestData';
import type { Family } from '../../features/family/familyApi';
import { ownersFamily } from '../../features/family/familyTestData';
import { fakeMonthReport, fakeYearReport } from '../../features/reports/reportsTestData';
import { today } from '../../features/transactions/days';
import { SUGGESTIONS } from '../../features/transactions/transactionsTestData';
import { fakePage, fakeSummary, twoMonths } from '../../features/transactions/transactionsFakeApi';
import type { Transaction } from '../../features/transactions/transactionsApi';
import type { MockRoutes } from '../../test/mockFetch';

/**
 * F-024's prototype world: Olena (you), Andriy and Iryna, each with their own accounts, transactions and year, and the
 * family's as everyone's together. The prototype's pages ask the fake API with `who` (`me`, a member's id, `family`).
 */

export type FamilyChoice = 'Couple' | 'Three people' | 'No family';

/** `me`, a member's id, or `family`. */
export type Who = string;

export interface Person {
  id: string;
  name: string;
  isYou: boolean;
}

export function familyOf(choice: FamilyChoice): Family | null {
  if (choice === 'No family') return null;
  const family = ownersFamily();
  return {
    ...family,
    members: choice === 'Couple' ? family.members.slice(0, 2) : family.members,
  };
}

export function peopleOf(family: Family | null): Person[] {
  return (family?.members ?? []).map((member) => ({
    id: member.isYou ? 'me' : member.id,
    name: member.displayName,
    isYou: member.isYou,
  }));
}

const ANDRIY = '01a181d1-df7b-7855-98c6-a2e2bc4c26b1';
const IRYNA = '01a181d1-df7b-7855-98c6-a2e2bc4c26b2';

const bank = (name: string, style: Account['cardStyle'] = 'Solid') =>
  ({ source: 'Bank', bankId: `b-${name}`, bankName: name, cardStyle: style }) as const;
const money = (balance: number) => ({ balance, openingBalance: balance, transactionCount: 9 });

const ACCOUNTS: Record<string, Account[]> = {
  me: OVERVIEW.accounts.map((item) => ({ ...item, transactionCount: 12 })),
  [ANDRIY]: [
    account('a-mono', 'Mono white', { ...bank('Monobank', 'Tinted'), ...money(21560) }),
    account('a-privat', 'Salary card', { ...bank('PrivatBank'), ...money(37980) }),
    account('a-cash', 'Pocket', { ...money(1240), cardStyle: 'Envelope' }),
    account('a-usd', 'Dollars in the box', {
      ...money(900),
      currency: 'USD',
      cardStyle: 'Plain',
    }),
  ],
  [IRYNA]: [
    account('i-mono', 'Mono black', { ...bank('Monobank'), ...money(8420) }),
    account('i-cash', 'Cash', { ...money(2100), cardStyle: 'Envelope' }),
  ],
};

/** Whose an account is: every account id → the person's `who`. */
const OWNER = new Map(
  Object.entries(ACCOUNTS).flatMap(([who, list]) => list.map((item) => [item.id, who] as const)),
);

const RATE: Record<string, number> = {
  UAH: 1,
  ...Object.fromEntries(TOTAL.rates.map((item) => [item.currency, item.rate])),
};

function overviewOf(list: Account[], archived: Account[]): AccountsOverview {
  const currencies = [...new Set(list.map((item) => item.currency))];
  return {
    ...OVERVIEW,
    accounts: list,
    archived,
    totals: currencies.map((currency) => {
      const inIt = list.filter((item) => item.currency === currency);
      return {
        currency,
        accounts: inIt.length,
        total: inIt.reduce((sum, item) => sum + item.balance, 0),
      };
    }),
  };
}

function totalOf(overview: AccountsOverview): AccountsTotal {
  return {
    ...TOTAL,
    total: overview.totals.reduce((sum, item) => sum + item.total * (RATE[item.currency] ?? 1), 0),
    rates: TOTAL.rates.filter((rate) =>
      overview.totals.some((item) => item.currency === rate.currency),
    ),
  };
}

/** Andriy's and Iryna's lines: the same kind of days as Olena's, fewer of them, on their own accounts. */
function theirs(who: string, every: number, share: number, prefix: string): Transaction[] {
  const own = ACCOUNTS[who] ?? [];
  const uah = own.filter((item) => item.currency === 'UAH');
  const usd = own.find((item) => item.currency === 'USD');
  const pickUah = (i: number) => uah[i % uah.length] ?? own[0];
  return twoMonths()
    .filter((_, i) => i % every === 0)
    .flatMap((item, i): Transaction[] => {
      const from = item.currency === 'USD' ? usd : pickUah(i);
      if (!from) return [];
      const line: Transaction = {
        ...item,
        id: `${prefix}${item.id}`,
        accountId: from.id,
        accountName: from.name,
        currency: from.currency,
        amount: Math.max(8, Math.round(item.amount * share)),
      };
      if (item.type !== 'Transfer') return [line];
      const to = item.currency === 'USD' ? pickUah(0) : pickUah(i + 1);
      if (!to || to.id === from.id) return [];
      return [
        {
          ...line,
          toAccountId: to.id,
          toAccountName: to.name,
          toCurrency: to.currency,
          toAmount: Math.round((item.toAmount ?? item.amount) * share),
        },
      ];
    });
}

const TRANSACTIONS: Record<string, Transaction[]> = {
  me: twoMonths(),
  [ANDRIY]: theirs(ANDRIY, 2, 0.8, 'a-'),
  [IRYNA]: theirs(IRYNA, 5, 0.6, 'i-'),
};

/** Whose a transaction is, for the family's lines. */
export function ownerOf(transaction: Pick<Transaction, 'accountId'>): string {
  return OWNER.get(transaction.accountId) ?? 'me';
}

/** Everyone's together, newest first (a day's lines keep each person's order). */
function together(people: Person[]): Transaction[] {
  return people
    .flatMap((person) => TRANSACTIONS[person.id] ?? [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.date.localeCompare(a.item.date) || a.index - b.index)
    .map(({ item }) => item);
}

/** How big each person's year is next to Olena's. */
const YEAR_SHARE: Record<string, number> = { me: 1, [ANDRIY]: 0.62, [IRYNA]: 0.35 };

type ApiReport = ReturnType<typeof fakeYearReport>;

/** A report with every amount times `by` (the fake reports are Olena's year). */
function scaled(report: ApiReport, by: number): ApiReport {
  const scale = (value: unknown): unknown => {
    if (typeof value === 'number') return Math.round(value * by);
    if (Array.isArray(value)) return value.map(scale);
    if (value && typeof value === 'object')
      return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, scale(inner)]));
    return value;
  };
  // The report's columns and the count of months aren't money
  return {
    ...(scale(report) as ApiReport),
    months: report.months,
    monthsCounted: report.monthsCounted,
  };
}

function shareOf(who: Who, people: Person[]): number {
  if (who === 'family')
    return people.reduce((sum, person) => sum + (YEAR_SHARE[person.id] ?? 0.5), 0);
  return YEAR_SHARE[who] ?? 0.5;
}

/** The fake API for the prototype: each request answers for its `who` (none: you). */
export function familyRoutes(family: Family | null): MockRoutes {
  const people = peopleOf(family);
  const whoOf = (query: URLSearchParams): Who => {
    const who = query.get('who') ?? 'me';
    return who === 'family' && people.length === 0 ? 'me' : who;
  };
  const accountsOf = (who: Who) =>
    who === 'family'
      ? overviewOf(
          people.flatMap((person) => ACCOUNTS[person.id] ?? []),
          OVERVIEW.archived,
        )
      : overviewOf(ACCOUNTS[who] ?? [], who === 'me' ? OVERVIEW.archived : []);
  const itemsOf = (who: Who) => (who === 'family' ? together(people) : (TRANSACTIONS[who] ?? []));
  const year = (who: Who, query: URLSearchParams) =>
    scaled(fakeYearReport(Number(query.get('year')), today()), shareOf(who, people));
  const month = (who: Who, query: URLSearchParams) =>
    scaled(fakeMonthReport(query.get('month') ?? '', today()), shareOf(who, people));

  return {
    '/api/accounts': (_, query) => ({ json: accountsOf(whoOf(query)) }),
    '/api/accounts/total': (_, query) => ({ json: totalOf(accountsOf(whoOf(query))) }),
    '/api/transactions': (_, query) => ({ json: fakePage(itemsOf(whoOf(query)), query) }),
    '/api/transactions/summary': (_, query) => ({
      json: fakeSummary(itemsOf(whoOf(query)), query),
    }),
    '/api/transactions/suggestions': { json: SUGGESTIONS },
    '/api/transactions/notes': { json: [] },
    '/api/categories': { json: DEFAULT_CATEGORIES },
    '/api/reports/year': (_, query) => ({ json: year(whoOf(query), query) }),
    '/api/reports/month': (_, query) => ({ json: month(whoOf(query), query) }),
    '/api/settings': {
      json: { displayName: 'Olena', email: 'olena@example.com', reportCurrency: 'UAH' },
    },
    '/api/family': family ? { json: family } : { status: 204 },
    '/api/auth/me': {
      json: {
        id: '01a181d1-df7b-7855-98c6-a2e2bc4c26bb',
        displayName: 'Olena',
        email: 'olena@example.com',
        isAdmin: false,
      },
    },
    '/api/health': { json: { status: 'Healthy' } },
  };
}

/** The months of this year so far, for the stories' text. */
export const THIS_MONTH = dayjs(today()).format('YYYY-MM');
