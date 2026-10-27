# 0002. Hosting on Render with Neon PostgreSQL

- Status: Accepted
- Date: 2026-10-27

## Context

Hosting must be free, simple, and the app should feel always available. Azure (App Service F1:
sleeps, no custom domain, CPU quota) and Google Cloud Run were rejected by the owner as too complicated.
No free option keeps a backend running 24/7 without managing a server yourself.

## Decision

- **Frontend:** Render **Static Site** (free, CDN, never sleeps).
- **API:** Render **Web Service** (free, Docker image built by Render from `backend/`).
  It sleeps after 15 minutes without traffic; waking up can take up to about a minute.
- The static site **rewrites `/api/*`** to the API service URL, so the browser sees one origin
  (no CORS, first-party auth cookie).
- **Database:** **Neon** PostgreSQL free plan (0.5 GB, no expiry). Render's free PostgreSQL is not
  used because it expires after 30 days.
- **Storybook:** a second Render static site.
- **Infrastructure as code:** `render.yaml` Blueprint; Render deploys `main` only after GitHub
  checks pass.

## Consequences

- The app opens instantly; only the first API call after idle time is slow (UI shows a "waking up" state).
- Optional keep-awake ping during the day (Q-002).
- Cookie and Google OAuth behavior through the rewrite must be verified (spike T-007).
  **Fallback:** serve the SPA from the API container (one service, one origin).
- Upgrading later (Render paid instance, ~$7/month) removes sleeping without code changes.
