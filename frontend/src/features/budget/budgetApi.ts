import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';

type Schemas = components['schemas'];

/** A category on the Budget page: its budget this month (none without one) and what was spent on it. */
export interface BudgetCategory {
  id: string;
  name: string;
  budget: number | null;
  spent: number;
}

/** An expense group: its own budget (none when it counts with its categories' sum) and all its categories' spending. */
export interface BudgetGroup {
  id: string;
  name: string;
  budget: number | null;
  spent: number;
  categories: BudgetCategory[];
}

/**
 * One month of the person's budget (F-033) as the API sends it, amounts as numbers. `planned` is false for a month
 * never planned, whose `startFrom` names the last planned month before it (`2026-10`). `spent` is all the month's
 * expenses, in the report currency `currency`.
 */
export interface MonthBudgetData {
  month: string;
  currency: string;
  planned: boolean;
  startFrom: string | null;
  total: number | null;
  spent: number;
  groups: BudgetGroup[];
  ratesMissing: boolean;
}

const amount = (value: number | string) => Number(value);
const optional = (value: number | string | null) => (value === null ? null : Number(value));

export const toMonthBudget = (data: Schemas['MonthBudget']): MonthBudgetData => ({
  month: data.month,
  currency: data.currency,
  planned: data.planned,
  startFrom: data.startFrom,
  total: optional(data.total),
  spent: amount(data.spent),
  groups: data.groups.map((group) => ({
    id: group.id,
    name: group.name,
    budget: optional(group.budget),
    spent: amount(group.spent),
    categories: group.categories.map((category) => ({
      id: category.id,
      name: category.name,
      budget: optional(category.budget),
      spent: amount(category.spent),
    })),
  })),
  ratesMissing: data.ratesMissing,
});

/** Every month's budget: fetched again after a budget or a transaction changes, or the report currency. */
export const budgetKey = ['budget'] as const;

/** One month (`2026-11`). */
export const monthBudgetQuery = (month: string) =>
  queryOptions({
    queryKey: [...budgetKey, month],
    queryFn: async ({ signal }): Promise<MonthBudgetData> => {
      const { data, response } = await apiClient.GET('/api/budget', {
        params: { query: { month } },
        signal,
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't load the budget: ${String(response.status)}`);
      return toMonthBudget(data);
    },
  });

/** Which budget a change is for: the month's total, an expense group's own or a category's. */
export type BudgetTarget =
  { kind: 'total' } | { kind: 'group'; id: string } | { kind: 'category'; id: string };

/**
 * What the API said when a budget doesn't fit (it checks the same rule as the page): its words. The page shows its
 * own, worked out before saving; this is for when the plan changed elsewhere meanwhile.
 */
export class BudgetRefused extends Error {}

async function refusalOf(response: Response, fallback: string): Promise<Error> {
  if (response.status === 400) {
    const problem = (await response.json().catch(() => null)) as {
      errors?: Record<string, string[]>;
    } | null;
    const text = problem?.errors?.amount?.[0];
    if (text) return new BudgetRefused(text);
  }
  return new Error(`${fallback}: ${String(response.status)}`);
}

/** Sets or (no amount) removes one budget of `month`; the month is planned (empty) first if it wasn't. */
export function useSetBudget(month: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ target, amount }: { target: BudgetTarget; amount: number | null }) => {
      const body = { month, amount };
      const { response } =
        target.kind === 'total'
          ? await apiClient.PUT('/api/budget/total', { body })
          : target.kind === 'group'
            ? await apiClient.PUT('/api/budget/groups/{id}', {
                params: { path: { id: target.id } },
                body,
              })
            : await apiClient.PUT('/api/budget/categories/{id}', {
                params: { path: { id: target.id } },
                body,
              });
      if (!response.ok) throw await refusalOf(response, "Couldn't save the budget");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: budgetKey }),
  });
}

/** Plans a month not planned yet: as a copy of the last planned one (`copyLast`), or empty. */
export function useStartMonth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ month, copyLast }: { month: string; copyLast: boolean }) => {
      const { response } = await apiClient.POST('/api/budget/start', {
        body: { month, copyLast },
      });
      // Planned already (another device or tab): what's there is what the page shows next
      if (!response.ok && response.status !== 409)
        throw new Error(`Couldn't plan the month: ${String(response.status)}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: budgetKey }),
  });
}

/**
 * Deletes `month`'s plan (owner's review of PR #115): its total and every group and category budget; the month is then
 * not planned. Gone already (another device or tab) is what was asked for.
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (month: string) => {
      const { response } = await apiClient.DELETE('/api/budget', {
        params: { query: { month } },
      });
      if (!response.ok && response.status !== 404)
        throw new Error(`Couldn't delete the plan: ${String(response.status)}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: budgetKey }),
  });
}
