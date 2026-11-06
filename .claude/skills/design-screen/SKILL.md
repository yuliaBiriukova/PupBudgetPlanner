---
name: design-screen
description: Design or review a screen or component for Pup Budget Planner — the 3 prototype stories in Storybook every 🎨 backlog item needs, a revision of a chosen variant, or a critique of an existing prototype or page. Use before writing any prototype story or UI component styles.
---

# Designing a screen for Pup Budget Planner

Models drift to the statistical average of the web: system/Inter type, indigo buttons, identical rounded
cards, all-caps labels, fade-up on everything. This skill exists to stop that and to make screens that feel
like *this* app. Follow the steps in order; don't write a prototype before step 3.

Prototypes are **Storybook stories built from the app's own parts** (I-021, ADR 0025), so the owner sees the
real UI with only the new part added, never a hand-drawn copy of it.

## 1. Read first

- `docs/PRODUCT.md` (who, what, business rules), `docs/DESIGN_RULES.md` (section 1 "Custom rules" wins over
  everything, including this skill), the change's description file, and the "Screen decisions" table.
- Storybook's *Design system / Foundations* and *Components* (`frontend/src/shared/design-system/`), `theme.ts`,
  and the stories of the screen being changed (`frontend/src/**/*.stories.tsx`): what exists is reused as it is.

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

## 3. Plan from the design system before any markup

The app's look is set: colors, type (Unbounded 300 + Manrope 400/500), radius, spacing, icons and every kind of
element are in `theme.ts` and *Design system* in Storybook. Write a compact plan and show it:

- **What is reused:** the screen, components and design-system elements the new part is made of.
- **What is new:** only the part this change adds, made from Mantine and the theme's tokens. Amounts keep their
  treatment: tabular figures, true minus sign (−), currency placement per DESIGN_RULES §5.
- **A new token** (a color, a size, an element kind) only when the change can't be built without it: name it,
  say why, and show it in the prototype with a theme override inside the prototype's folder.
- **Motion:** one moment that explains a change (e.g. a balance updating after save). Nothing else moves.
- **The bold element:** the one memorable thing on this screen. Spend boldness there; keep the rest quiet.

Then run the **slop check** (below) against the plan, revise, and say what you changed and why.

## 4. Three variants = three directions

The 3 prototypes differ in *direction* (layout, interaction, density, what comes first), all in the app's look.
Give each a one-line thesis, e.g. "a dropdown under the field" vs "pills by the keys" vs "from your receipts".
At least one variant takes a real, justified risk.

Build each as a **Storybook story** in `frontend/src/prototypes/<ID-name>/` (e.g. `Variant1.stories.tsx`,
`Final.stories.tsx`), `title: 'Prototypes/<ID> <name>'`, story name `Variant 1: Dropdown`,
`parameters: { layout: 'fullscreen' }`:

- Render the **real screen** the change is on, the way its own stories do (e.g. the Transactions screen with
  `MockFetch` and the test data in `src/features/transactions/Transactions.stories.tsx`), and add the new part.
  The story's decorator already gives the app's providers, theme and the toolbar's light/dark.
- **Never edit the app's files** for a prototype. A component that needs to work differently is copied into the
  prototype folder and changed there. Shared fake data may be imported, not changed.
- **One story per variant** (I-026), and one for the final prototype. Its states (a tab, an opened row, a list
  open) are reached inside the page, the way the app does it; only a state the page can't reach (loading, error,
  empty data) gets a story of its own. Options inside a variant are Storybook controls (args), not more stories.
  The design check covers each story's opening state; the states reached inside the page are clicked through in
  Playwright and their screenshots looked at (step 5) — not made into stories for the check.
- **No `globals` in a prototype story** — no viewport, no colour scheme: a story's globals lock those switches in
  the toolbar, and the owner switches them there.
- Plain English text is fine in a prototype (no i18n keys yet); typecheck, ESLint and Prettier must pass.
- In the description file, list each story with the link that opens it like a page — filling the window, without
  the sidebar and addons panel:
  `http://localhost:6006/?path=/story/<story-id>&nav=false&panel=false&globals=viewport.value:!undefined`.

The owner opens them in Storybook (`npm run storybook` in `frontend/`, port 6006). Check it is running and the
links open before sending them. In the toolbar the owner switches Phone 375 × 812, Tablet 768 × 1024, Desktop
1440 × 900 ("Reset viewport" is the window again) and Light / Dark. Earlier changes' HTML prototypes stay as they
are.

## 5. Verify by looking, not guessing

- Run the Playwright + axe design check on every story of the round, in `frontend/`, with Storybook running:
  `npm run design:check -- "http://localhost:6006/iframe.html?id=<story-id>" …`
  (it sets light and dark through the Storybook toolbar's global and names the screenshots after the story; HTML
  files and pages of the running app work too: `http://localhost:5173/<page>`, with `--storage <state.json>` when
  signed in). It covers 360/375/768/1024/1440 px, light and dark, every page and state: overflow, touch targets ≥ 44 px on
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
DESIGN_RULES "Screen decisions"; add any new lasting rule to "Custom rules". Copy the final story's design-check
screenshots (375 and 1440 px, light and dark) into the change folder's `prototypes/`.

When the change is built, delete its `frontend/src/prototypes/<ID-name>/` folder in the same PR; the real
screen's stories replace it.

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
