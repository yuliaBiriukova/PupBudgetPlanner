# B-012 · The amount stays half hidden under the phone keys when tapped

| | |
|---|---|
| Type | Bugfix |
| Priority | High (proposed: on the main form you can't see the amount you type) |
| Status | Done |
| Branch | `bugfix/B-012-amount-hidden-under-keys` |
| Found in | Production, 2026-11-09, the owner's Android phone (Chrome), light theme |
| Approved | 2026-11-11 (root cause and planned fix, "Approved, build it") |

## Steps to reproduce

1. On the phone, open Add transaction (Expense). The keys are folded (I-028).
2. Scroll the form only so far that the amount is partly in sight at the bottom of the sheet.
3. Tap the amount.

## Expected

The keys come up and the form scrolls so the whole amount is in sight right above them; you see every digit you type.

## Actual

The keys come up over the lower half of the amount and the form stays where it was: only the top of the amount shows
above the keys, and the digits being typed are hidden (owner's screenshot, kept out of the repo as it shows a balance).

## Root cause

Confirmed on 2026-11-11: reproduced in Storybook (*Transactions / Add phone*) at 375 × 640 px. With the keys folded the
whole amount is in sight; a tap on it brings the keys up and the form doesn't move. The form's scroll area now ends at
the keys' top (y 375) while the amount sits at y 357 – 446: 71 of its 89 px are under the keys, the form still at
scroll 0 of 375. Only the amount's top edge shows; the digits typed can't be seen. The owner's case (the amount partly
in sight before the tap) is the same, only worse.

Why: `AmountDisplay` keeps itself in sight above the keys (`scrollIntoView({ block: 'nearest' })`) only while `target`
is set, and `TransactionDialog` sets `target` only on an exchange's two amounts (F-019), where it also draws the ring
saying which one the keys type into. An expense's, an income's or a plain transfer's amount never gets `target`, so
since I-028 folded the keys, nothing scrolls it into sight when they come up. An exchange already works.

## Fix

Approved by the owner on 2026-11-11 and built:

- [x] `AmountDisplay` has a prop of its own for "the keys type into it", `typedInto`, apart from `target` (the ring).
  While it is set, the display scrolls into sight right above the keys as they come up and on every key, as an
  exchange's did already. Nothing moves if it is already fully in sight.
- [x] `TransactionDialog` sets it on the amount the keys type into while they are up, for every type; the ring stays on
  an exchange only.
- [x] Nothing changes on the desktop (no keys there) or for the Note (I-017, B-009).

## Tests

- [x] Unit (`TransactionsPage.test.tsx`, *the phone keys*): a tap on an expense's amount scrolls it into sight as the
  keys come up and again on a key, with no ring. Fails before the fix (no scroll), passes after it.
- [x] E2E on the phone (`transactions.spec.ts`, B-012): at 412 × 640 px the amount is in sight with the keys folded and
  low enough that they would cover it; tapped, the whole amount is right above the keys, and stays there while `125`
  is typed. Fails before the fix, passes after it. (A screen this short can't scroll the amount half out of sight: the
  whole form fits until the keys come up, which is the case reproduced above.)
- [x] Screenshots at 375 px with the keys up, light ([fixed-375-light.png](fixed-375-light.png)) and dark
  ([fixed-375-dark.png](fixed-375-dark.png)); an exchange on the phone keeps its ring and its rate line above the keys;
  the desktop at 1440 px, light and dark, unchanged.
