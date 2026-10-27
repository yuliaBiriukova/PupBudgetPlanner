# F-004 · Frontend scaffold

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Done |
| Branch | `feature/F-004-frontend-scaffold` |
| Design | not needed |

## Goal

An empty React app with all agreed libraries wired up.

## Acceptance criteria

- [x] Vite + React + TypeScript (`strict`) in `frontend/`
- [x] Mantine (core, dates, charts, form, notifications) with a theme file and light/dark mode
- [x] React Router, TanStack Query, react-i18next (English) configured
- [x] ESLint + Prettier; Vitest + React Testing Library + MSW with one sample test
- [x] Dev server proxies `/api` to the local API; script to generate API types from OpenAPI

## Tasks

- [x] Create Vite project
- [x] Add Mantine and the theme
- [x] Add router, query client and i18n providers
- [x] Configure lint/format
- [x] Configure Vitest, RTL, MSW
- [x] Add `openapi-typescript` script
- [x] Add dev proxy

## Tests

- Unit: the home page shows the app name and switches light/dark mode; an unknown address shows the
  "Page not found" page that links back home; the MSW test server answers mocked requests and fails
  unmocked ones.
- E2E (Playwright): — (Playwright comes with F-006)

## Notes

- Versions: React 19.3, Vite 8, Mantine 9, React Router 8, TanStack Query 5, i18next 26, Vitest 5, MSW 3.
- **Node 24 LTS** is required (`frontend/.nvmrc`, `engines`): Vitest 5, jsdom 30, React Router 8 and MSW 3
  need Node 22+. **TypeScript is pinned to 5.9**: typescript-eslint and openapi-typescript do not support
  TypeScript 7 yet. See [ADR 0008](../../../decisions/0008-frontend-toolchain.md).
- The Vite template now ships oxlint; it was replaced with ESLint + Prettier as agreed. ESLint uses
  typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`, react-hooks, react-refresh and the
  TanStack Query plugin; `eslint-config-prettier` turns off formatting rules.
- TypeScript: `strict` and `noUncheckedIndexedAccess`. i18n keys are type-checked against `en.json`.
- Layout follows ARCHITECTURE.md: `src/app` (providers, routes, theme), `src/features/<feature>`,
  `src/shared` (api, i18n, ui), `src/test` (Vitest setup, MSW server, `renderApp` helper).
- Color scheme follows the system on the first visit (`defaultColorScheme="auto"`), the toggle remembers the
  choice. Week starts on Monday (`DatesProvider`).
- API types: `npm run api:types` reads `http://localhost:5297/openapi/v1.json` from the running API and writes
  `src/shared/api/schema.ts` (committed, so builds and CI don't need the API). The API has no endpoints yet,
  so `paths` is empty. `apiClient` (openapi-fetch) is the typed client for the query hooks.
- MSW 3 renamed the `onUnhandledRequest` option to `onUnhandledFrame`; tests use `'error'`, so any request
  without a handler fails the test.
- The temporary home page and the color scheme toggle get Storybook stories in F-005.
- Checked manually: dev server renders the page in light/dark and at 375 px width; `/api/*` is proxied to the
  API (Kestrel answered).
