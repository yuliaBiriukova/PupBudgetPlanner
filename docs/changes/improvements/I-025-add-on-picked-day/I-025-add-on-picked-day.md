# I-025 · Add transaction on the day picked in the calendar

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | High (set by the owner, 2026-11-04: adding a forgotten past transaction is the main reason to pick a day) |
| Status | Todo |
| Branch | `improvement/I-025-add-on-picked-day` (planned on `plan/prod-testing-fixes`) |
| Design | not needed (the form and the page look as now; only the form's starting day changes) |
| Approved | — |

## Goal

On the Transactions page a click on a calendar day shows only that day ("Only Sunday, 1 Nov"). Then Add transaction
opens the form on today (We 4) and the day has to be picked again. The owner expects the form to start on the picked day
(2026-11-04, production): the usual reason to look at a past day is to add what is missing on it.

## Acceptance criteria

- [ ] While the Transactions page shows one day, Add transaction opens the form with that day picked: the week strip on
      that day's week, the day marked.
- [ ] This holds for every Add transaction while the page shows that day: the dark slip's button, the sidebar's on the
      desktop, the + in the phone's bar, the empty day's button.
- [ ] Without a picked day the form starts on today, as now. Other pages (Accounts' card +) start on today, as now.
- [ ] The day can still be changed in the form; the next form opened elsewhere starts on today again.
- [ ] After saving, the new transaction shows in the picked day's receipt.

## Tasks

- [ ] `transactionForm.ts`: `add()` takes an optional `date` (next to `accountId`); `TransactionFormProvider` starts the
      form on it.
- [ ] The Transactions page passes `filters.day` to the form; the app shell's buttons get it from the page (the shell's
      `add()` reads the page's address, or the page tells the provider which day it shows).
- [ ] Unit tests for the form's starting day.

## Tests

- Unit: the form opens on the given day; on today without one.
- E2E (Playwright): pick a past day in the calendar → Add transaction → the form shows that day → save → the
  transaction is in that day's receipt.
- Screens checked in Playwright screenshots (375 and 1440 px, light and dark): the form opened from a picked day.

## Notes

- Answered by the owner (2026-11-04): a past month picked without a day opens the form on today; only a picked day
  counts.
- The screenshots were shared in chat; not stored in the repo (they show real amounts).
