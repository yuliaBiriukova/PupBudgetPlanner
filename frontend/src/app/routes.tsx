import { Navigate, type RouteObject } from 'react-router';
import { AccountsPage } from '../features/accounts/AccountsPage';
import { GuestOnly, SignInPage, SignUpPage } from '../features/auth/AuthPages';
import { FamilyPage } from '../features/family/FamilyPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TransactionsPage } from '../features/transactions/TransactionsPage';
import { NotFoundPage } from './NotFoundPage';
import { SignedInLayout } from './SignedInLayout';

/** The app's pages inside the shell. */
export const sectionRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="/transactions" replace /> },
  { path: 'transactions', element: <TransactionsPage /> },
  { path: 'accounts', element: <AccountsPage /> },
  { path: 'reports', element: <ReportsPage /> },
  { path: 'family', element: <FamilyPage /> },
  { path: 'settings', element: <SettingsPage /> },
  { path: '*', element: <NotFoundPage /> },
];

export const routes: RouteObject[] = [
  {
    element: <GuestOnly />,
    children: [
      { path: 'sign-in', element: <SignInPage /> },
      { path: 'sign-up', element: <SignUpPage /> },
    ],
  },
  // Everything else needs a signed-in person
  { element: <SignedInLayout />, children: sectionRoutes },
];
