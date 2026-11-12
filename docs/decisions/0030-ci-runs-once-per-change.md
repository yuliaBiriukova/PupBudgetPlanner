# 0030. CI checks each change once: on its pull request, and a release on `main`

- Status: Accepted
- Date: 2026-11-12

## Context

The repo is private, so GitHub Actions has 2,000 free minutes a month. On 2026-11-12, 12 days into the cycle, 90% of
them were used: 129 runs of the same 4 jobs (Backend, Frontend, E2E, Docker image), about 13.6 minutes each. CI ran
on every pull request and on every push to `develop` and `main`. A third of the minutes went on pushes to `develop`,
which only repeat the PR's run: the PR is squash-merged, and `develop` is merged into the branch before every push
(CLAUDE.md "Before every push"). Docs-only `plan/…` PRs ran everything too (about 200 minutes), and every PR built the
Docker image, which only matters for what Render deploys from `main` (I-031).

## Decision

- **CI runs on pull requests and on the push to `main`**, not on the push to `develop`.
- **A pull request that changes only docs** (`docs/**`, `**/*.md`) starts no run. No Markdown file is part of the
  build.
- **The Docker image job runs only for a release**: on a PR into `main` and on the push to `main`
  (`if: github.base_ref == 'main' || github.ref == 'refs/heads/main'`).
- **The push to `main` keeps every job**: Render deploys a release only after the GitHub checks on `main`'s commit
  pass (ADR 0002), so that run is the deploy's gate.

## Consequences

- About half the minutes at the same pace (about 900 a month instead of about 1,760).
- A change to the `Dockerfile` or `render.yaml` is first built in CI on the release PR. If it breaks, the release PR
  is red and `main` isn't deployed. Build the image locally (`docker build .`) when changing it, or add the Docker job
  to PRs that touch these files if this happens.
- `develop` is no longer checked after each merge: two PRs merged one after the other are checked together only on
  the release PR, before `main`.
- No branch requires status checks (that needs GitHub Pro on a private repo), so a docs-only PR without a run isn't
  blocked. If required checks are turned on later, the docs-only rule must change (a skipped workflow leaves a
  required check waiting).
