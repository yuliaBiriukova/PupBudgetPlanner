import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import type { components } from '../../shared/api/schema';

export type CurrentUser = components['schemas']['CurrentUser'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type SignInRequest = components['schemas']['SignInRequest'];

/** Where a signed-out person was going (router state); they land there after signing in. */
export interface AuthLocationState {
  from?: string;
}

/** Why signing in or creating an account didn't work; each has its own message (ADR 0012). */
export type AuthFailure = 'credentials' | 'emailUnavailable' | 'tooMany' | 'network' | 'unknown';

export class AuthError extends Error {
  readonly failure: AuthFailure;

  constructor(failure: AuthFailure) {
    super(failure);
    this.name = 'AuthError';
    this.failure = failure;
  }
}

function failureFor(status: number): AuthFailure {
  switch (status) {
    case 401:
      return 'credentials';
    case 409:
      return 'emailUnavailable';
    case 429:
      return 'tooMany';
    default:
      return 'unknown';
  }
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
async function send<T>(request: () => Promise<{ data?: T; response: Response }>): Promise<T> {
  let result: { data?: T; response: Response };
  try {
    result = await request();
  } catch {
    throw new AuthError('network');
  }
  if (!result.response.ok || !result.data) throw new AuthError(failureFor(result.response.status));
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
      return send(() => apiClient.POST('/api/auth/login', { body }));
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
      return send(() => apiClient.POST('/api/auth/register', { body }));
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
