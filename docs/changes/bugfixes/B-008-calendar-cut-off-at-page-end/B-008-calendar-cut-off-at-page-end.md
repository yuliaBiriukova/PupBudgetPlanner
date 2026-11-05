# B-008 · The calendar's top is cut off at the end of the Transactions page

| | |
|---|---|
| Type | Bugfix |
| Priority | High (a visible defect on the main screen, at the end of every month long enough to scroll) |
| Status | Done |
| Branch | `bugfix/B-008-calendar-cut-off-at-page-end` |
| Found in | 2026-11-05, local, in B-007's screenshots (desktop, Transactions page); there before B-007 |
| Approved | 2026-11-05 (owner, after seeing it in the Browser pane: "it's cut off when you scroll to the end of the page. fix it in this scope") |

## Steps to reproduce

1. Desktop (1440 × 900 or 1440 × 720), a month with enough transactions for the page to scroll.
2. Transactions page; scroll to the very end of the page.

## Expected

The left column (calendar and "Where it went") stays 16 px under the window's top, the whole Calendar card in view.

## Actual

The column is pushed up: the Calendar card's top border and rounded corners go under the window's top (its top at
−12 px at 1440 × 900).

## Root cause

The sticky left column is capped at the window's visible height (868 px at 1440 × 900: the window less 16 px above and
under it). The two columns' area under the totals ends where the receipts end, which at the end of the page is the
window's bottom less the page's bottom padding (852 px). A sticky element can't go past the end of the area it is in,
so the browser pushes the 868 px column up by the difference. Found in
[B-007](../B-007-where-it-went-cut-off/B-007-where-it-went-cut-off.md)'s screenshots; B-007 didn't cause it.

## Fix

`FitColumn` (`TransactionsPage.tsx`):

- The column also ends where the receipts beside it end, so at the end of the page it fits in its area and stays 16 px
  under the window's top.
- Never shorter than its parts' least height (the calendar as it is, "Where it went" at its `min-height`), so with
  short receipts (one category or one day picked) it keeps its size, as before.
- It fits again when the receipts change height (a `ResizeObserver`), not only on scroll and resize.

Nothing else changes; the phone and the tablet have no such column.

## Tests

- [x] E2E (`e2e/transactions.spec.ts`, the B-007 test: desktop, 1440 × 720, 14 categories): at the page's end the
  Calendar card's top is at least 16 px under the window's top. Fails without the fix (−12 px), passes with it.
- [x] Screens checked in Playwright screenshots at the page's end (1440 × 900 and 1440 × 720, light and dark, calendar
  folded and unfolded, the list scrolled to its end) and looked at; walked through in the Browser pane, with all
  categories and with one picked.
