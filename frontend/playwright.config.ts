import { defineConfig, devices } from '@playwright/test';

// The Vite dev server (see vite.config.ts). Set E2E_BASE_URL to test an app that is already running elsewhere.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const isCI = !!process.env.CI;

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    // Chromium-based phone profile, so one browser download covers both projects.
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  // Starts the dev server unless E2E_BASE_URL points at a running app; locally an already running
  // `npm run dev` is reused.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
