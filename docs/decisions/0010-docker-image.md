# 0010. Docker image and production hosting settings

- Status: Accepted
- Date: 2026-10-27

## Context

F-009 deploys the app to one free Render web service (ADR 0002): 512 MB of memory, a tenth of a CPU, and the
service sleeps after 15 minutes without traffic, so every morning starts cold. Render terminates HTTPS in its
proxy and redirects HTTP to HTTPS itself. There is no Docker on the owner's machine.

## Decision

- **One multi-stage `Dockerfile` in the repository root:** `node:24-slim` builds the React app, the .NET 10 SDK
  publishes the API, the `aspnet:10.0` runtime image runs it with the React build in `wwwroot`. Runs as the
  non-root `app` user, listens on port 8080 (`PORT=8080` on Render).
- **ReadyToRun** (`linux-x64`, framework-dependent): precompiled code for a faster cold start, at the cost of a
  bigger image (≈ 20 MB published instead of ≈ 10 MB).
- **Workstation GC** (`DOTNET_gcServer=0`): less memory; the app serves a family, not heavy traffic.
- **SPA hosting:** static files from `wwwroot`; client routes fall back to `index.html`; unknown `/api/…` routes
  stay ProblemDetails 404s. Hashed bundles under `/assets` are cached for a year (`immutable`), everything else
  is `no-cache`, so a release shows up on the next load.
- **Forwarded headers:** `X-Forwarded-For` and `X-Forwarded-Proto` are trusted from any address (Render's proxy
  addresses aren't fixed and the container is reachable only through it). The `Host` header is passed through by
  Render unchanged, so `X-Forwarded-Host` is not used.
- **HTTPS:** redirection only in Development; in production Render redirects and the app sends HSTS.
- **The image is checked in CI** (job "Docker image"): it is built and started against a PostgreSQL service
  container, and a smoke test checks `/api/health`, the SPA, a client route and an API 404. This replaces a
  local Docker check and runs before every deploy (Render deploys only after checks pass).
- **Memory is measured in CI**, not on Render (the free plan has no metrics): the container runs with the free
  instance's 512 MB limit and the job summary shows `docker stats` after start-up and after 400 requests.

## Consequences

- The production image is tested on every pull request, not only on Render.
- Builds on Render are independent of GitHub Actions; a Render build can still fail for Render-specific reasons
  (e.g. out of build minutes), which the deploy log shows.
- Switching to Server GC or to a bigger instance is a configuration change only.
