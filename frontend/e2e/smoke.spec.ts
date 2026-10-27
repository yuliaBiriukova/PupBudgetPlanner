import { expect, test } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };

test('the app opens on Transactions', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(en.app.name);
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByRole('heading', { level: 1, name: en.nav.transactions })).toBeVisible();
});

test('the browser icon is the app logo', async ({ page, request }) => {
  await page.goto('/');

  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    'href',
    '/favicon.svg',
  );
  const svg = await request.get('/favicon.svg');
  expect(await svg.text()).toContain('#8ec1ec');
  for (const [path, type] of [
    ['/favicon.ico', 'image/x-icon'],
    ['/apple-touch-icon.png', 'image/png'],
  ]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain(type);
  }
});
