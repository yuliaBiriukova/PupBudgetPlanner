# B-015 · Two E2E tests fail in CI between midnight and 02:00 in Kyiv

| | |
|---|---|
| Type | Bugfix |
| Priority | High (a red CI on any pull request pushed late in the evening; nothing wrong in the app) |
| Status | Done |
| Branch | `improvement/I-029-popup-height-and-keyboard` (fixed on the pull request whose CI it failed, #78) |
| Found in | CI on PR #78, 2026-11-11 00:39 in Kyiv (2026-11-10 22:39 UTC), E2E job, desktop and phone |
| Approved | 2026-11-11: the owner turned on Auto-fix for PR #78 ("Turn on Auto-fix"), which covers fixing its failing CI |

## Steps to reproduce
1. Run the E2E tests on a machine whose clock is in UTC (CI's runner) between 22:00 and 24:00 UTC, when it is
   already the next day in Kyiv.

## Expected
`e2e/transactions.spec.ts` passes, as it does the rest of the day and on a laptop in Kyiv.

## Actual
Two tests fail on all three tries:
- "a person finds the month's eating out, changes one on its receipt and deletes another…" (desktop and phone): the
  receipt "Today, …" with "Total −1 142 ₴" isn't found;
- "on the desktop, a month with many categories: Where it went scrolls in its column…": the last category can't be
  hovered.

## Root cause
The tests, not the app. Their helper `addExpense` dates what it adds with **Kyiv's** today, as the API counts days
(`new Date().toLocaleDateString('sv', { timeZone: 'Europe/Kyiv' })`), but the browser Playwright starts has the
machine's time zone. On CI that is UTC: after midnight in Kyiv the expenses are dated the 11th while the page's own
today is still the 10th, so there is no "Today" receipt and the day is one the page doesn't show yet (no days after
today). On the owner's laptop the browser is in Kyiv, so it never showed there. `reports.spec.ts` already counts its
days in Kyiv for the same reason.

## Fix
The E2E tests run in the time zone the app's people are in: `playwright.config.ts` sets `timezoneId: 'Europe/Kyiv'`
for the browser and `TZ` for the tests' own code (the days they work out with `dayjs()`), so the page, the tests and
the API agree on the day at any hour.

## Tests
- Shown failing first: with the tests' time zone set to one that is a day behind Kyiv (`Pacific/Honolulu`, at
  11:45 in Kyiv), "a person finds the month's eating out…" fails with CI's own error, the "Today" receipt with
  "Total −1 142 ₴" not found; with `Europe/Kyiv` it and "a month with many categories…" pass.
- The full E2E suite, desktop and phone.
