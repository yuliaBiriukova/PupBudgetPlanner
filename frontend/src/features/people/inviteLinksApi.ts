import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { Place } from './linkGroups';
import { invitationsQuery, type Invitation } from './peopleApi';

/** The family owner's links of every status, newest first (I-006). Under `family`, so a change to it refreshes them. */
export const familyInvitationsQuery = queryOptions({
  queryKey: ['family', 'invitations'],
  queryFn: async ({ signal }): Promise<Invitation[]> => {
    const { data, response } = await apiClient.GET('/api/family/invitations', { signal });
    if (!response.ok || !data)
      throw new Error(`Couldn't load the family's links: ${String(response.status)}`);
    return data;
  },
});

export function linksQueryOf(place: Place) {
  return place === 'admin' ? invitationsQuery : familyInvitationsQuery;
}

/** The admin may be a family owner too: both lists are fetched again after any change. */
function useRefresh() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: invitationsQuery.queryKey }),
      queryClient.invalidateQueries({ queryKey: familyInvitationsQuery.queryKey }),
    ]);
}

/** A row's Cancel. Already used, expired or cancelled (409): the list is fetched again either way. */
export function useCancelLink(place: Place) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (id: string) => {
      const params = { path: { id } };
      const { response } =
        place === 'admin'
          ? await apiClient.POST('/api/admin/invitations/{id}/cancel', { params })
          : await apiClient.POST('/api/family/invitations/{id}/cancel', { params });
      if (!response.ok && response.status !== 409)
        throw new Error(`Couldn't cancel the link: ${String(response.status)}`);
    },
    onSettled: refresh,
  });
}

/** Cancel links in the bulk bar: only the waiting ones change. Says how many were cancelled. */
export function useCancelLinks(place: Place) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (ids: string[]): Promise<number> => {
      const body = { ids };
      const { data, response } =
        place === 'admin'
          ? await apiClient.POST('/api/admin/invitations/cancel', { body })
          : await apiClient.POST('/api/family/invitations/cancel', { body });
      if (!response.ok || !data) throw new Error(`Couldn't cancel: ${String(response.status)}`);
      return Number(data.count);
    },
    onSettled: refresh,
  });
}

/** Delete in the bulk bar, any status. Says how many were deleted (links already gone don't count). */
export function useDeleteLinks(place: Place) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (ids: string[]): Promise<number> => {
      const body = { ids };
      const { data, response } =
        place === 'admin'
          ? await apiClient.POST('/api/admin/invitations/delete', { body })
          : await apiClient.POST('/api/family/invitations/delete', { body });
      if (!response.ok || !data) throw new Error(`Couldn't delete: ${String(response.status)}`);
      return Number(data.count);
    },
    onSettled: refresh,
  });
}
