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

/** The most people one Block, Unblock or Delete may touch: the API's `PeopleRequestValidator.MaxPeople`. */
export const MAX_PICKS = 200;

/** A Block, Unblock or Delete the API turned down; 400 means the request itself was refused (too many people). */
export class PeopleActionError extends Error {
  readonly status: number;

  constructor(action: PeopleAction, status: number) {
    super(`Couldn't ${action}: ${String(status)}`);
    this.name = 'PeopleActionError';
    this.status = status;
  }
}

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
      if (!response.ok) throw new PeopleActionError(action, response.status);
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

export type SortKey = 'person' | 'joined' | 'invited';
export interface PeopleSort {
  key: SortKey;
  desc: boolean;
}

/** The first click on a column: names and links A to Z, the newest people first. */
export const FIRST_DIRECTION: Record<SortKey, boolean> = {
  person: false,
  joined: true,
  invited: false,
};

const byText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

// "Invited with" in the order the column reads: the admin, links by their note, links without a note, before invites
const invitedRank = (p: Person) => (p.isAdmin ? 0 : !p.invited ? 3 : p.invitationNote ? 1 : 2);

const compare: Record<SortKey, (a: Person, b: Person) => number> = {
  person: (a, b) => byText(a.displayName, b.displayName),
  joined: (a, b) => Date.parse(a.joinedAt) - Date.parse(b.joinedAt),
  invited: (a, b) =>
    invitedRank(a) - invitedRank(b) || byText(a.invitationNote ?? '', b.invitationNote ?? ''),
};

/** The people in the picked order; ties go by name. */
export function sortPeople(people: readonly Person[], sort: PeopleSort): Person[] {
  const sign = sort.desc ? -1 : 1;
  return [...people].sort(
    (a, b) =>
      sign * compare[sort.key](a, b) || byText(a.displayName, b.displayName) || byText(a.id, b.id),
  );
}
