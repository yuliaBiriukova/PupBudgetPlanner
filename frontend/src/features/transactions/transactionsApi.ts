import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';
import { accountsQuery } from '../accounts/accountsApi';

type Schemas = components['schemas'];

export type TransactionType = Schemas['TransactionType'];
export type TransactionSuggestions = Schemas['TransactionSuggestions'];

/** A transaction as the pages use it; the API may send its amount as text (a decimal there). */
export type Transaction = Omit<Schemas['TransactionItem'], 'amount'> & { amount: number };

export type SaveTransactionRequest = Omit<Schemas['SaveTransactionRequest'], 'amount'> & {
  amount: number;
};

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
});

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

/** Deletes a transaction for good; the answer has the balance it gave back. */
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
