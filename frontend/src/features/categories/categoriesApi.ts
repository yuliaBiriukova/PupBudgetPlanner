import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';

type Schemas = components['schemas'];

export type CategoryKind = Schemas['CategoryKind'];
export type CategoryGroup = Schemas['CategoryGroupItem'];
export type CategoriesOverview = Schemas['CategoriesOverview'];

/** The Categories page: the person's groups in the report's order, each with its categories (F-015). */
export const categoriesQuery = queryOptions({
  queryKey: ['categories'],
  queryFn: async ({ signal }): Promise<CategoriesOverview> => {
    const { data, response } = await apiClient.GET('/api/categories', { signal });
    if (!response.ok || !data)
      throw new Error(`Couldn't load categories: ${String(response.status)}`);
    return data;
  },
  // Read-only until categories can be changed (post-MVP): no need to fetch again on every visit
  staleTime: 5 * 60_000,
});
