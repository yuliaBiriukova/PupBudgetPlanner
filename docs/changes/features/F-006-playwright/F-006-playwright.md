# F-006 · Playwright setup

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Done |
| Branch | `feature/F-006-playwright` |
| Design | not needed |

## Goal

UI tests that run real user flows in the browser.

## Acceptance criteria

- [x] Playwright config with desktop Chromium and a mobile device profile
- [x] Config starts the app automatically for local runs
- [x] One smoke test (the app opens)
- [x] `npm run e2e` and `npm run clean:playwright` scripts

## Tasks

- [x] Install Playwright
- [x] Write config with projects and web server
- [x] Write smoke test
- [x] Add scripts

## Tests

- Unit: —
- E2E (Playwright): Smoke test: the home page loads (page title, app name heading and the "coming soon" text),
  on desktop and mobile.

## Notes

- Playwright 1.64 (`@playwright/test`) in `frontend/`; tests live in `frontend/e2e/`, config in
  `frontend/playwright.config.ts`.
- Projects: `desktop-chromium` (Desktop Chrome) and `mobile-chromium` (Pixel 7). The phone profile is
  Chromium-based so one browser download (`npx playwright install chromium`) covers both; WebKit / iPhone can be
  added later if we need Safari coverage.
- `webServer` runs `npm run dev` on `http://localhost:5173`; locally a dev server that is already running is
  reused. `E2E_BASE_URL` points the tests at an app that is already running elsewhere and skips the web server
  (for F-008 / F-009).
- The API is not started yet: there is nothing to call. F-007 / F-008 add the API + PostgreSQL to the E2E run
  (Neon `dev` branch locally, PostgreSQL service container in CI, see ADR 0005).
- CI settings are already in the config (`CI` env): `forbidOnly`, 2 retries, 1 worker, GitHub reporter;
  the HTML report is always written to `playwright-report/` (not opened automatically), traces on the first
  retry, screenshots on failure.
- Tests read user-visible text from `src/shared/i18n/locales/en.json`, so copy changes don't break them.
- Scripts: `e2e`, `e2e:ui`, `e2e:report`, `clean:playwright` (cross-platform, plain Node). Output folders are
  ignored by git, ESLint and Prettier. `playwright.config.ts` and `e2e/` are type-checked through
  `tsconfig.node.json`.
