# B-025 · The E2E clean-up times out after a big run and leaves test accounts in `dev`

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: only after a run with many tests, e.g. `--repeat-each=3`; the next run's clean-up removes the leftovers, but until then they sit in the shared `dev` database) |
| Status | Done |
| Branch | `bugfix/B-025-cleanup-timeout-after-big-runs` |
| Found in | I-033, 2026-11-13: the whole E2E suite with `--repeat-each=3` |
| Approved | 2026-11-14, the owner in chat ("Approved, build both") |

## Steps to reproduce
1. `npx playwright test --repeat-each=3` in `frontend/` (319 tests passed, about 10 minutes).
2. The `cleanup` teardown fails: "Test timeout of 30000ms exceeded."

## Expected
The clean-up deletes the run's `e2e-…@example.com` accounts and `E2E…` invite links, however many there are.

## Actual
It stops at Playwright's default 30 s. Run again on its own (`npx playwright test --project=cleanup
--timeout=300000`) it passed in 20 s and deleted what was left.

## Root cause
`cleanup.teardown.ts` has the default test timeout. Three full runs make several hundred test accounts; deleting
them, 200 at a time with all their data, on Neon takes longer than 30 s.

## Fix
The teardown has a timeout of its own, 5 minutes (`teardown.setTimeout(CLEANUP_TIMEOUT)`), in
`frontend/e2e/cleanup.teardown.ts`. Only the test file changes. Each API call keeps Playwright's 30 s limit; one
batch of 200 takes a few seconds.

## Tests
- [x] `npx playwright test --repeat-each=3` (2026-11-14): 319 tests passed, and the clean-up passed in 32.6 s, longer
      than the old 30 s limit, so this run would have failed before the fix.
- [x] ESLint, Prettier.
