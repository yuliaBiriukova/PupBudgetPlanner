import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';
import { reportsKey } from '../reports/reportsApi';

type Schemas = components['schemas'];

export type CategoryKind = Schemas['CategoryKind'];
export type Removal = Schemas['Removal'];

/**
 * A category as the app uses it; the API may send its count as text. A hidden one (F-029) isn't offered for new
 * transactions; its transactions, the reports and the Transactions filters keep it.
 */
export type Category = Omit<Schemas['CategoryItem'], 'transactionCount'> & {
  transactionCount: number;
};

/** A group with its shown categories in order, then its hidden ones. */
export type CategoryGroup = Omit<Schemas['CategoryGroupItem'], 'categories'> & {
  categories: Category[];
};

export interface CategoriesOverview {
  groups: CategoryGroup[];
}

/**
 * The person's whole set: the groups in the report's order (income first), each with its shown categories, then its
 * hidden ones; hidden groups too (F-015, F-029).
 */
export const categoriesQuery = queryOptions({
  queryKey: ['categories'],
  queryFn: async ({ signal }): Promise<CategoriesOverview> => {
    const { data, response } = await apiClient.GET('/api/categories', { signal });
    if (!response.ok || !data)
      throw new Error(`Couldn't load categories: ${String(response.status)}`);
    return {
      groups: data.groups.map((group) => ({
        ...group,
        categories: group.categories.map((category) => ({
          ...category,
          transactionCount: Number(category.transactionCount),
        })),
      })),
    };
  },
  // Changed on the Categories page and the Family page (F-030), which fetch it again after every change
  staleTime: 5 * 60_000,
});

/**
 * The API found the name in use there (another tab, two saves at once): the page checks names first, so this is rare.
 */
export class CategoryNameError extends Error {
  constructor() {
    super('This name is already in use there.');
    this.name = 'CategoryNameError';
  }
}

/** A 400 from the API with a mistake in the name: the sheet's other mistakes are found before it is sent. */
function hasNameError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('errors' in error)) return false;
  const { errors } = error;
  return typeof errors === 'object' && errors !== null && 'name' in errors;
}

function check(response: Response, error: unknown, what: string) {
  if (response.status === 400 && hasNameError(error)) throw new CategoryNameError();
  if (!response.ok) throw new Error(`Couldn't ${what}: ${String(response.status)}`);
}

/**
 * Every change fetches the categories again, and the transactions and reports that show their names and order.
 */
function useCategoryMutation<Variables, Result>(
  mutationFn: (variables: Variables) => Promise<Result>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: categoriesQuery.queryKey }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: reportsKey }),
      ]),
  });
}

/** `place` counts among the shown ones from 0; none puts it at the end (or keeps it where it is, when changed). */
export function useSaveCategory() {
  return useCategoryMutation(
    async ({
      id,
      groupId,
      name,
      place,
    }: {
      id?: string;
      groupId: string;
      name: string;
      place?: number;
    }) => {
      if (id) {
        const { error, response } = await apiClient.PUT('/api/categories/{id}', {
          params: { path: { id } },
          body: { name, groupId, place: place ?? null },
        });
        check(response, error, 'save the category');
        return id;
      }
      const { data, error, response } = await apiClient.POST('/api/categories', {
        body: { groupId, name, place: place ?? null },
      });
      check(response, error, 'add the category');
      return data?.id ?? '';
    },
  );
}

export function useSaveGroup() {
  return useCategoryMutation(
    async ({
      id,
      kind,
      name,
      place,
    }: {
      id?: string;
      kind: CategoryKind;
      name: string;
      place?: number;
    }) => {
      if (id) {
        const { error, response } = await apiClient.PUT('/api/categories/groups/{id}', {
          params: { path: { id } },
          body: { name, place: place ?? null },
        });
        check(response, error, 'save the group');
        return id;
      }
      const { data, error, response } = await apiClient.POST('/api/categories/groups', {
        body: { kind, name, place: place ?? null },
      });
      check(response, error, 'add the group');
      return data?.id ?? '';
    },
  );
}

/** Deletes a category with no transactions, hides one with transactions; says which it did. */
export function useRemoveCategory() {
  return useCategoryMutation(async (id: string): Promise<Removal> => {
    const { data, error, response } = await apiClient.DELETE('/api/categories/{id}', {
      params: { path: { id } },
    });
    check(response, error, 'remove the category');
    return data?.removal ?? 'Hidden';
  });
}

/** Deletes an empty group, hides one with only hidden categories; says which it did. */
export function useRemoveGroup() {
  return useCategoryMutation(async (id: string): Promise<Removal> => {
    const { data, error, response } = await apiClient.DELETE('/api/categories/groups/{id}', {
      params: { path: { id } },
    });
    check(response, error, 'remove the group');
    return data?.removal ?? 'Hidden';
  });
}

/** Shows a hidden category again at the end of its group (and its group, when that was hidden too). */
export function useRestoreCategory() {
  return useCategoryMutation(async (id: string) => {
    const { error, response } = await apiClient.POST('/api/categories/{id}/restore', {
      params: { path: { id } },
    });
    check(response, error, 'show the category again');
  });
}

export function useRestoreGroup() {
  return useCategoryMutation(async (id: string) => {
    const { error, response } = await apiClient.POST('/api/categories/groups/{id}/restore', {
      params: { path: { id } },
    });
    check(response, error, 'show the group again');
  });
}
