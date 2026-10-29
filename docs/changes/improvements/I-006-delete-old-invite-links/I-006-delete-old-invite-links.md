# I-006 · Delete used, expired and cancelled invite links

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Medium |
| Status | Todo |
| Branch | `improvement/I-006-delete-old-invite-links` (planned on `plan/f028-follow-ups`) |
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
- [ ] **Auto-delete after 30 days:** a link that can no longer be used is deleted automatically 30 days after it
      became so (used, expired or cancelled). Waiting links are never auto-deleted.
- [ ] Each used, expired or cancelled link shows its auto-delete date (e.g. "Deleted on 28 Nov").
- [ ] Links that are already older than 30 days when this ships are deleted by the first clean-up run.

## Tasks
- [ ] References: bulk delete in lists (Mobbin "bulk actions", "delete").
- [ ] 3 prototypes; owner picks and approves one.
- [ ] API: delete one link and delete many (admin only, same limit as the other bulk actions); refuse waiting links.
- [ ] Auto-delete: the date a link stopped being usable (used at / expires at / cancelled at), a clean-up that
      deletes links past 30 days (a background job or a run on each request to the links list — proposed before
      approval; the free Render service sleeps, so a timer alone isn't enough), the 30 days as a setting.
- [ ] API returns each old link's auto-delete date.
- [ ] UI on the Links tab, using the same check boxes and bulk bar as the People tab, and the auto-delete date.
- [ ] Stories: groups with selection, confirmation dialog.

## Design
References: —
Prototypes: `prototypes/`. Chosen variant: —

## Tests
- Unit (backend): delete one, delete many, refuse waiting links, refuse non-admins, account stays; the clean-up
  deletes links past 30 days and keeps waiting and newer ones; the auto-delete date.
- Unit (frontend): selection and confirmation.
- E2E (Playwright): delete a cancelled link, clear the expired group.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
- Owner's answer, 2026-10-29: yes, old links are deleted automatically after **30 days**, and each shows its
  auto-delete date. "30 days" counts from the moment the link stopped being usable (Claude's reading; confirm with
  the prototype).
