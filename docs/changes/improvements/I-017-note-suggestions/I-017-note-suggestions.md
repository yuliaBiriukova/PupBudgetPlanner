# I-017 · Suggest notes already used while typing a note

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | Medium |
| Status | Todo |
| Branch | `improvement/I-017-note-suggestions` (planned on `plan/i016-i017-quick-add-follow-ups`) |
| Design | 🎨 3 HTML prototypes required (the suggestion list under the Note field) |
| Approved | — |

## Goal

The same notes come back again and again ("Silpo", "Metro", "Lunch with Vlad"). While typing a note in the
quick-add form, the notes already used are suggested, so a repeated note takes a couple of letters and a tap. Asked by
the owner while reviewing F-018's design (2026-11-01).

## Acceptance criteria

- [ ] Typing in the Note field (adding or changing a transaction) shows the person's own earlier notes that contain
      what was typed, ignoring case, in English and Ukrainian.
- [ ] At most 5 suggestions; the most used first, then the most recent.
- [ ] A suggestion is picked with a tap or a click, or with the arrow keys and Enter; Escape closes the list; typing
      on without picking keeps exactly what was typed.
- [ ] On the phone the list stays visible above the keyboard and doesn't push the form around.
- [ ] Only the person's own notes are suggested (not a family member's).
- [ ] No suggestions while the field is empty, and none that equal what is already typed.

## Tasks

- [ ] 3 HTML prototypes of the suggestion list under the Note field (phone sheet and desktop dialog, light and dark),
      following the app's dropdowns (the currency and account lists: one line a row, the picked one in the accent).
- [ ] Owner's approval of the final prototype (I-003).
- [ ] API: the person's notes matching a text, with how often and how recently each was used.
- [ ] UI: Mantine's `Autocomplete` (or the shared dropdown) on the Note field, the request waiting for a short pause in
      typing.
- [ ] Storybook stories: suggestions, none, loading.

## Design

References: Monefy's note field; Wallet by BudgetBakers' payee suggestions; the browser's own form autocomplete.
Prototypes: `prototypes/` (not created yet). Chosen variant: — · Final prototype approved: —

## Tests

- Unit (backend): matching (case, Ukrainian letters), ordering by use and date, only the person's own notes, at most 5.
- Unit (frontend): the list while typing, picking with the keyboard and the mouse, Escape, nothing for an empty field.
- E2E (Playwright): save an expense with a note, start a new one, type two letters, pick the suggestion.
- Screens checked in Playwright screenshots (phone / desktop, light / dark).

## Notes

- **After F-018** (the quick-add form with its Note field) is built.
- Open point: suggest the notes used with the picked category first (Groceries → "Silpo", "ATB")? Claude's proposal:
  yes, as a tie-breaker after how often a note is used.
- Priority Medium (Claude's proposal): it makes the daily entry faster, which is what the app is for (PRODUCT.md:
  "fast entry on mobile is a priority"), but entry works without it.
