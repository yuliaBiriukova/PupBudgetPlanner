import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';
import { accountsQuery } from '../accounts/accountsApi';
import { budgetKey } from '../budget/budgetApi';

type Schemas = components['schemas'];

export type JarIconName = Schemas['JarIcon'];
export type JarColor = Schemas['JarColor'];
export type JarMoveKind = Schemas['JarMoveKind'];

/** A jar's money on one account: in the jar's currency and in the account's (F-034). */
export interface JarPlace {
  accountId: string;
  accountName: string;
  accountCurrency: string;
  amount: number;
  accountAmount: number;
}

/** One line of a jar's history, newest first; `amount` in the jar's currency, negative when it came out. */
export interface JarHistoryLine {
  id: string;
  date: string;
  kind: JarMoveKind;
  amount: number;
  accountId: string;
  accountName: string;
  accountCurrency: string;
  accountAmount: number;
  otherJarName: string | null;
  /** `2026-11`, for a month's saved money. */
  month: string | null;
}

/**
 * A saving jar (F-034) as the page uses it: a goal that sets money aside inside the person's accounts. `by` is the
 * target month (`2027-12`); `saved` what is in it; `plannedThisMonth` what this month's budget plans for it.
 */
export interface Jar {
  id: string;
  name: string;
  icon: JarIconName;
  color: JarColor;
  currency: string;
  goal: number | null;
  by: string | null;
  note: string | null;
  saved: number;
  places: JarPlace[];
  history: JarHistoryLine[];
  plannedThisMonth: number | null;
  setAsideThisMonth: number;
}

const toJar = (item: Schemas['JarItem']): Jar => ({
  id: item.id,
  name: item.name,
  icon: item.icon,
  color: item.color,
  currency: item.currency,
  goal: item.goal === null ? null : Number(item.goal),
  by: item.by,
  note: item.note,
  saved: Number(item.saved),
  places: item.places.map((place) => ({
    accountId: place.accountId,
    accountName: place.accountName,
    accountCurrency: place.accountCurrency,
    amount: Number(place.amount),
    accountAmount: Number(place.accountAmount),
  })),
  history: item.history.map((line) => ({
    id: line.id,
    date: line.date,
    kind: line.kind,
    amount: Number(line.amount),
    accountId: line.accountId,
    accountName: line.accountName,
    accountCurrency: line.accountCurrency,
    accountAmount: Number(line.accountAmount),
    otherJarName: line.otherJarName,
    month: line.month,
  })),
  plannedThisMonth: item.plannedThisMonth === null ? null : Number(item.plannedThisMonth),
  setAsideThisMonth: Number(item.setAsideThisMonth),
});

/** The person's jars: fetched again after a change to a jar, its money or the month's plan for it. */
export const jarsKey = ['jars'] as const;

export const jarsQuery = queryOptions({
  queryKey: jarsKey,
  queryFn: async ({ signal }): Promise<Jar[]> => {
    const { data, response } = await apiClient.GET('/api/jars', { signal });
    if (!response.ok || !data)
      throw new Error(`Couldn't load the jars: ${String(response.status)}`);
    return data.map(toJar);
  },
});

/** A new jar or the edited one. */
export type SaveJarRequest = Omit<Schemas['SaveJarRequest'], 'goal'> & { goal: number | null };

/**
 * What a refused change said about a field (`amount`, `currency`, `parts`); the dialogs check first and say it in
 * their own words, so this is for a change made elsewhere meanwhile.
 */
export class JarRefused extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }
}

async function refusalOf(response: Response, fallback: string): Promise<Error> {
  const problem = (await response.json().catch(() => null)) as {
    title?: string;
    errors?: Record<string, string[]>;
  } | null;
  const [field, texts] = Object.entries(problem?.errors ?? {})[0] ?? [];
  if (response.status === 400 && field && texts?.[0]) return new JarRefused(field, texts[0]);
  return new Error(`${fallback}: ${String(response.status)}`);
}

/** Jar money changes what of each account is free, and what the month's budget shows as set aside. */
function useRefresh() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: jarsKey }),
      queryClient.invalidateQueries({ queryKey: accountsQuery.queryKey }),
      queryClient.invalidateQueries({ queryKey: budgetKey }),
    ]);
}

/** Adds a jar (no `id`) or saves the edited one. */
export function useSaveJar() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ id, request }: { id?: string; request: SaveJarRequest }) => {
      const { data, response } = id
        ? await apiClient.PUT('/api/jars/{id}', { params: { path: { id } }, body: request })
        : await apiClient.POST('/api/jars', { body: request });
      if (!response.ok || !data) throw await refusalOf(response, "Couldn't save the jar");
      return toJar(data);
    },
    onSettled: refresh,
  });
}

/** Closes a jar: it leaves the list, its history stays, its money becomes free. */
export function useCloseJar() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (id: string) => {
      const { response } = await apiClient.POST('/api/jars/{id}/close', {
        params: { path: { id } },
      });
      // Gone already (another device): what was asked for
      if (!response.ok && response.status !== 404)
        throw new Error(`Couldn't close the jar: ${String(response.status)}`);
    },
    onSettled: refresh,
  });
}

export type JarMoveAction = Schemas['JarMoveAction'];

/**
 * Money into a jar from an account (typed in the account's currency), out of it back to one, or to another jar (both
 * in the jar's currency).
 */
export function useMoveJarMoney() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({
      jarId,
      action,
      accountId,
      amount,
      toJarId,
    }: {
      jarId: string;
      action: JarMoveAction;
      accountId: string;
      amount: number;
      toJarId?: string;
    }) => {
      const { data, response } = await apiClient.POST('/api/jars/{id}/moves', {
        params: { path: { id: jarId } },
        body: { action, accountId, amount, toJarId: toJarId ?? null },
      });
      if (!response.ok || !data) throw await refusalOf(response, "Couldn't move the money");
      return toJar(data);
    },
    onSettled: refresh,
  });
}

export type SavedMoneyWay = Schemas['SavedMoneyWay'];

/** A month's saved money split across jars, each part from an account (F-034). */
export function usePutSavedMoney() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (request: {
      month: string;
      way: SavedMoneyWay;
      parts: { jarId: string; accountId: string; amount: number }[];
    }) => {
      const { response } = await apiClient.POST('/api/jars/saved-money', { body: request });
      if (!response.ok) throw await refusalOf(response, "Couldn't put the money into jars");
    },
    onSettled: refresh,
  });
}
