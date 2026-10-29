---
name: design-screen
description: Design or review a screen or component for Pup Budget Planner — the 3 HTML prototypes every 🎨 backlog item needs, a revision of a chosen variant, or a critique of an existing prototype or page. Use before writing any prototype HTML or UI component styles.
---

# Designing a screen for Pup Budget Planner

Models drift to the statistical average of the web: system/Inter type, indigo buttons, identical rounded
cards, all-caps labels, fade-up on everything. This skill exists to stop that and to make screens that feel
like *this* app. Follow the steps in order; don't write HTML before step 3.

## 1. Read first

- `docs/PRODUCT.md` (who, what, business rules), `docs/DESIGN_RULES.md` (section 1 "Custom rules" wins over
  everything, including this skill), the change's description file, and the "Screen decisions" table.
- Earlier chosen prototypes in `docs/changes/**/prototypes/` — new screens must look like the same app.

## 1a. Look at references

Before the brief, see how others solve this screen — don't invent from the average:

- **Mobbin** (mobbin.com): search the pattern ("add expense", "transaction list", "sign in", "bottom sheet")
  and well-made finance apps.
- Other examples open on the internet: design galleries, product sites, app store screenshots.
- Only what opens without the owner's sign-in. No banking apps, no Claude's UI, nothing that needs the
  owner's account — and don't ask the owner to sign in anywhere for references.
- Write down 3–6 references in the change's description file ("Design" section): link — what we take from it
  (a layout, an interaction, a detail). Take ideas, not a copy of someone's look.

## 2. Brief (write it down, 5 lines)

- **Who and when:** a Kyiv couple. Daily: entering an expense on the phone in a few seconds, often one-handed,
  replacing Monefy. Monthly: reading the yearly table on a desktop, replacing their Google Sheet.
- **The one job of this screen**, and what the user must see first.
- **The subject's world** — where distinctive choices come from: hryvnia notes and coins, receipts, bank
  cards (Monobank, PrivatBank), the spreadsheet they have kept for years, a household ledger. Not puppies:
  "Pup" is a nickname (пуп → пупик).
- **One feeling** the screen should leave (e.g. "calm and in control", "quick and done").
- If any of this is unclear, ask the user before designing.

## 3. Token plan before any markup

Write a compact plan and show it:

- **Palette:** 4–6 named hex colors with roles (surface, text, primary action, income, expense, transfer,
  accent). Income green / expense red / transfer blue are fixed meanings. Must pass WCAG AA in light and dark.
- **Type:** one family, or two clearly different ones, with a reason tied to the brief. Google Fonts with
  **Cyrillic** support (Ukrainian is coming). A real scale with contrast in size and weight. Amounts get
  their own treatment: tabular figures, true minus sign (−), currency placement per DESIGN_RULES §5.
- **Shape and depth:** at most 2 radius values, one shadow approach (or none), a spacing scale.
- **Motion:** one moment that explains a change (e.g. a balance updating after save). Nothing else moves.
- **The bold element:** the one memorable thing on this screen. Spend boldness there; keep the rest quiet.
- **Mantine mapping:** every token must be expressible in the Mantine theme (`theme.ts`: font families,
  10-shade palettes, `primaryShade`, radius, shadows). If it can't be built with Mantine, change the plan.

Then run the **slop check** (below) against the plan, revise, and say what you changed and why.

## 4. Three variants = three directions

The 3 prototypes differ in *direction* (type, color and density decisions), not just in layout with the same
skin. Give each a one-line thesis, e.g. "ledger: dense, serif numbers, paper tones" vs "pocket: big touch
targets, one bold color" vs "dashboard: quiet chrome, data first". At least one variant takes a real,
justified aesthetic risk.

Build them as self-contained HTML in `docs/changes/<type>/<ID-name>/prototypes/variant-N.html` that opens
straight from disk and shows phone and desktop layouts in light and dark. The design check exercises more
when a prototype exposes these global functions (all optional): `go(pageId)` with a `PAGES` list of `{ id }`,
`state.schemePref` + `applyScheme()` for light/dark, `setView(name)` for a preview frame, `coldStart()` for the
waking-up state, `setNavCollapsed(bool | null)`, and `setLogo(name)` with a `LOGOS` object.

