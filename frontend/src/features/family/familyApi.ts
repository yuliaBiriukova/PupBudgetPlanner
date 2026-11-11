import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';

export type Family = components['schemas']['FamilyView'];
export type FamilyMember = components['schemas']['FamilyMemberItem'];
export type FamilyInvitation = components['schemas']['FamilyInvitationItem'];
export type CreatedFamilyInvitation = components['schemas']['CreatedInvitation'];
export type InvitedFamily = components['schemas']['InvitedFamily'];

/** A link lasts 7 days (F-023, as F-028's): the API's `Invitation.Lifetime`. */
export const LINK_DAYS = 7;

/** The longest family name: the API's `Family.NameMaxLength`. */
export const FAMILY_NAME_MAX = 40;

/** The longest "Who is it for?": the API's `Invitation.NoteMaxLength`. */
export const NOTE_MAX = 60;

/** The signed-in person's family, or null when they are in none (F-023). */
export const familyQuery = queryOptions({
  queryKey: ['family'],
  queryFn: async ({ signal }): Promise<Family | null> => {
    const { data, response } = await apiClient.GET('/api/family', { signal });
    if (response.status === 204) return null;
    if (!response.ok || !data)
      throw new Error(`Couldn't load the family: ${String(response.status)}`);
    return data;
  },
});

/** Why a change to the family didn't go through, by the API's status. */
export type FamilyFailure = 'alreadyInFamily' | 'gone' | 'unknown';

export class FamilyError extends Error {
  readonly failure: FamilyFailure;

  constructor(failure: FamilyFailure, status: number) {
    super(`Family change failed: ${String(status)}`);
    this.name = 'FamilyError';
    this.failure = failure;
  }
}

function check(response: Response) {
  if (response.ok) return;
  const failure: FamilyFailure =
    response.status === 409 ? 'alreadyInFamily' : response.status === 410 ? 'gone' : 'unknown';
  throw new FamilyError(failure, response.status);
}

/** A change to the family; the family is fetched again afterwards, whatever came of it. */
function useFamilyChange<T, R = void>(send: (value: T) => Promise<R>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: send,
    onSettled: () => queryClient.invalidateQueries({ queryKey: familyQuery.queryKey }),
  });
}

export function useStartFamily() {
  return useFamilyChange(async (name: string) => {
    const { response } = await apiClient.POST('/api/family', { body: { name: name.trim() } });
    check(response);
  });
}

export function useRenameFamily() {
  return useFamilyChange(async (name: string) => {
    const { response } = await apiClient.PUT('/api/family/name', { body: { name: name.trim() } });
    check(response);
  });
}

/** A new link; its token is in this answer only (F-028). */
export function useCreateFamilyInvitation() {
  return useFamilyChange(async (note: string): Promise<CreatedFamilyInvitation> => {
    const { data, response } = await apiClient.POST('/api/family/invitations', {
      body: { note: note.trim() || null },
    });
    check(response);
    if (!data) throw new FamilyError('unknown', response.status);
    return data;
  });
}

export function useCancelFamilyInvitation() {
  return useFamilyChange(async (id: string) => {
    const { response } = await apiClient.POST('/api/family/invitations/{id}/cancel', {
      params: { path: { id } },
    });
    // Already used, expired or cancelled: the family is fetched again either way
    if (response.status !== 409) check(response);
  });
}

export function useRemoveFromFamily() {
  return useFamilyChange(async (id: string) => {
    const { response } = await apiClient.POST('/api/family/members/{id}/remove', {
      params: { path: { id } },
    });
    check(response);
  });
}

/** Leave; an owner with others names who looks after the family next, an owner alone deletes it. */
export function useLeaveFamily() {
  return useFamilyChange(async (newOwnerId: string | null) => {
    const { response } = await apiClient.POST('/api/family/leave', { body: { newOwnerId } });
    check(response);
  });
}

/** Join the family of an invite link. 409: already in a family; 410: the link doesn't work. */
export function useJoinFamily() {
  return useFamilyChange(async (token: string) => {
    const { response } = await apiClient.POST('/api/family/join', { body: { token } });
    check(response);
  });
}

/** "OK" for Olena, "AK" for Andriy Kovalenko. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** The address to send: the app's own origin, so it works locally and on Render alike. */
export function familyInviteUrl(token: string): string {
  return `${window.location.origin}/invite/${token}`;
}
