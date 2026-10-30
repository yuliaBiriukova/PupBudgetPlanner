import type { Account, AccountsOverview } from './accountsApi';

export type GroupBy = 'currency' | 'source';

/** What a group is, and so what its add card fills in on the form. */
export type GroupKey =
  | { by: 'currency'; currency: string; total: number }
  | { by: 'cash' }
  | { by: 'bank'; bank: string }
  | { by: 'own'; sourceId: string; name: string };

export interface AccountGroup {
  id: string;
  key: GroupKey;
  accounts: Account[];
}

/**
 * The groups on the page (F-014). By currency: in the totals' order (the hryvnia first, then the most used), each
 * with its total. By source: cash, then each bank A to Z, then the person's own sources. Empty groups are left out.
 */
export function groupAccounts(overview: AccountsOverview, groupBy: GroupBy): AccountGroup[] {
  const { accounts } = overview;
  if (groupBy === 'currency') {
    return overview.totals.map((total) => ({
      id: `currency:${total.currency}`,
      key: { by: 'currency', currency: total.currency, total: total.total },
      accounts: accounts.filter((a) => a.currency === total.currency),
    }));
  }

  const groups: AccountGroup[] = [
    { id: 'cash', key: { by: 'cash' }, accounts: accounts.filter((a) => a.source === 'Cash') },
  ];
  const banks = [
    ...new Set(accounts.flatMap((a) => (a.source === 'Bank' && a.bankName ? [a.bankName] : []))),
  ];
  banks.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  for (const bank of banks) {
    groups.push({
      id: `bank:${bank}`,
      key: { by: 'bank', bank },
      accounts: accounts.filter((a) => a.source === 'Bank' && a.bankName === bank),
    });
  }
  for (const source of overview.sources) {
    groups.push({
      id: `own:${source.id}`,
      key: { by: 'own', sourceId: source.id, name: source.name },
      accounts: accounts.filter((a) => a.source === 'Own' && a.sourceId === source.id),
    });
  }
  return groups.filter((g) => g.accounts.length > 0);
}

/** The person's currencies, the ones of their archived accounts too: the hryvnia first, then by code. */
export function yourCurrencies(overview: AccountsOverview): string[] {
  const codes = [...new Set([...overview.accounts, ...overview.archived].map((a) => a.currency))];
  return codes.sort((a, b) => (a === 'UAH' ? -1 : b === 'UAH' ? 1 : a.localeCompare(b)));
}

/** Where the group switch is kept: the choice is remembered in this browser. */
const GROUP_BY_KEY = 'pup.accounts.groupBy';

export function readGroupBy(): GroupBy {
  try {
    return localStorage.getItem(GROUP_BY_KEY) === 'source' ? 'source' : 'currency';
  } catch {
    return 'currency';
  }
}

export function writeGroupBy(groupBy: GroupBy) {
  try {
    localStorage.setItem(GROUP_BY_KEY, groupBy);
  } catch {
    // Private windows may refuse storage; the page then starts grouped by currency
  }
}
