import { createServer, type Server } from 'node:http';

/**
 * In CI the API asks a stub instead of the NBU (F-017), so the tests don't depend on the real NBU or its rates.
 * Locally the API asks the real NBU: the stub's rates would be kept in the shared `dev` database as real ones.
 */
export const NBU_STUB = !!process.env.CI;

export const NBU_STUB_PORT = 5299;

/** Hryvnias for one unit, the same every day (F-014's final prototype). */
export const STUB_RATES: Record<string, number> = { USD: 41.35, EUR: 48.1, PLN: 11.3 };

/**
 * Answers `GET /NBUStatService/v1/statdirectory/exchange?date=yyyyMMdd&json` the way the NBU does, with
 * {@link STUB_RATES} for any date.
 */
export function startNbuStub(port = NBU_STUB_PORT): Server {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', `http://localhost:${String(port)}`);
    const date = url.searchParams.get('date') ?? '';
    if (url.pathname !== '/NBUStatService/v1/statdirectory/exchange' || !/^\d{8}$/.test(date)) {
      response.writeHead(404).end();
      return;
    }

    const day = `${date.slice(6, 8)}.${date.slice(4, 6)}.${date.slice(0, 4)}`;
    const body = Object.entries(STUB_RATES).map(([cc, rate]) => ({ cc, rate, exchangedate: day }));
    response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
  }).listen(port);
}
