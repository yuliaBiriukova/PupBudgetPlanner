import { expect, test } from '@playwright/test';

// The app reaches the real API through the /api proxy. The API is up only after the database migrations ran.
test('the API answers through the app', async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: 'Healthy' });
});

// F-026: no other site may show the app in a frame; the browser keeps to the content types it's given
test('the API sends the security headers', async ({ request }) => {
  const headers = (await request.get('/api/health')).headers();

  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['content-security-policy']).toBe("frame-ancestors 'none'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
});
