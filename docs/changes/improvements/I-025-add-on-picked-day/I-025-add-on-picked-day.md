# I-025 · Add transaction on the day picked in the calendar

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | High (set by the owner, 2026-11-04: adding a forgotten past transaction is the main reason to pick a day) |
| Status | Done |
| Branch | `improvement/I-025-add-on-picked-day` (planned on `plan/prod-testing-fixes`) |
| Design | not needed (the form and the page look as now; only the form's starting day changes) |
| Approved | 2026-11-05, the planned fix ("Approved, build it") |

## Goal

On the Transactions page a click on a calendar day shows only that day ("Only Sunday, 1 Nov"). Then Add transaction
opens the form on today (We 4) and the day has to be picked again. The owner expects the form to start on the picked day
(2026-11-04, production): the usual reason to look at a past day is to add what is missing on it.

## Acceptance criteria

- [x] While the Transactions page shows one day, Add transaction opens the form with that day picked: the week strip on
      that day's week, the day marked.
- [x] This holds for every Add transaction while the page shows that day: the dark slip's button, the sidebar's on the
      desktop, the + in the phone's bar, the empty day's button.
- [x] Without a picked day the form starts on today, as now. Other pages (Accounts' card +) start on today, as now.
- [x] The day can still be changed in the form; the next form opened elsewhere starts on today again.
- [x] After saving, the new transaction shows in the picked day's receipt.

## Fix (approved 2026-11-05)

Today every Add transaction calls `add()` on the form's provider, and `TransactionDialog`'s `initialState` starts a new
transaction on `today()`. The four buttons live in two places: the slip's and the empty day's on the Transactions page,
the sidebar's and the phone bar's in the app shell, which doesn't know the page's filters.

- **The page tells the provider which day it shows.** `TransactionFormProvider` keeps a "day on screen"; the
  Transactions page sets it to `filters.day` with a small hook (`useFormDay(filters.day)`) and clears it when the day is
  unpicked or the page is left. `add()` with no date of its own uses that day. So the shell's buttons need no change and
  don't have to read the Transactions page's address (the other way considered, rejected: it ties the shell to one
  page's URL format).
- **The form starts on the given day.** `FormRequest`'s add gets an optional `date`; `initialState` takes it for
  `date` and `week` (the week strip on that day's week) instead of `today()`. The exchange rate then is that day's, as
  when the day is picked in the form by hand.
- Unchanged: the day can be changed in the form; Accounts' card + and any page without a picked day start on today;
  the picked account still comes along from the slip's button.

## Tasks

- [x] `transactionForm.ts`: `add()` takes an optional `date` (next to `accountId`); the provider keeps the day on
      screen and a hook for the page to set it; `TransactionDialog` starts a new transaction on the request's date.
- [x] The Transactions page sets the day on screen from `filters.day`.
- [x] Unit tests for the form's starting day (given day, day on screen, today without one, cleared after leaving).

## Tests

- Unit (`TransactionsPage.test.tsx`): a day tapped in the calendar → the sidebar's and the slip's Add transaction open
  on it, and it is saved with that date; unpicked → today; picked, then the Accounts page → its card's + opens on
  today. The first fails without the page's `useFormDay`.
- E2E (`transactions.spec.ts`, desktop and phone): the 15th of last month tapped in the calendar → the shell's button
  (sidebar / tab bar's +) → that day is checked in the form → saved → it is on that day's receipt. Fails without the
  fix.
- Screens checked in Playwright screenshots (375 and 1440 px, light and dark): the page on a picked day and the form
  opened from it (the week strip on 12 – 18 Oct, Th 15 marked).

## Notes

- The empty day ("Nothing on …") has no button of its own; the "No transactions yet" page's button goes through the
  same `add()`, so every Add transaction starts on the day on screen.
- Answered by the owner (2026-11-04): a past month picked without a day opens the form on today; only a picked day
  counts.
- The screenshots were shared in chat; not stored in the repo (they show real amounts).
