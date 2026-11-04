# B-004 · Can't type in the currency search of the account form

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (the search is dead, but the currency can still be found by scrolling the list) |
| Status | Todo |
| Branch | `bugfix/B-004-currency-search-not-typing` (planned on `plan/prod-testing-fixes`) |
| Found in | 2026-11-04, production, owner's testing (desktop, New account form) |
| Design | 🎨 3 prototype stories: the owner asked for a different way to pick a currency, not only a fix |
| Approved | — (date the owner approved the root cause and the chosen variant) |

## Steps to reproduce

1. Desktop. Accounts → New account (or edit an account).
2. Click the Currency field: the list opens under it with "Search: zloty, GBP" on top.
3. Type `pln` (or click into the search first and type).

## Expected

The letters show in the search and the list narrows to the matching currencies.

## Actual

Nothing is typed; the list stays as it was.

## Root cause

Not confirmed yet (to be reproduced on the bugfix branch). Suspected: the list is a Mantine `Popover` rendered in a
portal, outside the New account dialog, while the dialog (`ResponsiveDialog`, a Mantine `Modal`) traps the focus inside
itself. The search's `focus()` (`CurrencyPicker.tsx`) is taken back by the dialog, so the keys go to the dialog. The same
picker in Settings has no dialog around it, which would explain why it was not caught in F-016. To check as well: the
phone's sheet in the same form, and the E2E test of the account form (it may pick the currency by clicking a row, never
by typing).

## Fix: variants to propose

The owner asked for another way to solve it, not only the focus fix. Three variants as prototype stories
(`frontend/src/prototypes/B-004-currency-picker/`, *Prototypes / B-004 Currency picker*), each in the real New account
form:

1. **Same list, search that works.** Keep today's dropdown and fix the focus (the list kept inside the dialog's focus
   trap, or the trap told about it). Smallest change; the look is the approved F-016 one.
2. **Type in the field itself.** The Currency field becomes a search box (a combobox): click it and type `zł`, `pol` or
   `PLN`, matches show under it, Enter or a click picks one, arrows move through them. Your currencies first while
   it's empty. One step less: no separate search box. As in Wise's and Revolut's currency fields.
3. **A list step inside the dialog.** On the desktop too, the currency opens as a page of the dialog (as on the phone's
   sheet): the dialog's content becomes a full-height list with the search on top and a Back arrow; picking returns to
   the form. Nothing floats over the dialog, so no focus fight, and long lists have room.

References to look at before the prototypes (Mobbin "currency picker", "select with search"; Wise, Revolut, Monobank's
open sites) are recorded here when the design round starts.

## Tests

- Regression (unit, `CurrencyPicker` inside a `ResponsiveDialog`): typing in the search narrows the list. Fails before
  the fix.
- E2E (Playwright): New account → type a currency in the search → pick it → the account is saved in it.
- Screens checked in Playwright screenshots (375 and 1440 px, light and dark): the account form with the list open and
  a search typed; Settings' currency field still works.

## Notes

- Raised by the owner on 2026-11-04 while testing production (with I-022 – I-025, B-005 – B-007).
- The screenshot was shared in chat; not stored in the repo.
