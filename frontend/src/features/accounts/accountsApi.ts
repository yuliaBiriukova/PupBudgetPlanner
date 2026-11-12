import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';

type Schemas = components['schemas'];

export type SourceKind = Schemas['SourceKind'];
export type CardStyle = Schemas['CardStyle'];
export type SaveAccountRequest = Omit<Schemas['SaveAccountRequest'], 'openingBalance'> & {
  openingBalance: number;
};

/** An account as the page uses it; the API may send its amounts as text (they are decimals there). */
export type Account = Omit<
  Schemas['AccountItem'],
  'openingBalance' | 'balance' | 'transactionCount'
> & {
  openingBalance: number;
  balance: number;
  /** An account with transactions can't be deleted or change its currency (I-011, F-018). */
  transactionCount: number;
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
  transactionCount: Number(item.transactionCount),
});

/**
 * The Accounts page: accounts, archived ones, totals per currency and what the form offers (F-014); someone else's or
 * the family's to look at with `who` (F-024: a member's id or `family`; none for your own). Every key starts with
 * the accounts', so a change to an account or a transaction fetches them all again; while another person's load, the
 * last ones stay on screen.
 */
export const accountsQueryOf = (who?: string) =>
  queryOptions({
    queryKey: who ? ['accounts', { who }] : ['accounts'],
    queryFn: async ({ signal }): Promise<AccountsOverview> => {
      const { data, response } = await apiClient.GET('/api/accounts', {
        params: { query: { who } },
        signal,
      });
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
    placeholderData: who ? keepPreviousData : undefined,
  });

/** Your own accounts: the page, the quick-add form, Settings (F-014). */
export const accountsQuery = accountsQueryOf();

export type RatesStatus = Schemas['RatesStatus'];
/** One NBU rate: hryvnias for one unit of the currency, as the NBU publishes it (F-016). */
export type RateItem = Omit<Schemas['RateItem'], 'rate'> & { rate: number };

/** "In total, in UAH" (F-017); `total` is null when there are no rates for it (`Missing`). */
export type AccountsTotal = Omit<Schemas['AccountsTotal'], 'total' | 'rates'> & {
  total: number | null;
  rates: RateItem[];
};

/**
 * The accounts together in the report currency at today's NBU rates (F-017). Its own request, so the page doesn't
 * wait for the NBU; its key starts with the accounts', so every change to an account fetches it again too.
 */
export const accountsTotalQueryOf = (who?: string) =>
  queryOptions({
    queryKey: who ? ['accounts', 'total', { who }] : ['accounts', 'total'],
    queryFn: async ({ signal }): Promise<AccountsTotal> => {
      const { data, response } = await apiClient.GET('/api/accounts/total', {
        params: { query: { who } },
        signal,
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't load the total: ${String(response.status)}`);
      return {
        ...data,
        total: data.total === null ? null : Number(data.total),
        rates: data.rates.map((item) => ({ ...item, rate: Number(item.rate) })),
      };
    },
    placeholderData: who ? keepPreviousData : undefined,
  });

/** Your own accounts' total. */
export const accountsTotalQuery = accountsTotalQueryOf();

/**
 * The API found that the account would look just like another one in use (I-020): a mistake in its name when it is
 * saved, a conflict when it is restored.
 */
export class AccountCopyError extends Error {
  constructor() {
    super('You already have this account.');
    this.name = 'AccountCopyError';
  }
}

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
      const { data, error, response } = id
        ? await apiClient.PUT('/api/accounts/{id}', { params: { path: { id } }, body })
        : await apiClient.POST('/api/accounts', { body });
      // The form checks it first; this is a copy saved meanwhile (another tab, two saves at once)
      if (response.status === 400 && hasNameError(error)) throw new AccountCopyError();
      if (!response.ok || !data)
        throw new Error(`Couldn't save the account: ${String(response.status)}`);
      return toAccount(data);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: accountsQuery.queryKey }),
  });
}

/** A 400 from the API with a mistake in the name: the form's other mistakes are found before it is sent. */
function hasNameError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('errors' in error)) return false;
  const { errors } = error;
  return typeof errors === 'object' && errors !== null && 'name' in errors;
}

/** Archives an account, or brings an archived one back (not when an account in use is just like it, I-020). */
export function useArchiveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restore }: { id: string; restore?: boolean }) => {
      const params = { path: { id } };
      const { response } = restore
        ? await apiClient.POST('/api/accounts/{id}/restore', { params })
        : await apiClient.POST('/api/accounts/{id}/archive', { params });
      if (restore && response.status === 409) throw new AccountCopyError();
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
