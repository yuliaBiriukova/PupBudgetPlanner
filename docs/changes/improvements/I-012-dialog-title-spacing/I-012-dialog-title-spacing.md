# I-012 · Less space between a pop-up's title and its content

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Medium |
| Status | In progress |
| Branch | `improvement/I-012-dialog-title-spacing` (planned on `plan/f014-follow-ups`) |
| Design | Not 3 variants: one [before / after page](prototypes/before-after.html) with the proposed spacing, for the owner's approval |
| Approved | 2026-10-30, by the owner in chat ("Approved, build it"): round 3 of the before / after page |

## Goal

Every pop-up (the desktop dialog and the phone sheet) has too much empty space between its title block and its
content; it looks like a gap that shouldn't be there. Found by the owner while testing F-014, 2026-10-30, for all
pop-ups.

## Acceptance criteria

- [ ] In every pop-up the space between the title and the content is the same as between the content and the
      buttons, and no bigger than the pop-up's outer padding: 20 px on the desktop dialog, 16 px on the phone sheet
      (owner, 2026-10-30; DESIGN_RULES custom rules).
- [ ] The outer padding of every pop-up stays as it is: 20 px on the desktop; on the phone 16 px at the sides and under
      the buttons, 20 px under a content without buttons.
- [ ] Every spacing value in the pop-ups is even (divisible by 2 or 4), the gaps built from them too (owner,
      2026-10-30).
- [ ] The same on the desktop dialog (`ResponsiveDialog`) and the phone sheet (`BottomSheet`), light and dark.
- [ ] A long content still scrolls between the pinned title and the pinned buttons (I-004) and fades out at the top
      and the bottom edge whenever there is more behind it.
- [ ] Checked on every pop-up there is: the account form and the archive question (F-014), New invite link, Block
      and Delete (F-028), Add transaction and More (F-010).

## Tasks

- [x] Before / after page with the proposed spacing (desktop dialog and phone sheet): `prototypes/before-after.html`.
- [x] The owner approves it (2026-10-30, round 3).
- [ ] Fix the spacing once, in the shared `ResponsiveDialog` and `BottomSheet` styles.
- [ ] Storybook: the shared dialog stories show the new spacing; screenshots of every pop-up at 375 and 1440 px,
      light and dark.

## Design

References: the app's own approved prototypes. The first proposal took their spacing, about 12 px (F-014 variant 10:
4 + 8 px; I-004 variant 4: 8 or 10 + 4 px); the owner's review replaced it with the rule above.

### Before / after page (2026-10-30)

[prototypes/before-after.html](prototypes/before-after.html): Before (the app today) and After side by side, for the
Archive question, a long list scrolled, and Add transaction; phone or desktop, light or dark; pink bands mark the
space above and below the content. The design check passes (0 issues; it found 16 in the page's own markup first, now fixed), and the screenshots
were looked at for every pop-up, view and scheme.

**Cause, confirmed.** Mantine's body rule is `padding-top: 0` only `:where(:not(:only-child))`. Since I-004 the
body is the only child inside the scroll area, so its full top padding is back. Measured in Storybook
(`Shared/ResponsiveDialog`, Short and Long), title → content / content → buttons:

| Pop-up | Before | Where it comes from | After |
|---|---|---|---|
| Desktop dialog (`ResponsiveDialog`) | 49 / 24 px | 9 px (the 26 px title centred against the 44 px close button) + header 20 px bottom padding + body 20 px top padding; below: body 8 + footer 16 px | 24 / 24 px |
| Phone sheet (`BottomSheet`) | 23 / 20 px | 15 px (Mantine's 60 px minimum header height around the 44 px close button) + 4 + 4 px padding; below: body 8 + footer 12 px | 20 / 20 px |
| Add transaction, desktop (Mantine's own `Modal`, no buttons) | 24 px | worked out from Mantine's CSS: 4 px (title against the 28 px close button) + header 20 px bottom padding | 24 px |

**Round 1** (13 px under the title on both) — owner's review, 2026-10-30: the space between the title and the
content should be the same as between the content and the buttons, and every value divisible by 4 or 2, no odd
numbers.

**Round 2** (24 / 24 px desktop, 20 / 20 px phone: the title's space matched to the buttons') — owner's review,
2026-10-30: the outer padding of the pop-up stays the same (round 2's page left the content without bottom padding
when there are no buttons: a bug in the page, the app has 20 px there); the content fades at the top and the bottom
when it scrolls (the page only faded the top; the app does both); inner gaps are never bigger than the outer padding,
added to DESIGN_RULES. Today's space above the buttons (24 / 20 px) is already bigger than the outer padding
(20 / 16 px), so it changes too.

**Proposed fix, round 3.** Both inner gaps equal the outer padding; the outer padding stays:

| | Title → content | Content → buttons | Outer padding |
|---|---|---|---|
| Desktop dialog | 20 px = 8 + 12 | 20 px = 8 + 12 | 20 px (unchanged) |
| Phone sheet | 16 px = 8 + 8 | 16 px = 8 + 8 | 16 px at the sides and under the buttons, 20 px under a content without buttons (unchanged) |

- Both: the title's line is 28 px (line height 1.3 gave 26 px, so 9 px above and below it against the 44 px close
  button); now 8 px. The title row has no bottom padding.
- `ResponsiveDialog`: the body's top padding is 12 px; the footer's top padding 12 px (was 16); the title row's
  right padding 16 px (Mantine's 15 px).
- `BottomSheet`: no minimum height for the title row (Mantine's 60 px); the body's top padding is 8 px (was 4); the
  footer's top padding 8 px (was 12).
- The body's bottom padding stays: 8 px above the buttons, 20 px without them.
- Add transaction on the desktop uses the shared `ResponsiveDialog` instead of its own `Modal` (480 px wide,
  the 44 px close button), so the spacing is fixed in one place. It is a placeholder until F-018 anyway.
- The "More" sheet (no title shown) is unchanged.

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
