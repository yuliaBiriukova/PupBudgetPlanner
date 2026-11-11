import { Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useSearchParams } from 'react-router';
import {
  AuthError,
  currentUserQuery,
  googleFailureOf,
  signUpInfoQuery,
  useRegister,
  useSignIn,
  type AuthFailure,
  type AuthLocationState,
} from './authApi';
import { AuthLayout } from './AuthLayout';
import { InviteOnlyNotice } from './InvitePage';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { useWakeNote } from './useWakeNote';

function failureOf(error: Error | null): AuthFailure | null {
  if (!error) return null;
  return error instanceof AuthError ? error.failure : 'unknown';
}

/**
 * Sign-in and sign-up are for people who aren't signed in; anyone else goes on into the app. (The invite page is
 * InviteRoute: someone signed in may open a family's link, F-023.)
 */
export function GuestOnly() {
  const { data: user } = useQuery(currentUserQuery);
  const state = useLocation().state as AuthLocationState | null;

  if (user) return <Navigate to={state?.from ?? '/transactions'} replace />;
  return <AuthLayout />;
}

export function SignInPage() {
  const signIn = useSignIn();
  const notice = useWakeNote();
  // A Google sign-in that didn't work comes back here with ?error=…, until the next attempt
  const [params] = useSearchParams();
  const googleFailure = signIn.isIdle ? googleFailureOf(params.get('error')) : null;

  return (
    <SignInForm
      onSubmit={(values) => {
        signIn.mutate(values);
      }}
      pending={signIn.isPending}
      failure={googleFailure ?? failureOf(signIn.error)}
      notice={notice}
    />
  );
}

/** Create account: the form while sign-up is open; while it is invite-only, how to get a link (F-028). */
export function SignUpPage() {
  const { t } = useTranslation();
  const signUp = useQuery(signUpInfoQuery);
  const register = useRegister();
  const notice = useWakeNote();

  if (signUp.isPending)
    return <Loader size={20} color="gray" aria-label={t('auth.loading')} mt={28} />;
  if (signUp.data?.mode !== 'Open') return <InviteOnlyNotice />;

  return (
    <SignUpForm
      onSubmit={(values) => {
        register.mutate(values);
      }}
      pending={register.isPending}
      failure={failureOf(register.error)}
      notice={notice}
    />
  );
}
