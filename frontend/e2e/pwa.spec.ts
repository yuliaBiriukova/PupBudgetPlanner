import { expect, test } from '@playwright/test';
import { BASE_URL } from './auth.ts';

/**
 * The installable app (F-025): the manifest, and the service worker that opens the app from its cache without a
 * network. The service worker exists only in the production build: CI's `vite preview`, or locally
 * `E2E_BASE_URL=http://localhost:4173` with `npm run build` and `npm run preview` running. The Vite dev server has none,
 * so there these tests are skipped. The other specs block service workers (playwright.config.ts), so a cached app
 * can't change what they test.
 */
const productionBuild = !BASE_URL.endsWith(':5173');

test.describe('the installable app', () => {
  test.skip(
    !productionBuild,
    'Needs the production build: the Vite dev server has no service worker',
  );
  test.use({ serviceWorkers: 'allow' });

  test('has a manifest with its name, icons and standalone display', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');

    expect(response.ok()).toBe(true);
    const manifest = (await response.json()) as {
      name: string;
      short_name: string;
      display: string;
      icons: { src: string; purpose: string }[];
    };
    expect(manifest).toMatchObject({
      name: 'Pup Budget Planner',
      short_name: 'Pup Budget',
      display: 'standalone',
    });
    expect(manifest.icons.map((icon) => `${icon.src} ${icon.purpose}`)).toEqual([
      '/pwa-192.png any',
      '/pwa-512.png any',
      '/pwa-maskable-512.png maskable',
    ]);
    for (const icon of manifest.icons) {
      expect((await request.get(icon.src)).headers()['content-type']).toBe('image/png');
    }
  });

  test('passes Chrome’s own install check', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page.getByRole('heading', { level: 1, name: 'Transactions' })).toBeVisible();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });

    // What Chrome's address bar and Android's "Install app" look at (the DevTools protocol, Chromium only)
    const devtools = await page.context().newCDPSession(page);
    const { installabilityErrors } = (await devtools.send('Page.getInstallabilityErrors')) as {
      installabilityErrors: { errorId: string }[];
    };

    expect(installabilityErrors.map((error) => error.errorId)).toEqual([]);
  });

  test('opens from its cache without a network, says so, and goes on once the network is back', async ({
    page,
    context,
  }) => {
    const heading = page.getByRole('heading', { level: 1, name: 'Transactions' });
    await page.goto('/transactions');
    await expect(heading).toBeVisible();
    // The first visit installs the service worker; from the next load it answers the page
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect(heading).toBeVisible();
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('alert')).toHaveText(
      'You’re offline.Pup Budget opens once the phone is online again.',
    );
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();

    await context.setOffline(false);

    await expect(heading).toBeVisible();
  });

  test('never answers the API from its cache', async ({ page, context }) => {
    await page.goto('/transactions');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Transactions' })).toBeVisible();

    // Online the API answers itself, not with the app's page
    const health = await page.goto('/api/health');
    expect(health?.headers()['content-type']).toContain('application/json');

    // Offline an API address fails, while the app's own pages still open (in a new tab: the failed one shows the
    // browser's error page)
    await context.setOffline(true);
    await expect(page.goto('/api/health')).rejects.toThrow();
    const tab = await context.newPage();
    await tab.goto('/accounts');
    await expect(tab.getByRole('alert')).toContainText('You’re offline.');
    await context.setOffline(false);
  });
});
