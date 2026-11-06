# B-009 · An empty gap under the Note while it is typed on the phone

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: looks broken on the main form, but nothing is lost and Save works) |
| Status | Done |
| Branch | `bugfix/B-009-gap-under-note` (planned on `plan/quick-add-keys`) |
| Found in | Production, 2026-11-05, the owner's Android phone (Chrome), dark theme |
| Approved | 2026-11-06, fix A ("Approved: build A") |

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

Confirmed on 2026-11-06: reproduced in Storybook (*Add phone* with no earlier notes, `notes:none`) at 375 × 520 px,
the room the keyboard leaves: typing `кфс` scrolls the Note to the top of the sheet and leaves an empty 218 px block
between it and Save, with no list, as on the owner's phone.

It is I-017's room for the suggestions. While the Note is typed on the phone (`noteTyped`: the Note has the focus, not
the desktop), `TransactionDialog.tsx` adds an empty block under the form (`noteRoom`) as high as the sheet minus the
Note, and scrolls the Note to the top, so the list of earlier notes has the room down to Save. Both hang only on the
Note having the focus, not on the list: `NoteField` knows whether it shows a list (`shown.length > 0`) but doesn't tell
the form. With no earlier note like the one typed (or before the first ones load), the room is only an empty gap.

## Fix

The owner chose **A** on 2026-11-06. Built:

- `NoteField` tells the form when its list shows or goes (`onListed`).
- `TransactionDialog` adds the room under the form and scrolls the Note to the top only while the Note is typed on the
  phone **and** the list shows (`roomForList`). With no list there is no room: the form stays where it is, and the Note
  is only scrolled into sight if the keyboard covers it. When the list goes (nothing matches any more, a note picked)
  the room goes with it. The desktop is unchanged.

The options that were offered:

- **A (proposed, chosen):** the room and the scroll only while the suggestions list is shown. With no list the form stays where
  it is, the Note scrolled just into sight above the keyboard. When a list appears, the Note goes up to make room for
  it, as now.
- **B:** no room and no scroll at all: the list opens over the form above the Note when there is no room below
  (as the desktop does).

A moves the form when the first suggestion appears; B never moves it, but the list covers the amount and the
category while it is open.

## Tests

- [x] Regression (Vitest, `TransactionsPage.test.tsx`): on the phone a new note (`кфс`) adds no room under the form;
  `si` with its list does; typed on to `sixq` the list and the room go. Fails without the fix (the room is there for
  `кфс`), passes with it.
- [x] E2E (`e2e/transactions.spec.ts`, phone, 375 × 520 px): a new note → the Note in sight and at most 32 px above
  Save; the start of an earlier note → the Note goes up for the list and the whole list is above Save. Fails without the
  fix (226 px between the Note and Save), passes with it. A list of one note doesn't reach Save, so the test checks the
  Note moving up rather than the list's foot.
- [x] Screens checked in Playwright screenshots at 375 × 520 px (a new note, a list, the list gone, the keys after the
  Note) and 1440 px (unchanged), light and dark, and looked at; walked through in the Browser pane (Storybook, *Add
  phone*, with and without earlier notes).

## Notes

- I-028 (folding the keys away) is in the same part of `TransactionDialog.tsx`; building them one after the other
  avoids conflicts.
