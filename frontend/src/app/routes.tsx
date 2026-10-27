import { Navigate, type RouteObject } from 'react-router';
import { AccountsPage } from '../features/accounts/AccountsPage';
import { FamilyPage } from '../features/family/FamilyPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TransactionsPage } from '../features/transactions/TransactionsPage';
import { NotFoundPage } from './NotFoundPage';
import { AppLayout } from './shell/AppLayout';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/transactions" replace /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'family', element: <FamilyPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
