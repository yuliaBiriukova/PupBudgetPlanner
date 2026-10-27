# F-008 · CI pipeline

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Review |
| Branch | `feature/F-008-ci-pipeline` |
| Design | not needed |

## Goal

Every push and pull request is built and tested automatically.

## Acceptance criteria

- [x] `.github/workflows/ci.yml` runs on pull requests and on pushes to `develop` and `main`
- [x] Backend: restore, build, test
- [x] Frontend: lint, type-check, unit tests, build; Storybook build
- [x] Playwright E2E against the real API with a PostgreSQL service container
- [x] Playwright report uploaded as an artifact when tests fail

## Tasks

- [x] Write backend job
- [x] Write frontend job
- [x] Write E2E job with PostgreSQL service
- [x] Add caching

## Tests

- Unit: —
- E2E (Playwright): Runs the whole E2E suite. New test `e2e/api.spec.ts`: `GET /api/health` through the app's
  `/api` proxy returns `{"status":"Healthy"}` — proves the app reaches the real API, which only starts listening
  after the migrations ran against the database.

## Notes

- Workflow `CI` (`.github/workflows/ci.yml`), three jobs that run in parallel on `ubuntu-latest`:
  - **Backend** — `dotnet restore`, `dotnet build --configuration Release`, `dotnet test` (MTP, ADR 0007).
    The SDK comes from `backend/global.json`.
  - **Frontend** — `npm ci`, `lint`, `format:check`, `typecheck`, `test`, `build`, `build-storybook`. Node from
    `frontend/.nvmrc` (ADR 0008).
  - **E2E (Playwright)** — PostgreSQL 17 service container (the Neon default major version); the connection
    string is a job environment variable (`ConnectionStrings__Database`) for a throwaway database, not a secret.
    Builds the API (Release) and the app, installs Chromium with its system dependencies, runs `npm run e2e`.
    On failure uploads `frontend/playwright-report/` as the `playwright-report` artifact (kept 14 days).
- Triggers: every pull request, and pushes to `develop` and `main`. A new push to a pull request cancels its
  older run; runs on `develop` / `main` always finish. The workflow token is read-only (`contents: read`).
- Caching: npm through `actions/setup-node` (`cache: npm`), NuGet packages through `actions/cache` keyed on the
  project files and `Directory.*.props`. Playwright browsers are not cached (Playwright advises against it: the
  system dependencies have to be installed anyway, and restoring takes about as long as downloading).
- Action versions: `checkout@v7`, `setup-node@v7`, `setup-dotnet@v6`, `cache@v6`, `upload-artifact@v7`.
- **Playwright now starts the real API** (change to F-006's config): `webServer` runs two servers —
  - API: `dotnet run --project src/PupBudgetPlanner.Api --launch-profile http` in `backend/`, ready when
    `http://localhost:5297/api/health` answers. Locally it uses the user-secrets connection string (Neon `dev`).
  - App: locally `npm run dev` (port 5173); in CI (`CI` env) `npm run preview` (port 4173) serves the production
    build, and the API runs with `--configuration Release --no-build`. `vite preview` reuses the `/api` proxy.
  - Locally servers that are already running are reused; `E2E_BASE_URL` still skips both.
- Branch protection ("require CI to pass before merging") is not available for private repositories on the
  free GitHub plan, so a red PR can technically still be merged — check the PR's checks before merging.
- Free plan: 2,000 Actions minutes/month for private repositories; one CI run takes a few minutes per job.
