import { expect, test } from '@playwright/test';

// The app reaches the real API through the /api proxy. The API is up only after the database migrations ran.
test('the API answers through the app', async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: 'Healthy' });
});
