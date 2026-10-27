# F-009 · Deployment to Render

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | In progress |
| Branch | `feature/F-009-render-deployment` |
| Design | not needed |

## Goal

The app runs in production from `main`, and only from `main`.

## Acceptance criteria

- [x] Multi-stage `Dockerfile` builds the React app and the API into one image
- [x] ASP.NET Core serves the SPA (fallback to `index.html`) and the API under `/api`; forwarded headers enabled
- [x] `render.yaml`: web service tracks `main` and deploys only after GitHub checks pass; Storybook static site
- [ ] Secrets set as Render environment variables
- [ ] Keep-awake ping on cron-job.org: `/api/health` every 14 min, 07:00–23:00 Kyiv
- [ ] Memory use and cold-start time measured and written down here

## Tasks

- [ ] Owner creates Render and cron-job.org accounts
- [x] Write Dockerfile
- [x] Configure static files + SPA fallback
- [x] Write `render.yaml`
- [x] Build and smoke-test the image in CI (job "Docker image")
- [ ] Connect repo in Render (owner, see "Owner setup")
- [ ] First release: `develop` → `main`
- [ ] Set up keep-awake job (owner, see "Owner setup")
- [ ] Measure and record

## Tests

- Unit: cache headers for hashed bundles vs. other files (`SpaHostingExtensionsTests`).
- CI: the production image is built, started against PostgreSQL and checked: `/api/health`, `/`, a client
  route (gets `index.html`), an unknown `/api` route (404).
- Manual: the published app run locally in `Production` against Neon `dev` — same checks, plus `Cache-Control`
  headers and HSTS behind `X-Forwarded-Proto: https`.
- E2E (Playwright): smoke test against the production URL after the first release:
  `E2E_BASE_URL=https://<service>.onrender.com npm run e2e` in `frontend/`.

## Owner setup

Done once, by the owner, in the browser. Nothing here goes into the repository.

1. **Render account:** sign up at render.com with GitHub and allow access to the `PupBudgetPlanner` repository.
2. **Blueprint:** Render dashboard → **New → Blueprint** → pick the repository, branch `main`. Render reads
   `render.yaml` and creates two services: `pup-budget-planner` (web, Docker) and
   `pup-budget-planner-storybook` (static site).
3. **Connection string:** Render asks for `ConnectionStrings__Database`. Use the Neon **`main`** branch,
   **direct** (not pooled) connection, written in the Npgsql format:
   `Host=<ep-…>.neon.tech;Database=<db>;Username=<user>;Password=<password>;SSL Mode=Require`.
   (Migrations take a session-level lock, which doesn't work through the pooler.)
   Later changes: service → **Environment** (Render ignores `sync: false` values on Blueprint updates).
4. **First release** (after this PR is merged into `develop`): release pull request `develop` → `main`
   with a merge commit. CI runs on `main`, then Render builds and deploys.
5. **Check:** open `https://<service>.onrender.com` (home page) and `/api/health` (`{"status":"Healthy"}`).
6. **Keep-awake ping:** cron-job.org → **Create cronjob**:
   - URL: `https://<service>.onrender.com/api/health`, method GET
   - Schedule: custom — every 14 minutes (`*/14`), hours 7–22, time zone **Europe/Kyiv**
     (the last ping is at 22:56, so the service sleeps from about 23:10)
   - Notify on failure: on

## Measurements

To fill in after the first release.

| What | How | Result |
|---|---|---|
| Image size | CI job "Docker image", last line of the smoke test | |
| Memory after start-up | Render → service → Metrics → Memory | |
| Memory after a few page loads | Render → Metrics | |
| Cold start | after ≥ 15 min idle: `curl -o /dev/null -w "%{time_total}" https://<service>.onrender.com/api/health` | |
| Warm request | the same command again | |

## Notes

- Decisions: [ADR 0010](../../../decisions/0010-docker-image.md) (image, ReadyToRun, GC, SPA hosting,
  forwarded headers, HTTPS).
- `/api/health` doesn't touch the database, so Render's health checks and the keep-awake ping don't wake the
  Neon compute (it suspends after 5 minutes idle and wakes on the first query).
- Storybook rebuilds only when something under `frontend/` changes (`buildFilter`).
