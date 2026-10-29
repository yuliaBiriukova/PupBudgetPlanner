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
- [ ] **A morning clean-up job** runs once a day, every morning, and deletes outdated data: for now, links past
      their 30 days. Other changes can add their own outdated data to the same job later.
- [ ] The job can only be started by the scheduler (a secret it sends), not by anyone who finds the address; a
      second run on the same day does no harm.
- [ ] Each run logs how much it deleted; a failed run shows up in the logs and the next morning's run catches up.
- [ ] Links that are already older than 30 days when this ships are deleted by the first clean-up run.

## Tasks
- [ ] References: bulk delete in lists (Mobbin "bulk actions", "delete").
- [ ] 3 prototypes; owner picks and approves one.
- [ ] API: delete one link and delete many (admin only, same limit as the other bulk actions); refuse waiting links.
- [ ] Auto-delete: the date a link stopped being usable (used at / expires at / cancelled at); the 30 days as a
      setting.
- [ ] Morning clean-up job (proposal, to approve with the change): a cron job on cron-job.org — the service that
      already runs the keep-awake ping (ADR 0002) — calls a clean-up endpoint every morning at 07:00 Kyiv time,
      with the secret in a header. The call also wakes the free Render service, so an in-app timer isn't needed
      (a sleeping service would miss it). Alternative: a scheduled GitHub Actions workflow. Recorded in an ADR.
- [ ] Clean-up endpoint: checks the secret (Render environment / user-secrets, never in the repo), deletes links
      past their 30 days, logs the count. Built so other outdated data can be added to it.
- [ ] Set up the cron-job.org job and the secret on Render (owner, with Claude's steps in the description).
- [ ] API returns each old link's auto-delete date.
- [ ] UI on the Links tab, using the same check boxes and bulk bar as the People tab, and the auto-delete date.
- [ ] Stories: groups with selection, confirmation dialog.

## Design
References: —
Prototypes: `prototypes/`. Chosen variant: —

## Tests
- Unit (backend): delete one, delete many, refuse waiting links, refuse non-admins, account stays; the clean-up
  deletes links past 30 days and keeps waiting and newer ones; the auto-delete date; the clean-up endpoint refuses
  a call without the right secret; running it twice deletes nothing more.
- Unit (frontend): selection and confirmation.
- E2E (Playwright): delete a cancelled link, clear the expired group.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
- Owner's answer, 2026-10-29: yes, old links are deleted automatically after **30 days**, and each shows its
  auto-delete date. "30 days" counts from the moment the link stopped being usable (Claude's reading; confirm with
  the prototype).
- Owner's answer, 2026-10-29: the clean-up runs as a **cron job every morning**. The 07:00 Kyiv time and
  cron-job.org are Claude's proposal (same service and start time as the keep-awake ping).
