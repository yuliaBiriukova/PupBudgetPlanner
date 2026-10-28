import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';
import type { CurrentUser } from '../features/auth/authApi';

/** The person every rendered app is signed in as, unless a test says otherwise. */
export const testUser: CurrentUser = {
  id: '01a181d1-df7b-7855-98c6-a2e2bc4c26bb',
  displayName: 'Olena',
  email: 'olena@example.com',
};

/** Requests every rendered app makes: the API's health at start-up and who is signed in. */
const defaultHandlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  http.get('/api/auth/me', () => HttpResponse.json(testUser)),
];

/** MSW server for unit tests. Add handlers per test with `server.use(http.get(...))`. */
export const server = setupServer(...defaultHandlers);
