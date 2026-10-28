# B-001 · Flaky "server answers quickly" unit test

| | |
|---|---|
| Type | Bugfix |
| Status | Done |
| Branch | `bugfix/B-001-flaky-server-wake-test` |
| Found in | CI on `develop`, 2026-10-27, push run for PR #14 (Frontend job) |

## Steps to reproduce
1. Run `npm test` in `frontend/` on a busy machine (as on the CI runner), or make the `/api/health` mock answer
   after a short real delay (50 ms).
2. Look at `useServerWake.test.tsx` → "shows nothing when the server answers quickly".

## Expected
The test passes: a quick health check shows neither the "Waking up the server…" pill nor "Connected".

## Actual
Sometimes it fails: "Connected" (or the pill with "5 s") is on the screen.

## Root cause
The test fakes the clock (`Date`, `setInterval`), but MSW and TanStack Query run in real time. It moved the fake
clock 5 s right after the page was drawn, without waiting for the start-up health check. When the check was
still running at that moment, the shell saw a request "running" for 5 s and treated the server as waking up.
The hook itself is right: in the browser the clock does not jump.

## Fix
- `renderApp` returns its `QueryClient`.
- The test waits until no request is running and the shell has seen it (TanStack Query tells subscribers on a
  real `setTimeout(0)`, so the helper lets one run) before it moves the clock.

## Tests
- Regression: the health mock in that test now answers after a real 50 ms delay. Before the fix the test failed
  every time; after it, it passes (5 runs in a row). Without the `setTimeout(0)` step it still failed 1 run in 3.
- Lint, build and all 22 unit tests pass. No E2E change: only test code changed.
