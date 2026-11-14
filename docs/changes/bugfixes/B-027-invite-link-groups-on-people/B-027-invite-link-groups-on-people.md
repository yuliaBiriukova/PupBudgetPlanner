# B-027 · The People page's invite links lost their groups: only the Family page was meant to drop them

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: in production since the release PR #98; the admin's own screen, every link still there and usable) |
| Status | Todo |
| Branch | `bugfix/B-027-invite-link-groups-on-people` |
| Found in | Production, People › Invite links, reported by the owner on 2026-11-13 |
| Design | Back to the groups the owner has approved before (I-006, and I-032's final prototype for the Family page): no new prototype |
| Approved | — |

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

## Tests
- [ ] Unit (`PeoplePage.test.tsx`): the groups and their counts, an empty group not shown, Waiting open and the others
      folded, a group's Select all (on a folded group too), the folds kept in the browser, rows without a tag, the
      cancel confirmation's words. `FamilyPage.test.tsx` still passes untouched.
- [ ] E2E (`invite-links.spec.ts`, phone and desktop): the admin's tab shows its links in groups; cancelling a link
      moves it to *Expired and cancelled*; the Family page's one list as now.
- [ ] Stories: the People stories show the groups again; screenshots at 375 and 1440 px, light and dark, looked at.
