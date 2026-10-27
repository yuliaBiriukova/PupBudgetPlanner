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
- [x] 3 HTML prototypes (with the `design-screen` skill); round 3 block by block, mix chosen
- [ ] Implement layout components
- [ ] Routes with placeholder pages
- [ ] Waking-up indicator
- [ ] Storybook stories

## Design

Prototypes (second round, made with the `design-screen` skill) in [`prototypes/`](prototypes/). Each file opens
from disk; the dark bar on top switches phone / tablet / desktop and light / dark, simulates a cold start and
describes the direction.

| Variant | Thesis | Type | Colors |
|---|---|---|---|
| [1 — Ledger](prototypes/variant-1.html) | The family spreadsheet, typeset properly: paper, fine rules, light serif numbers, a double rule under the total | Spectral + IBM Plex Sans | Ink-blue primary, gold logo |
| [2 — Banknote](prototypes/variant-2.html) | Hryvnia notes: an engraved panel for the total, sepia ink, a banknote color per currency | Unbounded + Manrope | Sepia primary, olive logo |
| [3 — Pocket](prototypes/variant-3.html) | A wallet of cards, dark-first: accounts as bank cards, a floating tab bar | Rubik | Sunflower Add, azure logo |

All three: phone tab bar with Add in the centre and More (Family, Settings, theme); desktop sidebar with an
icon button to collapse it to an icon rail, and a draggable edge (208–320 px, snaps to the rail when dragged
narrow; keyboard: ← → and Enter); collapsed by default below 1024 px, the choice is remembered. Weights 300–500.
Design check: no issues. Not yet compared with Claude's sidebar (sign-in to claude.ai pending).

### Round 3: block by block (2026-10-27)

The owner asked for more solutions, with options for every block of the shell. [`prototypes/blocks.html`](prototypes/blocks.html)
is one mix-and-match prototype: a panel on the left (the "Blocks" button on narrow screens) switches each block
between its options, the preview changes at once, the mix is remembered, and "Your mix" gives the picks as text to
paste back. The colors, type and logos of round 2 are options here, plus new ones.

| Group | Block | Options (A is the default) |
|---|---|---|
| Look | Colors | A ink and gold · B sepia and olive · C sunflower and azure · D **graphite and tangerine** (new) |
| Look | Type | A Spectral + IBM Plex Sans · B Unbounded + Manrope · C Rubik · D **Fira Sans** (new: light 300 headings and amounts) |
| Look | Corners | A sharp 4/10 px · B soft 8/16 · C round 12/24 |
| Look | Logo | A P-coin · B hryvnia sign · C coin stack · D ledger grid with a double rule |
| Desktop sidebar | Surface | A tinted panel · B floating card · C dark column (dark even in light mode) · D seamless |
| Desktop sidebar | Open section | A tinted fill · B edge bar · C accent icon and a dot · D tab in the logo color |
| Desktop sidebar | Collapse button | A next to the logo · B round button on the edge · C at the bottom · D the logo turns into it in the rail (Claude-like) |
| Desktop sidebar | Add | A one "Add transaction" button · B "Expense" plus small Income and Transfer buttons · C floating "Add" at the bottom right |
| Desktop sidebar | Bottom | A theme row and profile · B one line: avatar, name, theme and sign-out icons · C light / dark / device switch |
| Phone | Tab bar | A raised Add in the centre · B floating bar · C four tabs and "Add" above the bar on the right · D icon tabs, the open one named, Add at the end |
| Phone | Top bar | A logo bar · B page title · C no bar |
| Phone | "More" | A list · B profile and tiles |
| Everywhere | Whose money | A per page · B one Me / Vlad / Family switch in the shell |
| Everywhere | Waking up | A banner · B card with a progress line · C splash with a breathing logo · D small pill at the top |

Every option keeps the drag-to-resize sidebar edge. Token rules for the new options: graphite light `#232427`
buttons, `#e8743b` logo, `#c4511a` accent (≥ 3:1 on the sidebar); dark `#ecebe8` buttons, `#f08a4b` accent. The
logo-colored tab uses the logo's own foreground; sepia's light logo was darkened to `#5f6c2a` and azure is `#2f6fd6`
in both schemes so its white text passes 4.5:1. The design check now also runs every option of every block
(`setBlock` / `BLOCKS` hooks): 0 issues at 360–1440 px in light and dark, sidebar open and collapsed.

