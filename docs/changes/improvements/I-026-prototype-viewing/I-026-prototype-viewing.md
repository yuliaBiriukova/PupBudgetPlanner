# I-026 · Prototypes in Storybook that open like a page

| | |
|---|---|
| Type | Improvement |
| Milestone | M4 — Reports |
| Priority | High |
| Status | Todo |
| Branch | `improvement/I-026-prototype-viewing` |
| Design | not needed |
| Approved | — |

## Goal

The owner, after F-022's first round in stories (2026-11-04): "the prototypes experience feels awful in Storybook,
feels worse than in HTML". An HTML prototype opened as a page that filled the window and followed its size; a
Storybook prototype opens inside Storybook's frame. A prototype should open like a page again, with Storybook's
switches for the screen size and the colour scheme on top, and one story per variant instead of one per screen size.

## What made it worse (found 2026-11-04)

- **A fixed frame instead of the window.** The desktop stories set the viewport to 1280 × 800 px: Storybook draws a
  1280 px frame inside the window, with its own scroll bars when the window is smaller, and the page never follows the
  window's size as the HTML did.
- **The viewport locked.** A story that sets a global (`globals: { viewport: … }`) locks that switch in the toolbar,
  so the desktop stories couldn't be looked at as a phone.
- **A story per screen size and state.** Round 1 had 13 stories for 3 variants ("…, phone", "…, a month on the
  phone"), so the sidebar was a long list and moving between them meant hunting.
- **Storybook's chrome.** The sidebar, the addons panel (Controls, Interactions, Accessibility) and the developer
  buttons (grid, measure, outline, backgrounds) take the room and aren't for looking at a design.
- **Opens as a phone.** Every story opens in the 375 px phone viewport (the project's default), also on the desktop.

## Proposal

What the prototypes do (no change to the app's files, goes ahead with F-022's final prototype):

1. **One story per variant** and one for the final prototype. Its states (Year / Month, a month opened) are reached
   inside the page, the way the app does it; a state that can't be reached from the page (loading, error) gets its own
   story. No story sets the viewport or the colour scheme.
2. **The links open the page**: `http://localhost:6006/?path=/story/<id>&nav=false&panel=false&globals=viewport.value:!undefined`
   — no sidebar, no addons panel, the canvas as big as the window and following its size; the toolbar's viewport
   switch shows it as a phone or a tablet, and Light / Dark switches the scheme.

What needs the Storybook configuration (`frontend/.storybook/`, needs the owner's approval):

3. **Screen sizes named after the design check's:** Phone 375 × 812, Tablet 768 × 1024, Desktop 1440 × 900, and
   "Fill the window" first.
4. **Prototypes open filling the window** by default (the app's component stories keep the phone first).
5. **A quieter toolbar:** the developer buttons (grid, measure, outline, backgrounds) hidden; the viewport and Light /
   Dark stay.
6. **The rule** in `CLAUDE.md`, `DESIGN_RULES.md` §2, `docs/changes/README.md` and the `design-screen` skill: one
   story per variant, no viewport in a prototype story, the links in the form above, Storybook checked running before
   the links are sent.

## Acceptance criteria

- [ ] A prototype link opens the page filling the window, without Storybook's sidebar and panel, and it follows the
      window's size.
- [ ] The viewport switch shows it as a phone, a tablet or a desktop at the design check's sizes; Light / Dark works.
- [ ] One story per variant (states inside the page), none locking the viewport.
- [ ] The rule is written down where prototypes are described (point 6).

## Tasks

- [ ] F-022's stories in this shape (variants and the final prototype).
- [ ] After approval: the viewport sizes, the default for prototypes and the toolbar in `.storybook/`.
- [ ] The rule in the docs and the skill.

## Tests

- The design check on a prototype story still runs at 360–1440 px, light and dark.
- Looked at in the Browser pane: a link opens filling the window; the viewport and scheme switches work.
