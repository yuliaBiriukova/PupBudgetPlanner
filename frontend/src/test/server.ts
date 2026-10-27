import { setupServer } from 'msw/node';

/** MSW server for unit tests. Add handlers per test with `server.use(http.get(...))`. */
export const server = setupServer();
