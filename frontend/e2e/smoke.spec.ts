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

  // The links the page declares, so a stale or broken URL fails here. Each carries ?v=: browsers keep
  // tab icons by URL, and the scaffold's Vite icon was cached as /favicon.svg (B-002).
  const icons = page.locator('link[rel="icon"], link[rel="apple-touch-icon"]');
  await expect(icons).toHaveCount(3);
  for (const icon of await icons.all()) {
    await expect(icon).toHaveAttribute('href', /\?v=\d+$/);
  }
  const svg = await request.get(
    (await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href')) ?? '',
  );
  expect(await svg.text()).toContain('#8ec1ec');
  for (const [selector, type] of [
    ['link[rel="icon"][sizes="32x32"]', 'image/x-icon'],
    ['link[rel="apple-touch-icon"]', 'image/png'],
  ]) {
    const response = await request.get((await page.locator(selector).getAttribute('href')) ?? '');
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain(type);
  }
});
