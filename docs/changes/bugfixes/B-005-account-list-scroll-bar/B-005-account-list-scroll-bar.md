# B-005 · The account list's scroll bar covers the balances

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (the balances under the bar are hard to read; the list still works) |
| Status | Done |
| Branch | `bugfix/B-005-account-list-scroll-bar` (planned on `plan/prod-testing-fixes`) |
| Found in | 2026-11-04, production, owner's testing (desktop, quick-add form) |
| Approved | 2026-11-05: the root cause, the planned fix and its prototype ("Approved, build it") |

## Steps to reproduce

1. Desktop, a person with more accounts than fit in the list (about 8 or more).
2. Add transaction → click the Account field.

## Expected

The scroll bar runs beside the rows, in a gutter of its own, as in the currency list; every balance is readable.

## Actual

The scroll bar is drawn over the rows' right side, on top of the balances (`$2 851`, `$1 500`, `$4 000`).

## Root cause

Confirmed on 2026-11-05 in Storybook (Transactions → Add Desktop, the Account and Category lists, 1440 px, light and
dark). Mantine's `ScrollArea` draws its bar over the content: a 12 px strip at the area's right edge (the thumb 6 px
wide, 10 px under the pointer, I-004's look). The desktop dropdown lists (`Picker.tsx`, `CurrencyPicker.tsx`) keep only
6 px of their own padding outside the scroll area, so the rows run under the bar, and a row's 10 px right padding is
all that is left between the bar and the balance. Measured: the bar's strip at 957–969 px, the balance's right edge at
959 px; under the pointer the thumb (958–968 px) touches the balance's last character (`$1 240`, `€300`, `₴`), and the
picked row's highlight runs under the bar. The currency list has the same layout; it shows less only because most of
its rows have nothing at the right (the check mark is on the picked one).

Not affected: bottom sheets (phone) and dialogs, whose bodies keep 16 px from the edge, and "Where it went", which
already has a 20 px gutter (B-007).

## Fix

`offsetScrollbars="present"` on the `FadingScrollArea` of the two desktop dropdowns: `Picker.tsx` (Account, Transfer
from / to, Category, the Transactions filter) and `CurrencyPicker.tsx` (Settings, the account form, the Reports pill).
Mantine gives the list a 12 px gutter on the right only while there is something to scroll: the bar runs beside the
rows, and no row or highlight is under it. A list too short to scroll (a search with few matches) keeps its full
width. The phone sheets, the dialogs and the Note field's suggestions don't change.

**Prototype** (approved 2026-11-05, deleted with the build): *Prototypes / B-005 Account list scroll bar* in
`frontend/src/prototypes/B-005-account-list-scroll-bar/`, the real quick-add and Accounts screens with the gutter
turned on by the story. Checked in Playwright at 1440 px, light and dark, under the pointer: in the Account, Category
and currency lists every row ended where the bar starts; a search that left nothing to scroll dropped the gutter.

## Tests

- [x] Unit (`Picker.test.tsx`, `CurrencyPicker.test.tsx`, new): on the desktop, the list's scroll area asks Mantine
  for the gutter. Both fail without the fix, pass with it.
- [x] E2E (`e2e/transactions.spec.ts`, desktop): a person with 10 accounts opens the Account list, scrolls it with the
  pointer over it; every row ends at or left of the bar. Fails without the fix, passes with it.
- [x] Screens checked in Playwright screenshots and looked at: the Account, Category and currency dropdowns at 1440 px,
  scrolled, under the pointer, light and dark (every row ends where the bar starts, 957 / 957 / 937 px); the phone's
  Account sheet at 375 px, light and dark (unchanged).

## Notes

- Raised on 2026-11-04 together with I-024 (the same list shows no currency); they can be built one after the other.
- The screenshot was shared in chat; not stored in the repo (it shows real balances).
