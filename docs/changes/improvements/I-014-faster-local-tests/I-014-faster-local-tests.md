# I-014 · Faster, steadier tests on the owner's laptop

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | High |
| Status | Todo |
| Branch | `improvement/I-014-faster-local-tests` |
| Design | not needed |
| Approved | — |

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
- [ ] `npm test` passes 3 runs in a row on the owner's laptop, with no test timing out.
- [ ] `npm test` takes at most 60 s on the owner's laptop (now 1 min 45 s).
- [ ] `npm run e2e` from a cold start (API and Vite not running, Vite's cache cleared) passes 3 runs in a row on the
      owner's laptop, with no `page.goto` timeout.
- [ ] The laptop stays usable while the tests run: fewer parallel workers locally, as long as the times above hold.
- [ ] CI is unchanged or faster, and green.
- [ ] `CLAUDE.md` says how to test while working on a change: the affected test files while iterating, every suite
      once before the commit / push (as now).

## Tasks
- [ ] Vitest (`vite.config.ts`): measure `pool: 'vmThreads'`, `isolate: false` and a lower `maxWorkers` on the
      owner's laptop; keep the fastest setting that passes 3 runs in a row and keeps each test file isolated
      enough (no state leaking between files). Write down the measurements.
- [ ] People "picks at most 200 people at a time": find why it takes 5–8 s (200 rows with check boxes in jsdom) and
      make it lighter; only if that isn't enough, give this one test a longer timeout.
- [ ] Look at the other slow page tests (1–3.5 s: Accounts, sign up / sign in, invite page) for the same causes.
- [ ] Playwright (`playwright.config.ts`, `e2e/auth.setup.ts`): open the app once in `setup` before the parallel
      tests start, so Vite has prepared it; measure 2, 3 and 4 local workers and pick the fastest that passes cold.
      CI keeps 1 worker and its retries.
- [ ] If the cold start still fails: try running local E2E against `vite preview` (a build, as CI does) and compare.
- [ ] `CLAUDE.md`: the rule on running the affected tests while iterating, with the commands
      (`npx vitest run src/features/<feature>`, `npx playwright test e2e/<name>.spec.ts`).
- [ ] An ADR if the Vitest pool or isolation changes.

## Tests
- Unit: the whole suite 3 times in a row, timed, before and after.
- E2E (Playwright): the whole suite 3 times from a cold start, timed, before and after; its cleanup teardown
  removes the test accounts after every run.
- Screens checked in Playwright screenshots: not needed, no UI changes.

## Notes
- Measurements and the cause were found on 2026-10-31 by running every suite on the owner's laptop on `develop`;
  the E2E runs' `e2e-…` accounts were removed by the cleanup teardown.
- The backend tests (25 s) are fine and stay as they are.
