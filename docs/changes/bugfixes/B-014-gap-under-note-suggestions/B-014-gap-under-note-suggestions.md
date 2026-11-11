# B-014 · An empty gap under the Note's suggestions on the phone

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: looks broken on the main form, but nothing is lost and Save works) |
| Status | Done |
| Branch | `bugfix/B-014-gap-under-note-suggestions` |
| Found in | Production, 2026-11-09, the owner's Android phone (Chrome), dark theme |
| Approved | 2026-11-11 (root cause and fix A, "Approved, build A") |

## Steps to reproduce

1. On the phone, open Add transaction (Expense).
2. Tap the Note and type the middle of a note used before (`дона` for `Макдональдс`).

## Expected

The suggestions show under the Note and Save comes right after them, with no empty space.

## Actual

The Note goes to the top of the sheet with its one suggestion under it, then a large empty space, then Save expense
right above the phone's keyboard ([gap-under-suggestions.png](gap-under-suggestions.png)).

## Root cause

Confirmed on 2026-11-11: reproduced in Storybook (*Transactions / Add phone*) at 375 × 520 px, the room the keyboard
leaves. Typing `phy` lists one note (*Physio session*): the Note goes to the top of the sheet, the list's foot is at
y 252 and Save's top at y 452, an empty 200 px gap; the room under the form (`noteRoom`) is 254 px
([reproduced-375x520.jpg](reproduced-375x520.jpg)). With `s` the list has its most rows (5, 232 px) and ends 24 px above
Save: no gap, the room is right for it.

Why: it is the case B-009 left on purpose. While the Note is typed on the phone and its list shows (`roomForList` in
`TransactionDialog.tsx`), the form adds an empty block under itself as high as the sheet minus the Note
(`scroller.clientHeight - block.offsetHeight - NOTE_TOP_GAP`) and scrolls the Note to the top. That height is the same
for any list: it fits the longest one (5 rows), and a shorter list fills only its top. The form doesn't know how tall
the list is.

## Fix

The owner approved option A on 2026-11-11 ("Approved, build A"). Built:

- [x] `NoteField` tells the form how tall its list is with all its rows and its border (`onList`, was `onListed`: a
  height, or `null` when the list goes), measured as the rows change and as they change size. While the list is hidden
  for a moment (the popover hides it when the Note is scrolled out of the form's sight) it keeps its last height.
- [x] `TransactionDialog` makes the room under the form only as high as the list needs below the Note (`noteRoomHeight`
  in `noteRoom.ts`: the list, its 4 px gap and the 8 px it keeps above Save, less the form already under the Note), and
  never more than before (the sheet less the Note). The form then scrolls only so far that the list's foot is just
  above Save: the Note goes up only as far as the list needs, the fields above it staying in sight. A list of one note
  leaves no gap; the longest list on a short screen is as before (the Note at the top, the list scrolling inside).
- [x] The room grows and shrinks with the list as you type (`s` → `si` → `sil`), and goes with it, as before (B-009).
- [x] Nothing changes on the desktop or with no list (B-009); the amount's keys (B-012, I-028) are untouched.

Checked at 375 × 520 px in Storybook: with one note the list ends 16 px above Save (was 200 px of empty space), the
room is 62 px (was 254 px); with five notes the list ends 16 px above Save too.

Not chosen: option B (no room; the list opens over the form above the Note when there is no room below, as on the
desktop). It never moves the form, but the list covers the amount and the category while it shows.

## Tests

- [x] Unit (`noteRoom.test.ts`): the room is what a short list needs, counts the form already under the Note, and never
  takes the Note above the top of the sheet.
- [x] Unit (`TransactionsPage.test.tsx`, B-014): on the phone the room for one note is its row, gap and foot (68 px),
  for five notes all five rows (244 px). Fails before the fix (384 px, the whole sheet), passes after it.
- [x] E2E on the phone (`transactions.spec.ts`, 375 × 520 px): one note, five, then three as the note is typed on;
  each time the whole list is above Save and at most 32 px from it, the Note in sight. Fails before the fix (201 px),
  passes after it. B-009's test now expects Save right after the list instead of the Note going up over 100 px.
- [x] Screenshots at 375 × 520 px, light and dark: one note ([light](fixed-375-light-one.png),
  [dark](fixed-375-dark-one.png)) and five ([light](fixed-375-light-five.png), [dark](fixed-375-dark-five.png)); also
  checked three notes and the list gone. The desktop at 1440 px, unchanged ([light](fixed-1440-light.png),
  [dark](fixed-1440-dark.png)).

## Notes

- Same part of `TransactionDialog.tsx` as B-012 and I-029 (the keyboard room); build them one after the other.
