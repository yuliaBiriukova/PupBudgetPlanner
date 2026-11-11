# B-017 · Two frontend unit tests fail on CI's `develop` runs that passed on their PRs

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (a red `develop` after a merge, the code itself green; one of the two causes is a real, if brief, glitch in the app) |
| Status | Todo |
| Branch | `bugfix/B-017-flaky-ci-unit-tests` |
| Found in | CI, `Frontend` job, pushes to `develop` on 2026-11-11: run 43002311103 (after B-012, #79) and run 43015219261 (after I-029, #78) |
| Approved | — |

## Steps to reproduce
1. Run the frontend unit tests on a busy machine, as CI's 4-core runner is with 4 test workers.
2. Or, for the Transactions test, on any machine: log the page's filters while the test runs (see "Root cause").

## Expected
Both tests pass every time, as they did on their pull requests.

## Actual
- Run 43015219261: `src/app/shell/AppLayout.test.tsx` › "app shell on the phone" › "opens on Transactions, marked in
  the tab bar" — the `Transactions` heading isn't found within the 1 s default wait (the test took 1.55 s).
- Run 43002311103: `src/features/transactions/TransactionsPage.test.tsx` › "opens on the phone with the Filters
  button; the sheet's picks show as chips" — the button "Clear account: Wallet" isn't found within the test's 4 s
  wait (the test took 6.1 s).

Each passed on its PR and on the next push; nothing else failed.

## Root cause
Two different causes.

**1. The Filters sheet's picks are dropped for a moment as it closes (a real race, in the app).** On the phone the
picks made in the Filters sheet wait in the page (a draft) and go into the address once the sheet's Back step is gone
(`useTransactionFilters.settle`, F-020 / I-015). `settle` writes the address and clears the draft in the same step,
but React Router's `setSearchParams` updates the address a moment later. So for one render the page has neither:
it shows **no filters at all**. Logged in the test on a quiet laptop, after "Show N transactions":

| ms after the tap | what the page shows |
|---|---|
| 51 | the sheet closes, filters Wallet + Expenses (the draft) |
| 65 | `settle` writes Wallet + Expenses to the address and clears the draft |
| 83 | **no filters**: no chips, "Filters" without a count; the summary and the list ask for the whole month |
| 420 | the address has caught up: Wallet + Expenses again, the chips back |

In the test this costs a re-render of the whole unfiltered page, two extra requests and their re-renders, and each
role query over this big page takes about 150 ms in jsdom (several times that under CI's load). The chip came 0.6–1.4 s
after the tap on a quiet laptop and 4.4–6.1 s into the test under load; on CI it ran past the 4 s wait. In the app the
same gap is a flash of the unfiltered page and its requests as the sheet closes (seen in the test's logs; not looked
at in a browser).

**2. The shell test's first wait is the file's cold start (timing only).** "opens on Transactions…" is the first test
in `AppLayout.test.tsx`: it pays for the file's first render of the whole app (Mantine, i18n, the first API answers
through MSW) before the heading shows. That takes 0.6 s on a quiet laptop and 1.4–1.8 s with the CPU busy, and its
`findByRole` waits the Testing Library default of 1 s. The page tests already wait up to 4 s for their first load
(`LOADED`, "The first render of the app can take over a second on a busy machine"); this file doesn't.

Reproduced: ten runs of both files with all 8 cores busy (eight busy-loop processes beside Vitest): the shell test at
1.4–1.8 s, close to its limit; the Filters test at 4.4–6.1 s. The logs above are from single runs with timing added
(removed again).

## Fix
1. **The race, in `useTransactionFilters.ts`:** the draft stays until the address has the settled picks. `settle`
   writes the address and keeps the draft; the draft is cleared once the address has moved from where it was when
   the sheet closed. When the picks end up as they were (nothing to write), the draft is cleared at once. No other
   behaviour changes: Back still leaves the page, picks still wait while the sheet's step is the current entry.
2. **The shell test's waits:** `LOADED` (4 s) moves to `src/test/render.tsx` next to `renderApp`, used by the page
   tests that define their own copy today (Accounts, Categories, Reports, Settings, Transactions), and
   `AppLayout.test.tsx` uses it for its first wait after each `renderApp`, where the app's first load is expected.
   No retries.

## Tests
- Regression test for the race in `TransactionsPage.test.tsx`: after "Show N transactions" the chips and the
  Filters count never go away (checked on every render until the list has loaded), and the API isn't asked for the
  unfiltered month. Fails before the fix, passes after it.
- `AppLayout.test.tsx` and `TransactionsPage.test.tsx` repeated ten times with all cores busy (as above), all
  passing; the Filters test's time noted before and after.
- The full frontend checks (lint, format, typecheck, unit tests, build) and CI on the PR.

## Notes
- Seen while reproducing, not part of this fix: under the heavier load of the reproduction (more than CI's) two
  I-025 tests in `TransactionsPage.test.tsx` ("adds on the day tapped in the calendar…", "adds on today again…") ran
  past Vitest's 5 s test limit. On CI they take 3.6–4.0 s. Left as is unless CI shows them failing.
