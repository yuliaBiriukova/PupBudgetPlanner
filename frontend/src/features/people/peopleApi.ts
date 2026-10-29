import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';

export type Person = components['schemas']['PersonItem'];
export type Invitation = components['schemas']['InvitationItem'];
export type CreatedInvitation = components['schemas']['CreatedInvitation'];

/** Everyone with an account, the admin first (F-028). */
export const peopleQuery = queryOptions({
  queryKey: ['admin', 'people'],
  queryFn: async ({ signal }): Promise<Person[]> => {
    const { data, response } = await apiClient.GET('/api/admin/people', { signal });
    if (!response.ok || !data) throw new Error(`Couldn't load people: ${String(response.status)}`);
    return data;
  },
});

/** All invite links, newest first. */
export const invitationsQuery = queryOptions({
  queryKey: ['admin', 'invitations'],
  queryFn: async ({ signal }): Promise<Invitation[]> => {
    const { data, response } = await apiClient.GET('/api/admin/invitations', { signal });
    if (!response.ok || !data)
      throw new Error(`Couldn't load invite links: ${String(response.status)}`);
    return data;
  },
});

/** The address to send: the app's own origin, so it works locally and on Render alike. */
export function inviteUrl(token: string): string {
  return `${window.location.origin}/invite/${token}`;
}

export type PeopleAction = 'block' | 'unblock' | 'delete';

/** Block, unblock or delete one person or everyone picked; the lists are fetched again afterwards. */
export function usePeopleAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, userIds }: { action: PeopleAction; userIds: string[] }) => {
      const body = { userIds };
      const { response } =
        action === 'block'
          ? await apiClient.POST('/api/admin/people/block', { body })
          : action === 'unblock'
            ? await apiClient.POST('/api/admin/people/unblock', { body })
            : await apiClient.POST('/api/admin/people/delete', { body });
      if (!response.ok) throw new Error(`Couldn't ${action}: ${String(response.status)}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });
}

/** A new link; its token is in this answer only. */
export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: string): Promise<CreatedInvitation> => {
      const { data, response } = await apiClient.POST('/api/admin/invitations', {
        body: { note: note.trim() || null },
      });
      if (!response.ok || !data)
        throw new Error(`Couldn't make a link: ${String(response.status)}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invitationsQuery.queryKey }),
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { response } = await apiClient.POST('/api/admin/invitations/{id}/cancel', {
        params: { path: { id } },
      });
      // Already used, expired or cancelled: the list is fetched again either way
      if (!response.ok && response.status !== 409)
        throw new Error(`Couldn't cancel the link: ${String(response.status)}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: invitationsQuery.queryKey }),
  });
}

/** Whether a person matches the search: name or email, any case, any alphabet. */
export function matchesSearch(person: Person, query: string): boolean {
  const q = query.trim().toLocaleLowerCase();
  return (
    !q ||
    person.displayName.toLocaleLowerCase().includes(q) ||
    person.email.toLocaleLowerCase().includes(q)
  );
}
