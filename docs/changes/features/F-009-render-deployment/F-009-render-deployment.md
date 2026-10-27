# F-009 · Deployment to Render

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Done |
| Branch | `feature/F-009-render-deployment` |
| Design | not needed |

## Goal

The app runs in production from `main`, and only from `main`.

## Acceptance criteria

- [x] Multi-stage `Dockerfile` builds the React app and the API into one image
- [x] ASP.NET Core serves the SPA (fallback to `index.html`) and the API under `/api`; forwarded headers enabled
- [x] `render.yaml`: web service tracks `main` and deploys only after GitHub checks pass; Storybook static site
- [x] Secrets set as Render environment variables
- [x] Keep-awake ping on cron-job.org: `/api/health` every 14 min, 07:00–23:00 Kyiv
- [x] Memory use (in CI with a 512 MB limit: Render's free plan has no metrics) and cold-start time measured
  and written down here

## Tasks

- [x] Owner creates Render and cron-job.org accounts
- [x] Write Dockerfile
- [x] Configure static files + SPA fallback
- [x] Write `render.yaml`
- [x] Build and smoke-test the image in CI (job "Docker image")
- [x] Connect repo in Render (owner, see "Owner setup")
- [x] First release: `develop` → `main` (PR #10)
- [x] Set up keep-awake job (owner, see "Owner setup")
- [x] Measure memory in CI: container limited to 512 MB, `docker stats` in the job summary
- [x] Measure and record

## Tests

- Unit: cache headers for hashed bundles vs. other files (`SpaHostingExtensionsTests`).
- CI: the production image is built, started against PostgreSQL and checked: `/api/health`, `/`, a client
  route (gets `index.html`), an unknown `/api` route (404).
- Manual: the published app run locally in `Production` against Neon `dev` — same checks, plus `Cache-Control`
  headers and HSTS behind `X-Forwarded-Proto: https`.
- E2E (Playwright): smoke test against the production URL after the first release:
  `E2E_BASE_URL=https://pup-budget-planner.onrender.com npm run e2e` in `frontend/` — 4/4 passed on 2026-10-27.
- Production, checked on 2026-10-27: `/api/health` 200, `/` and `/reports/2026` → `index.html` (`no-cache`),
  `/api/nope` → 404 ProblemDetails, HTTP → HTTPS 301, HSTS, `/assets` `immutable` and Brotli-compressed by
  Render (JS bundle 495 KB → 156 KB transferred), Storybook site 200.

## Production

- App: https://pup-budget-planner.onrender.com
- Storybook: https://pup-budget-planner-storybook.onrender.com

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

Render's free plan has no memory / CPU metrics, so memory is measured in CI: same image, container limited to
the free instance's 512 MB (job "Docker image", step "Memory use", shown in the job summary).

| What | How | Result (2026-10-27) |
|---|---|---|
| Image size | CI job "Docker image" | 251 MB |
| Memory after start-up and the smoke test | CI, `docker stats` | 44 MiB of 512 MiB (9 %) |
| Memory after 400 more requests | CI, `docker stats` | 57 MiB of 512 MiB (11 %) |
| Warm request, `/api/health` and `/` | `curl -o /dev/null -w "%{time_total}" https://pup-budget-planner.onrender.com/api/health` | 0.15–0.17 s |
| Cold start | the same command after 17 min idle (cron job paused) | 23.4 s; the next requests 0.17–0.19 s |

## Notes

- Decisions: [ADR 0010](../../../decisions/0010-docker-image.md) (image, ReadyToRun, GC, SPA hosting,
  forwarded headers, HTTPS).
- `/api/health` doesn't touch the database, so Render's health checks and the keep-awake ping don't wake the
  Neon compute (it suspends after 5 minutes idle and wakes on the first query).
- Storybook rebuilds only when something under `frontend/` changes (`buildFilter`).
