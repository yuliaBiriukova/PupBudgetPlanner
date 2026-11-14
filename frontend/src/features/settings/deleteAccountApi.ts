import { queryOptions, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';

/** What deleting the account takes away, how it is confirmed and whether it can be (F-027). */
export type DeletionSummary = components['schemas']['DeletionSummary'];

export type DeleteAccountRequest = components['schemas']['DeleteMyAccountRequest'];

/** The word typed to confirm (the API's `AccountDeletionRules.Word`); any letter case counts. */
export const DELETE_WORD = 'DELETE';

export const isDeleteWord = (typed: string) => typed.trim().toUpperCase() === DELETE_WORD;

/** "Confirm with Google": a page navigation to Google and back to Settings with `?delete=…`. */
export const GOOGLE_CONFIRM_URL = '/api/me/delete/google';

/** What Settings is opened with after "Confirm with Google" (the API's `GoogleConfirmation` paths). */
export const DELETE_PARAM = 'delete';

export const deletionQuery = queryOptions({
  queryKey: ['deletion'],
  queryFn: async ({ signal }): Promise<DeletionSummary> => {
    const { data, response } = await apiClient.GET('/api/me/deletion', { signal });
    if (!response.ok || !data)
      throw new Error(`Couldn't load what deleting takes: ${String(response.status)}`);
    return data;
  },
});

/** Why the deletion didn't go through: a field to fix, or a reason for the whole dialog. */
export type DeleteFailure =
  | { kind: 'fields'; fields: Partial<Record<'word' | 'password' | 'newOwnerId', string>> }
  | { kind: 'google' | 'lockedOut' | 'admin' | 'unknown' };

export class DeleteAccountError extends Error {
  readonly failure: DeleteFailure;

  constructor(failure: DeleteFailure, status: number) {
    super(`Deleting the account failed: ${String(status)}`);
    this.name = 'DeleteAccountError';
    this.failure = failure;
  }
}

/** Deletes the account; the API signs this device out, the others within a minute. */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (body: DeleteAccountRequest) => {
      const { error, response } = await apiClient.POST('/api/me/delete', { body });
      if (response.ok) return;
      const status = response.status;
      if (status === 400) {
        const errors = (error as { errors?: Record<string, string[]> } | undefined)?.errors ?? {};
        throw new DeleteAccountError(
          {
            kind: 'fields',
            fields: {
              word: errors.word?.[0],
              password: errors.password?.[0],
              newOwnerId: errors.newOwnerId?.[0],
            },
          },
          status,
        );
      }
      const kind =
        status === 409
          ? 'google'
          : status === 429
            ? 'lockedOut'
            : status === 403
              ? 'admin'
              : 'unknown';
      throw new DeleteAccountError({ kind }, status);
    },
  });
}
