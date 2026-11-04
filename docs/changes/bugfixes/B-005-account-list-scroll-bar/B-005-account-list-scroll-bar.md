# B-005 · The account list's scroll bar covers the balances

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (the balances under the bar are hard to read; the list still works) |
| Status | Todo |
| Branch | `bugfix/B-005-account-list-scroll-bar` (planned on `plan/prod-testing-fixes`) |
| Found in | 2026-11-04, production, owner's testing (desktop, quick-add form) |
| Approved | — (date the owner approved the root cause and the planned fix) |

## Steps to reproduce

1. Desktop, a person with more accounts than fit in the list (about 8 or more).
2. Add transaction → click the Account field.

## Expected

The scroll bar runs beside the rows, in a gutter of its own, as in the currency list; every balance is readable.

## Actual

The scroll bar is drawn over the rows' right side, on top of the balances (`$2 851`, `$1 500`, `$4 000`).

## Root cause

Not confirmed yet. Suspected: the quick-add dropdown (`Picker.tsx`) scrolls in `FadingScrollArea` (I-004's custom bar),
which lays the bar over the content; the rows have no right padding for it, while the balances sit at the right edge.
The currency list has no balance at the right, so it doesn't show there. To check: the All categories dropdown, which
uses the same `Picker`.

## Fix

Planned: a gutter for the bar in the `Picker`'s list (right padding as wide as the bar plus a gap, or the scroll area's
`offsetScrollbars`), so no row is covered; the same in every list that scrolls with `FadingScrollArea`.

## Tests

- Screens checked in Playwright screenshots (1440 px, light and dark): the Account and All categories dropdowns with a
  long list, scrolled; the bar beside the rows, no amount under it.
- Unit (if it can be seen in jsdom): the list has its gutter.

## Notes

- Raised on 2026-11-04 together with I-024 (the same list shows no currency); they can be built one after the other.
- The screenshot was shared in chat; not stored in the repo (it shows real balances).
