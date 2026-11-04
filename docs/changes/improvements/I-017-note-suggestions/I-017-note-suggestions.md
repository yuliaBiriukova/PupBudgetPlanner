# I-017 · Suggest notes already used while typing a note

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | Medium |
| Status | Done |
| Branch | `improvement/I-017-note-suggestions` (planned on `plan/i016-i017-quick-add-follow-ups`) |
| Design | 🎨 3 HTML prototypes required (the suggestion list under the Note field) |
| Approved | 2026-11-04: the final prototype ([variant 4](prototypes/variant-4.html)), by the owner in chat ("the prototype is approved, build it") |

## Goal

The same notes come back again and again ("Silpo", "Metro", "Lunch with Vlad"). While typing a note in the
quick-add form, the notes already used are suggested, so a repeated note takes a couple of letters and a tap. Asked by
the owner while reviewing F-018's design (2026-11-01).

## Acceptance criteria

- [x] Typing in the Note field (adding or changing a transaction) shows the person's own earlier notes that contain
      what was typed, ignoring case, in English and Ukrainian.
- [x] At most 5 suggestions: first the notes that start with what was typed, then those that have it further on; within
      each, the most used first, then the most recent ("si": Silpo, Simcard top-up, Silpo, wine for Friday, then Physio
      session, Kids' music lesson; owner, 2026-11-04).
- [x] On the phone, while the note is typed, the app's keys fold away and Save stays above the phone's keyboard; a tap on
      the amount brings the keys back. The form scrolls the Note field to its top and the list hangs under it.
- [x] A suggestion is picked with a tap or a click, or with the arrow keys and Enter; Escape closes the list; typing
      on without picking keeps exactly what was typed.
- [x] On the phone the list stays visible above the keyboard and doesn't push the form around.
- [x] Only the person's own notes are suggested (not a family member's).
- [x] No suggestions while the field is empty, and none that equal what is already typed.

## Tasks

- [x] 3 HTML prototypes of the suggestion list under the Note field (phone sheet and desktop dialog, light and dark),
      following the app's dropdowns (the currency and account lists: one line a row, the picked one in the accent).
- [x] Owner's approval of the final prototype (I-003), 2026-11-04.
- [x] API: the person's notes matching a text, with how often and how recently each was used.
- [x] UI: Mantine's `Combobox` on the Note field (`NoteField.tsx`), the request waiting for a short pause in typing
      (200 ms).
- [x] Storybook stories: suggestions, none, loading.

## Design

References (looked at 2026-11-04):

