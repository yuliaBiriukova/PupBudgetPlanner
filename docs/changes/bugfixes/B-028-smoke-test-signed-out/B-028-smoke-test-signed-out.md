# B-028 · The smoke test "the app opens on Transactions" can't pass on production

| | |
|---|---|
| Type | Bugfix |
| Priority | Low (only the hand check after a release; the app is right) |
| Status | Done |
| Branch | `bugfix/B-028-smoke-test-signed-out` |
| Found in | F-026's production smoke check after the MVP release (PR #107), 2026-11-14 |
| Approved | 2026-11-14, the owner in chat ("do option 1": the test checks what's true signed out) |

## Steps to reproduce
1. After a release, run the check the release PRs give:
   `E2E_BASE_URL=https://pup-budget-planner.onrender.com npx playwright test e2e/smoke.spec.ts --no-deps`.
2. "the app opens on Transactions" fails on phone and desktop: the page ends on `/sign-in`, not `/transactions`.

## Expected
Both smoke tests pass against production without an account there.

## Actual
The icon test passes; the Transactions test fails at `toHaveURL(/\/transactions$/)`.

## Root cause
`smoke.spec.ts` was written in F-010, before sign-in (F-011). Since then the E2E projects start signed in: the
`setup` project signs a test person in on `dev` and saves the session. Against production the release check skips
`setup` on purpose (`--no-deps`, so no test account is made there), so the test runs signed out and the app rightly
sends it to Sign in. Earlier release PRs gave the same command; it would have failed there too.

## Fix
The smoke tests start signed out, as `auth.spec.ts` does, and check what is true for anyone: `/` opens Sign in, with
the app's name, the Email and Password fields and the Sign in button. The signed-in start on Transactions is covered
by the other E2E tests (`transactions.spec.ts` and the rest). The README says how to run the smoke tests against
production after a release. Only the test and the README change.

## Tests
- [x] `npx playwright test e2e/smoke.spec.ts --repeat-each=3` locally (dev server and API), phone and desktop.
- [x] The same against production (`E2E_BASE_URL=https://pup-budget-planner.onrender.com … --no-deps`): it only opens
      pages and reads the icons, nothing is created.
- [x] ESLint, Prettier, typecheck.
