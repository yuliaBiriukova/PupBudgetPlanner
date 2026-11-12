import type { Account, AccountsOverview, AccountsTotal } from '../../features/accounts/accountsApi';
import { TOTAL } from '../../features/accounts/accountsTestData';
import type { Family } from '../../features/family/familyApi';
import { fakeFamilyRoutes } from '../../features/family/familyFakeApi';
import { ANDRIY_ID } from '../../features/family/familyTestData';
import { familyViewsRoutes } from '../../features/family/familyViewsFakeApi';
import { fakePage, fakeSummary } from '../../features/transactions/transactionsFakeApi';
import type { Transaction } from '../../features/transactions/transactionsApi';
import type { MockAnswer, MockRoutes } from '../../test/mockRoutes';
import { levelOf, type Privacy } from './privacy';

type Handler = (
  body: unknown,
  query: URLSearchParams,
  params: Record<string, string>,
) => MockAnswer;

const RATE: Record<string, number> = {
  UAH: 1,
  ...Object.fromEntries(TOTAL.rates.map((item) => [item.currency, item.rate])),
};

function json(answer: MockAnswer): unknown {
  return typeof answer === 'object' && 'json' in answer ? answer.json : undefined;
}

/**
 * F-030's fake API: F-024's money of Olena, Andriy and Iryna, F-023's family, and Andriy's privacy (`andriy`, fixed
 * in a story) as the API would apply it to what Olena sees:
 * - his hidden account is gone, with its balance from the totals;
 * - a transfer between a hidden and a shared account shows on the shared side, to or from "A private account";
 * - his lines on a balance-only account aren't listed but count in the totals by category;
 * - his lines in a private category are gone, from the totals too;
 * - with "only totals by category" none of his lines are listed, and the calendar's days leave him out.
 * The reports are F-024's fake ones, not recalculated.
 */
export function privacyRoutes(family: Family, andriy: Privacy): MockRoutes {
  const views = familyViewsRoutes(family);
  const familyApi = fakeFamilyRoutes(family);
  const call = (path: string) => views[path] as Handler;

  const his = (item: { ownerId: string }) => item.ownerId === ANDRIY_ID;
  const level = (accountId: string | null | undefined) =>
    accountId ? levelOf(andriy, accountId) : 'Everything';
  const hiddenAccount = (account: Account) => his(account) && level(account.id) === 'Hidden';

  /** His transfer with one side hidden: the other side's line, the hidden one named "A private account". */
  const withPrivateSide = (item: Transaction): Transaction => {
    if (!his(item) || item.type !== 'Transfer') return item;
    if (level(item.toAccountId) === 'Hidden')
      return { ...item, toAccountId: 'private', toAccountName: 'A private account' };
    if (level(item.accountId) === 'Hidden')
      return { ...item, accountId: 'private', accountName: 'A private account' };
    return item;
  };
  /** Counts in the totals Olena sees. */
  const counted = (item: Transaction) => {
    if (!his(item)) return true;
    if (item.type === 'Transfer')
      return level(item.accountId) !== 'Hidden' || level(item.toAccountId) !== 'Hidden';
    return (
      level(item.accountId) !== 'Hidden' &&
      !(item.categoryId && andriy.categories.includes(item.categoryId))
    );
  };
  /** Listed on Olena's Transactions page. */
  const listed = (item: Transaction) => {
    if (!counted(item)) return false;
    if (!his(item)) return true;
    if (andriy.lines === 'Totals') return false;
    const sides = [item.accountId, item.toAccountId].filter(
      (id): id is string => !!id && id !== 'private',
    );
    return sides.every((id) => level(id) === 'Everything');
  };

  const allLines = (query: URLSearchParams): Transaction[] => {
    const every = new URLSearchParams(query);
    every.delete('offset');
    every.delete('categoryId');
    every.set('limit', '1000000');
    const page = json(call('/api/transactions')(undefined, every, {})) as
      { items: Transaction[] } | undefined;
    return (page?.items ?? []).filter(counted).map(withPrivateSide);
  };

  return {
    ...views,
    ...familyApi,
    '/api/accounts': (body, query, params) => {
      const overview = json(call('/api/accounts')(body, query, params)) as
        AccountsOverview | undefined;
      if (!overview) return { status: 500 };
      const accounts = overview.accounts.filter((account) => !hiddenAccount(account));
      const currencies = [...new Set(accounts.map((account) => account.currency))];
      return {
        json: {
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
        },
      };
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