- [Baymard, autocomplete design](https://baymard.com/blog/autocomplete-design): on the phone the list sits between
  the field and the keyboard, so only a few rows show (4–8 at most); the part the list adds stands out, not what was
  typed. Taken: at most 5, the typed part quiet grey and the rest standing out, the list right above the keyboard.
- The phone keyboards' own word strip (Gboard, iOS QuickType): a row of suggestions right above the keys, where the
  thumb already is. Taken for variant 2.
- The browser's own form autocomplete and Mantine's `Autocomplete`: a dropdown under the field, ↓ ↑ and Enter, Escape
  closes it, flips above the field when there's no room below. Taken for variants 1 and 3 on the desktop.
- The app's own lists (the currency and account dropdowns, F-016 / F-018) and the Transactions page's till receipts
  (F-020): the rows, the picked one in the accent, the dotted leaders of variant 3.
- Monefy's note field and Wallet by BudgetBakers' payee suggestions (named in the plan): not looked at, since their
  screens weren't open without signing in. [Buckets](https://github.com/buckets/application/issues/106) and
  [BudgetFlow](https://budgetflow.featurebase.app/p/feature-request-autocomplete-for-notes-based-on-historical-transactions)
  show that people of budgeting apps ask for exactly this: earlier notes suggested while typing.

What all three variants share: the form as built (F-018 / F-019 / I-019), the person's own expense notes that
*contain* what was typed (case ignored, Ukrainian too), at most 5, the most used first, then the most recent, none for an
empty field or equal to what's typed, ↓ ↑ Enter and Escape on the desktop, a row picked on pointer down so the field keeps
its focus. **On the phone, while the note is typed, the app's keys fold away** and the phone's keyboard takes their
place, with Save over it; a tap on the amount brings the keys back. (As built, nothing hides the app's keys while the
note has the focus, so with the phone's keyboard up they take most of the room that is left: read from the code, not yet
seen on a phone.)

### Round 1 (2026-11-04)

- [Variant 1 · The app's dropdown](prototypes/variant-1.html): the quiet one. The list the account and currency
  fields open, one line a row, under the Note field and over the form (above it on the desktop when there's no room
  below). On the phone the form scrolls the field to the top and the list hangs under it.
- [Variant 2 · Pills by the keys](prototypes/variant-2.html): the thumb one. The notes as pills right above the phone's
  keyboard, like its own word strip; the strip keeps its place while typing, so nothing opens over the form. On the
  desktop the pills are a row under the field. Risk: Android's keyboard strip right under ours.
- [Variant 3 · From your receipts](prototypes/variant-3.html): the ledger one. Each note a receipt line with a dotted
  leader to the category it went with; the notes of the picked category first (the open point); picking a note also
  picks its category when the category came pre-picked and not by hand, with a line and Undo. On the phone the list
  docks above Save with a fixed height. This is more than the criteria ask for.

Each prototype has five screens (typing "si", the arrow keys, Ukrainian "ат", picked, an empty note) and a note on its
direction ("About this direction"). The design check passes on all three with 0 issues, at 360 / 375 / 768 / 1024 /
1440 px, light and dark.

### Round 2: final prototype (2026-11-04)

The owner chose variant 1, with the notes that *start* with what was typed before the ones that only contain it.
[Final prototype](prototypes/variant-4.html): variant 1 with that order (the same five screens; "ат" puts АТБ first).
Owner's review: the type switch fills the title row up to the X, as in the app (the round-1 prototypes sized it to its
labels); a scrolled form fades at its edges, as in the app. Design check 0 issues; every screen at 375 and 1440 px,
light and dark, looked at.

Chosen variant: 1, with starts-first order · Final prototype approved: 2026-11-04

## Tests

- Unit (backend): matching (case, Ukrainian letters), ordering (starts with it first, then by use and date), only the
  person's own notes, at most 5.
- Unit (frontend): the list while typing, picking with the keyboard and the mouse, Escape, nothing for an empty field.
- E2E (Playwright): save an expense with a note, start a new one, type two letters, pick the suggestion.
- Screens checked in Playwright screenshots (phone / desktop, light / dark).

## Built (2026-11-04)

- **API** `GET /api/transactions/notes?type=&text=`: the person's own notes of that type, grouped in the database (one
  row a note with how many transactions have it and when the last was added), matched and ordered in memory by
  `NoteSuggestions.Of` (Application, pure): case is ignored with .NET's ordinal rules, which fold Ukrainian too, whatever
  the database's locale; "silpo" and "Silpo" are one note, written as it was last time. A text longer than a note is a
  400; an empty one gives none.
- **The form's type:** an expense's notes are suggested for an expense, an income's for an income, a transfer's for a
  transfer, as the prototype's "your own expense notes" for the expense form.
- **UI:** the list is Mantine's `Combobox` with the app's dropdown look; it opens only while it has rows, so Escape
  closes the form again once there are none. The last rows stay while the next load, without those that no longer fit.
  On the phone the list is the sheet's, outside its scrolling form (the form's fade at its foot stays off it), and goes
  down to the form's end where Save starts, scrolling with a fade past that. On the desktop it turns up above the field
  when the room under the dialog runs out.
- **The phone's keyboard:** the Note field's focus folds the app's keys to one 52 px "Save expense" (Save changes when
  editing); a tap on the amount brings them back. A full sheet follows the visual viewport while the keyboard is up
  (`useKeyboardInset`), so it fills what the keyboard leaves and Save sits right above it. Not yet tried on a real
  phone: Playwright has no phone keyboard (checked at 375 × 520 px, the room it leaves).

## Notes

- **After F-018** (the quick-add form with its Note field) is built.
- Open point: suggest the notes used with the picked category first (Groceries → "Silpo", "ATB")? Claude's proposal:
  yes, as a tie-breaker after how often a note is used. *Settled 2026-11-04:* no; the owner chose variant 1, where the
  order is starts-with first, then use and date (variant 3 had the category order).
- Priority Medium (Claude's proposal): it makes the daily entry faster, which is what the app is for (PRODUCT.md:
  "fast entry on mobile is a priority"), but entry works without it.
