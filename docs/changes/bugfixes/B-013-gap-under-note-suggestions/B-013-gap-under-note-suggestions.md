# B-013 · An empty gap under the Note's suggestions on the phone

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: looks broken on the main form, but nothing is lost and Save works) |
| Status | Todo |
| Branch | `bugfix/B-013-gap-under-note-suggestions` (planned on `plan/phone-feedback`) |
| Found in | Production, 2026-11-09, the owner's Android phone (Chrome), dark theme |
| Approved | — (date the owner approved the root cause and the planned fix) |

## Steps to reproduce

1. On the phone, open Add transaction (Expense).
2. Tap the Note and type the middle of a note used before (`дона` for `Макдональдс`).

## Expected

The suggestions show under the Note and Save comes right after them, with no empty space.

## Actual

The Note goes to the top of the sheet with its one suggestion under it, then a large empty space, then Save expense
right above the phone's keyboard ([gap-under-suggestions.png](gap-under-suggestions.png)).

## Root cause

Suspected from reading the code, to be confirmed by reproducing it. This is the case B-009 left on purpose: while the
Note is typed and its list shows (`roomForList` in `TransactionDialog.tsx`), an empty block (`noteRoom`) as high as the
sheet minus the Note is added under the form and the Note is scrolled to the top, so the longest list (up to its
limit) has room down to Save. A short list (one or two notes) fills only the top of that room; the rest is the gap.

## Fix

To be proposed after reproducing. Options to offer:

- **A (proposed):** the room only as high as the list that shows, up to what the sheet has: the Note goes up only as far
  as the list needs, and Save sits right under the list. The room grows and shrinks with the list as you type.
- **B:** no room at all: the list opens over the form, above the Note, when there is no room below (as the desktop
  does; B-009's option B).

A still moves the form when a list appears; B never moves it, but the list covers the amount and the category.

## Tests

- Regression test that fails before the fix and passes after it (Vitest and E2E on the phone, 375 × 520 px: a list of
  one note → Save at most 32 px under the list's last row; a long list → the whole list above Save).
- Screens checked in Playwright screenshots at 375 px (one, three and the most suggestions, the list gone), light and
  dark; the desktop is unchanged.

## Notes

- Same part of `TransactionDialog.tsx` as B-011 and I-029 (the keyboard room); build them one after the other.
