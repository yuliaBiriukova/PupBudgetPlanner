import { account, OVERVIEW, TOTAL } from '../accounts/accountsTestData';
import type { Account, AccountsOverview, AccountsTotal } from '../accounts/accountsApi';
import { DEFAULT_CATEGORIES } from '../categories/categoriesTestData';
import { fakeMonthReport, fakeYearReport } from '../reports/reportsTestData';
import { today } from '../transactions/days';
import { SUGGESTIONS } from '../transactions/transactionsTestData';
import { fakePage, fakeSummary, twoMonths } from '../transactions/transactionsFakeApi';
import type { Transaction } from '../transactions/transactionsApi';
import type { MockRoutes } from '../../test/mockRoutes';
import type { Family } from './familyApi';
import { ANDRIY_ID, IRYNA_ID, OLENA_ID, ownersFamily } from './familyTestData';
import { FAMILY, ME } from './whose';

/**
 * F-024's stories: Olena (the signed-in person), Andriy and Iryna, each with their own accounts, transactions and
 * year, and the family's as everyone's together. The fake API answers each request for its `who` (none: Olena's).
 */

export type FamilyChoice = 'Couple' | 'Three people' | 'No family';

export function familyOf(choice: FamilyChoice): Family | null {
  if (choice === 'No family') return null;
  const family = ownersFamily();
  return {
    ...family,
    members: choice === 'Couple' ? family.members.slice(0, 2) : family.members,
  };
}

const bank = (name: string, style: Account['cardStyle'] = 'Solid') =>
  ({ source: 'Bank', bankId: `b-${name}`, bankName: name, cardStyle: style }) as const;
const money = (balance: number) => ({ balance, openingBalance: balance, transactionCount: 9 });

const ACCOUNTS: Record<string, Account[]> = {
  [OLENA_ID]: OVERVIEW.accounts.map((item) => ({ ...item, transactionCount: 12 })),
  [ANDRIY_ID]: [
    account('a-mono', 'Mono white', { ...bank('Monobank', 'Tinted'), ...money(21560) }),
    account('a-privat', 'Salary card', { ...bank('PrivatBank'), ...money(37980) }),
    account('a-cash', 'Pocket', { ...money(1240), cardStyle: 'Envelope' }),
    account('a-usd', 'Dollars in the box', { ...money(900), currency: 'USD', cardStyle: 'Plain' }),
  ].map((item) => ({ ...item, ownerId: ANDRIY_ID })),
  [IRYNA_ID]: [
    account('i-mono', 'Mono black', { ...bank('Monobank'), ...money(8420) }),
    account('i-cash', 'Cash', { ...money(2100), cardStyle: 'Envelope' }),
  ].map((item) => ({ ...item, ownerId: IRYNA_ID })),
};

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
function theirs(ownerId: string, every: number, share: number, prefix: string): Transaction[] {
  const own = ACCOUNTS[ownerId] ?? [];
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
        ownerId,
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
  [OLENA_ID]: twoMonths(),
  [ANDRIY_ID]: theirs(ANDRIY_ID, 2, 0.8, 'a-'),
  [IRYNA_ID]: theirs(IRYNA_ID, 5, 0.6, 'i-'),
};

/** How big each person's year is next to Olena's. */
const YEAR_SHARE: Record<string, number> = { [OLENA_ID]: 1, [ANDRIY_ID]: 0.62, [IRYNA_ID]: 0.35 };

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

/** The fake API of the stories: each request answers for its `who` (none: Olena's own). */
export function familyViewsRoutes(family: Family | null): MockRoutes {
  const ids = (family?.members ?? []).map((member) => member.id);
  /** Whose money a request asks for: the people's ids, Olena's first. */
  const peopleOf = (query: URLSearchParams): string[] => {
    const who = query.get('who') ?? ME;
    if (who === FAMILY && ids.length > 0) return ids;
    return [ids.includes(who) ? who : OLENA_ID];
  };
  const accountsOf = (people: string[]) =>
    overviewOf(
      people.flatMap((id) => ACCOUNTS[id] ?? []),
      people.includes(OLENA_ID) ? OVERVIEW.archived : [],
    );
  const itemsOf = (people: string[]) =>
    people
      .flatMap((id) => TRANSACTIONS[id] ?? [])
      .map((item, index) => ({ item, index }))
      .sort((a, b) => b.item.date.localeCompare(a.item.date) || a.index - b.index)
      .map(({ item }) => item);
  const shareOf = (people: string[]) =>
    people.reduce((sum, id) => sum + (YEAR_SHARE[id] ?? 0.5), 0);

  return {
    '/api/accounts': (_, query) => ({ json: accountsOf(peopleOf(query)) }),
    '/api/accounts/total': (_, query) => ({ json: totalOf(accountsOf(peopleOf(query))) }),
    '/api/transactions': (_, query) => ({ json: fakePage(itemsOf(peopleOf(query)), query) }),
    '/api/transactions/summary': (_, query) => ({
      json: fakeSummary(itemsOf(peopleOf(query)), query),
    }),
    '/api/transactions/suggestions': { json: SUGGESTIONS },
    '/api/transactions/notes': { json: [] },
    '/api/categories': { json: DEFAULT_CATEGORIES },
    '/api/reports/year': (_, query) => ({
      json: scaled(fakeYearReport(Number(query.get('year')), today()), shareOf(peopleOf(query))),
    }),
    '/api/reports/month': (_, query) => ({
      json: scaled(fakeMonthReport(query.get('month') ?? '', today()), shareOf(peopleOf(query))),
    }),
    '/api/settings': {
      json: { displayName: 'Olena', email: 'olena@example.com', reportCurrency: 'UAH' },
    },
    '/api/family': family ? { json: family } : { status: 204 },
    '/api/auth/me': {
      json: { id: OLENA_ID, displayName: 'Olena', email: 'olena@example.com', isAdmin: false },
    },
    '/api/health': { json: { status: 'Healthy' } },
  };
}
