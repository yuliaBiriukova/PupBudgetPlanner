import { Navigate, type RouteObject } from 'react-router';
import { AccountsPage } from '../features/accounts/AccountsPage';
import { GuestOnly, SignInPage, SignUpPage } from '../features/auth/AuthPages';
import { InviteRoute } from '../features/auth/InviteRoute';
import { CategoriesPage } from '../features/categories/CategoriesPage';
import { FamilyPage } from '../features/family/FamilyPage';
import { PeoplePage } from '../features/people/PeoplePage';
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
  { path: 'categories', element: <CategoriesPage /> },
  { path: 'family', element: <FamilyPage /> },
  { path: 'settings', element: <SettingsPage /> },
  // The admin's page (F-028); anyone else gets Page not found
  { path: 'people', element: <PeoplePage tab="people" /> },
  { path: 'people/links', element: <PeoplePage tab="links" /> },
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
  // The invite link (F-028): the same frame without the Sign in / Create account switch. Signed in, a family's link
  // asks to join the family (F-023)
  { path: 'invite/:token', element: <InviteRoute /> },
  // Everything else needs a signed-in person
  { element: <SignedInLayout />, children: sectionRoutes },
];
