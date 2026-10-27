# 0002. Hosting on Render (one service) with Neon PostgreSQL

- Status: Accepted
- Date: 2026-10-27 (revised the same day, before implementation: one service instead of
  static site + API, to minimise risk around Google sign-in)

## Context

Hosting must be free, simple, low-risk, and the app should feel always available. Google sign-in is
a must-have and must work without surprises. Azure (App Service F1) and Google Cloud Run were rejected
by the owner. No free option keeps a backend running 24/7 without managing a server yourself.

A split setup (React on a Render static site proxying `/api/*` to the API) was considered: it opens
instantly even when the API sleeps, but cookies and the Google OAuth callback would pass through Render's
proxy — non-standard and a risk for sign-in.

## Decision

- **One Render Web Service (free)** running **one Docker container**: ASP.NET Core serves the React build
  and the API (`/api`) from the same origin. Standard, well-documented setup for cookies and Google sign-in.
- **Keep-awake ping:** a free cron-job.org job calls `/api/health` every 14 minutes from 07:00 to 23:00
  Kyiv time (~500 of the 750 free instance hours per month). At night the service sleeps; the PWA opens from
  its cache and shows "Waking up the server…".
- **Database:** **Neon** PostgreSQL free plan (0.5 GB, no expiry). Render's free PostgreSQL is not used
  because it expires after 30 days.
- **Storybook:** a separate free Render static site.
- **Only `main` is deployed.** `render.yaml` Blueprint; Render deploys after GitHub checks pass.

## Consequences

- Least moving parts: one service, one origin, one Dockerfile.
- Data Protection keys must be stored in the database (the container's disk is wiped on restart).
- If the free tier stops being enough, switching the instance type to Starter (~$7/month) removes
  sleeping with no code changes.
