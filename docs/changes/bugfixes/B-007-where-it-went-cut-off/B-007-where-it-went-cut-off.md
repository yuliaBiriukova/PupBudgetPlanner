# B-007 · "Where it went" is cut off and doesn't scroll

| | |
|---|---|
| Type | Bugfix |
| Priority | High (categories at the bottom can't be seen or picked on the main page) |
| Status | Done |
| Branch | `bugfix/B-007-where-it-went-cut-off` (planned on `plan/prod-testing-fixes`) |
| Found in | 2026-11-04, production, owner's testing (desktop, Transactions page) |
| Approved | 2026-11-05 (root cause and fix, owner: "Approved, build it") |

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

Confirmed 2026-11-05 (Storybook, the desktop's Transactions page, the column capped by hand at 600 px as the app's
script does): the column and "Where it went" shrink as planned, and the list's scroll area gets 91 px; but the scroll
area's inner viewport (Mantine `ScrollArea`) stays 240 px, the whole list. The viewport's height is `100%` of the scroll
area, and a percentage only works against a set height: the column has only a `max-height`, so nothing in the chain has
one, and the viewport grows to its content. With nothing to scroll inside it, the wheel does nothing, and the scroll
area (`overflow: hidden`) cuts the rest off. The sticky column stays put as the page scrolls, so the page's scroll
doesn't help either. The F-020 checks had few categories, so the list never had to scroll.

A smaller one, found reading the code: the cap is measured when the page opens and on scroll or resize. If the totals
above the column change height later (the month's figures arriving), the cap is a little off until the next scroll.

## Fix

Approved 2026-11-05:

1. `TransactionsPage.module.css`, `.whereScroll` (the desktop only): the scroll area is a flex column and its viewport
   takes the room it has (`flex: 1; min-height: 0`) instead of `height: 100%`, so the viewport is the scroll area's
   height and the list scrolls inside it, with its fades and the bar. Tried in place: the viewport becomes 91 px with
   240 px to scroll.
2. `FitColumn` (`TransactionsPage.tsx`): also measures again when the page's content changes size (a
   `ResizeObserver`), so the column ends 16 px above the window's bottom after the totals load too.

Nothing else changes: the phone and the tablet keep "Where it went" in the Filters sheet and dropdown.

## Tests

- [x] E2E (Playwright, desktop, a 1440 × 720 window, `e2e/transactions.spec.ts`): a month with spending in 14
  categories; down the page the last category is out of view; the wheel over the list brings it into view, and a click
  on it picks it (the address has the category). Without the CSS fix the test fails there (the wheel brings nothing
  into view); with it, it passes.
- [x] Screens checked in Playwright screenshots (1440 × 900 and 1440 × 720, light and dark; calendar folded and
  unfolded; at the top, down the page and at the list's end) and looked at.

## Notes

- The screenshot was shared in chat; not stored in the repo (it shows real amounts).
- Seen in the screenshots, not part of this bug and not changed: at the very end of the page, when the receipts are
  not much taller than the column, the sticky column is pushed up by its grid and the calendar's top edge goes under
  the window's top (the column is capped by the window, not by where the receipts end). It was there before this fix;
  fixed in [B-008](../B-008-calendar-cut-off-at-page-end/B-008-calendar-cut-off-at-page-end.md).
