import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { server } from './server';

// Sample of mocking the API in a test; real API hooks use the same pattern from F-007 on.
describe('MSW test server', () => {
  it('answers a request with the mocked response', async () => {
    server.use(http.get('/api/sample', () => HttpResponse.json({ status: 'ok' })));

    const response = await fetch(new URL('/api/sample', window.location.origin));

    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('fails a request that has no handler', async () => {
    const error: unknown = await fetch(new URL('/api/unknown', window.location.origin)).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(TypeError);
    expect(String((error as TypeError).cause)).toContain('[MSW]');
  });
});
