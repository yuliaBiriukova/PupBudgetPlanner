# B-027 · The People page's invite links lost their groups: only the Family page was meant to drop them

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: in production since the release PR #98; the admin's own screen, every link still there and usable) |
| Status | Done |
| Branch | `bugfix/B-027-invite-link-groups-on-people` |
| Found in | Production, People › Invite links, reported by the owner on 2026-11-13 |
| Design | Back to the groups the owner has approved before (I-006, and I-032's final prototype for the Family page): no new prototype |
| Approved | 2026-11-14, the owner in chat ("Approved, build it"): the root cause and the planned fix |

## Steps to reproduce
1. Sign in as the admin and open People › Invite links.

## Expected
The links in groups, as before I-032: *Waiting*, *Used*, *Expired and cancelled*. The owner, 2026-11-13: "bring back
invite link groups to People, I asked to remove groups only in Family".

## Actual
One list of every link (waiting ones first, then newest first), a status tag on each row and one Select all over the
list: "3 links".

## Root cause
- I-032 (PR #97, 2026-11-12) was planned as "one list on the People page; on the Family page only the groups that
  have links", and built that way. Its description and its final prototype read the owner's request the wrong way
  round for the People page.
- In the review of #97 the owner asked for no groups on the Family page either. Both pages share one component,
  `InviteLinks` (`frontend/src/features/people/InviteLinks.tsx`), so from then on both showed the one list and the
  group code (`GroupHead`, the folds, `readOpen` / `writeOpen` in `linkGroups.ts`) was deleted.
- The owner wanted the groups gone only on the Family page.

## Fix (planned, to approve)
- **People › Invite links:** the groups come back as the owner approved them before: *Waiting*, *Used*, *Expired and
  cancelled*, each with its title, count, how many of it are picked and its Select all; *Waiting* open at first, the
  others folded, Show / Hide on each head, and the browser keeps which are open (`pup.people.links.open`, as before).
  From I-032 stays: a group with no links doesn't show, and with no links at all the tab says "No invite links yet.
  Make one with New invite link." The rows say their status in words, as before I-032 (*Used by Olena on 3 Nov*,
  *Expired on 1 Nov*, *Cancelled on 2 Nov*), without the tag; the cancel confirmation says the link moves to *Expired
  and cancelled* again.
- **Family page:** no change: one list with the status tags and one Select all.
- `InviteLinks` takes the groups or the one list by its `place`; the group code and its texts come back from before
  I-032 (`7db9f02`).

## Built (2026-11-14)
- `InviteLinks.tsx`: the code of I-032's approved prototype state (the groups, only those with links; PR #97's commit
  `a607b91`, then on the Family page) now draws the admin's tab, and the one list draws the Family page. The group
  heads are the People page's full-size titles, as in I-006 (the Family page's smaller ones went with the groups).
- `linkGroups.ts`: the folds are kept under `pup.people.links.open` again, so a browser that kept them before I-032
  opens as it was left. `pup.family.links.open` and the older `pup.people.links.shown` stay unread.
- `en.json`: the groups' titles, their Select all names, Show / Hide and the rows' words (*Used by …*, *Expired on …*,
  *Cancelled on …*) are back; the cancel confirmation says "moves to Expired and cancelled" on People and "shows as
  cancelled" on Family.

## Tests
- [x] Unit (`PeoplePage.test.tsx`): the three groups, Waiting open and the others folded, the rows' words without a
      tag, the folds kept in the browser; a group with no links not shown; no links at all says so, with no groups; a
      folded group's Select all, then Delete; the cancel confirmation's "moves to Expired and cancelled".
      `FamilyPage.test.tsx` passes untouched. Both files 3 times in a row (`--repeats=2`): 56 tests, all passed.
- [x] E2E (`invite-links.spec.ts`, phone and desktop): the admin's links in their groups (Used folded until opened, its
      row "Used by … on"); a cancelled link moves to *Expired and cancelled*, "Cancelled on". The Family test as it was.
      With `family.spec.ts`, `--repeat-each=3`: 26 passed.
- [x] Stories: *Links all open*, *Links picked*, *Links delete confirm*, *Links cancel confirm* and *Links group
      cleared* (an emptied group goes away) are back on the groups. The design check (Playwright + axe, 360 – 1440 px,
      light and dark) on the People stories and the Family owner: no issue from this change; it flags the toast's
      close button (28 px, no name) in *Links group cleared*, the app's notification, the same on every page.
- [x] Screenshots at 375 and 1440 px, light and dark, looked at: in [screenshots/](screenshots/) the groups opened
      (`people-groups-…`), two groups picked (`people-picked-…`) and a group cleared (`people-group-cleared-…`).
- [x] Test data: the E2E runs made `e2e-…@example.com` people and `E2E…` invite links in the `dev` database; the
      clean-up teardown deleted them. Nothing else was created; nothing of the owner's was touched.
