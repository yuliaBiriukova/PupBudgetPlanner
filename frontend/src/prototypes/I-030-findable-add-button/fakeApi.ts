import type { MockRoutes } from '../../test/mockFetch';
import { OVERVIEW, TOTAL } from '../../features/accounts/accountsTestData';
import { DEFAULT_CATEGORIES } from '../../features/categories/categoriesTestData';
import { today } from '../../features/transactions/days';
import {
  EXPENSE_NOTES,
  fakeNotes,
  fakePage,
  fakeSummary,
} from '../../features/transactions/transactionsFakeApi';
import { latestTransactions, SUGGESTIONS } from '../../features/transactions/transactionsTestData';
import { fakeMonthReport, fakeYearReport } from '../../features/reports/reportsTestData';

/** The fake API of the Transactions, Accounts and Reports pages and the quick-add form, as their own stories use it. */
export const PROTOTYPE_ROUTES: MockRoutes = {
  '/api/transactions': (_, query) => ({ json: fakePage(latestTransactions(), query) }),
  '/api/transactions/summary': (_, query) => ({ json: fakeSummary(latestTransactions(), query) }),
  '/api/transactions/suggestions': { json: SUGGESTIONS },
  '/api/transactions/notes': (_, query) => ({ json: fakeNotes(EXPENSE_NOTES, query) }),
  'POST /api/transactions': 'pending',
  '/api/accounts': { json: OVERVIEW },
  '/api/accounts/total': { json: TOTAL },
  '/api/categories': { json: DEFAULT_CATEGORIES },
  '/api/rates': {
    json: {
      date: today(),
      status: 'Current',
      rates: [
        { currency: 'EUR', rate: 48.71 },
        { currency: 'USD', rate: 45.53 },
      ],
    },
  },
  '/api/reports/year': (_, query) => ({
    json: fakeYearReport(Number(query.get('year')), today(), 1),
  }),
  '/api/reports/month': (_, query) => ({
    json: fakeMonthReport(query.get('month') ?? '', today(), 1),
  }),
  '/api/settings': {
    json: { displayName: 'Olena', email: 'olena@example.com', reportCurrency: 'UAH' },
  },
};
