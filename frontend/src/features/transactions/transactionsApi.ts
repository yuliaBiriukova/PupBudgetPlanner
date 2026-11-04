import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';
import { accountsQuery } from '../accounts/accountsApi';
import type { TransactionQuery } from './filters';

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

/** A page of the list: its transactions, and where the next page starts (none after the last). */
export interface TransactionPage {
  items: Transaction[];
  next: number | null;
}

/** A day's totals in the summary's currency: the calendar's colour, the receipt's foot. */
export interface DayTotal {
  date: string;
  spent: number;
  received: number;
  /** All its transactions the filters find, transfers too. */
  count: number;
  /** How many of them are transfers: a blue dot in the calendar, as income's is green. */
  transfers: number;
}

/** A category's line in "Where it went". */
export interface CategoryTotal {
  categoryId: string;
  name: string;
  amount: number;
}

/**
 * What the transactions the filters find come to (F-020), in `currency`: the report currency at the NBU rate of each
 * day, or one picked account's own. The categories leave the picked one out of their filters; `ratesMissing` means
 * some amounts in another currency had no rate and aren't counted.
 */
export interface TransactionSummary {
  currency: string;
  spent: number;
  received: number;
  count: number;
  days: DayTotal[];
  categories: CategoryTotal[];
  ratesMissing: boolean;
}

/** The list loads this many at a time as it is scrolled. */
export const PAGE_SIZE = 30;

/** The Transactions page's list (F-020): the ones the filters find, newest first, a page at a time. */
export const transactionPagesQuery = (query: TransactionQuery) =>
  infiniteQueryOptions({
    queryKey: [...transactionsKey, 'list', query],
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }): Promise<TransactionPage> => {
      const { data, response } = await apiClient.GET('/api/transactions', {
        params: { query: { ...query, offset: pageParam, limit: PAGE_SIZE } },
        signal,
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't load transactions: ${String(response.status)}`);
      return {
        items: data.items.map(toTransaction),
        next: data.next == null ? null : Number(data.next),
      };
    },
    getNextPageParam: (last) => last.next ?? undefined,
  });

/** The Transactions page's totals, calendar and categories for the filters (F-020). */
export const transactionSummaryQuery = (query: TransactionQuery) =>
  queryOptions({
    queryKey: [...transactionsKey, 'summary', query],
    queryFn: async ({ signal }): Promise<TransactionSummary> => {
      const { data, response } = await apiClient.GET('/api/transactions/summary', {
        params: { query },
        signal,
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't load the totals: ${String(response.status)}`);
      return {
        currency: data.currency,
        spent: Number(data.spent),
        received: Number(data.received),
        count: Number(data.count),
        days: data.days.map((day) => ({
          date: day.date,
          spent: Number(day.spent),
          received: Number(day.received),
          count: Number(day.count),
          transfers: Number(day.transfers),
        })),
        categories: data.categories.map((category) => ({
          ...category,
          amount: Number(category.amount),
        })),
        ratesMissing: data.ratesMissing,
      };
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

/**
 * The Note field's suggestions (I-017): the person's own earlier notes of the type that have `text` in them, at most 5,
 * the ones that start with it first. A save asks for them again, as for every list under `transactions`.
 */
export const noteSuggestionsQuery = (type: TransactionType, text: string) =>
  queryOptions({
    queryKey: [...transactionsKey, 'notes', type, text],
    queryFn: async ({ signal }): Promise<string[]> => {
      const { data, response } = await apiClient.GET('/api/transactions/notes', {
        params: { query: { type, text } },
        signal,
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't load the notes: ${String(response.status)}`);
      return data.map((item) => item.note);
    },
    staleTime: 60 * 1000,
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
