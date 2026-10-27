import createClient from 'openapi-fetch';
import type { paths } from './schema';

/**
 * Typed client for the backend API. `schema.ts` is generated from the backend OpenAPI document
 * (`npm run api:types`); call it only from TanStack Query hooks.
 */
export const apiClient = createClient<paths>({ baseUrl: window.location.origin });
