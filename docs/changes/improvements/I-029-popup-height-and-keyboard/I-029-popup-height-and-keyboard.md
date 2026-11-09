# I-029 · Phone pop-ups: as tall as the screen allows, small ones at the bottom, all above the keyboard

| | |
|---|---|
| Type | Improvement |
| Milestone | M6 — MVP release (polish) |
| Priority | Medium (proposed: long pop-ups waste room and the keyboard covers the fields of every pop-up but the quick-add form; there is a workaround, scrolling) |
| Status | Todo |
| Branch | `improvement/I-029-popup-height-and-keyboard` (planned on `plan/phone-feedback`) |
| Design | Not needed (no new screen); before / after screenshots of every pop-up for the owner, see "Open points" |
| Approved | — (date the owner approved the description) |

## Goal

On the phone every pop-up uses the screen well: one that doesn't fit takes as much of the screen as it can, a small one
sits at the bottom as now, and while the phone's keyboard is up the pop-up is above it with the field being typed and
its buttons in sight (owner, 2026-11-09).

## Today

- Phone pop-ups are bottom sheets (`BottomSheet.tsx`): as tall as their content up to **90 %** of the screen; the
  currency list's sheet a set 80 % (F-016); the quick-add form a set 90 % (F-018).
- Only the quick-add form follows the phone's keyboard (I-017, `useKeyboardInset`). Every other sheet (the account
  form, Settings' fields, the People dialogs, the currency search) stays where it is and the keyboard covers its lower
  part, often the field being typed and the buttons.

## Acceptance criteria

- [ ] A phone pop-up whose content doesn't fit grows to the top of the screen, leaving only a small gap above it so it
      still reads as a sheet (the gap to be agreed, see "Open points"); its title and buttons stay put, the content
      scrolls between them (I-004).
- [ ] A pop-up whose content fits is as tall as its content and sits at the bottom, as now.
- [ ] While the phone's keyboard is up, **every** pop-up sits on top of it: no part of it is under the keyboard, the
      field being typed is scrolled into sight and the buttons are in sight above the keyboard. When the keyboard goes,
      the pop-up goes back to its height at the bottom.
- [ ] The quick-add form and the currency search keep what they have (the form's own keys, the search's steady height)
      and get the new height rule.
- [ ] Swipe down and Back still close the pop-ups (I-015).
- [ ] The desktop dialogs are unchanged (centred; they already scroll inside, I-004), unless the owner wants the same
      rule there (see "Open points").

## Tasks

- [ ] `BottomSheet`: the height rule (grow to the screen's top minus the gap) for every sheet; the set heights kept
      where a sheet needs them.
- [ ] The keyboard rule for every sheet: `useKeyboardInset` for all sheets, not only `full` ones; the field in focus
      scrolled into sight.
- [ ] Look through every pop-up on the phone (account form, delete dialogs, Settings, People, invite links, the
      currency search, the pickers, the quick-add form) with the keyboard up and down.
- [ ] Storybook: the sheet's stories for a short, a long and a typed-in sheet.

## Design

References to look at before building: Material 3 bottom sheets (standard and full-screen), iOS sheets (medium / large
detents), how Monobank and Revolut keep a sheet above the keyboard.

## Tests

- Unit: `BottomSheet` height for short and long content; the keyboard inset applied to every sheet.
- E2E (Playwright, phone): a long sheet reaches the top gap; the account form's Name typed with a 300 px keyboard
  (emulated through the visual viewport, as I-017's tests do) keeps the field and Save above it.
- Screens checked in Playwright screenshots at 375 px (short and long sheets, keyboard up and down) and 1440 px
  (unchanged), light and dark.

## Open points

- **The gap at the top** when a sheet grows: none (the sheet fills the screen like a page), or a small one (e.g. 16 px
  or the header's height) so the page behind still shows? Proposed: a small gap, as iOS and Material sheets do.
- **Desktop:** only the phone sheets, or also the desktop dialogs (taller before they scroll)? Proposed: the phone
  only; "stick to the bottom" and the keyboard are the phone's.
- **Design check:** before / after screenshots enough, or a prototype story to try it first? Proposed: screenshots, as
  there is no new screen.
