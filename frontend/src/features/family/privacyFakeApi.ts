import type { Account, AccountsOverview, AccountsTotal } from '../accounts/accountsApi';
import { OVERVIEW, TOTAL } from '../accounts/accountsTestData';
import type { CategoriesOverview } from '../categories/categoriesApi';
import { DEFAULT_CATEGORIES } from '../categories/categoriesTestData';
import { fakePage, fakeSummary } from '../transactions/transactionsFakeApi';
import type { Transaction } from '../transactions/transactionsApi';
import type { MockAnswer, MockRoutes } from '../../test/mockRoutes';
import type { Family } from './familyApi';
import { fakeFamilyRoutes } from './familyFakeApi';
import { ANDRIY_ID } from './familyTestData';
import { familyViewsRoutes } from './familyViewsFakeApi';
import { PRIVATE_ACCOUNT_ID } from './privacy';
import type { AccountShare, TransactionShare } from './privacyApi';

/**
 * What someone keeps from the rest of the family (F-030): accounts not shared in full, private categories and whole
 * groups.
 */
export interface Kept {
  transactions: TransactionShare;
  accounts: Record<string, AccountShare>;
  categories: string[];
  groups?: string[];
}

export const NOTHING_KEPT: Kept = { transactions: 'Every', accounts: {}, categories: [] };

/** Olena's start in the stories: her dollars at home hidden, her Privat card balance only, Gifts private. */
export const OLENA_KEEPS: Kept = {
  transactions: 'Every',
  accounts: { 'cash-usd': 'Hidden', privat: 'BalanceOnly' },
  categories: ['group-2-6'],
};

/** Andriy's (F-024's fake money): his dollars in the box hidden, his pocket cash balance only, Gifts private. */
export const ANDRIY_KEEPS: Kept = {
  transactions: 'Every',
  accounts: { 'a-usd': 'Hidden', 'a-cash': 'BalanceOnly' },
  categories: ['group-2-6'],
};

const keepsAny = (kept: Kept) =>
  kept.transactions === 'Totals' ||
  Object.keys(kept.accounts).length > 0 ||
  kept.categories.length > 0 ||
  (kept.groups ?? []).length > 0;

const shareOf = (kept: Kept, accountId: string | null | undefined): AccountShare =>
  (accountId ? kept.accounts[accountId] : undefined) ?? 'Everything';

function json(answer: MockAnswer): unknown {
  return typeof answer === 'object' && 'json' in answer ? answer.json : undefined;
}

type Handler = (
  body: unknown,
  query: URLSearchParams,
  params: Record<string, string>,
) => MockAnswer;

/**
 * Olena's own accounts and categories with what she keeps from the family, and the three changes of the Family
 * page's "What the family sees", kept while the story or test runs. `family()` gives the family as the API sends it:
 * her row says what she shares now.
 */
