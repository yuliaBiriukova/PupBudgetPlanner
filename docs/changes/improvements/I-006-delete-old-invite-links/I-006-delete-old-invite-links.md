# I-006 · Delete invite links

| | |
|---|---|
| Type | Improvement |
| Milestone | M5 — Categories & family (moved from M2, which is done) |
| Priority | High (raised from Medium by the owner, 2026-11-12) |
| Status | Done (the owner sets up the cron-job.org job and the secret at the release, see "Setting up the morning clean-up") |
| Branch | `improvement/I-006-delete-old-invite-links` (planned on `plan/f028-follow-ups`, updated on `plan/i006-batch-delete-invite-links`) |
| Design | 3 prototype stories required (delete on the Invite links tab and the Family page) |
| Approved | 2026-11-12, by the owner in chat ("approved I-006, build it"): the description, the final prototype and the morning clean-up job |

## Goal
The admin can delete invite links — one at a time or many at once, a whole group (Waiting, Used, Expired and
cancelled) by selecting it all — so the database and the Invite links tab do not fill up with old links. A family
owner can do the same with their own links on the Family page. Links that can no longer be used are also deleted
automatically 30 days later. Found by the owner after F-028, 2026-10-29; asked again on 2026-11-12 ("batch deleting
the used and expired/cancelled invite links"), now that F-023's family links land on the same tab.

## Acceptance criteria
- [x] On the Invite links tab, any link — waiting, used, expired or cancelled — can be deleted on its own.
- [x] Every link has a check box; several can be selected and deleted at once through the bulk bar.
- [x] Each group (Waiting, Used, Expired and cancelled) has its own "Select all"; a whole group is cleared by
      selecting it all and deleting through the bulk bar. An empty group shows no Select all (owner, PR #95 review).
- [x] Every group folds, Waiting too: Waiting starts open, Used and Expired and cancelled folded; what the person
      opened or folded is kept in the browser, as today (owner, 2026-11-12).
- [x] Deleting asks for confirmation and says how many links go; when waiting links are among them, it says they
      stop working at once.
- [x] Deleted links are removed from the database (not hidden). A deleted waiting link can no longer be used to sign
      up or join a family.
- [x] Cancelling a waiting link stays as it is today, and several can be cancelled at once: the bulk bar has
      Cancel links (as the People tab's Block) when any waiting link is picked; it cancels only the waiting ones,
      after a confirmation that says how many (owner, 2026-11-12).
- [x] The admin's links and family owners' links (F-023) are deleted the same way on the Invite links tab; a family
      and its members are not touched.
- [x] **Family page:** a family owner sees their own links there — waiting, used, expired and cancelled — and can
      delete them the same way (check boxes, Select all per group, bulk bar, confirmation). Only their own family's
      links; members who aren't owners see no delete.
- [x] Deleting a used link does not touch the account that was created with it, and the People page still shows that
      person as "Invited" with the link's note (see open point 1).
- [x] **Auto-delete after 30 days:** a link that can no longer be used is deleted automatically 30 days after it
      became so (used, expired or cancelled). Waiting links are never auto-deleted.
- [x] A line under the groups says it: "Used, expired and cancelled links are deleted automatically 30 days after
      they stop working." The links show no date of their own (owner, 2026-11-12, in place of the auto-delete date
      on each link asked for on 2026-10-29).
- [x] **A morning clean-up job** runs once a day, every morning, and deletes outdated data: for now, links past
      their 30 days. Other changes can add their own outdated data to the same job later.
- [x] The job can only be started by the scheduler (a secret it sends), not by anyone who finds the address; a
      second run on the same day does no harm.
- [x] Each run logs how much it deleted; a failed run shows up in the logs and the next morning's run catches up.
- [x] Links that are already older than 30 days when this ships are deleted by the first clean-up run.
- [x] The E2E clean-up deletes the tests' `E2E…` links instead of leaving them cancelled.

## Tasks
- [x] References: bulk delete in lists (Mobbin "bulk actions", "delete", "select all"); record what was taken.
- [x] 3 prototype stories in `frontend/src/prototypes/I-006-delete-old-invite-links/` built from the real
      Invite links tab and Family page (I-021); owner picks one, final prototype approved.
- [x] Keep "Invited" and its note on the People page when the used link is gone (open point 1): a migration copies
      them onto the account, `PeopleService` reads them from there.
- [x] API: delete one link and delete many (`POST /api/admin/invitations/delete`, admin only, at most 200 at a
      time like `people/delete`), any status; say how many were deleted. Cancel many the same way
      (`POST /api/admin/invitations/cancel` with the ids, at most 200; links that aren't waiting are left as they
      are).
- [x] API for family owners: list their family's links of every status, delete and cancel them (one or many, at
      most 200; only their own family's links, owner only).
- [x] Auto-delete: the date a link stopped being usable (used at / expires at / cancelled at); the 30 days as a
      setting.
- [x] Morning clean-up job (proposal, to approve with the change): a cron job on cron-job.org — the service that
      already runs the keep-awake ping (ADR 0002) — calls a clean-up endpoint every morning at 07:05 Kyiv time (built: five minutes after the ping wakes the API),
      with the secret in a header. The call also wakes the free Render service, so an in-app timer isn't needed
      (a sleeping service would miss it). Alternative: a scheduled GitHub Actions workflow (costs Actions minutes,
      see I-031). Recorded in an ADR.
- [x] Clean-up endpoint: checks the secret (Render environment / user-secrets, never in the repo), deletes links
      past their 30 days, logs the count. Built so other outdated data can be added to it.
- [ ] Set up the cron-job.org job and the secret on Render (owner, at the release; steps in "Setting up the morning
      clean-up" below).
- [x] UI on the Invite links tab: check boxes on every link and the bulk bar from the People tab (`BulkBar` in
      `PeopleTab.tsx`), a "Select all" on each group (Waiting, Used, Expired and cancelled), the 30-day line under the
      groups, the confirmation dialogs.
- [x] Waiting folds like the other groups, open by default (both pages). Today the browser keeps the list of groups
      left *open* (`pup.people.links.shown`, Used / Expired and cancelled only): keep the fold of each group so that a
      value saved before this change still leaves Waiting open.
- [x] UI on the Family page: the owner's links of every status in the same groups, with the same selection, bulk
      bar, 30-day line and confirmations.
- [x] E2E clean-up (`frontend/e2e/cleanup.teardown.ts`) deletes the tests' `E2E…` links;
      CLAUDE.md "Clean up test data" and I-007's notes no longer say links can only be cancelled.
- [x] Stories: groups with selection, confirmation dialog, a group cleared (both screens); loading and error states.

## Design
References (Mobbin's own catalogue needs a sign-in, so open pages only):
- [Carbon data table, batch actions](https://carbondesignsystem.com/components/data-table/usage/) — the bar for
  picked rows takes the table's head, with the count, the actions and Cancel (variant 3).
- [Google Photos, selecting a day](https://alphr.com/google-photos-how-to-select-all) — a check next to each date
  heading picks the whole day: Select all on each group's head (variants 1 and 3).
- [eBay Playbook, bulk editing](https://playbook.ebay.com/design-system/patterns/bulk-editing) — the bulk bar
  shows once something is picked or edit mode is on; red only on the destructive action (variant 2's Select mode,
  the red only in the confirmation).
- [SaaS UI, bulk actions](https://www.saasui.design/blog/saas-bulk-actions-ux-patterns) — a bar pinned to an edge
  with the count and a clear way out of the selection (the floating bar of variants 1 and 2).
- The app's own People tab (F-028): the check box left of each row, shown on hover with a mouse and always on the
  phone, and its bulk bar — reused as they are (variant 1).

Prototypes: stories in `frontend/src/prototypes/I-006-delete-old-invite-links/`, *Prototypes / I-006 Delete invite
links*. Each opens the app as Olena, the admin and the owner of the Kovalenko family, on People › Invite links; the
sidebar (More on the phone) goes to the Family page, which deletes the same way. The Controls' *start* opens on the
Family page instead. Every change (cancel, delete, a new link) is kept while the story is shown.
- [Variant 1: Check boxes](http://localhost:6006/?path=/story/prototypes-i-006-delete-invite-links--variant-1&nav=false&panel=false&globals=viewport.value:!undefined)
  — the People tab's pattern: a box on every link (with a mouse on hover or once anything is picked), a Select all
  box on each group's head that works on a folded group too ("4 picked" in its head), the floating bar with Delete.
- [Variant 2: Select mode](http://localhost:6006/?path=/story/prototypes-i-006-delete-invite-links--variant-2&nav=false&panel=false&globals=viewport.value:!undefined)
  — the list stays as it is today until Select; then every group opens, each says Select all / Clear, every link
  is a box, Cancel steps aside, and a bar with Delete and Done stays until Done.
- [Variant 3: Ledger](http://localhost:6006/?path=/story/prototypes-i-006-delete-invite-links--variant-3&nav=false&panel=false&globals=viewport.value:!undefined)
  — the risk: one dense table like the spreadsheet (Link, What happened, Date, Deleted on), the groups as bands with
  their Select all box, a ⋯ on each row (Cancel link, Delete link), and the bar for the picked links in place of
  the table's head.

All three: each used, expired or cancelled link shows "Deleted on 12 Dec" (30 days after it stopped working), a
line under the groups says so; Delete asks once with the links listed, "Keep them" / "Delete 6 links", says when
some still work ("they stop working at once") and that whoever joined with a link keeps their account.

Chosen variant: variant 1 "Check boxes", to improve (owner, 2026-11-12). Variants 2 and 3 were removed from the
stories.

### Round 2: the final prototype (2026-11-12)
[Final prototype](http://localhost:6006/?path=/story/prototypes-i-006-delete-invite-links--final&nav=false&panel=false&globals=viewport.value:!undefined)
— variant 1 with the owner's points:
- **Cancel links in the bulk bar** (as Block on the People tab): shown when any waiting link is picked; it asks
  once ("Cancel 2 links?", the waiting links listed, "Keep them" / "Cancel 2 links"), says the cancelled ones move
  to Expired and cancelled and are deleted 30 days later, and that the other picked links stay as they are. Only the
  waiting ones change; the picks are cleared after.
- **No delete date on each link** (owner, 2026-11-12): round 1's "Deleted on 12 Dec" (the day the morning clean-up
  removes a used, expired or cancelled link) read like a date in the past, and "Auto-deletes 10 Dec" wasn't clear
  either. The right of an old link's card is empty now; only the line under the groups says they are deleted
  automatically 30 days after they stop working.
- **The fold's hover** tints the whole group head, the Select all box included, as one strip (it was a grey pill
  beside the box).
- On the phone a long group title wraps with its count and "N picked" after its last word, and only the chevron
  stays (no Show / Hide), so nothing is left alone on the right; waiting cards say "6 days left" without the date.
- **Waiting folds too** (owner, 2026-11-12, after the final prototype was shown): its head is a fold like the
  others, open when the page opens.

Final prototype approved: 2026-11-12 (owner, in chat: "approved I-006, build it").

## Tests
- Unit (backend): delete one, delete many (waiting ones too), the 200 limit, refuse non-admins; cancel many
  (only the waiting ones change); a family owner
  deletes their family's links and not another family's, a member who isn't the owner is refused; a deleted waiting
  link can't be used; the account stays and is still "Invited" with its note, a family's link is deleted and the
  family is unchanged; the clean-up deletes links past 30 days and keeps waiting and newer ones; the clean-up endpoint refuses a call without the right secret; running it twice deletes nothing more.
- Unit (frontend): selection, "Select all" on a group, confirmation with the count (and the waiting-links line);
  Cancel links shown only with a waiting link picked, cancelling only those.
- E2E (Playwright): delete a cancelled link, clear the Expired and cancelled group with Select all, delete several
  used links and the person stays "Invited", delete a waiting link and it no longer opens; a family owner deletes a
  link on the Family page.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

### As built (2026-11-12)
The backend's unit tests have no database (integration tests come after the MVP, ADR 0005), so what the database
does is checked by the E2E tests:
- Unit (backend): the clean-up's query and the stopped-at date agree for waiting, used, cancelled and expired links,
  a link that stopped at the cutoff is kept (`InvitationTests`); the 1–200 limit (`AccessTests`); the admin's and the
  family's endpoints answer with the counts, a member who isn't the owner gets 403, someone in no family 404
  (`AdminControllerTests`, `FamilyControllerTests`); the clean-up runs only with the configured secret, is off
  without one, opts out of antiforgery and is rate-limited (`CleanupControllerTests`); the antiforgery filter skips
  only an endpoint that opts out (`AntiforgeryFilterTests`).
- Unit (frontend): Waiting folds and every fold is remembered; a fold saved before this change keeps Waiting open;
  Select all on a folded group, the bulk bar without Cancel links when nothing waiting is picked, Delete's
  confirmation with the links listed and the count, the waiting-link warning and Keep it; Cancel links cancels only
  the waiting ones; the Family page's owner deletes the Used and Expired and cancelled groups, a member sees no
  check boxes (`PeoplePage.test.tsx`, `FamilyPage.test.tsx`).
- E2E (`invite-links.spec.ts`, phone and desktop): the admin deletes a used and a waiting link through the bulk bar
  (the warning says one still works), the waiting link no longer opens (404), Cancel links cancels another, and the
  person made with the used link is still "Invited" with its note; a family owner clears Used and Expired and
  cancelled with Select all on the Family page, the waiting link and the member stay. On the shared `dev` database
  the admin's test picks only its own links, never a group's Select all. `family.spec.ts` reads a link's note as
  written (no "For").
- By hand: `POST /api/cleanup` without the secret and with a wrong one → 401; with it → 200 `{"invitationsDeleted":0}`
  twice, run with a 10-year keep period so nothing in the shared `dev` database was deleted; the log line and the
  `DELETE … WHERE COALESCE(used_at, cancelled_at, expires_at) < @cutoff` it runs.
- Screens: the Family page (links, picked with the bar, the Delete and Cancel confirmations) and the Invite links tab
  (links, a group picked) at 375 and 1440 px, light and dark, looked at; they match the final prototype.

### Built differently from the prototype
- The family list shows a link's note as written ("Mom"), as the Invite links tab does and as the final prototype
  did; before, the Family page said "For Mom". The new-link dialog still says "For Dad".
- The Invite links tab keeps its lead line ("A link works once, for 7 days. Pup Budget shows a link only when you make
  it."); the prototype had a draft of it.
- The clean-up runs at 07:05 Kyiv time, not 07:00 as proposed: five minutes after the keep-awake ping's first call
  wakes the free service, so the call doesn't wait for a cold start.

## Setting up the morning clean-up (owner, at the release)
After the release PR is merged and Render has deployed `main`:
1. Make a long random secret, e.g. in PowerShell:
   `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`.
2. Render → the `pup-budget-planner` service → Environment → add `Cleanup__Secret` with the secret → Save (the
   service restarts). Without it the clean-up answers 401 and deletes nothing.
3. cron-job.org → Create cronjob: title "Pup Budget morning clean-up", URL
   `https://<the app's address>/api/cleanup`; schedule every day at 07:05, time zone Europe/Kyiv. Under Advanced:
   request method **POST**, header `X-Cleanup-Secret` with the secret. Save.
4. Run it once with "Test run": the answer is `200` with `{"invitationsDeleted": N}` (the first run deletes every
   link that stopped working more than 30 days ago). Render's logs say "Morning clean-up: deleted N invite links…".
5. A failed morning shows in cron-job.org's history (not 200) and in Render's logs; the next morning catches up.

## Open points (answered by the owner, 2026-11-12)
1. **"Invited" on the People page comes from the used link.** Today `PeopleService` finds a person's "Invited" tag
   and note through the link that created the account (`CreatedAccount`), so deleting that link would drop them.
   **Answer:** copy "invited" and the note onto the account in a migration and read them from there, so any used
   link can be deleted.
2. **Which links can be picked.** **Answer:** all of them — waiting links get a check box too and can be deleted in
   a batch; each group (Waiting, Used, Expired and cancelled) has its own "Select all".
3. **Clearing a group.** **Answer:** "Select all" on the group, then delete through the bulk bar (no separate
   "Delete all").
4. **Family owners.** **Answer:** yes, they delete their own links on the Family page, which then lists their links
   of every status, not only the waiting ones.
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
- Owner, 2026-11-12 (work started): answered open points 1–4 (above). Waiting links can be deleted outright too, and
  family owners delete their own links on the Family page, which lists every status.
- Owner, 2026-11-12 (design round 1): chose variant 1 "Check boxes", to improve; asked for batch Cancel in the same
  change (as Block on the People tab); found the folded group's hover odd (a grey pill beside the check box); asked
  why old links show "Deleted on" — it is the auto-delete date of the 2026-10-29 answer, which read like a date in
  the past, so the final prototype said "Auto-deletes".
- Owner, 2026-11-12 (final prototype): didn't like "Auto-deletes" either; chose no date on each link, only the line
  under the groups.
- Owner, 2026-11-12 (review of PR #95): no Select all at all on a group with no links (it was a disabled box). The
  empty gap it left looked odd, so the owner chose that an empty group's title moves left, to where the box would be.
