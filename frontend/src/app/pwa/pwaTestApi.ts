import { http, HttpResponse } from 'msw/http';
import { server } from '../../test/server';
import { OVERVIEW, TOTAL } from '../../features/accounts/accountsTestData';
import { DEFAULT_CATEGORIES } from '../../features/categories/categoriesTestData';
import { fakePage, fakeSummary } from '../../features/transactions/transactionsFakeApi';

/** The Transactions page's requests, answered with no transactions: the PWA tests open the app there. */
export function answerTransactionsPage() {
  server.use(
    http.get('/api/accounts', () => HttpResponse.json(OVERVIEW)),
    http.get('/api/accounts/total', () => HttpResponse.json(TOTAL)),
    http.get('/api/categories', () => HttpResponse.json(DEFAULT_CATEGORIES)),
    http.get('/api/transactions', ({ request }) =>
      HttpResponse.json(fakePage([], new URL(request.url).searchParams)),
    ),
    http.get('/api/transactions/summary', ({ request }) =>
      HttpResponse.json(fakeSummary([], new URL(request.url).searchParams)),
    ),
  );
}