export function fakePrivacyRoutes(
  start: Kept,
  { fail = false, accounts = OVERVIEW, categories = DEFAULT_CATEGORIES } = {},
) {
  const kept: Kept = structuredClone(start);
  const own = (): AccountsOverview => ({
    ...accounts,
    accounts: accounts.accounts.map((item) => ({ ...item, familySees: shareOf(kept, item.id) })),
    archived: accounts.archived.map((item) => ({ ...item, familySees: shareOf(kept, item.id) })),
  });
  const ownCategories = (): CategoriesOverview => ({
    groups: categories.groups.map((group) => ({
      ...group,
      isPrivate: (kept.groups ?? []).includes(group.id),
      categories: group.categories.map((category) => ({
        ...category,
        isPrivate: kept.categories.includes(category.id),
      })),
    })),
  });
  const withMine = (family: Family): Family => ({
    ...family,
    members: family.members.map((member) =>
      member.isYou
        ? { ...member, transactions: kept.transactions, keepsPrivate: keepsAny(kept) }
        : member,
    ),
  });

  const routes: MockRoutes = {
    '/api/accounts': () => ({ json: own() }),
    '/api/categories': () => ({ json: ownCategories() }),
    'PUT /api/family/privacy/transactions': (body) => {
      if (fail) return { status: 500 };
      kept.transactions = (body as { share: TransactionShare }).share;
      return { status: 204 };
    },
    'PUT /api/family/privacy/accounts/{id}': (body, _query, { id = '' }) => {
      if (fail) return { status: 500 };
      const { share } = body as { share: AccountShare };
      const others = Object.entries(kept.accounts).filter(([account]) => account !== id);
      kept.accounts = Object.fromEntries(
        share === 'Everything' ? others : [...others, [id, share]],
      );
      return { status: 204 };
    },
    'PUT /api/family/privacy/groups/{id}': (body, _query, { id = '' }) => {
      if (fail) return { status: 500 };
      const { isPrivate } = body as { isPrivate: boolean };
      kept.groups = (kept.groups ?? []).filter((item) => item !== id);
      if (isPrivate) kept.groups.push(id);
      return { status: 204 };
    },
    'PUT /api/family/privacy/categories/{id}': (body, _query, { id = '' }) => {
      if (fail) return { status: 500 };
      const { isPrivate } = body as { isPrivate: boolean };
      kept.categories = kept.categories.filter((item) => item !== id);
      if (isPrivate) kept.categories.push(id);
      return { status: 204 };
    },
  };
  return { routes, own, withMine };
}

const RATE: Record<string, number> = {
  UAH: 1,
  ...Object.fromEntries(TOTAL.rates.map((item) => [item.currency, item.rate])),
};

/**
 * F-030's stories: F-024's money of Olena, Andriy and Iryna, F-023's family, Olena's settings that change on the Family
 * page, and Andriy's (`andriy`, fixed) as the API applies them to what Olena sees:
 * - his hidden account is gone, with its balance from the totals;
 * - a transfer between a hidden and a shared account shows on the shared side, to or from "A private account";
 * - his lines on a balance-only account aren't listed but count in the totals by category;
 * - his lines in a private category are gone, from the totals too;
 * - with "only totals by category" none of his lines are listed, and the calendar's days leave him out.
 * The reports are F-024's fake ones, not worked out again.
 */
