import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';
import { accountsTotalQuery } from '../accounts/accountsApi';
import { currentUserQuery } from '../auth/authApi';

/** The person's name, email and report currency (F-016); the theme is kept on the device, not here. */
export type UserSettings = components['schemas']['UserSettings'];

export const settingsQuery = queryOptions({
  queryKey: ['settings'],
  queryFn: async ({ signal }): Promise<UserSettings> => {
    const { data, response } = await apiClient.GET('/api/settings', { signal });
    if (!response.ok || !data)
      throw new Error(`Couldn't load the settings: ${String(response.status)}`);
    return data;
  },
});

/** Saves the name; the menu shows it right after. */
export function useChangeName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (displayName: string): Promise<UserSettings> => {
      const { data, response } = await apiClient.PUT('/api/settings/name', {
        body: { displayName },
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't save the name: ${String(response.status)}`);
      return data;
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsQuery.queryKey, settings);
      void queryClient.invalidateQueries({ queryKey: currentUserQuery.queryKey });
    },
  });
}

/** Saves the report currency; the total on Accounts (and here) is fetched again in it. */
export function useChangeReportCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currency: string): Promise<UserSettings> => {
      const { data, response } = await apiClient.PUT('/api/settings/report-currency', {
        body: { currency },
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't save the report currency: ${String(response.status)}`);
      return data;
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsQuery.queryKey, settings);
      void queryClient.invalidateQueries({ queryKey: accountsTotalQuery.queryKey });
    },
  });
}
