# I-012 · Less space between a pop-up's title and its content

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Medium |
| Status | Todo |
| Branch | `improvement/I-012-dialog-title-spacing` (planned on `plan/f014-follow-ups`) |
| Design | Not 3 variants: one before / after page with the proposed spacing, for the owner's approval |
| Approved | — |

## Goal

Every pop-up (the desktop dialog and the phone sheet) has too much empty space between its title block and its
content; it looks like a gap that shouldn't be there. Found by the owner while testing F-014, 2026-10-30, for all
pop-ups.

## Acceptance criteria

- [ ] In every pop-up the content starts close under the title, with the spacing of the approved before / after
      page (proposal: about 12 px between the title block and the content, as in the prototypes).
- [ ] The same on the desktop dialog (`ResponsiveDialog`) and the phone sheet (`BottomSheet`), light and dark.
- [ ] A long content still scrolls between the pinned title and the pinned buttons (I-004), and its top fade still
      shows only once it is scrolled.
- [ ] Checked on every pop-up there is: the account form and the archive question (F-014), New invite link, Block
      and Delete (F-028), Add transaction and More (F-010).

## Tasks

- [ ] Before / after page with the proposed spacing (desktop dialog and phone sheet); the owner approves it.
- [ ] Fix the spacing once, in the shared `ResponsiveDialog` and `BottomSheet` styles.
- [ ] Storybook: the shared dialog stories show the new spacing; screenshots of every pop-up at 375 and 1440 px,
      light and dark.

## Design

References: the app's own approved prototypes already have the intended spacing, about 12 px:

- F-014 variant 10: 4 px under the title, 8 px above the content;
- I-004 variant 4: 8 px (phone) or 10 px (desktop) under the title, 4 px above the content.

## Tests

- Unit: none needed (styles only); the existing dialog tests keep passing.
- Storybook stories of every pop-up run (their steps and an axe scan) and their screenshots looked at.
- Screens checked in Playwright screenshots (phone / desktop, light / dark): every pop-up listed above.

## Notes

- Measured on 2026-10-30 (Archive question, desktop dialog, 1280 px): **49 px** between the title text and the
  content: the header's 20 px bottom padding plus the body's 20 px top padding, plus the line height.
- Likely cause, to confirm when building: Mantine leaves out the body's top padding when the body comes right after
  the header. Since I-004 the body is wrapped in the scroll area (`FadingScrollArea`), so Mantine no longer sees it
  that way and adds the full padding back.
- The owner's "screenshot 1" didn't reach Claude with the request; the measurement above is from the app.
