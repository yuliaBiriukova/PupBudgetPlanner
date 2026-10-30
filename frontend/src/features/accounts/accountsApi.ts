import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';

type Schemas = components['schemas'];

export type SourceKind = Schemas['SourceKind'];
export type CardStyle = Schemas['CardStyle'];
export type SaveAccountRequest = Omit<Schemas['SaveAccountRequest'], 'openingBalance'> & {
  openingBalance: number;
};

/** An account as the page uses it; the API may send its amounts as text (they are decimals there). */
export type Account = Omit<Schemas['AccountItem'], 'openingBalance' | 'balance'> & {
  openingBalance: number;
  balance: number;
};

export type CurrencyTotal = Omit<Schemas['CurrencyTotal'], 'accounts' | 'total'> & {
  accounts: number;
  total: number;
};

export type AccountsOverview = Omit<
  Schemas['AccountsOverview'],
  'accounts' | 'archived' | 'totals'
> & {
  accounts: Account[];
  archived: Account[];
  totals: CurrencyTotal[];
};

export const CARD_STYLES: readonly CardStyle[] = ['Solid', 'Tinted', 'Envelope', 'Plain'];

/** A new account's card style until one is picked: a bank card is solid, cash an envelope (as in the API). */
export function defaultStyle(source: SourceKind): CardStyle {
  return source === 'Bank' ? 'Solid' : source === 'Cash' ? 'Envelope' : 'Plain';
}

const toAccount = (item: Schemas['AccountItem']): Account => ({
  ...item,
  openingBalance: Number(item.openingBalance),
  balance: Number(item.balance),
});

/** The Accounts page: accounts, archived ones, totals per currency and what the form offers (F-014). */
export const accountsQuery = queryOptions({
  queryKey: ['accounts'],
  queryFn: async ({ signal }): Promise<AccountsOverview> => {
    const { data, response } = await apiClient.GET('/api/accounts', { signal });
    if (!response.ok || !data)
      throw new Error(`Couldn't load accounts: ${String(response.status)}`);
    return {
      ...data,
      accounts: data.accounts.map(toAccount),
      archived: data.archived.map(toAccount),
      totals: data.totals.map((total) => ({
        ...total,
        accounts: Number(total.accounts),
        total: Number(total.total),
      })),
    };
  },
});

/** Adds an account (no `id`) or saves the edited one; the page is fetched again afterwards. */
export function useSaveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id?: string;
      body: SaveAccountRequest;
    }): Promise<Account> => {
      const { data, response } = id
        ? await apiClient.PUT('/api/accounts/{id}', { params: { path: { id } }, body })
        : await apiClient.POST('/api/accounts', { body });
      if (!response.ok || !data)
        throw new Error(`Couldn't save the account: ${String(response.status)}`);
      return toAccount(data);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: accountsQuery.queryKey }),
  });
}

/** Archives an account, or brings an archived one back. */
export function useArchiveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restore }: { id: string; restore?: boolean }) => {
      const params = { path: { id } };
      const { response } = restore
        ? await apiClient.POST('/api/accounts/{id}/restore', { params })
        : await apiClient.POST('/api/accounts/{id}/archive', { params });
      if (!response.ok) throw new Error(`Couldn't change the account: ${String(response.status)}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: accountsQuery.queryKey }),
  });
}

/** Deletes an account for good (I-011); the person's own sources and banks stay. */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { response } = await apiClient.DELETE('/api/accounts/{id}', {
        params: { path: { id } },
      });
      if (!response.ok) throw new Error(`Couldn't delete the account: ${String(response.status)}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: accountsQuery.queryKey }),
  });
}