export function familyPrivacyRoutes(family: Family, olena: Kept, andriy: Kept): MockRoutes {
  const views = familyViewsRoutes(family);
  const familyApi = fakeFamilyRoutes(family);
  const privacy = fakePrivacyRoutes(olena);
  const call = (path: string) => views[path] as Handler;

  const his = (item: { ownerId: string }) => item.ownerId === ANDRIY_ID;
  const level = (accountId: string | null | undefined) => shareOf(andriy, accountId);
  const hiddenAccount = (account: Account) => his(account) && level(account.id) === 'Hidden';
  const asSeen = (account: Account): Account =>
    his(account) ? { ...account, familySees: level(account.id) } : account;

  /** His transfer with one side hidden: the other side's line, the hidden one "A private account". */
  const withPrivateSide = (item: Transaction): Transaction => {
    if (!his(item) || item.type !== 'Transfer') return item;
    if (level(item.toAccountId) === 'Hidden')
      return {
        ...item,
        toAccountId: PRIVATE_ACCOUNT_ID,
        toAccountName: '',
        toCurrency: item.currency,
        toAmount: item.amount,
      };
    if (level(item.accountId) === 'Hidden')
      return {
        ...item,
        accountId: PRIVATE_ACCOUNT_ID,
        accountName: '',
        currency: item.toCurrency ?? item.currency,
        amount: item.toAmount ?? item.amount,
      };
    return item;
  };
  /** Counts in the totals Olena sees. */
  const counted = (item: Transaction) => {
    if (!his(item)) return true;
    if (item.categoryId && andriy.categories.includes(item.categoryId)) return false;
    if (item.type === 'Transfer')
      return level(item.accountId) !== 'Hidden' || level(item.toAccountId) !== 'Hidden';
    return level(item.accountId) !== 'Hidden';
  };
  /** Listed on Olena's Transactions page. */
  const listed = (item: Transaction) => {
    if (!his(item)) return true;
    if (andriy.transactions === 'Totals') return false;
    return level(item.accountId) !== 'BalanceOnly' && level(item.toAccountId) !== 'BalanceOnly';
  };
  const isMine = (query: URLSearchParams) => !query.get('who') || query.get('who') === 'me';

  const allLines = (query: URLSearchParams): Transaction[] => {
    const every = new URLSearchParams(query);
    every.delete('offset');
    every.delete('categoryId');
    every.set('limit', '1000000');
    const page = json(call('/api/transactions')(undefined, every, {})) as
      { items: Transaction[] } | undefined;
    return (page?.items ?? []).filter(counted).map(withPrivateSide);
  };
  const theirAccounts = (query: URLSearchParams): AccountsOverview | undefined => {
    const overview = json(call('/api/accounts')(undefined, query, {})) as
      AccountsOverview | undefined;
    if (!overview) return undefined;
    // Olena's own as she keeps them now
    const mine = new Map(privacy.own().accounts.map((item) => [item.id, item.familySees]));
    const accounts = overview.accounts
      .filter((account) => !hiddenAccount(account))
      .map(asSeen)
      .map((account) => ({ ...account, familySees: mine.get(account.id) ?? account.familySees }));
    const currencies = [...new Set(accounts.map((account) => account.currency))];
    return {
      ...overview,
      accounts,
      totals: currencies.map((currency) => {
        const inIt = accounts.filter((account) => account.currency === currency);
        return {
          currency,
          accounts: inIt.length,
          total: inIt.reduce((sum, account) => sum + account.balance, 0),
        };
      }),
    };
  };

  return {
    ...views,
    ...familyApi,
    ...privacy.routes,
    '/api/family': (body, query, params) => {
      const answer = (familyApi['/api/family'] as Handler)(body, query, params);
      const found = json(answer) as Family | undefined;
      if (!found) return answer;
      const withAndriy = {
        ...found,
        members: found.members.map((member) =>
          member.id === ANDRIY_ID
            ? { ...member, transactions: andriy.transactions, keepsPrivate: keepsAny(andriy) }
            : member,
        ),
      };
      return { json: privacy.withMine(withAndriy) };
    },
    '/api/accounts': (body, query, params) => {
      if (isMine(query)) return (privacy.routes['/api/accounts'] as Handler)(body, query, params);
      const overview = theirAccounts(query);
      return overview ? { json: overview } : { status: 500 };
    },
    '/api/accounts/total': (body, query, params) => {
      const total = json(call('/api/accounts/total')(body, query, params)) as
        AccountsTotal | undefined;
      const overview = json(call('/api/accounts')(body, query, params)) as
        AccountsOverview | undefined;
      if (!total || !overview) return { status: 500 };
      const gone = overview.accounts
        .filter(hiddenAccount)
        .reduce((sum, account) => sum + account.balance * (RATE[account.currency] ?? 1), 0);
      const left = new Set(
        overview.accounts
          .filter((account) => !hiddenAccount(account))
          .map((account) => account.currency),
      );
      return {
        json: {
          ...total,
          total: (total.total ?? 0) - gone,
          rates: total.rates.filter((rate) => left.has(rate.currency)),
        },
      };
    },
    '/api/transactions': (_body, query) => ({
      json: fakePage(allLines(query).filter(listed), query),
    }),
    '/api/transactions/summary': (_body, query) => {
      const lines = allLines(query);
      const totals = fakeSummary(lines, query);
      const shown = fakeSummary(lines.filter(listed), query);
      return { json: { ...totals, days: shown.days, count: shown.count } };
    },
  };
}
