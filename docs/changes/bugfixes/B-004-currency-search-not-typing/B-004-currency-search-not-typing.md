# B-004 · Can't type in the currency search of the account form

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (the search is dead, but the currency can still be found by scrolling the list) |
| Status | Done |
| Branch | `bugfix/B-004-currency-search-not-typing` (planned on `plan/prod-testing-fixes`) |
| Found in | 2026-11-04, production, owner's testing (desktop, New account form) |
| Design | 🎨 3 prototype stories, then the final prototype (variant 1, see "Design"); screenshots in [prototypes/](prototypes/) |
| Approved | 2026-11-06 (owner: "Approved, build it", the root cause and the final prototype) |

## Steps to reproduce

1. Desktop. Accounts → New account (or edit an account).
2. Click the Currency field: the list opens under it with "Search: zloty, GBP" on top.
3. Type `pln` (or click into the search first and type).

## Expected

The letters show in the search and the list narrows to the matching currencies.

## Actual

Nothing is typed; the list stays as it was.

## Root cause

Reproduced on 2026-11-06 in Storybook (desktop, *Accounts page / New account* and *Settings page / Desktop*) and
confirmed in the code. **Not the dialog** (as first suspected): Settings, with no dialog around the picker, loses the
keys the same way.

- `CurrencyPicker.tsx` focuses the search in an effect as soon as `open` turns true. On the desktop the list is a
  Mantine `Popover`, whose dropdown is drawn by a `Transition`: it isn't in the page until the next animation frame
  (`use-transition.mjs`: `exited` → `pre-entering` in a `requestAnimationFrame`). When the effect runs,
  `search.current` is still `null`, so nothing gets the focus: it stays on the Currency button, and what is typed goes
  nowhere (or into the field that had the focus before).
- The dialog's focus trap (`use-focus-trap.mjs`) only keeps **Tab** inside the dialog; it doesn't take the focus back.
  A click into the search does focus it, and typing then works (checked in Chromium). The report's "click into the
  search first" is to be checked again with the owner on the fixed build.
- Why the tests didn't catch it: in unit tests Mantine's `Transition` draws the dropdown at once (`env="test"`), and the
  stories and E2E tests type with `userEvent.type` / `fill`, which click the search first.
- **The phone has it too**: the sheet (`BottomSheet`, a Mantine `Drawer`) gives the focus to its first focusable
  element a moment after it opens, which is its × button, not the search. Typing there goes nowhere until the search is
  tapped (found in the prototype check, 375 px).

**Planned fix** (whatever the variant): focus the search the moment it is drawn (a ref callback on the search instead
of the effect; on the phone `data-autofocus`, so the sheet focuses the search and not its ×), with a regression test
that keeps the real transition (no `env="test"` shortcut) and an E2E test that types with the keyboard, not `fill`.
Every currency field shares the picker, so Settings and the Reports page's pill are fixed with it.

## Fix: variants proposed

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

## Design

### References (2026-11-06)

- **Wise, currency converter** (wise.com/gb/currency-converter, open page): a dropdown under the currency with the
  search on top, **in focus the moment it opens**; `zlo` narrows the list to PLN at once; the picked row has a check.
  Taken: variant 1 is exactly this behaviour on F-016's look.
- **Revolut, currency converter** (revolut.com/currency-converter, open page): the list opens over the field itself, its
  search where the field was; the name first and the code under it. Taken for variant 2: the search lives in the
  field, not in a box under it.
- **GOV.UK accessible autocomplete** (alphagov.github.io/accessible-autocomplete/examples): a plain text field that is
  the search, matches under it, ↓ ↑ and Enter, read out as a combobox. Taken for variant 2: the keys and the
  combobox roles.
- **Our own phone sheet** (F-016): the list as a whole page with its search on top. Taken for variant 3: the same
  page, inside the desktop dialog too.
- Mobbin answers 403 without signing in, so nothing was taken from it.

### Round 1: three variants (2026-11-06)

