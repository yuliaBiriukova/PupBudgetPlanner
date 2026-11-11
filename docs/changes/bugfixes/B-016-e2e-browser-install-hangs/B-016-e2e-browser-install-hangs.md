# B-016 · CI's E2E job hangs for 10–20 minutes installing the browser, then fails without running a test

| | |
|---|---|
| Type | Bugfix |
| Priority | High (a red CI on every pull request and on `develop` while Ubuntu's package mirrors can't be reached; nothing wrong in the app or the tests) |
| Status | Todo |
| Branch | `bugfix/B-016-e2e-browser-install-hangs` |
| Found in | CI, 2026-11-11, `E2E (Playwright)` job, step "Install Playwright browser" |
| Approved | — |

## Steps to reproduce
1. Run CI while the runner can't resolve `azure.archive.ubuntu.com` (as on 2026-11-11 from about 13:55 to 15:30 UTC).

## Expected
The E2E job installs Chromium in under a minute and runs the tests (a green job takes about 5–6 minutes).

## Actual
The step "Install Playwright browser" (`npx playwright install --with-deps chromium`) waits 8–12 minutes and fails
with apt's exit code 100, or runs until the job's 20-minute limit cancels it. No test runs. Four times on 2026-11-11:

| Run | What | Install step | Result |
|-----|------|--------------|--------|
| [43033488192](https://github.com/yuliaBiriukova/PupBudgetPlanner/actions/runs/43033488192) attempt 1 | B-014's PR | 7 min 45 s | failed (exit code 100) |
| [43037180391](https://github.com/yuliaBiriukova/PupBudgetPlanner/actions/runs/43037180391) | push to `develop` | 10 min 10 s | failed (exit code 100) |
| [43042750681](https://github.com/yuliaBiriukova/PupBudgetPlanner/actions/runs/43042750681) attempt 1 | B-013's PR (#82) | 10 min 06 s | failed (exit code 100) |
| [43042750681](https://github.com/yuliaBiriukova/PupBudgetPlanner/actions/runs/43042750681) attempt 2 | B-013's PR (#82), re-run | 17 min 48 s | cancelled by the job's 20-minute limit |

The earlier red E2E runs that week were real test bugs and are fixed: B-010 and B-015.

## Root cause
CI, not the app or the tests. `--with-deps` makes Playwright run `apt-get update` and `apt-get install` for the
system packages Chromium wants. On GitHub's `ubuntu-latest` (Ubuntu 24.04) image the libraries are already there
(the image has Google Chrome); what apt still installs are **9 font packages** (`fonts-freefont-ttf`,
`fonts-ipafont-gothic`, `fonts-wqy-zenhei`, `xfonts-*` …, 21 MB). On 2026-11-11 the runners couldn't resolve
`azure.archive.ubuntu.com` ("Temporary failure resolving"), and the fallback `security.ubuntu.com` failed too. apt
waited about 20 s per file and per mirror (4 index files, then 9 packages, each on two mirrors), so the step took
10 minutes and failed, or hung until the job's limit. The step has no time limit of its own, so a mirror outage costs
the whole 20 minutes.

The app doesn't need those fonts: it ships its own (Manrope and Unbounded, from `@fontsource`), and the E2E tests
compare no screenshots.

## Fix
Planned, not yet approved. Two options were weighed:

1. **Run the E2E job in Playwright's own image** (`mcr.microsoft.com/playwright:v1.64.1-noble`), which has Chromium
   and its packages, so nothing is installed with apt. But: a 2 GB image is pulled on every run (from another
   registry that can be down too); its tag has to be bumped by hand with every Playwright update in
   `package-lock.json`, or the job fails; Postgres is reached as `postgres` instead of `localhost` (the connection
   string changes); and `setup-dotnet` has to run inside the container, where .NET needs libraries the image may not
   have (ICU), which means apt again.
2. **Install only the browser, without apt** — chosen. Drop `--with-deps`: the runner already has Chromium's
   libraries, and the fonts aren't needed (see Root cause). Keep the downloaded browser in the Actions cache keyed by
   the Playwright version from `package-lock.json`, so most runs don't download it either; a Playwright update makes a
   new key on its own.

Why 2: it removes the step that hung, keeps the job as it is (the runner's .NET, Node and `localhost` Postgres), and
needs nothing kept in step by hand. If a future runner image lacks a library Chromium needs, Playwright fails at
once with a message naming it, not after 10 minutes.

In `.github/workflows/ci.yml`, job `e2e`:
- a step that reads the installed Playwright version (`npx playwright --version`);
- `actions/cache` for `~/.cache/ms-playwright`, key `playwright-<os>-<version>`;
- "Install Playwright browser": `npx playwright install chromium` (no `--with-deps`) with `timeout-minutes: 4`, so a
  download that hangs fails in 4 minutes, not 20. With the cache hit it only checks the browser is there.

## Tests
- CI on this change's pull request: the E2E job green, the install step without apt in its log, the cache saved; a
  re-run of the job restores the browser from the cache.
- The whole E2E suite runs in CI as before (desktop and phone); a green job time compared with the ~5–6 minutes before.
