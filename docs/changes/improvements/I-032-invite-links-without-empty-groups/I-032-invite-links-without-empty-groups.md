# I-032 · Invite links: no empty groups on the Family page; one list on the People page

| | |
|---|---|
| Type | Improvement |
| Milestone | M6 — MVP release (polish before the launch) |
| Priority | Medium (proposed: a side screen, nothing broken; owner's feedback on I-006 after the release) |
| Status | Todo |
| Branch | `bugfix/B-020-B-022-I-032-ui-fixes` (one PR with B-020 – B-022, as the owner asked) |
| Design | 🎨 changes I-006's approved screens: a final prototype story to approve |
| Approved | — |

## Goal

Less clutter around invite links. Found by the owner on 2026-11-12: a group with no links (Waiting 0, Used 0,
Expired and cancelled 0) still shows its title and "No links are waiting.", on the Family page and on the People
page's Invite links tab. The People page doesn't need the groups at all: one list of links, each with its status
and details.

## Acceptance criteria

- [ ] Family page: a group with no links isn't shown (no title, no count, no "No links…" line). With no links at all,
      only "Create invite link" shows.
- [ ] People page, Invite links tab: no groups; one list of every link, each showing its status (Waiting, Used,
      Expired, Cancelled) and its details (note, who made it, dates) as today.
- [ ] Picking links and deleting or cancelling them works as in I-006 on both pages.

## Tasks

- [ ] Final prototype story (owner's direction, from the I-006 screens) — to approve before any code.
- [ ] Build it; update the People and Family stories, unit tests and `invite-links.spec.ts`.

## Design

The owner gave the direction (hide empty groups; one list on People). Open points for the prototype are in Notes.

## Tests

- Unit: an empty group isn't shown (Family); the People tab lists every status in one list.
- E2E (Playwright): `invite-links.spec.ts` on the new list.
- Screens checked in Playwright screenshots (phone / desktop, light / dark).

## Notes

### Open points (Claude's proposals, to settle with the owner)

1. **People page, the order of the one list:** waiting links first (they can still be used, and Cancel is on them),
   then the rest, each part newest first.
2. **People page, the status:** a small tag on each row, as the People list's tags: *Waiting* (with the days left, as
   today), *Used by Olena · 3 Nov*, *Expired 1 Nov*, *Cancelled 2 Nov*; the row's icon stays.
3. **People page, picking:** one *Select all* at the list's head (the first 200, as today), the bulk bar as in I-006.
   The groups' folds and what was saved of them go away.
4. **Family page, no links at all:** only *Create invite link*, no line under it. A group shows again as soon as it
   has a link; Waiting starts open, the others folded, as today.
5. **Design round:** the owner has given the direction, so one final prototype story (*Prototypes / I-032 Invite
   links*, the People tab and the Family page) instead of 3 variants, then approval before any code.
