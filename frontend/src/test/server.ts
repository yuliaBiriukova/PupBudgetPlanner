import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';

/** Requests every rendered app makes: the shell asks for the API's health at start-up. */
const defaultHandlers = [http.get('/api/health', () => HttpResponse.json({ status: 'ok' }))];

/** MSW server for unit tests. Add handlers per test with `server.use(http.get(...))`. */
export const server = setupServer(...defaultHandlers);
