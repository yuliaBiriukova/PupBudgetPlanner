import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';
import { accountsQuery } from '../accounts/accountsApi';

type Schemas = components['schemas'];

export type TransactionType = Schemas['TransactionType'];
export type TransactionSuggestions = Schemas['TransactionSuggestions'];

/**
 * A transaction as the pages use it; the API may send its amounts as text (decimals there). A transfer (F-019) has its
 * To account and what it got (`toAmount`), and no category.
 */
export type Transaction = Omit<Schemas['TransactionItem'], 'amount' | 'toAmount'> & {
  amount: number;
  toAmount?: number | null;
};

export type SaveTransactionRequest = Omit<
  Schemas['SaveTransactionRequest'],
  'amount' | 'toAmount'
> & {
  amount: number;
  toAmount?: number | null;
};

/** One day's NBU rates (F-017): hryvnias for one unit of each currency, by code; why when they are earlier. */
export interface DayRates {
  /** `YYYY-MM-DD`: the day they are of; empty when there are none. */
  date: string | null;
  status: Schemas['RatesStatus'];
  /** Hryvnias for one unit, by code; the hryvnia itself isn't listed. */
  rates: Record<string, number>;
}

/** An account's balance before and after a save or a delete: the notification counts from one to the other. */
export interface BalanceChange {
  accountId: string;
  before: number;
  after: number;
}

export interface SavedTransaction {
  transaction: Transaction;
  balances: BalanceChange[];
}

const toTransaction = (item: Schemas['TransactionItem']): Transaction => ({
  ...item,
  amount: Number(item.amount),
  toAmount: item.toAmount == null ? null : Number(item.toAmount),
});

/** Whether it is a transfer between two currencies: an exchange (F-019). */
export function isExchange(transaction: Pick<Transaction, 'type' | 'currency' | 'toCurrency'>) {
  return (
    transaction.type === 'Transfer' &&
    !!transaction.toCurrency &&
    transaction.toCurrency !== transaction.currency
  );
}

const toChanges = (balances: Schemas['BalanceChange'][]): BalanceChange[] =>
  balances.map((change) => ({
    accountId: change.accountId,
    before: Number(change.before),
    after: Number(change.after),
  }));

const transactionsKey = ['transactions'] as const;

/** The Transactions page until F-020: the latest transactions, newest first (F-018). */
export const latestTransactionsQuery = queryOptions({
  queryKey: [...transactionsKey, 'latest'],
  queryFn: async ({ signal }): Promise<Transaction[]> => {
    const { data, response } = await apiClient.GET('/api/transactions', { signal });
    if (!response.ok || !data)
      throw new Error(`Couldn't load transactions: ${String(response.status)}`);
    return data.items.map(toTransaction);
  },
});

/** What the form picks and offers when it opens: the last accounts and categories, the most used ones. */
export const suggestionsQuery = queryOptions({
  queryKey: [...transactionsKey, 'suggestions'],
  queryFn: async ({ signal }): Promise<TransactionSuggestions> => {
    const { data, response } = await apiClient.GET('/api/transactions/suggestions', { signal });
    if (!response.ok || !data)
      throw new Error(`Couldn't load the suggestions: ${String(response.status)}`);
    return data;
  },
});

/**
 * The NBU rates of a transaction's day (F-019), for the exchange's suggested second amount: that day's, or the latest
 * earlier ones, marked. Kept for the session: a day's rates don't change once published.
 */
export const ratesQuery = (date: string) =>
  queryOptions({
    queryKey: ['rates', date],
    queryFn: async ({ signal }): Promise<DayRates> => {
      const { data, response } = await apiClient.GET('/api/rates', {
        params: { query: { date } },
        signal,
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't load the rates: ${String(response.status)}`);
      return {
        date: data.date,
        status: data.status,
        rates: Object.fromEntries(data.rates.map((item) => [item.currency, Number(item.rate)])),
      };
    },
    // An earlier day's rates never change; today's may come out later: asked again after a while
    staleTime: 15 * 60 * 1000,
  });

/** Balances, totals and the lists change with every save or delete: all of them are fetched again. */
function useRefetchAfterChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionsKey }),
      queryClient.invalidateQueries({ queryKey: accountsQuery.queryKey }),
    ]);
}

/** Adds a transaction (no `id`) or saves the changed one. */
export function useSaveTransaction() {
  const refetch = useRefetchAfterChange();

  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id?: string;
      body: SaveTransactionRequest;
    }): Promise<SavedTransaction> => {
      const { data, response } = id
        ? await apiClient.PUT('/api/transactions/{id}', { params: { path: { id } }, body })
        : await apiClient.POST('/api/transactions', { body });
      if (!response.ok || !data)
        throw new Error(`Couldn't save the transaction: ${String(response.status)}`);
      return { transaction: toTransaction(data.transaction), balances: toChanges(data.balances) };
    },
    onSettled: refetch,
  });
}

/** Deletes a transaction for good; the answer has the balances it gave back (two for a transfer). */
export function useDeleteTransaction() {
  const refetch = useRefetchAfterChange();

  return useMutation({
    mutationFn: async ({ id }: { id: string }): Promise<BalanceChange[]> => {
      const { data, response } = await apiClient.DELETE('/api/transactions/{id}', {
        params: { path: { id } },
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't delete the transaction: ${String(response.status)}`);
      return toChanges(data.balances);
    },
    onSettled: refetch,
  });
}
