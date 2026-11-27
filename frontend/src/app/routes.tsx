import { Navigate, type RouteObject } from 'react-router';
import { AccountsPage } from '../features/accounts/AccountsPage';
import { BudgetPage } from '../features/budget/BudgetPage';
import { JarsPage } from '../features/jars/JarsPage';
import { GuestOnly, SignInPage, SignUpPage } from '../features/auth/AuthPages';
import { InviteRoute } from '../features/auth/InviteRoute';
import { CategoriesPage } from '../features/categories/CategoriesPage';
import { FamilyPage } from '../features/family/FamilyPage';
import { PeoplePage } from '../features/people/PeoplePage';
import { PrivacyPolicyPage } from '../features/privacy-policy/PrivacyPolicyPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { AccountDeletedPage } from '../features/settings/AccountDeletedPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TransactionsPage } from '../features/transactions/TransactionsPage';
import { NotFoundPage } from './NotFoundPage';
import { SignedInLayout } from './SignedInLayout';

/** The app's pages inside the shell. */
export const sectionRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="/transactions" replace /> },
  { path: 'transactions', element: <TransactionsPage /> },
  { path: 'budget', element: <BudgetPage /> },
  { path: 'jars', element: <JarsPage /> },
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
  // The privacy policy (F-031): for anyone, signed in or not, with no request to the API
  { path: 'privacy', element: <PrivacyPolicyPage /> },
  // After deleting one's account (F-027): already signed out
  { path: 'account-deleted', element: <AccountDeletedPage /> },
  // Everything else needs a signed-in person
  { element: <SignedInLayout />, children: sectionRoutes },
];
