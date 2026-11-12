import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import type { AccountsOverview, AccountsTotal } from '../../features/accounts/accountsApi';
import { reportsKey, toReport, type Report } from '../../features/reports/reportsApi';
import type { components } from '../../shared/api/schema';
import type { Person, Who } from './world';

interface WhoState {
  people: Person[];
  /** Whose money the lens shows on Transactions, Accounts and Reports. */
  who: Who;
  setWho: (who: Who) => void;
}

export const WhoContext = createContext<WhoState>({
  people: [],
  who: 'me',
  setWho: () => undefined,
});

export function useWhoState() {
  return useContext(WhoContext);
}

/** Whose money the page shows: the shell's lens. Without a family it is always yours. */
export function usePageWho(): [Who, (who: Who) => void] {
  const state = useWhoState();
  if (state.people.length === 0) return ['me', () => undefined];
  return [state.who, state.setWho];
}

/** The short name of a choice: Me, Andriy, Family. */
export function whoName(who: Who, people: Person[]): string {
  if (who === 'family') return 'Family';
  if (who === 'me') return 'Me';
  return people.find((person) => person.id === who)?.name ?? 'Me';
}

/** "Andriy's money", "Your money", "The family's money". */
export function whoseMoney(who: Who, people: Person[]): string {
  if (who === 'family') return 'The family’s money';
  if (who === 'me') return 'Your money';
  return `${whoName(who, people)}’s money`;
}

/** The person's first letter, as the People and Family pages show them. */
export function initialOf(who: Who, people: Person[]): string {
  const person =
    who === 'me' ? people.find((item) => item.isYou) : people.find((item) => item.id === who);
  return (person?.name ?? 'Me').slice(0, 1);
}

async function getJson<T>(
  path: string,
  query: Record<string, string | number | undefined>,
  signal: AbortSignal,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined) params.set(key, String(value));
  const response = await fetch(`${path}?${params.toString()}`, { signal });
  if (!response.ok) throw new Error(`Couldn't load ${path}: ${String(response.status)}`);
  return (await response.json()) as T;
}

/** The Accounts page's data for `who`; its key starts with the accounts', so a saved transaction fetches it again. */
export const whoseAccountsQuery = (who: Who) =>
  queryOptions({
    queryKey: ['accounts', { who }],
    queryFn: ({ signal }) => getJson<AccountsOverview>('/api/accounts', { who }, signal),
    placeholderData: keepPreviousData,
  });

export const whoseTotalQuery = (who: Who) =>
  queryOptions({
    queryKey: ['accounts', 'total', { who }],
    queryFn: ({ signal }) => getJson<AccountsTotal>('/api/accounts/total', { who }, signal),
    placeholderData: keepPreviousData,
  });

/** Both kinds of report alike, so the page can ask for either. */
type ReportKey = (string | number | null | { who: Who })[];

export const whoseYearQuery = (who: Who, year: number, currency?: string) =>
  queryOptions({
    queryKey: [...reportsKey, 'year', year, currency ?? null, { who }] as ReportKey,
    queryFn: async ({ signal }): Promise<Report> =>
      toReport(
        await getJson<components['schemas']['Report']>(
          '/api/reports/year',
          { year, currency, who },
          signal,
        ),
      ),
    placeholderData: keepPreviousData,
  });

export const whoseMonthQuery = (who: Who, month: string, currency?: string) =>
  queryOptions({
    queryKey: [...reportsKey, 'month', month, currency ?? null, { who }] as ReportKey,
    queryFn: async ({ signal }): Promise<Report> =>
      toReport(
        await getJson<components['schemas']['Report']>(
          '/api/reports/month',
          { month, currency, who },
          signal,
        ),
      ),
    placeholderData: keepPreviousData,
  });
