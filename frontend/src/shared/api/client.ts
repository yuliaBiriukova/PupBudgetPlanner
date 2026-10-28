import createClient from 'openapi-fetch';
import type { paths } from './schema';

/** The API's antiforgery token: it puts it in this cookie and expects it back in the header (ADR 0003). */
export const ANTIFORGERY_COOKIE = 'XSRF-TOKEN';
export const ANTIFORGERY_HEADER = 'X-XSRF-TOKEN';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readCookie(name: string): string | undefined {
  const prefix = `${name}=`;
  const cookie = document.cookie.split('; ').find((c) => c.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}

/**
 * Typed client for the backend API. `schema.ts` is generated from the backend OpenAPI document
 * (`npm run api:types`); call it only from TanStack Query hooks.
 */
export const apiClient = createClient<paths>({
  baseUrl: window.location.origin,
  // Looked up on every call, not kept from start-up, so request mocks installed later (MSW in tests) apply
  fetch: (request) => globalThis.fetch(request),
});

// Every request that changes something carries the antiforgery token
apiClient.use({
  onRequest({ request }) {
    const token = readCookie(ANTIFORGERY_COOKIE);
    if (!SAFE_METHODS.has(request.method) && token) request.headers.set(ANTIFORGERY_HEADER, token);
    return request;
  },
});