Each is a story of the real Accounts page (its fake API), opening with New account; the app's files are untouched (the
page and the form are copied into the prototype folder, only the Currency field differs). In all three the search is
in focus when the list opens, the first match is marked as you type, **Enter picks it** and ↓ ↑ move the mark, and
what was typed in the form stays. The stories were deleted when the fix was built:

1. **Search that works** — today's dropdown and look (F-016), only fixed, plus Enter and ↓ ↑. The phone keeps its
   sheet, the search in focus.
2. **Type in the field** — the Currency field is the search: a click or Tab puts the cursor in it, the picked currency
   grey in it until a letter is typed, the list under it. One step less; nothing to find inside the list. The phone
   keeps variant 1's sheet (typing in the field would put the phone's keyboard over the list).
3. **A page of the dialog** — the field opens the currency as a page of the dialog or sheet (← and the title
   "Currency", the search, the whole list), the same size as the form; picking, ← or Escape go back to the form. No
   pop-up over a pop-up, also on the phone. Changes the F-016 rule "a dropdown under the field" for the account form.

**Owner's choice (2026-11-06): variant 1**, without changes. Variants 2 and 3 are deleted.

### Final prototype (2026-11-06)

Variant 1 as it was shown: F-016's dropdown and sheet, unchanged in look; the search in focus the moment the list is
drawn (desktop) or the sheet opens (phone); the first match marked as you type, Enter picks it, ↓ ↑ move the mark,
Escape closes the list and leaves the dialog open. The same picker serves Settings and the Reports page's pill, so they
get it too.
Approved by the owner on 2026-11-06 ("Approved, build it"). Its screenshots (375 and 1440 px, light and dark; the form,
and the list with `dol` typed and ↓ pressed) are in [prototypes/](prototypes/); the prototype story is deleted.

## Fix

The final prototype, built in the shared `CurrencyPicker` (`frontend/src/shared/ui/CurrencyPicker.tsx`), so every
currency field has it: the account form, Settings and the Reports page's pill.

- The search is focused by a ref callback as it is drawn, not by an effect when `open` turns true. On the phone it is
  marked `data-autofocus`, so the sheet's focus trap gives it the focus instead of the × button.
- The row Enter picks (`data-active`, the hover's tint): the first match while typing, or the row ↓ ↑ or a mouse
  marked, kept for the search it was marked in. The search points at it with `aria-activedescendant`, and the list
  keeps it in sight. Enter picks it and doesn't send the form; Escape closes the list as before. ↓ ↑ and Enter work
  from what the search holds, not from the last render.
- Found in the screenshots and fixed with it: a phone keeps `:hover` where it was last tapped, which looked like a
  second mark. The hover tint is now only for devices that hover (`@media (hover: hover)`, as elsewhere in the app),
  and only a mouse marks a row it moves over.
- The look is F-016's, unchanged.

## Tests

- [x] Regression (Vitest, `CurrencyPicker.test.tsx`, with Mantine's real transitions instead of `env="test"`): in a
  `ResponsiveDialog` on the desktop the search has the focus after the click, `pln` typed with the keys alone narrows
  the list and Enter picks PLN; on the phone the sheet's search has the focus, not its ×; `dol` marks your US dollar
  first, ↓ ↓ ↑ marks AUD and Enter picks it; Escape closes the list, not the dialog. All four fail on the old picker,
  pass with the fix.
- [x] E2E (`e2e/accounts.spec.ts`, desktop and phone): New account → Currency → the search is in focus, `dollar` typed
  with the keys narrows the list, `usd` and Enter pick US dollar, and the account is saved in dollars.
- [x] Story *Shared / Currency picker / Typing with the keys*: the keys alone, ↓ marks AUD.
- [x] Screens checked in Playwright screenshots (375 and 1440 px, light and dark): the account form with the list open
  and a search typed, Settings' currency field and the Reports page's pill.

## Notes

- Raised by the owner on 2026-11-04 while testing production (with I-022 – I-025, B-005 – B-007).
- The screenshot was shared in chat; not stored in the repo.
