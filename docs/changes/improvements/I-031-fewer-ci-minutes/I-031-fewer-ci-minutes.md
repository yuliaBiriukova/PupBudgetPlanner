# I-031 · CI checks each change once, not two or three times

| | |
|---|---|
| Type | Improvement |
| Milestone | M6 — MVP release (development) |
| Priority | High (proposed: on 2026-11-12 GitHub warned that 90% of the month's 2,000 free Actions minutes were used, with 20 days left; past the limit, minutes are billed or CI stops) |
| Status | Todo |
| Branch | `improvement/I-031-fewer-ci-minutes` |
| Design | not needed (CI only) |
| Approved | 2026-11-12, the owner in chat ("Approved, build it") |

## Goal

Spend GitHub Actions minutes only on checks that can find something new, so CI stays within the free 2,000 minutes a
month without checking less before a change reaches `develop` or a release reaches production.

## Where the minutes went (2026-11-01 – 2026-11-12)

129 CI runs, 516 jobs, about **1,760 billed minutes** (GitHub's alert: 1,801). Every run is the same 4 jobs, about
13.6 minutes.

| Job | Minutes | Average per run |
|-----|--------:|----------------:|
| E2E (Playwright) | 754 | 5.8 |
| Frontend (lint, format, typecheck, unit tests, build, Storybook build) | 524 | 4.1 |
| Docker image | 333 | 2.6 |
| Backend | 149 | 1.2 |

| Trigger | Runs | Minutes |
|---------|-----:|--------:|
| Pull requests | 82 | 1,099 |
| Push to `develop` (the squash merge of a PR) | 40 | 563 |
| Push to `main` (a release) | 7 | 98 |

What can go:
1. **The push to `develop` repeats its PR's run** (563 minutes, 32%). Before every push, `develop` is merged into the
   branch (CLAUDE.md "Before every push"), so the PR's run already checked what the squash merge puts on `develop`.
2. **Docs-only pull requests run everything.** The `plan/…` PRs (15 runs, about 200 minutes) change only Markdown.
3. **The Docker image is built on every pull request** (2.6 minutes each). The image only matters for what Render
   deploys, which is `main`.

What stays:
- **The push to `main`.** Render deploys a release only after the GitHub checks on `main`'s commit pass
  (`render.yaml`, ADR 0002); with no run on that commit, the deploy would wait or go out unchecked.
- **The release PR `develop` → `main`** with every job, the Docker image included, so the owner sees the release
  green before merging it.

Expected: about 900 minutes a month at this month's pace instead of about 1,760 (roughly half).

## Acceptance criteria
- [ ] A pull request into `develop` that changes code runs Backend, Frontend and E2E; not the Docker image.
- [ ] A pull request that changes only docs (`docs/**`, `*.md`) starts no CI run.
- [ ] A squash merge into `develop` starts no CI run.
- [ ] A release PR `develop` → `main` and the push to `main` run all four jobs, the Docker image included; Render
      still deploys only after they pass.
- [ ] Docs say when CI runs and why: ARCHITECTURE.md "CI/CD", ADR 0010's "Consequences", a new ADR for the triggers.

## Tasks
- [ ] `ci.yml`: triggers `pull_request` (with `paths-ignore: docs/**, **/*.md`) and `push` to `main` only.
- [ ] `ci.yml`: the `docker` job runs only when the PR's base is `main` or on the push to `main`
      (`if: github.base_ref == 'main' || github.ref == 'refs/heads/main'`).
- [ ] Check on this branch's PR: no Docker job, the other three run. Check with a docs-only commit on a scratch PR (or
      the next `plan/…` PR) that no run starts.
- [ ] ADR `docs/decisions/0030-ci-runs-once-per-change.md`; ARCHITECTURE.md "CI/CD" (diagram and text: no run on
      `develop` pushes; the "enough for this project" line); ADR 0010 "Consequences": the image is tested on release
      PRs and `main`, not on every PR.

## Tests
- No app code changes, so no unit or E2E tests. The check is CI itself on this branch's PR (see Tasks) and the next
  release PR.

## Notes
- **What is lost:** a Dockerfile or `render.yaml` change is first built in CI on the release PR, not on its own PR.
  If it breaks, the release PR shows it and `main` isn't deployed. A change to the image can still be checked on its
  own PR by building it locally (`docker build .`), or we add the Docker job to PRs that touch the `Dockerfile` later.
- **Two PRs merged one after the other** aren't checked together on `develop` any more. Each is checked after
  `develop` is merged into it, and the release PR checks everything together before `main`.
- **No required status checks:** branch protection needs GitHub Pro on a private repo, so a PR whose run was skipped
  (docs only) isn't blocked waiting for checks.
- **For the rest of this cycle** (resets 2026-12-01): about 200 minutes are left, about 15 runs today, about 20 after
  this change. Optional, the owner's choice in GitHub → Settings → Billing → Budgets: a $0 Actions budget blocks
  any overage, but CI then stops until the reset.
- **Other options considered:** making the repo public (free minutes) was looked at and not chosen (2026-11-12): the
  repo stays private. GitHub Pro (3,000 minutes, branch protection) costs money every month.

