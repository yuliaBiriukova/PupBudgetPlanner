import { useQuery } from '@tanstack/react-query';
import { accountsQuery, type Account } from '../../features/accounts/accountsApi';
import { categoriesQuery, type CategoryGroup } from '../../features/categories/categoriesApi';

export const ICON = { size: 20, stroke: 1.7 } as const;

/** Your own accounts in use and your categories, as the Accounts and Categories pages have them. */
export function useOwnMoney(): { accounts: Account[]; groups: CategoryGroup[] } {
  const accounts = useQuery(accountsQuery);
  const categories = useQuery(categoriesQuery);
  return {
    accounts: accounts.data?.accounts ?? [],
    groups: (categories.data?.groups ?? []).filter((group) => !group.isHidden),
  };
}

/** Where an account's money is: its bank, its own source, or Cash. */
export function whereOf(account: Account): string {
  return account.bankName ?? account.sourceName ?? 'Cash';
}
