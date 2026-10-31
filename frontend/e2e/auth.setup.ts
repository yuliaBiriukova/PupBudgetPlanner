import { expect, test as setup } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { AUTH_FILE, newPerson, signUpThroughApi } from './auth.ts';

// One person for the tests that need a signed-in app; their cookies are reused by every project
setup('create a signed-in test person', async ({ page, request }) => {
  const response = await signUpThroughApi(request, newPerson('shared'));

  expect(response.ok()).toBe(true);
  await request.storageState({ path: AUTH_FILE });

  // Opens the app once before the tests run in parallel: a cold Vite dev server prepares the app on the first
  // visit, which took longer than a test's 30 s when every worker asked for it at once (I-014). No route is lazy,
  // so this one page prepares them all.
  setup.setTimeout(120_000);
  await page.context().addCookies((await request.storageState()).cookies);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: en.nav.transactions })).toBeVisible({
    timeout: 90_000,
  });
});
