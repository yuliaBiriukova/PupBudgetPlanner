# I-006 · Delete used, expired and cancelled invite links

| | |
|---|---|
| Type | Improvement |
| Milestone | M5 — Categories & family (moved from M2, which is done) |
| Priority | High (raised from Medium by the owner, 2026-11-12) |
| Status | Todo |
| Branch | `improvement/I-006-delete-old-invite-links` (planned on `plan/f028-follow-ups`, updated on `plan/i006-batch-delete-invite-links`) |
| Design | 3 prototype stories required (delete on the Invite links tab) |
| Approved | — |

## Goal
The admin can delete invite links that can no longer be used — one at a time or many at once — so the database
and the Invite links tab do not fill up with old links. Found by the owner after F-028, 2026-10-29; asked again on
2026-11-12 ("batch deleting the used and expired/cancelled invite links"), now that F-023's family links land on the
same tab.

## Acceptance criteria
- [ ] On the Invite links tab, a used, expired or cancelled link can be deleted on its own.
- [ ] Several of them can be selected and deleted at once, and a whole group (Used / Expired and cancelled) can be
      cleared in one go.
- [ ] Deleting asks for confirmation and says how many links go.
- [ ] Deleted links are removed from the database (not hidden).
- [ ] Waiting (still usable) links cannot be deleted this way; they are cancelled first, as today.
- [ ] The admin's links and family owners' links (F-023) are deleted the same way; a family and its members are not
      touched, and the Family page (which lists only waiting links) is unchanged.
- [ ] Deleting a used link does not touch the account that was created with it, and the People page still shows that
      person as "Invited" with the link's note (see open point 1).
- [ ] **Auto-delete after 30 days:** a link that can no longer be used is deleted automatically 30 days after it
      became so (used, expired or cancelled). Waiting links are never auto-deleted.
- [ ] Each used, expired or cancelled link shows its auto-delete date (e.g. "Deleted on 28 Nov").
- [ ] **A morning clean-up job** runs once a day, every morning, and deletes outdated data: for now, links past
      their 30 days. Other changes can add their own outdated data to the same job later.
- [ ] The job can only be started by the scheduler (a secret it sends), not by anyone who finds the address; a
      second run on the same day does no harm.
- [ ] Each run logs how much it deleted; a failed run shows up in the logs and the next morning's run catches up.
- [ ] Links that are already older than 30 days when this ships are deleted by the first clean-up run.
- [ ] The E2E clean-up deletes the tests' old `E2E…` links instead of leaving them cancelled.

## Tasks
- [ ] References: bulk delete in lists (Mobbin "bulk actions", "delete", "clear all"); record what was taken.
- [ ] 3 prototype stories in `frontend/src/prototypes/I-006-delete-old-invite-links/` built from the real
      Invite links tab (I-021); owner picks one, final prototype approved.
- [ ] Keep "Invited" and its note on the People page when the used link is gone (open point 1): a migration copies
      them onto the account, `PeopleService` reads them from there.
- [ ] API: delete one link and delete many (`POST /api/admin/invitations/delete`, admin only, at most 200 at a
      time like `people/delete`); refuse waiting links; say how many were deleted.
- [ ] Auto-delete: the date a link stopped being usable (used at / expires at / cancelled at); the 30 days as a
      setting.
- [ ] Morning clean-up job (proposal, to approve with the change): a cron job on cron-job.org — the service that
      already runs the keep-awake ping (ADR 0002) — calls a clean-up endpoint every morning at 07:00 Kyiv time,
      with the secret in a header. The call also wakes the free Render service, so an in-app timer isn't needed
      (a sleeping service would miss it). Alternative: a scheduled GitHub Actions workflow (costs Actions minutes,
      see I-031). Recorded in an ADR.
- [ ] Clean-up endpoint: checks the secret (Render environment / user-secrets, never in the repo), deletes links
      past their 30 days, logs the count. Built so other outdated data can be added to it.
- [ ] Set up the cron-job.org job and the secret on Render (owner, with Claude's steps in the description).
- [ ] API returns each old link's auto-delete date.
- [ ] UI on the Invite links tab: check boxes and the bulk bar from the People tab (`BulkBar` in `PeopleTab.tsx`),
      a "Delete all" on each folded group, the auto-delete date on each old link, the confirmation dialog.
- [ ] E2E clean-up (`frontend/e2e/cleanup.teardown.ts`) deletes the tests' used, expired and cancelled `E2E…` links;
      CLAUDE.md "Clean up test data" and I-007's notes no longer say links can only be cancelled.
- [ ] Stories: groups with selection, confirmation dialog, a group cleared; loading and error states.

## Design
References: —
Prototypes: stories in `frontend/src/prototypes/I-006-delete-old-invite-links/`. Chosen variant: —

## Tests
- Unit (backend): delete one, delete many, the 200 limit, refuse waiting links, refuse non-admins, the account
  stays and is still "Invited" with its note, a family's link is deleted and the family is unchanged; the clean-up
  deletes links past 30 days and keeps waiting and newer ones; the auto-delete date; the clean-up endpoint refuses a
  call without the right secret; running it twice deletes nothing more.
- Unit (frontend): selection, "Delete all" on a group, confirmation with the count, waiting links have no check box.
- E2E (Playwright): delete a cancelled link, clear the Expired and cancelled group, delete several used links and
  the person stays "Invited".
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Open points (proposals to approve with the change)
1. **"Invited" on the People page comes from the used link.** Today `PeopleService` finds a person's "Invited" tag
   and note through the link that created the account (`CreatedAccount`), so deleting that link would drop them.
   Proposal: copy "invited" and the note onto the account in a migration and read them from there, so any used
   link can be deleted. Alternative: used links that created a still-existing account can't be deleted (simpler, but
   the Used group never empties).
2. **Which links can be picked.** Proposal: only used, expired and cancelled ones; waiting links get no check box,
   so a mixed selection can't happen.
3. **Clearing a group.** Proposal: a "Delete all" in each folded group's head (Used, Expired and cancelled), with
   the same confirmation; the bulk bar for a hand-picked few.
4. **Family owners.** Proposal: they get no delete; the Family page shows only waiting links, and old ones go with
   the 30-day job. The admin can delete family links on the Invite links tab like any other.
5. **Ship in one go or in two.** The owner chose to keep it one change (2026-11-12). Proposal: build it on one
   branch, but if the cron job's setup on Render holds it up, the manual delete may go first in its own PR of the
   same change.

## Notes
- Owner's answer, 2026-10-29: yes, old links are deleted automatically after **30 days**, and each shows its
  auto-delete date. "30 days" counts from the moment the link stopped being usable (Claude's reading; confirm with
  the prototype).
- Owner's answer, 2026-10-29: the clean-up runs as a **cron job every morning**. The 07:00 Kyiv time and
  cron-job.org are Claude's proposal (same service and start time as the keep-awake ping).
- Owner, 2026-11-12: asked to plan batch deleting the used and expired / cancelled invite links; chose to update
  I-006 rather than split it, and raised it to **High**. Since 2026-10-29: F-023 added family owners' links to the
  same tab, the People tab has check boxes and a bulk bar to reuse, and prototypes are Storybook stories (I-021).
