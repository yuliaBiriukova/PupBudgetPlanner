# I-023 · Opening balance works as a calculator

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Low (set by the owner, 2026-11-04: adding up by hand is a workaround) |
| Status | Todo |
| Branch | `improvement/I-023-opening-balance-calculator` (planned on `plan/prod-testing-fixes`) |
| Design | 🎨 3 prototype stories (how a sum and its result show in the field; the phone's keys or not) |
| Approved | — |

## Goal

The quick-add form's amount is a calculator (F-018): `8000+575` is worked out to `8 575`. The opening balance in the
account form should work the same way (owner, 2026-11-04, production), so a balance made of several parts (cash in two
envelopes, a card plus a deposit) is typed as a sum, not added up elsewhere.

## Acceptance criteria

- [ ] The opening balance accepts `+` and `−` between amounts (`8000+575`, `10000-1425`); the sum is shown as typed and
      its result next to it or above it, as in the quick-add display.
- [ ] Leaving the field, Enter or Add / Save works the sum out; the account is saved with the result.
- [ ] A balance below zero still works (a credit card's debt): `-5000`, and a sum that ends below zero (`-5000-300`).
- [ ] A sum that can't be worked out (`8000+`) is a mistake under the field, as an amount that isn't a number is now.
- [ ] Whole amounts as now (the opening balance has no cents, ADR 0018).
- [ ] On the phone the sum is typed with the app's own keys, as in the quick-add form (digits, 00, ⌫, + − =); the
      phone's keyboard stays closed for this field.
- [ ] The keys don't open by themselves when the account form opens (new or edit): they show only after a tap on the
      opening balance, and go away when another field is tapped or the balance is done. The name is usually typed
      first, with the phone's keyboard.

## Tasks

- [ ] References (Mobbin "calculator input", "amount with math"; Spendee, Monefy, 1Money) and 3 prototype stories in
      `frontend/src/prototypes/I-023-opening-balance-calculator/` (*Prototypes / I-023 Opening balance calculator*),
      in the real account form. Candidates: the plain field with the result under it as a hint ("= 8 575 €"); the
      field with the sum small and the result big (the quick-add display's two lines, number from the left, I-022);
      the quick-add display itself. All three with the app's keys on the phone, shown after a tap on the balance.
- [ ] Owner's approval of the final prototype (I-003).
- [ ] Reuse `amount.ts` (`evaluate`, `isSum`, `showExpression`) from the transactions feature; move it to `shared` if
      both features use it, and let it start with a minus.
- [ ] Storybook stories for the changed field.

## Tests

- Unit: sums with a leading minus, a result below zero, an unfinished sum; the form saves the result.
- E2E (Playwright): New account with `8000+575` → the card shows `8 575 ₴`.
- Screens checked in Playwright screenshots (375 and 1440 px, light and dark).

## Notes

- Together with I-022: the number starts at the left in the chosen variant, unless the owner picks the right-aligned
  quick-add display; then I-022 is closed with this change.
- Answered by the owner (2026-11-04): on the phone the app's own keys, as in the quick-add form, but not opened as the
  form opens.
- The quick-add form's keys (`AmountKeys.tsx`) need a minus at the start for a debt; the quick-add amount never starts
  with one.
