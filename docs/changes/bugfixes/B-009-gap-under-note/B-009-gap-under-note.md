# B-009 · An empty gap under the Note while it is typed on the phone

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: looks broken on the main form, but nothing is lost and Save works) |
| Status | Todo |
| Branch | `bugfix/B-009-gap-under-note` (planned on `plan/quick-add-keys`) |
| Found in | Production, 2026-11-05, the owner's Android phone (Chrome), dark theme |
| Approved | — |

## Steps to reproduce

1. On the phone, open Add transaction (Expense).
2. Tap the Note and type a note never used before (`кфс`).

## Expected

The form stays as it is, the Note in sight above the phone's keyboard, Save right under the form.

## Actual

The form scrolls so the Note is at the top of the sheet; the day, the account, the amount and the category go out of
sight above it, and an empty space is left between the Note and Save
([gap-under-note.png](gap-under-note.png)).

## Root cause

To be confirmed by reproducing it (Playwright at 375 × 520 px, the room the keyboard leaves, and on the phone). Read
from the code: it is I-017's room for the suggestions. While the Note is typed on the phone,
`TransactionDialog.tsx` adds an empty block under the form (`noteRoom`) as high as the sheet minus the Note, and
scrolls the Note to the top, so the list of earlier notes has the room down to Save. The room is there whether or not
there is a list: with no earlier note like the one typed, it is only an empty gap.

## Fix

Planned, for the owner's choice after the reproduction:

- **A (proposed):** the room and the scroll only while the suggestions list is shown. With no list the form stays where
  it is, the Note scrolled just into sight above the keyboard. When a list appears, the Note goes up to make room for
  it, as now.
- **B:** no room and no scroll at all: the list opens over the form above the Note when there is no room below
  (as the desktop does).

A moves the form when the first suggestion appears; B never moves it, but the list covers the amount and the
category while it is open.

## Tests

- Regression (Vitest): with no suggestions, typing the Note adds no room under the form; with suggestions, it does.
- E2E (Playwright, phone, 375 × 520 px): type a new note → no gap between the Note and Save; type the start of an
  earlier note → the list shows under the Note, down to Save.
- Screens checked in Playwright screenshots (375 px, light and dark).

## Notes

- I-028 (folding the keys away) is in the same part of `TransactionDialog.tsx`; building them one after the other
  avoids conflicts.
