# I-004 · Custom scroll bars, and scrolling inside the dialog

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Medium |
| Status | Todo |
| Branch | `improvement/I-004-I-008-people-page-follow-ups` (shared with I-005 – I-008, as the owner asked) |
| Design | 3 HTML prototypes required (scroll bar style) |
| Approved | — |

## Goal
Scroll bars inside the app look like Pup, not like the browser's default grey bar, and a dialog scrolls inside
itself. Found by the owner after F-028, 2026-10-29.

## Acceptance criteria
- [ ] Every scrolling area except the page itself (`body`) has the app's own thin scroll bar, themed for light
      and dark: dialogs, phone sheets, the sidebar, lists and menus.
- [ ] The page's own scroll bar stays the browser's default.
- [ ] A dialog taller than the screen scrolls inside the dialog: its title and the close button stay in place, the
      scroll bar sits inside the rounded card, and the page behind does not move.
- [ ] Same on the phone sheet.

## Tasks
- [ ] References: how well-made apps style scroll bars in dialogs and side panels.
- [ ] 3 prototypes of the scroll bar and a long dialog; owner picks and approves one.
- [ ] One shared style (theme tokens, no hard-coded colors) applied to `ResponsiveDialog`, `BottomSheet` and the
      other scrolling areas.
- [ ] Stories: a long dialog and a long sheet.

## Design
References: —
Prototypes: `prototypes/`. Chosen variant: —

## Tests
- Unit: —
- E2E (Playwright): a long dialog scrolls inside itself; the page behind keeps its scroll position.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
- The dialogs are Mantine `Modal` (desktop) and `Drawer` (phone sheet) with Pup styles on top; see I-008's notes
  and the owner's question 3 in PROGRESS 2026-10-29 (8).
