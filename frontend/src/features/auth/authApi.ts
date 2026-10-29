import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';

export type CurrentUser = components['schemas']['CurrentUser'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type SignInRequest = components['schemas']['SignInRequest'];
export type InvitationPreview = components['schemas']['InvitationPreview'];

/** Where a signed-out person was going (router state); they land there after signing in. */
export interface AuthLocationState {
  from?: string;
}

/**
 * Why signing in or creating an account didn't work; each has its own message (ADR 0012). The invite-only ones
 * come from F-028.
 */
export type AuthFailure =
  | 'credentials'
  | 'emailUnavailable'
  | 'tooMany'
  | 'network'
  | 'google'
  | 'inviteOnly'
  | 'inviteGone'
  | 'blocked'
  | 'unknown';

export class AuthError extends Error {
  readonly failure: AuthFailure;

  constructor(failure: AuthFailure) {
    super(failure);
    this.name = 'AuthError';
    this.failure = failure;
  }
}

/** 403 means "needs an invite link" when creating an account and "blocked" when signing in. */
function failureFor(status: number, action: 'signIn' | 'register'): AuthFailure {
  switch (status) {
    case 401:
      return 'credentials';
    case 403:
      return action === 'register' ? 'inviteOnly' : 'blocked';
    case 409:
      return 'emailUnavailable';
    case 410:
      return 'inviteGone';
    case 429:
      return 'tooMany';
    default:
      return 'unknown';
  }
}

/** Where a failed Google sign-in comes back: `/sign-in?error=…` (the API's GoogleSignIn paths). */
export function googleFailureOf(error: string | null): AuthFailure | null {
  switch (error) {
    case 'google':
      return 'google';
    case 'invite-only':
      return 'inviteOnly';
    case 'invite':
      return 'inviteGone';
    case 'blocked':
      return 'blocked';
    default:
      return null;
  }
}

/** Whether Create account needs an invite link (F-028); it rarely changes. */
export const signUpInfoQuery = queryOptions({
  queryKey: ['auth', 'sign-up'],
  queryFn: async ({ signal }) => {
    const { data, response } = await apiClient.GET('/api/auth/sign-up', { signal });
    if (!response.ok || !data) throw new Error(`Couldn't load sign-up: ${String(response.status)}`);
    return data;
  },
  staleTime: Infinity,
  retry: 20,
  retryDelay: 3000,
});

/** Thrown when an invite link doesn't work (used, expired, cancelled or made up: never told apart). */
export class InvitationGoneError extends Error {
  constructor() {
    super('invitation gone');
    this.name = 'InvitationGoneError';
  }
}

/** Who invited and until when, for the invite page. */
export function invitationPreviewQuery(token: string) {
  return queryOptions({
    queryKey: ['invitations', 'preview', token],
    queryFn: async ({ signal }): Promise<InvitationPreview> => {
      const { data, response } = await apiClient.GET('/api/invitations/{token}', {
        params: { path: { token } },
        signal,
      });
      if (response.status === 404) throw new InvitationGoneError();
      if (!response.ok || !data)
        throw new Error(`Couldn't load the invitation: ${String(response.status)}`);
      return data;
    },
    // A missing link stays missing; at night the server may still be waking up
    retry: (count, error) => !(error instanceof InvitationGoneError) && count < 20,
    retryDelay: 3000,
  });
}

/**
 * Who is signed in: the person, or null. Asking also gives the browser the antiforgery token for that person,
 * so it is asked again after signing in or out.
 */
export const currentUserQuery = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: async ({ signal }): Promise<CurrentUser | null> => {
    const { data, response } = await apiClient.GET('/api/auth/me', { signal });
    if (response.status === 204) return null;
    if (!response.ok || !data)
      throw new Error(`Couldn't load the signed-in person: ${String(response.status)}`);
    return data;
  },
  staleTime: Infinity,
  // At night the server can take up to a minute to wake up
  retry: 20,
  retryDelay: 3000,
});

/** Sends a sign-in or sign-up request; the token from `currentUserQuery` must be there first. */
async function send<T>(
  action: 'signIn' | 'register',
  request: () => Promise<{ data?: T; response: Response }>,
): Promise<T> {
  let result: { data?: T; response: Response };
  try {
    result = await request();
  } catch {
    throw new AuthError('network');
  }
  if (!result.response.ok || !result.data)
    throw new AuthError(failureFor(result.response.status, action));
  return result.data;
}

/** After signing in: show the person at once, then fetch them again for a token that belongs to them. */
function useSignedIn() {
  const queryClient = useQueryClient();
  return (user: CurrentUser) => {
    queryClient.setQueryData(currentUserQuery.queryKey, user);
    void queryClient.invalidateQueries({ queryKey: currentUserQuery.queryKey });
  };
}

export function useSignIn() {
  const queryClient = useQueryClient();
  const signedIn = useSignedIn();

  return useMutation({
    mutationFn: async (body: SignInRequest) => {
      await queryClient.query({ ...currentUserQuery, staleTime: 'static' });
      return send('signIn', () => apiClient.POST('/api/auth/login', { body }));
    },
    onSuccess: signedIn,
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const signedIn = useSignedIn();

  return useMutation({
    mutationFn: async (body: RegisterRequest) => {
      await queryClient.query({ ...currentUserQuery, staleTime: 'static' });
      return send('register', () => apiClient.POST('/api/auth/register', { body }));
    },
    onSuccess: signedIn,
  });
}

/** Signs out and forgets everything cached for the person, so the next one starts clean. */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { response } = await apiClient.POST('/api/auth/logout');
      if (!response.ok) throw new Error(`Couldn't sign out: ${String(response.status)}`);
    },
    onSuccess: () => {
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'health' });
      queryClient.setQueryData(currentUserQuery.queryKey, null);
      void queryClient.invalidateQueries({ queryKey: currentUserQuery.queryKey });
    },
  });
}

/**
 * "Continue with Google": the API sends the person to Google and back to `from` (a path in the app). From the
 * invite page `invite` carries the link's token, so a new account can be created with it (F-028). A failed
 * attempt comes back to sign in with `?error=…`.
 */
export function googleSignInUrl(from?: string, invite?: string): string {
  const params = new URLSearchParams();
  if (from) params.set('returnUrl', from);
  if (invite) params.set('invite', invite);
  const query = params.toString();
  return query ? `/api/auth/google?${query}` : '/api/auth/google';
}
