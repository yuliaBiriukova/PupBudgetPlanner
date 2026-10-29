# I-006 · Delete used, expired and cancelled invite links

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Medium |
| Status | Todo |
| Branch | `improvement/I-004-I-008-people-page-follow-ups` (shared with I-004 – I-008, as the owner asked) |
| Design | 3 HTML prototypes required (delete on the Links tab) |
| Approved | — |

## Goal
The admin can delete invite links that can no longer be used — one at a time or many at once — so the database
does not fill up with old links. Found by the owner after F-028, 2026-10-29.

## Acceptance criteria
- [ ] On the Links tab, a used, expired or cancelled link can be deleted on its own.
- [ ] Several of them can be selected and deleted at once, and a whole group (used / expired and cancelled) can be
      cleared.
- [ ] Deleting asks for confirmation and says how many links go.
- [ ] Deleted links are removed from the database (not hidden).
- [ ] Waiting (still usable) links cannot be deleted this way; they are cancelled first, as today.
- [ ] Deleting a used link does not touch the account that was created with it.

## Tasks
- [ ] References: bulk delete in lists (Mobbin "bulk actions", "delete").
- [ ] 3 prototypes; owner picks and approves one.
- [ ] API: delete one link and delete many (admin only, same limit as the other bulk actions); refuse waiting links.
- [ ] UI on the Links tab, using the same check boxes and bulk bar as the People tab.
- [ ] Stories: groups with selection, confirmation dialog.

## Design
References: —
Prototypes: `prototypes/`. Chosen variant: —

## Tests
- Unit (backend): delete one, delete many, refuse waiting links, refuse non-admins, account stays.
- Unit (frontend): selection and confirmation.
- E2E (Playwright): delete a cancelled link, clear the expired group.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
- Open point for the proposal: also delete old links automatically after some time (e.g. 90 days)? Not in scope
  unless the owner wants it.
