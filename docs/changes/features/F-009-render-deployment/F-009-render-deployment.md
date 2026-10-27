# F-009 · Deployment to Render

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Todo |
| Branch | `feature/F-009-render-deployment` |
| Design | not needed |

## Goal

The app runs in production from `main`, and only from `main`.

## Acceptance criteria

- [ ] Multi-stage `Dockerfile` builds the React app and the API into one image
- [ ] ASP.NET Core serves the SPA (fallback to `index.html`) and the API under `/api`; forwarded headers enabled
- [ ] `render.yaml`: web service tracks `main` and deploys only after GitHub checks pass; Storybook static site
- [ ] Secrets set as Render environment variables
- [ ] Keep-awake ping on cron-job.org: `/api/health` every 14 min, 07:00–23:00 Kyiv
- [ ] Memory use and cold-start time measured and written down here

## Tasks

- [ ] Owner creates Render and cron-job.org accounts
- [ ] Write Dockerfile
- [ ] Configure static files + SPA fallback
- [ ] Write `render.yaml`
- [ ] Connect repo in Render
- [ ] Set up keep-awake job
- [ ] Measure and record

## Tests

- Unit: —
- E2E (Playwright): Smoke test against the production URL after the first release.

## Notes

- —
