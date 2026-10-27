import { expect, test } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };

test('the home page opens', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(en.app.name);
  await expect(page.getByRole('heading', { level: 1, name: en.app.name })).toBeVisible();
  await expect(page.getByText(en.home.comingSoon)).toBeVisible();
});
