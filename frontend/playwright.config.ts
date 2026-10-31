import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE, BASE_URL, E2E_ADMIN } from './e2e/auth.ts';

const isCI = !!process.env.CI;

// The dev server locally, `vite preview` in CI (see e2e/auth.ts); both proxy /api to the API
const baseURL = BASE_URL;

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
  // Locally 3: the fastest from a cold start on the owner's 8-thread laptop, at about 40% CPU (4 took 100%, I-014)
  workers: isCI ? 1 : 3,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Creates a person and keeps their cookies, so the app's tests start signed in (auth.spec.ts starts signed out).
    // Once the projects that depend on it finish, passed or failed, `cleanup` removes the test data (I-007).
    { name: 'setup', testMatch: /auth\.setup\.ts$/, teardown: 'cleanup' },
    { name: 'cleanup', testMatch: /cleanup\.teardown\.ts$/ },
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
          // A Google client that only gets as far as Google's sign-in page (e2e/auth.spec.ts); a real one from the
          // environment wins
          env: {
            Authentication__Google__ClientId:
              process.env.Authentication__Google__ClientId ?? 'e2e-google-client',
            Authentication__Google__ClientSecret:
              process.env.Authentication__Google__ClientSecret ?? 'e2e-google-secret',
            // Invite-only sign-up with the tests' admin (F-028); locally a reused API reads it from user-secrets
            Access__SignUp: 'InviteOnly',
            Access__AdminEmails__1: E2E_ADMIN.email,
          },
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
