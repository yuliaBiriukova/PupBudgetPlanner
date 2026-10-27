# Progress log

Newest entries on top. Each entry: what was done, decisions, what's next.

## 2026-10-27 (11)

**Done**
- F-008: CI pipeline merged into `develop` (PR #8).
- F-009 (code part): multi-stage `Dockerfile` (Node 24 → .NET 10 SDK publish with ReadyToRun → `aspnet:10.0`,
  non-root, port 8080, workstation GC) and `.dockerignore`. The API serves the React build from `wwwroot` with an
  `index.html` fallback for client routes; unknown `/api` routes stay ProblemDetails 404s; `/assets` cached for a
  year, the rest `no-cache`. Forwarded headers (`For`/`Proto`) trusted from Render's proxy; HTTPS redirection only
  in Development, HSTS in production.
- `render.yaml`: Docker web service (free, Frankfurt, `main`, deploy after checks pass, health check
  `/api/health`, `ConnectionStrings__Database` set in the dashboard) and the Storybook static site.
- New CI job "Docker image": builds the image, runs it against PostgreSQL, smoke-tests health, SPA, client route
  and API 404. No local Docker, so CI is where the image is checked.
- Checked locally: the published app in `Production` against Neon `dev` (all routes and headers as expected);
  ReadyToRun `linux-x64` publish works. Backend: clean build, 15 tests pass.
- Owner setup steps written in the F-009 change file.

**Decisions**
- ADR 0010: Docker image and production hosting settings.

**Next**
- Owner: Render account + Blueprint, connection string (Neon `main`, direct), first release `develop` → `main`,
  cron-job.org keep-awake ping. Then measure memory and cold start and finish F-009.

## 2026-10-27 (10)

**Done**
- F-007: database and health check merged into `develop` (PR #7).
- F-008: GitHub Actions workflow `.github/workflows/ci.yml` with three parallel jobs — Backend (restore,
  Release build, tests), Frontend (lint, format check, type-check, unit tests, build, Storybook build) and
  E2E (Playwright against the real API with a PostgreSQL 17 service container; report uploaded on failure).
  npm and NuGet caching; older PR runs cancelled on a new push.
- Playwright's `webServer` now starts the API too (user-secrets / Neon `dev` locally) and, in CI, serves the
  production build with `vite preview` on port 4173. New E2E test: `/api/health` through the app's proxy.
  E2E (4 tests) passes locally in both modes; backend build is clean, 7 tests pass; lint, format, type-check,
  unit tests, build and Storybook build pass.

**Next**
- F-009: deployment to Render.

## 2026-10-27 (9)

**Done**
- F-006: Playwright setup merged into `develop` (PR #6).
- F-007: EF Core 10 + Npgsql in Infrastructure: `AppDbContext` with snake_case names, first migration
  (`data_protection_keys`), migrations applied on start-up, Data Protection keys stored in the database.
  Connection string `ConnectionStrings:Database` from user-secrets locally, environment variable in production.
  `GET /api/health` (no database access). New test projects `Api.Tests` and `Infrastructure.Tests`
  (7 tests in total); `dotnet-ef` as a local tool. Build is clean, tests pass.
- Neon project created by the owner (branches `main` and `dev`). Checked against `dev`: migration
  applied, Data Protection key stored and reused after a restart, `/api/health` returns 200 without a query.
- API produces JSON only; frontend API types regenerated (they now include `/api/health`).

**Decisions**
- ADR 0009: snake_case database names, migrations and a design-time factory in Infrastructure, EF Core
  versions pinned transitively.

**Next**
- F-008: CI pipeline.

## 2026-10-27 (8)

**Done**
- F-005: Storybook merged into `develop` (PR #5).
- F-006: Playwright 1.64 in `frontend/`: projects `desktop-chromium` and `mobile-chromium` (Pixel 7), web server
  starts `npm run dev` (reuses a running one locally), CI-ready settings, smoke test for the home page in
  `frontend/e2e/`. Scripts `e2e`, `e2e:ui`, `e2e:report`, `clean:playwright`. E2E (2 tests), lint, typecheck,
  unit tests and build pass.

**Next**
- F-007: database and health check.

## 2026-10-27 (7)

**Done**
- F-004: frontend scaffold merged into `develop` (PR #4).
- F-005: Storybook 10.6 (Vite builder) in `frontend/.storybook/`: stories wrapped in `AppProviders` (Mantine theme,
  query client, i18n), toolbar for light/dark mode, Mobile / Tablet / Desktop viewport presets (Mobile by default),
  docs and a11y addons, `eslint-plugin-storybook`. Sample story for `ColorSchemeToggle` with a play function.
  Lint, typecheck, tests, app build and Storybook build pass without warnings.

**Next**
- F-006: Playwright setup.

## 2026-10-27 (6)

**Done**
- F-003: backend scaffold merged into `develop` (PR #3).
- F-004: frontend scaffold in `frontend/`: Vite 8 + React 19 + TypeScript (strict), Mantine 9 with theme and
  light/dark mode, React Router 8, TanStack Query, react-i18next (English, typed keys), openapi-fetch client with
  generated types, ESLint + Prettier, Vitest + RTL + MSW (5 tests), `/api` dev proxy. Lint, typecheck, tests and
  build pass.

**Decisions**
- ADR 0008: frontend needs Node 24 LTS; TypeScript pinned to 5.9 (tooling doesn't support TypeScript 7 yet).

**Next**
- F-005: Storybook.

## 2026-10-27 (5)

**Done**
- F-003: backend scaffold in `backend/`: `PupBudgetPlanner.slnx` with Domain, Application, Infrastructure, Api and
  Domain.Tests, Application.Tests; central package management, warnings as errors, analyzers, `.editorconfig`.
  `dotnet build` is clean and `dotnet test` passes (3 tests).

**Decisions**
- ADR 0007: backend tests run on Microsoft.Testing.Platform (required by xUnit v3 4.x on the .NET 10 SDK).

**Next**
- F-004: frontend scaffold.

## 2026-10-27 (4)

**Done**
- F-001: planning docs merged into `develop` (PR #1, squash merge).
- F-002: private GitHub repo `yuliaBiriukova/PupBudgetPlanner` with `main` and `develop` (default branch);
  squash and merge commits allowed, rebase disabled, branches deleted after merge.

**Next**
- F-003: backend scaffold.

## 2026-10-27 (3)

**Done**
- Data model: enums documented (`TransactionType`, `CategoryKind`, `Currency`, `Institution`, `FamilyRole`,
  `RateSource`), stored as text; consistency rules for transactions.
- Change description files renamed from `README.md` to the folder name (`F-018-…/F-018-….md`);
  backlog links point to them.
- Rules added: squash merge for PRs into `develop` (merge commit for releases into `main`); every PR has a
  short description of its changes (template in `.github/pull_request_template.md`); a folder and description
  file are created as soon as a change is added to the plan.

**Next**
- Owner finishes reviewing the planning docs.
- F-002: `gh auth login`, create the repo, configure merge settings, open the F-001 pull request.

## 2026-10-27 (2)

**Done**
- Added the git workflow to `CLAUDE.md`: `main` (only deployed) ← `develop` ← `feature/F-…`,
  `improvement/I-…`, `bugfix/B-…`; commit messages start with the ID; pre-push checklist.
- Created `docs/changes/` with one folder per change and templates; 26 MVP features (F-001 – F-026)
  replace the old `T-xxx` tasks.
- Design process: 3 HTML prototypes per screen, stored in the change folder.
- Hosting revised (ADR 0002): one Render service serving SPA + API — standard setup, least risk for
  Google sign-in; keep-awake ping 07:00–23:00; Data Protection keys in the database.
- Storybook: free Render static site.
- All open questions answered.
- Branches `develop` and `feature/F-001-planning-docs` created locally.

**Next**
- F-002: owner runs `gh auth login`, then create the repo, push, open the F-001 pull request.
- F-003 / F-004: scaffold backend and frontend.

## 2026-10-27

**Done**
- Analysed the Google Sheets budget (Yulia 2026, Vlad 2026) and derived the default categories and the report layout.
- Agreed on the stack: ASP.NET Core (.NET 10) + React/TypeScript + Mantine, PostgreSQL on Neon, hosting on Render,
  GitHub Actions CI, Identity with Google sign-in, NBU exchange rates, Playwright for UI tests, Storybook.
- Created the repository with planning documents and ADRs 0001–0006.
- Installed the GitHub CLI.

**Decisions**
- Integration tests and email (Resend) moved to after the MVP; Google sign-in is in the MVP.
- Categories are personal; removing default categories and private data are after the MVP.
- One family per person. UI in English; Ukrainian later. Recurring transactions are out of scope.
