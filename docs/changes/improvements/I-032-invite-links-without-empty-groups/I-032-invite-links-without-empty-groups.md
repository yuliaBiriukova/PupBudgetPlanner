# I-032 · Invite links: no empty groups on the Family page; one list on the People page

| | |
|---|---|
| Type | Improvement |
| Milestone | M6 — MVP release (polish before the launch) |
| Priority | Medium (proposed: a side screen, nothing broken; owner's feedback on I-006 after the release) |
| Status | In progress (final prototype) |
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
- [ ] People page, Invite links tab: no groups; one list of every link: waiting ones first, then the rest, each part
      newest first. Each row shows its status as a tag (*Waiting · 5 days left*, *Used by Olena · 3 Nov*,
      *Expired 1 Nov*, *Cancelled 2 Nov*) and its details (note, family) as today.
- [ ] People page: one *Select all* at the list's head (the first 200); the bulk bar, Cancel links and Delete as in
      I-006. The groups' folds, and what the browser kept of them, go away there.
- [ ] Picking links and deleting or cancelling them works as in I-006 on both pages.

## Tasks

- [ ] Final prototype story (owner's direction, one story instead of 3 variants, agreed 2026-11-12) — to approve before
      any code.
- [ ] Build it; update the People and Family stories, unit tests and `invite-links.spec.ts`.

## Design

The owner gave the direction (hide empty groups; one list on People) and took the five proposals in Notes; one final
prototype instead of 3 variants (agreed 2026-11-12).

References (open pages, no sign-in):
- Atlassian design system, *Lozenge* (atlassian.design/components/lozenge): a short status word in a small tinted
  box next to the item; colour by meaning (in progress, success, removed). Taken: the status as one word, its colour
  saying waiting / used / done with.
- Shopify Polaris, *Badge* in index tables (polaris.shopify.com/components/feedback-indicators/badge): one list of
  every status with the status as a badge on each row instead of tabs or groups. Taken: no groups, the badge leads the
  row's details.
- Carbon design system, *Status indicator pattern* (carbondesignsystem.com/patterns/status-indicator-pattern): the
  status never by colour alone, always with a word; an icon may repeat it. Taken: the word in the tag, the row's icon
  kept.
- The app's own People tab: one list with a Select all over it and the floating bar for the picked ones.

**Final prototype:** *Prototypes / I-032 Invite links / Final prototype*
([open it](http://localhost:6006/?path=/story/prototypes-i-032-invite-links--final-prototype&nav=false&panel=false&globals=viewport.value:!undefined)),
the copies in `frontend/src/prototypes/I-032-invite-links-without-empty-groups/`. It opens on the People page's
Invite links tab; the controls switch to the Family page and to other sets of links (*Every status*, *Some statuses
missing*, *None*).
- People: one list, waiting links first, then the rest, each part newest first. The head is the Select all box with
  "7 links" and "2 picked". Each row: the icon, the note (and the family tag), then a status tag that leads the
  details' line: *Waiting* 6 days left, until 18 Nov · *Used* by Dmytro Lysenko on 10 Nov · *Expired* on 7 Nov ·
  *Cancelled* on 4 Nov (the details no longer repeat the status word). Tags: Waiting in the accent, Used in the
  income green, Expired and Cancelled grey. With no links: "No invite links yet. Make one with New invite link."
- Family: the groups as before (Waiting open, the others folded), only those with links; with none, only *Create
  invite link*.
- Checked: typecheck, ESLint, Prettier; the design check (Playwright + axe, 360 – 1440 px, light and dark) on the
  People tab, the Family page with a group missing and the People tab with no links: 0 issues, 0 console errors;
  every state (all links, some statuses missing, none, two picked with the bar, the Family page) at 375 and 1440 px,
  light and dark, screenshots looked at.
- When built, the cancel confirmation's "It moves to Expired and cancelled" is said differently on the People page
  (there is no such group there).

Chosen: the owner's direction · Final prototype approved: — (screenshots go to `prototypes/` once approved)

## Tests

- Unit: an empty group isn't shown (Family); the People tab lists every status in one list.
- E2E (Playwright): `invite-links.spec.ts` on the new list.
- Screens checked in Playwright screenshots (phone / desktop, light / dark).

## Notes

### Open points: settled 2026-11-12, the owner took all five proposals ("Yes, as proposed")

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
