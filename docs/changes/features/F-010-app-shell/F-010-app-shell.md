# F-010 · App shell and navigation

| | |
|---|---|
| Type | Feature |
| Milestone | M1 — Authentication & app shell |
| Status | In progress |
| Branch | `feature/F-010-app-shell` |
| Design | 3 HTML prototypes required |

## Goal

The frame of the app: navigation on mobile and desktop, theme, and the waking-up state.

## Acceptance criteria

- [ ] Navigation to Transactions, Accounts, Reports, Family, Settings works on mobile and desktop
- [ ] Primary color and theme chosen; light/dark mode switch
- [ ] "Waking up the server…" indicator when the API answers slowly
- [ ] The add-transaction action is reachable from every page on mobile
- [ ] The desktop sidebar can be collapsed — by dragging its edge (the way Claude's UI does it) or with an
      icon button; not with a text row like "Collapse menu"

## Tasks

- [ ] Look at how Claude's UI collapses and resizes its sidebar
- [ ] 3 HTML prototypes (with the `design-screen` skill)
- [ ] Implement layout components
- [ ] Routes with placeholder pages
- [ ] Waking-up indicator
- [ ] Storybook stories

## Design

Prototypes: `prototypes/` (not created yet). Chosen variant: —

## Tests

- Unit: Layout and indicator component tests.
- E2E (Playwright): Navigate between all sections on desktop and mobile.

## Notes

### Starting over (2026-10-27)

A first round of prototypes (variants 1–3, then revisions 1b and 1c) was rejected and removed. What it taught:

- **Owner feedback on the last revision:** too simple, too much like the component library's default look;
  fonts too bold; icons and text not aligned; the sidebar collapse should work by dragging (like Claude's UI)
  or with an icon button. Now custom rules in `DESIGN_RULES.md`.
- **Logo:** a budget symbol, not a love symbol and not a dog ("Pup" is a nickname: пуп → пупик). Its color must
  differ from the primary buttons — in a sidebar the logo and "Add" sit right next to each other.
- **Liked before the visual style was rejected:** variant 1's structure — on the phone a bottom tab bar with a
  raised Add in the centre and "More" for Family and Settings; on desktop a sidebar. Ask again before reusing it.
- **Technical findings to keep in mind:**
  - A CSS reset like `.app button { color: inherit }` silently overrides button text colors (it made filled
    buttons fail contrast); keep resets at zero specificity (`:where(...)`).
  - A container query cannot style its own container; query a parent.
  - Touch targets: Mantine's default sizes (inputs and buttons 36–42 px, segmented controls and chips smaller)
    are under the 44 px rule on phones; pick sizes deliberately.
  - Fixel (Ukrainian typeface by MacPaw, OFL, Cyrillic, ₴) has a slashed zero in its tabular figures that can't
    be turned off. IBM Plex Sans, Fira Sans, Rubik and Manrope have plain tabular zeros, ₴ and Cyrillic.
  - Indigo is the most common "AI default" primary color (it comes from Tailwind's `indigo-500` demos).
- The rejected prototypes are not in the repository.
