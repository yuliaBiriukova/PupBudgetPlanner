# I-026 · Prototypes in Storybook that open like a page

| | |
|---|---|
| Type | Improvement |
| Milestone | M4 — Reports |
| Priority | High |
| Status | Done |
| Branch | `improvement/I-026-prototype-viewing` |
| Design | not needed |
| Approved | 2026-11-05, by the owner in chat ("Approved, build it"): the description as updated on 2026-11-05 (point 4 dropped); the shortcuts fix asked for by the owner the same day ("fix the issue with shortcuts") |

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

What the prototypes do (no change to the app's files):

1. **One story per variant** and one for the final prototype. Its states (Year / Month, a month opened) are reached
   inside the page, the way the app does it; a state that can't be reached from the page (loading, error) gets its own
   story. No story sets the viewport or the colour scheme.
2. **The links open the page**: `http://localhost:6006/?path=/story/<id>&nav=false&panel=false&globals=viewport.value:!undefined`
   — no sidebar, no addons panel, the canvas as big as the window and following its size; the toolbar's viewport
   switch shows it as a phone or a tablet, and Light / Dark switches the scheme.

What needs the Storybook configuration (`frontend/.storybook/`, needs the owner's approval):

3. **Screen sizes named after the design check's:** Phone 375 × 812, Tablet 768 × 1024, Desktop 1440 × 900 (now
   Mobile, Tablet and Desktop 1280 × 800). Storybook's own "Reset viewport" at the top of the list is the window's
   size, so no item of our own is needed for it.
4. ~~Prototypes open filling the window by default~~ — dropped (2026-11-05): the link (point 2) already opens a
   prototype filling the window, and it hides the sidebar, so there is no other way in. A default per story would need
   code of our own in Storybook's manager; a story's own `globals` lock the switch.
5. **A quieter toolbar:** the developer buttons (grid and backgrounds, measure, outline) hidden for the whole
   Storybook (`features` in `main.ts`); reload, viewport, vision filter (accessibility) and Light / Dark stay. No
   story uses them; the design check doesn't either.
6. **The rule** in `CLAUDE.md`, `DESIGN_RULES.md` §2, `docs/changes/README.md` and the `design-screen` skill: one
   story per variant, no viewport or colour scheme in a prototype story, the links in the form above, Storybook
   checked running before the links are sent.

## Findings (2026-11-05)

- F-022 was built and its prototype stories deleted before this change started, so there are no prototype stories to
  reshape now; the rule applies from the next 🎨 change (I-023, I-024).
- Points 1–2 work with today's Storybook 10.6 and no change: `Reports / Reports page – Year Phone` (a story without
  `globals`) opened with the link fills the Browser pane without the sidebar and panel, and the viewport switch still
  works (Mobile shows the 375 × 812 frame). `!undefined` is Storybook's URL form for "no viewport".
- The app's component and screen stories keep the phone first (`initialGlobals` in `preview.tsx`); those that set
  `globals: { viewport: { value: 'desktop' } }` keep working, since the item's key stays `desktop` — only its size
  becomes 1440 × 900.
- **Escape** brought Storybook's sidebar and addons panel back, also when pressed inside the page (Storybook passes
  the page's keys to its own shortcuts), so closing a prototype's dialog or menu with Escape showed the sidebar
  again. The owner asked for the fix on 2026-11-05 ("fix the issue with shortcuts"): Storybook's shortcuts are off
  (`addons.setConfig({ enableShortcuts: false })` in the new `.storybook/manager.ts`).
- Seen, not changed: Escape doesn't close the Reports page's currency list while the focus is on its pill (also in
  the bare `iframe.html` story, so not Storybook's doing).
- An address such as `iframe.html?id=<id>&args=data:none` didn't change the Reports stories' state (they declare no
  controls), so the skill doesn't send the design check to a state through `args`: states reached inside the page
  are clicked through and their screenshots looked at.

## Acceptance criteria

- [x] A prototype link opens the page filling the window, without Storybook's sidebar and panel, and it follows the
      window's size.
- [x] The viewport switch shows it as a phone, a tablet or a desktop at the design check's sizes; Light / Dark works.
- [x] The developer buttons (grid, backgrounds, measure, outline) are gone from the toolbar.
- [x] One story per variant (states inside the page), none locking the viewport — written as the rule, checked on the
      next 🎨 change's prototypes.
- [x] The rule is written down where prototypes are described (point 6).

## Tasks

- [x] ~~F-022's stories in this shape~~ — F-022 was built first; nothing left to reshape (see Findings).
- [x] The viewport sizes and names (Phone 375 × 812, Tablet 768 × 1024, Desktop 1440 × 900) in `preview.tsx` and
      the quieter toolbar (`features` in `main.ts`).
- [x] The rule in `CLAUDE.md`, `DESIGN_RULES.md` §2, `docs/changes/README.md` and the `design-screen` skill.
- [x] Storybook's keyboard shortcuts off (`.storybook/manager.ts`), so Escape keeps the page as it was opened.

## Tests

- The design check on a prototype story still runs at 360–1440 px, light and dark: run on
  `Reports / Reports page – Year Phone` (there are no prototype stories now) with this branch's Storybook, 0 issues;
  its 6 console errors come from the story's own play function (a phone story checked at wider sizes too; the
  story file isn't changed here).
- Looked at in the Browser pane (2026-11-05): the link opens the Month and Year stories filling the window without
  the sidebar and panel; the toolbar has only reload, viewport, vision filter and Light / Dark; the viewport list
  is Phone, Tablet, Desktop, and Desktop shows 1440 × 900; Dark switches the page. With the shortcuts off, Escape
  pressed inside the page (the currency list open) keeps the sidebar and panel hidden; before, it showed them.
