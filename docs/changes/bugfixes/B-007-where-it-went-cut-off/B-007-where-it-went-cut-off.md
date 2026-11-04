# B-007 · "Where it went" is cut off and doesn't scroll

| | |
|---|---|
| Type | Bugfix |
| Priority | High (categories at the bottom can't be seen or picked on the main page) |
| Status | Todo |
| Branch | `bugfix/B-007-where-it-went-cut-off` (planned on `plan/prod-testing-fixes`) |
| Found in | 2026-11-04, production, owner's testing (desktop, Transactions page) |
| Approved | — (date the owner approved the root cause and the planned fix) |

## Steps to reproduce

1. Desktop, a month with spending in many categories (10 or more).
2. Transactions page; scroll down to "Where it went" in the left column, under the calendar.

## Expected

All the month's categories can be reached: the list scrolls inside the column (as F-020 planned: the column at most the
window's visible height, "Where it went" scrolling inside it), or the column is as tall as its content.

## Actual

The list ends mid-row ("Salon/Barber" cut in half at the bottom of the window); the wheel over it doesn't scroll it, and
the page's own scroll doesn't bring the rest into view.

## Root cause

Not confirmed yet. Suspected (`TransactionsPage.module.css`, `.left` and `.where`): the left column is `position:
sticky` and its height is capped at the window's visible height, set from a script as the page scrolls; "Where it went"
should take the rest and scroll in its `FadingScrollArea`. If the cap is not set (or set before the calendar's height is
known), or the scroll area gets no height of its own (`min-height: 0` missing in the flex column), the list overflows and
is clipped instead of scrolling. To check: with the calendar folded and unfolded, a short and a tall window.

## Fix

Planned after the cause is confirmed: the scroll area takes the column's remaining height (`flex: 1; min-height: 0`) and
the column's height follows the window and the calendar's fold, so the list scrolls inside it with its fades; every
category reachable.

## Tests

- Unit or E2E (Playwright, desktop): a month with many categories → the last category can be scrolled to and picked.
- Screens checked in Playwright screenshots (1440 px and a short window, light and dark; calendar folded and unfolded).

## Notes

- The screenshot was shared in chat; not stored in the repo (it shows real amounts).
