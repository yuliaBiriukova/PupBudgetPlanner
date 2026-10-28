import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router';
import { useServerWake } from '../../app/shell/useServerWake';
import {
  AuthError,
  currentUserQuery,
  useRegister,
  useSignIn,
  type AuthFailure,
  type AuthLocationState,
} from './authApi';
import { WakeNote } from './AuthFormParts';
import { AuthLayout } from './AuthLayout';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';

function failureOf(error: Error | null): AuthFailure | null {
  if (!error) return null;
  return error instanceof AuthError ? error.failure : 'unknown';
}

function useWakeNote() {
  const wake = useServerWake();
  return wake.waking ? <WakeNote seconds={wake.seconds} /> : null;
}

/** Sign-in and sign-up are for people who aren't signed in; anyone else goes on into the app. */
export function GuestOnly() {
  const { data: user } = useQuery(currentUserQuery);
  const state = useLocation().state as AuthLocationState | null;

  if (user) return <Navigate to={state?.from ?? '/transactions'} replace />;
  return <AuthLayout />;
}

export function SignInPage() {
  const signIn = useSignIn();
  const notice = useWakeNote();

  return (
    <SignInForm
      onSubmit={(values) => {
        signIn.mutate(values);
      }}
      pending={signIn.isPending}
      failure={failureOf(signIn.error)}
      notice={notice}
    />
  );
}

export function SignUpPage() {
  const register = useRegister();
  const notice = useWakeNote();

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
