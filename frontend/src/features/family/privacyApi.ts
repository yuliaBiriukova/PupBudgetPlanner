import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';
import { accountsQuery, type AccountsOverview } from '../accounts/accountsApi';
import { categoriesQuery, type CategoriesOverview } from '../categories/categoriesApi';
import { reportsKey } from '../reports/reportsApi';
import { familyQuery, type Family } from './familyApi';

/** What the other members see of one of your accounts (F-030); a new account is `Everything`. */
export type AccountShare = components['schemas']['AccountShare'];

/** What the other members see of your transactions: every one, or only the totals by category. */
export type TransactionShare = components['schemas']['TransactionShare'];

export class PrivacyError extends Error {
  constructor(status: number) {
    super(`Couldn't change what the family sees: ${String(status)}`);
    this.name = 'PrivacyError';
  }
}

function check(response: Response) {
  if (!response.ok) throw new PrivacyError(response.status);
}

/**
 * A change to what the family sees (F-030): shown at once (`show`), sent, and every page that shows money fetched
 * again afterwards, whatever came of it. A failed one goes back to what the server has.
 */
function usePrivacyChange<T>(
  send: (value: T) => Promise<void>,
  show: (queryClient: QueryClient, value: T) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: send,
    onMutate: async (value) => {
      await Promise.all(
        [familyQuery, accountsQuery, categoriesQuery].map(({ queryKey }) =>
          queryClient.cancelQueries({ queryKey, exact: true }),
        ),
      );
      show(queryClient, value);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: familyQuery.queryKey }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: categoriesQuery.queryKey }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: reportsKey }),
      ]),
  });
}

/** Your own member row with what you share now, and whether you keep anything. */
function withMine(
  family: Family | null | undefined,
  change: (me: Family['members'][number]) => Partial<Family['members'][number]>,
) {
  if (!family) return family;
  return {
    ...family,
    members: family.members.map((member) =>
      member.isYou ? { ...member, ...change(member) } : member,
    ),
  };
}

export function useShareTransactions() {
  return usePrivacyChange(
    async (share: TransactionShare) => {
      const { response } = await apiClient.PUT('/api/family/privacy/transactions', {
        body: { share },
      });
      check(response);
    },
    (queryClient, share) => {
      queryClient.setQueryData(familyQuery.queryKey, (family) =>
        withMine(family, (me) => ({
          transactions: share,
          keepsPrivate: share === 'Totals' || me.keepsPrivate,
        })),
      );
    },
  );
}

export function useShareAccount() {
  return usePrivacyChange(
    async ({ accountId, share }: { accountId: string; share: AccountShare }) => {
      const { response } = await apiClient.PUT('/api/family/privacy/accounts/{id}', {
        params: { path: { id: accountId } },
        body: { share },
      });
      check(response);
    },
    (queryClient, { accountId, share }) => {
      queryClient.setQueryData<AccountsOverview>(accountsQuery.queryKey, (overview) =>
        overview
          ? {
              ...overview,
              accounts: overview.accounts.map((account) =>
                account.id === accountId ? { ...account, familySees: share } : account,
              ),
            }
          : overview,
      );
    },
  );
}

export function useKeepCategory() {
  return usePrivacyChange(
    async ({ categoryId, isPrivate }: { categoryId: string; isPrivate: boolean }) => {
      const { response } = await apiClient.PUT('/api/family/privacy/categories/{id}', {
        params: { path: { id: categoryId } },
        body: { isPrivate },
      });
      check(response);
    },
    (queryClient, { categoryId, isPrivate }) => {
      queryClient.setQueryData<CategoriesOverview>(categoriesQuery.queryKey, (overview) =>
        overview
          ? {
              ...overview,
              groups: overview.groups.map((group) => ({
                ...group,
                categories: group.categories.map((category) =>
                  category.id === categoryId ? { ...category, isPrivate } : category,
                ),
              })),
            }
          : overview,
      );
    },
  );
}

/** A whole group of yours, its categories added later too (owner, 2026-11-12). */
export function useKeepGroup() {
  return usePrivacyChange(
    async ({ groupId, isPrivate }: { groupId: string; isPrivate: boolean }) => {
      const { response } = await apiClient.PUT('/api/family/privacy/groups/{id}', {
        params: { path: { id: groupId } },
        body: { isPrivate },
      });
      check(response);
    },
    (queryClient, { groupId, isPrivate }) => {
      queryClient.setQueryData<CategoriesOverview>(categoriesQuery.queryKey, (overview) =>
        overview
          ? {
              ...overview,
              groups: overview.groups.map((group) =>
                group.id === groupId ? { ...group, isPrivate } : group,
              ),
            }
          : overview,
      );
    },
  );
}
