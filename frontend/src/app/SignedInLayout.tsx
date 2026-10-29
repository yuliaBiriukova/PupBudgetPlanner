import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router';
import { currentUserQuery, useSignOut, type AuthLocationState } from '../features/auth/authApi';
import { AppLayout } from './shell/AppLayout';
import { StartupScreen } from './StartupScreen';

/**
 * The app for a signed-in person. While the API says who that is (at night it may be waking up) a start-up
 * screen shows; nobody signed in goes to the sign-in page and comes back here afterwards.
 */
export function SignedInLayout() {
  const { data: user, isPending, isError, refetch } = useQuery(currentUserQuery);
  const location = useLocation();
  const signOut = useSignOut();

  if (isPending) return <StartupScreen />;
  if (isError) {
    return (
      <StartupScreen
        failed
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }
  if (!user) {
    const state: AuthLocationState = { from: `${location.pathname}${location.search}` };
    return <Navigate to="/sign-in" replace state={state} />;
  }

  return (
    <AppLayout
      user={{ name: user.displayName, email: user.email, isAdmin: user.isAdmin }}
      onSignOut={() => {
        signOut.mutate();
      }}
    />
  );
}
