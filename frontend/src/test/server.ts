import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';
import type { CurrentUser } from '../features/auth/authApi';

/** The person every rendered app is signed in as, unless a test says otherwise. */
export const testUser: CurrentUser = {
  id: '01a181d1-df7b-7855-98c6-a2e2bc4c26bb',
  displayName: 'Olena',
  email: 'olena@example.com',
  isAdmin: false,
};

/** Requests every rendered app makes: the API's health at start-up and who is signed in. */
const defaultHandlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  http.get('/api/auth/me', () => HttpResponse.json(testUser)),
  http.get('/api/auth/sign-up', () => HttpResponse.json({ mode: 'InviteOnly' })),
  // In no family (F-023), unless a test says otherwise
  http.get('/api/family', () => new HttpResponse(null, { status: 204 })),
  // The month's budget (F-033) the shell's banner and the quick-add form ask for: never planned, nothing before it
  http.get('/api/budget', ({ request }) =>
    HttpResponse.json({
      month: new URL(request.url).searchParams.get('month') ?? '2026-11',
      currency: 'UAH',
      planned: false,
      startFrom: null,
      total: null,
      spent: 0,
      groups: [],
      ratesMissing: false,
      income: 0,
      jars: [],
      saved: { leftOfBudgets: 0, net: 0, intoJars: 0 },
    }),
  ),
  // No saving jars (F-034), unless a test says otherwise; the Budget page asks for them, and the accounts' free money
  http.get('/api/jars', () => HttpResponse.json([])),
];

/** MSW server for unit tests. Add handlers per test with `server.use(http.get(...))`. */
export const server = setupServer(...defaultHandlers);
