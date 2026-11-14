import { expect, test } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };

// The privacy policy (F-031): open to anyone, linked from the sign-in screens and Settings

const policy = en.privacyPolicy;

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('opens from Sign in, reads to the end, and Back returns to Sign in', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByRole('link', { name: policy.link }).click();

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { level: 1, name: policy.title })).toBeVisible();
    await expect(page.getByText(policy.inShort)).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(
      Object.values(policy.sections).map((s) => s.title),
    );

    await page.getByRole('button', { name: policy.back }).click();
    await expect(page.getByRole('button', { name: en.auth.signIn, exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('opened straight from a link, it asks the API for nothing', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/')) apiCalls.push(request.url());
    });

    await page.goto('/privacy');

    await expect(page.getByRole('heading', { level: 1, name: policy.title })).toBeVisible();
    await expect(page.getByRole('heading', { name: policy.sections.changes.title })).toBeVisible();
    expect(apiCalls).toEqual([]);
  });

  test('picking a section in the contents goes to it', async ({ page, isMobile }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1, name: policy.title })).toBeVisible();

    // On the phone the contents fold under the intro; on the desktop they stay beside the text
    if (isMobile) await page.getByRole('button', { name: policy.onThisPage }).click();
    const contents = page
      .getByRole('navigation', { name: policy.onThisPage })
      .filter({ visible: true });
    await contents.getByRole('link', { name: policy.sections.where.title }).click();

    const heading = page.getByRole('heading', { level: 2, name: policy.sections.where.title });
    await expect(heading).toBeInViewport();
    // Right under the top line, not scrolled past
    await expect
      .poll(async () => (await heading.boundingBox())?.y ?? -1)
      .toBeGreaterThanOrEqual(56);
  });
});

test('a signed-in person opens it from Settings, and Back returns to Settings', async ({
  page,
}) => {
  await page.goto('/settings');
  const privacy = page.getByRole('region', { name: policy.settingsTitle });
  await expect(privacy).toBeVisible();
  await privacy.getByRole('link', { name: new RegExp(policy.settingsRow) }).click();

  await expect(page.getByRole('heading', { level: 1, name: policy.title })).toBeVisible();
  await page.getByRole('button', { name: policy.back }).click();
  await expect(page.getByRole('heading', { level: 1, name: en.nav.settings })).toBeVisible();
});