### Chosen (2026-10-27)

The owner's mix from `blocks.html`, which now opens with it:

| Block | Choice |
|---|---|
| Colors | **Charcoal and sky** (picked from the 17 schemes below): near-black `#26292e` buttons, sky `#8ec1ec` logo, blue `#2a62a3` edge bar on cool grey `#f5f6f7` / `#ebedf0`; dark mode `#121315` with light `#e9eaec` buttons and a sky bar |
| Type | Unbounded (light 300: headings, amounts, app name) + Manrope (text) |
| Corners | Round: 12 / 24 px |
| Logo | Coin stack, charcoal mark on a sky-blue circle |
| Sidebar surface | Tinted panel with a hairline border |
| Open section | Edge bar: blue in light mode, sky in dark mode, plus an accent icon |
| Collapse button | Next to the logo when open; in the rail the logo turns into the expand button on hover (Claude-like) |
| Add on desktop | One full-width "Add transaction" button |
| Bottom of sidebar | One line: avatar, name, theme and sign-out icon buttons |
| Phone tab bar | Icon tabs, the open one named in a pill; Add as the last button, under the thumb |
| Phone top bar | Logo bar: logo, name, theme switch, avatar |
| "More" menu | List in a bottom sheet |
| Whose money | Per page, designed with each page |
| Waking up | Dark pill at the top with a seconds counter; the page shows placeholders |

Follow-ups from the owner:

- **Logo color:** gold replaced. Copper is the default: blue and orange are opposites, so the logo stands apart from the
  ink "Add" button next to it. Pale blue `#a9c1e0` and sage `#a3b89c` are in the new "Logo color" block to compare.
  The ink mark on copper is 4.7:1, so a copper fill could also carry text.
- **The app name is never cut:** the sidebar's minimum width is measured from its head row (logo, full
  "Pup Budget" in the current font, collapse button), not a fixed 208 px: 236 px with Unbounded. Dragging narrower
  stops there, or snaps to the rail below 150 px. In the app: measure once the fonts have loaded.

Chosen variant: the mix above, with the charcoal and sky scheme (owner, 2026-10-27).

### Smooth collapse and more color schemes (2026-10-27)

The owner asked for a smooth sidebar collapse and for as many color schemes as possible within the chosen setup.

**Collapse.** Only the sidebar's width animates (240 ms, `cubic-bezier(.2, 0, 0, 1)`); nothing switches layout. To
get there:

- The sidebar keeps its 12 px padding in both states. Every icon, the logo and the avatar sit on one vertical axis
  36 px from the edge, the middle of the 72 px rail. A frame-by-frame trace shows them not moving at all while the
  width goes 248 → 72.
- Labels (nav, app name, Add, user name) fade out (160 ms) and are clipped by the shrinking width instead of being
  removed. Expanding fades them back in after a short delay.
- The collapse button and the theme / sign-out icons are positioned at the right edge and fade out. In the rail
  the bottom shows only the avatar; the theme stays in More and Settings.
- In the rail the logo is the expand button (as chosen); while the sidebar is open it is `inert`. Focus moves to
  whichever control replaces the clicked one.
- Dragging the edge doesn't animate (it follows the pointer); reduced motion turns the animation off.

**Color schemes.** The Colors block has 17 schemes now, each in light and dark: the 4 from before plus flag blue and
yellow, cobalt and apricot, ocean and sand, petrol and saffron, teal and coral, charcoal and sky, steel and mint,
midnight and lime, cocoa and pistachio, wine and blush, kraft and teal, apricot and navy, sky and marigold. Each new
scheme is 8 colors per mode (page, sidebar, text, button, button text, accent, logo, logo mark); the other tokens
are derived from them. So every scheme keeps the same structure: the Add button in the button color, the edge bar
in the accent, a logo color that differs from the button. Income green and expense red stay fixed (one shade
deeper on darker papers). Every pair (text, muted text on page / sidebar / hover, button text, active tab, accent,
logo mark, income, expense, tooltip, focus) passes WCAG AA in both modes; the panel shows a swatch for each
scheme (page, button, logo).

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
