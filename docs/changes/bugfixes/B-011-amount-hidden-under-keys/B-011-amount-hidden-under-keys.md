# B-011 · The amount stays half hidden under the phone keys when tapped

| | |
|---|---|
| Type | Bugfix |
| Priority | High (proposed: on the main form you can't see the amount you type) |
| Status | Todo |
| Branch | `bugfix/B-011-amount-hidden-under-keys` (planned on `plan/phone-feedback`) |
| Found in | Production, 2026-11-09, the owner's Android phone (Chrome), light theme |
| Approved | — (date the owner approved the root cause and the planned fix) |

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

Suspected from reading the code, to be confirmed by reproducing it: since I-028 the keys start folded and slide up on a
tap on the amount (`keysUp` in `TransactionDialog.tsx`), but nothing scrolls the amount into sight when they do. The
form's scroll area gets shorter under the keys and keeps its scroll, so whatever was at its bottom is now under them.

## Fix

To be proposed after reproducing. Likely: when the keys come up (and when the sheet's room changes while they are up),
scroll the amount into sight above them if it isn't fully in sight, the way the Note is kept in sight above the phone's
keyboard (I-017, B-009). Nothing moves if the amount is already fully in sight.

## Tests

- Regression test that fails before the fix and passes after it (E2E on the phone, a short screen: scroll the amount
  half out of sight, tap it, the whole amount is above the keys).
- Screens checked in Playwright screenshots at 375 px, light and dark; the desktop is unchanged (no keys there).
