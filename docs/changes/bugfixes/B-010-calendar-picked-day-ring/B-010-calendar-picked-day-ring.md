# B-010 · The picked day's black ring is broken in the Transactions calendar

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: looks broken on the main screen, but the day is picked and the list is right) |
| Status | Todo |
| Branch | `bugfix/B-010-calendar-picked-day-ring` (planned on `plan/phone-feedback`) |
| Found in | Production, 2026-11-09, the owner's Android phone (Chrome), light theme |
| Approved | — (date the owner approved the root cause and the planned fix) |

## Steps to reproduce

1. On the phone, open Transactions with the calendar on "This week".
2. Tap the first day of the week (Monday).

## Expected

An even black ring all round the picked day, the same width on every side, as on the desktop.

## Actual

The ring is broken: its left side is cut off at the calendar card's edge, and at the top right the ring stops where the
next day begins (owner's screenshot, kept out of the repo as it shows the month's totals).

## Root cause

Suspected from reading the code, to be confirmed by reproducing it on the bugfix branch:

- The ring is drawn **outside** the cell (`TransactionsPage.module.css`, `.cell[aria-pressed='true']`: a 2 px body-colour
  gap and a 2 px ring, 4 px out), but the grid leaves only 2 px between the days. The next day is drawn over the ring's
  right side, and on Monday the calendar card (or its scroll area) clips the left side.
- Possibly also the phone's "stuck" hover after a tap: `.cell:hover:not(:disabled)` is more specific than the picked
  rule and swaps its `box-shadow` for the light hover ring (the same kind of sticky tint B-004 fixed in the currency
  list).

## Fix

To be proposed after reproducing. Likely: draw the ring **inside** the cell (an inset ring, as the week strip in the
quick-add form does), so nothing can cover or clip it, and keep the hover tint for devices that hover only
(`@media (hover: hover)`).

## Tests

- Regression test that fails before the fix and passes after it (E2E on the phone: the picked Monday's ring is
  inside the calendar card and not covered by Tuesday).
- Screens checked in Playwright screenshots (phone / desktop, light / dark): the first, a middle and the last day of
  the week picked, with and without spending.
