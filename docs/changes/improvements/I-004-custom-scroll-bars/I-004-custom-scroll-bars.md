# I-004 · Custom scroll bars, and scrolling inside the dialog

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Medium |
| Status | In progress (final prototype, waiting for the owner's approval) |
| Branch | `improvement/I-004-custom-scroll-bars` (planned on `plan/f028-follow-ups`) |
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
- [x] References: how well-made apps style scroll bars in dialogs and side panels.
- [ ] 3 prototypes of the scroll bar and a long dialog; owner picks and approves one. (Round 1 built
      2026-10-29; the owner picked variant 2; final prototype `variant-4.html` waiting for approval.)
- [ ] One shared style (theme tokens, no hard-coded colors) applied to `ResponsiveDialog`, `BottomSheet` and the
      other scrolling areas.
- [ ] Stories: a long dialog and a long sheet.

## Design
### References
- [Mantine ScrollArea](https://mantine.dev/core/scroll-area/): the four ways a custom bar can behave (on hover,
  while scrolling, always, never), the thumb size and the gap that keeps content clear of it. Variants 2 and 3
  would be built with it.
- [Mantine Modal, "scroll inside"](https://mantine.dev/core/modal/): a sticky header with the body in a
  `ScrollArea.Autosize` (`scrollAreaComponent`): the title and close button stay, only the body scrolls.
- [Material 3 dialogs](https://m3.material.io/components/dialogs/guidelines): when a dialog has to scroll, the title
  stays pinned at the top and it doesn't scroll with the page behind; a divider marks the edge. Taken: the hairline
  under the title once the list has moved (variants 1 and 3).
- [Material 3 bottom sheets](https://m3.material.io/components/bottom-sheets/guidelines): a tall modal sheet
  scrolls inside itself. Taken: the phone sheet keeps its grab handle and title and scrolls its body.
- [Apple HIG, scroll views](https://developer.apple.com/design/human-interface-guidelines/scroll-views): the
  indicator appears once people scroll, so make it obvious in other ways that there is more; small bars in panels.
  Taken: variant 2's bar that shows while scrolling and its edge fades.
- [Radix Scroll Area](https://www.radix-ui.com/primitives/docs/components/scroll-area): a thin rounded thumb inset
  inside a small panel, with no track or arrows.

### Round 1 (2026-10-29)
One shared prototype (the People page, a long "Pick a category" dialog with the default categories that becomes the
phone sheet, a long dropdown, a short window in which the sidebar scrolls); the variants differ in the scroll bar.
The page column keeps the browser's own bar in all three.

| Variant | Thesis | Built with |
|---------|--------|------------|
| [1 · Quiet pill](prototypes/variant-1.html) | The browser's bar, only quieter: a 4 px grey pill (the fields' border color, 3:1), 6 px under the mouse, always there while there is more; no track or arrows; a hairline under the dialog title once scrolled | One global CSS rule, nothing wrapped; Firefox only colors it |
| [2 · Shows while you scroll](prototypes/variant-2.html) | Like a phone or a Mac: a 6 px pill floats over the content, shows while scrolling or under the pointer and fades after a second; the list fades out at the edges with more behind them | Mantine `ScrollArea` type "scroll" in every scrolling area |
| [3 · Sky rail](prototypes/variant-3.html) | The bold one: a 1 px rail like a ledger's margin line with a 6 px sky-blue thumb (the accent, the sidebar's "you are here" color); always there; content keeps clear of it | Mantine `ScrollArea` type "always" with offset |

Checked: `npm run design:check` on all three (0 issues), and screenshots of the long dialog, the dialog scrolled,
the phone sheet, the dropdown and the short window at 375 and 1440 px, light and dark, with the browser's scroll
bars on (headless Chromium hides them by default).

### Round 2: final prototype (2026-10-29)
The owner picked variant 2 (the bar shows while scrolling, the edges fade) and answered:
- the pointer stays an arrow over the bar and while dragging it, as on Windows, macOS and in the browser (a hand is
  for links and buttons, an open hand for dragging the content itself);
- the page itself (its main column) keeps the browser's own scroll bar;
- a long form dialog keeps its buttons pinned at the bottom while the form scrolls between the title and the
  buttons, with a hairline over them while more is below (on the phone full width, Save on top).

[Variant 4 · Final](prototypes/variant-4.html) is variant 2 with a "Dialog with buttons" screen added. Checked:
design check 0 issues; screenshots at 375 and 1440 px, light and dark, of the dialog scrolled, the dialog with
buttons and the page.

Prototypes: `prototypes/`. Chosen variant: 2, built as the final prototype `variant-4.html` (not approved yet).

## Tests
- Unit: —
- E2E (Playwright): a long dialog scrolls inside itself; the page behind keeps its scroll position.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
- The dialogs are Mantine `Modal` (desktop) and `Drawer` (phone sheet) with Pup styles on top; see the owner's
  question 3 in PROGRESS 2026-10-29 (8).
