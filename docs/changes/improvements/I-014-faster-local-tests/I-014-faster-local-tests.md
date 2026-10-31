# I-014 · Faster, steadier tests on the owner's laptop

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | High |
| Status | Done |
| Branch | `improvement/I-014-faster-local-tests` |
| Design | not needed |
| Approved | 2026-10-31, "Approved, build it" |

## Goal
The tests run faster and stop failing on timeouts on the owner's laptop (Intel i5-10300H, 4 cores / 8 threads,
32 GB), so building a change doesn't stall for an hour. Found by the owner after I-011, 2026-10-31: the session ran
for almost an hour, looked stuck and loaded the computer.

## What we measured (2026-10-31, `develop` at 43f99d4)

| Suite | Time | Result |
|-------|------|--------|
| Backend (`dotnet test`) | 25 s | all pass |
| Frontend unit (`npm test`, Vitest) | 1 min 45 s (Vitest: 94 s) | 1 failed: People "picks at most 200 people at a time" timed out at 5 s |
| E2E, cold start (`npm run e2e`) | 1 min 50 s | 4 failed: the first `page.goto` of desktop tests timed out at 30 s; CPU at 90–100% |
| E2E, run again straight after | 52 s | all pass (42, 2 skipped) |

- **Unit tests:** only 8% of the time is the tests themselves: setup 41%, creating jsdom 29%, imports 16%. Each of
  the 13 test files loads jsdom, Mantine, i18n and the MSW server again, on all 8 threads at once; Vitest itself
  suggests `pool: 'vmThreads'` or `isolate: false`. Page tests take 1–3.5 s each, and the 200-people test 5–8 s,
  so it fails on almost every run here (also noted in the I-011 and I-012 progress entries).
- **E2E:** locally Playwright starts the API and the Vite dev server and runs 4 workers (half the threads). On a
  cold start they all open the app while Vite is still preparing it, and with no retries locally the first tests
  fail. Once warm the suite passes. The I-011 notes also have a one-off "That didn't go through" in `auth.spec`.
- **Re-runs add up:** every failure makes Claude re-run and investigate, and each run is about 2 silent minutes.
  Running every Storybook story (~10 min) is already gone (I-010 dropped).

## Acceptance criteria
- [x] `npm test` passes 3 runs in a row on the owner's laptop, with no test timing out.
- [x] `npm test` takes at most 60 s on the owner's laptop: 25–28 s (the 1 min 45 s measured first was a cold run;
      warm, `develop` took 22–25 s with a timeout in half the runs).
- [x] `npm run e2e` from a cold start (API and Vite not running, Vite's cache cleared) passes 3 runs in a row on the
      owner's laptop, with no `page.goto` timeout: 58–59 s each.
- [x] The laptop stays usable while the tests run: E2E at 36–46% CPU on average (was 75%, peaks at 100%), unit
      tests on 4 workers instead of 7.
- [x] CI is unchanged or faster, and green: CI keeps 1 E2E worker and its retries; on its 4-core runner Vitest gets
      4 workers instead of the default 3. CI ran on the PR.
- [x] `CLAUDE.md` says how to test while working on a change: the affected test files while iterating, every suite
      once before the commit / push (as now).

## Tasks
- [x] Vitest (`vite.config.ts`): measured on the owner's laptop (Vitest's own duration, one run each unless noted):

      | Setting | Time | Result |
      |---------|------|--------|
      | default (`forks`, 7 workers) | 22 s | People test timed out |
      | `forks`, 4 workers | 24 s | all pass |
      | `threads` | 21 s | People test timed out |
      | `threads`, 4 workers | 26 s | People test timed out |
      | `vmThreads` (4 or 7 workers) | 49–51 s | 54 tests fail |
      | `threads`, `isolate: false`, 4 workers (4 runs) | 16–19 s | 1 of 4 runs: People test timed out |

      Kept the default pool with isolation and `maxWorkers: 4`: about as fast as 7 workers and half the CPU.
      `isolate: false` was 7 s faster but lets one file's state leak into the next, which makes failures hard to
      read; not worth it at this size.
- [x] People "picks at most 200 people at a time": 3.5 s on its own, timed step by step. The time goes on rendering
      209 Mantine rows, twice when all are picked, and the dialog steps; queries by label instead of by role saved
      0.3 s. It needs more than 200 people, so it keeps them and gets a 15 s timeout (like the Accounts test's
      10 s).
- [x] The other slow page tests (1–3.5 s alone) render the whole app the same way; none timed out in the 3 runs on
      4 workers, so they stay as they are.
- [x] Playwright (`playwright.config.ts`, `e2e/auth.setup.ts`): `setup` opens the signed-in app once (up to 2 min)
      before the tests run in parallel. Cold runs: 4 workers 71 s (CPU 75%, peak 100%), 2 workers 75 s (42%), 3
      workers 58 s (39%), all passing; local default now 3. CI keeps 1 worker and its retries.
- [x] Running local E2E against `vite preview` was not needed: the cold start passes with the warm-up.
- [x] `CLAUDE.md`: the rule on running the affected tests while iterating, with the commands, and on running a
      suite longer than a minute in the background.
- [x] No ADR: the Vitest pool and isolation stay as they are.

## Tests
- Unit: the whole suite 3 times in a row after the change: 112 passed each time, 23–26 s (Vitest) / 25–28 s
  (`npm test`).
- E2E (Playwright): 3 cold runs after the change (Vite's cache cleared, servers started by Playwright): 42 passed,
  2 skipped, 58–59 s each; the cleanup teardown removed the test accounts after every run.
- Backend: 203 passed. Typecheck, lint, Prettier and the build pass.
- Screens checked in Playwright screenshots: not needed, no UI changes.

## Notes
- Measurements and the cause were found on 2026-10-31 by running every suite on the owner's laptop on `develop`;
  the E2E runs' `e2e-…` accounts were removed by the cleanup teardown.
- The backend tests (25 s) are fine and stay as they are.
- A first run after a while is slower (the first unit run took 94 s, the next ones 22–25 s): files are read from
  disk and checked again. Nothing in the repo changes that.
