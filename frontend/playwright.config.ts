import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE } from './e2e/auth.ts';

const isCI = !!process.env.CI;

// Locally the Vite dev server; in CI the production build served by `vite preview` (see vite.config.ts).
// Both proxy /api to the API. Set E2E_BASE_URL to test an app that is already running elsewhere.
const baseURL =
  process.env.E2E_BASE_URL ?? (isCI ? 'http://localhost:4173' : 'http://localhost:5173');

// The real API (`http` launch profile) with its database: locally the connection string from user-secrets,
// in CI the `ConnectionStrings__Database` environment variable. CI builds the API in Release beforehand.
const apiCommand = isCI
  ? 'dotnet run --project src/PupBudgetPlanner.Api --launch-profile http --configuration Release --no-build'
  : 'dotnet run --project src/PupBudgetPlanner.Api --launch-profile http';

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
    // Creates a person and keeps their cookies, so the app's tests start signed in (auth.spec.ts starts signed out)
    { name: 'setup', testMatch: /auth\.setup\.ts$/ },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
    // Chromium-based phone profile, so one browser download covers both projects.
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
  ],
  // Starts the API and the app unless E2E_BASE_URL points at a running app; locally servers that are already
  // running are reused. The API applies migrations before it answers /api/health.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          name: 'API',
          command: apiCommand,
          cwd: '../backend',
          url: 'http://localhost:5297/api/health',
          reuseExistingServer: !isCI,
          timeout: 180_000,
        },
        {
          name: 'Web',
          command: isCI ? 'npm run preview' : 'npm run dev',
          url: baseURL,
          reuseExistingServer: !isCI,
          timeout: 120_000,
        },
      ],
});