## 5. Verify by looking, not guessing

- Run the Playwright + axe design check on every variant, in `frontend/`:
  `npm run design:check -- ../docs/changes/<type>/<ID-name>/prototypes/variant-1.html …`
  (pages of the running app too: `http://localhost:5173/<page>`, with `--storage <state.json>` when signed in)
  It covers 360/375/768/1024/1440 px, light and dark, every page and state: overflow, touch targets ≥ 44 px on
  the phone, icon scale 16/20/24, clipped text, overlapping floating elements, WCAG AA contrast and other axe
  rules, visible focus, console errors. It exits with 1 when anything is found; the report with screenshots is
  `frontend/test-results/design-check/report.html`. Don't trust a clean run you haven't seen fail once.
- **Look at the screenshots** (375 and 1440 px, light and dark), and zoom into nav items, buttons and list rows
  to check icon/text alignment and type weight. Critique each against the slop check and the brief; fix and
  re-check. Watch CSS specificity: a reset can silently override component colors.
- Read every label on every button, in every state and scheme, and check that names and titles are whole at
  default sizes. The first F-010 build shipped a primary button whose text was invisible and an app name cut
  off in the sidebar — the owner found both by hand. Showing a variant means you have seen it is clean.
- For interaction patterns (collapsing a sidebar, sheets, menus), look at how well-made apps do it (Mobbin,
  open examples on the internet) before inventing one.
- The same look-check applies when the chosen design is built in the app: before every commit that changes
  UI, run the E2E tests and look at Playwright screenshots of the changed screens.

## 6. Present and record

Show the user the screenshots, each variant's thesis and trade-offs, and your recommendation.

When the user picks a variant with changes, or a mix, build it as one **final prototype**, verify it as in
step 5, show it and ask: "Approve this for implementation?" Repeat until they approve it in so many words.
Picking options or commenting on a round is **not** approval: never start the implementation, backend or
frontend, on it. Then record the approved prototype and the date in the change file (`Approved` row) and in
DESIGN_RULES "Screen decisions"; add any new lasting rule to "Custom rules".

## Slop check

Treat each item as a defect unless the brief clearly justifies it:

- Indigo / violet / purple as the primary color by default; purple-to-blue gradients; gradient washes.
- System font, Inter or Roboto chosen "because it's safe"; one weight and size for everything; heavy bold
  everywhere (the owner found 600–700 weights on most text too bold).
- The component library's default look: Mantine (or any kit) with stock spacing, radius, borders and
  components, only recolored. Plain and "too simple" is a defect too, not a safe choice.
- Icons and text not optically aligned (different center lines, uneven gaps) in nav items, buttons and rows —
  check this in zoomed screenshots, the automated check can't see it.
- Identical rounded cards with one radius and the same grey shadow; cards inside cards; a row of 3 stat cards
  by reflex.
- Tracked ALL-CAPS eyebrow labels, middle-dot meta strings ("Bank · Note"), monospace labels, arrows
  appended to links, one accented word in a heading, 01/02/03 on things that are not a sequence.
- An icon in a tinted circle on every list row; emoji as icons; paw or dog imagery.
- Fade-and-slide-up on every block, hover lift on every card, bounce or elastic easing.
- Grey text on colored backgrounds; pure #000 / #fff where a tinted neutral fits; low-contrast "muted" text.
- Copy tells: "Submit", "Something went wrong", apologetic or clever copy instead of clear copy.
- **The test:** would someone glance at it and say "an AI made this"? If yes, it is not done.

## Do instead

- Make the money the hero: big, well-set numbers with tabular figures, clear sign and currency.
- Respect the spreadsheet heritage: density and alignment where the user reads numbers (reports, lists).
- Let color carry meaning (income, expense, transfer, the active section), not decoration.
- Use structure (alignment, grouping, typographic hierarchy) before boxes, borders and shadows.
- Write copy from the user's side, in sentence case: "Add expense", "Couldn't save — check the amount".
