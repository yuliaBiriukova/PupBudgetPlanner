# Design rules

Rules every screen and component follows. Section 1 holds **our own custom rules** — they win over
everything below when they conflict.

## 1. Custom rules

_Add project-specific rules here (one rule per bullet, with the date it was added)._

- No dogs, paws or puppy imagery: "Pup" is the owners' nickname (пуп → пупик), not a puppy. (2026-10-27)
- The logo is a budget symbol — not a love symbol (hearts etc.) — and its color differs from the primary
  buttons, which can sit right next to it (sidebar). (2026-10-27)
- The app must not look like the component library's default theme: Mantine is the toolkit, not the look.
  (2026-10-27)
- Restrained type weights: regular and medium for most text; heavy bold only where one thing must stand out.
  (2026-10-27)
- Icons and their text are aligned optically (same center line, consistent gap) in every nav item, button and
  row. (2026-10-27)
- The app name is never cut off: the sidebar can't be resized narrower than its logo row with the full
  "Pup Budget". (2026-10-27)

## 2. Process

1. **References first.** Look at how others solve the same screen: **Mobbin** (mobbin.com, search by pattern or
   by app) and other examples open on the internet. Only references that open without the owner's sign-in — no
   banking apps or Claude's UI. The references used and what each one gave are listed in the change's
   description file.
2. Every new screen starts with **3 design variants as HTML prototypes** — self-contained `.html` files
   that open in any browser and show mobile and desktop layouts. They live in the change folder:
   `docs/changes/features/F-xxx-name/prototypes/variant-1.html` … `variant-3.html`.
   Design work follows the **`design-screen`** skill (`.claude/skills/design-screen/`), and every variant passes
   the Playwright + axe design check before it is shown: `npm run design:check -- <file.html>` in `frontend/`.
   Its screenshots are also looked at, not just its exit code.
3. The user picks one (or a mix). The choice is recorded in the change's description file and in
   [Screen decisions](#9-screen-decisions) below.
4. Components are built in **Storybook** first (all states, mobile and desktop), then wired to the API.
5. **Before every commit that changes UI**, the changed screens are checked in Playwright: E2E tests pass and
   screenshots at 375 and 1440 px, light and dark, have been looked at. The owner should never be the first to
   find an invisible label or a cut-off name (both happened in the first F-010 build).

## 3. Foundation

- **Mantine first.** Use Mantine components and theme tokens (colors, spacing, radius, fonts).
  No hard-coded colors or pixel sizes in components; custom styles only through CSS modules using
  Mantine CSS variables.
- **Theme** lives in one place (`frontend/src/app/theme.ts`). Colors: charcoal and sky. Buttons charcoal `#26292e` (light) / `#e9eaec` (dark), logo sky `#8ec1ec`, accent
  `#2a62a3` (light) / `#8ec1ec` (dark), page `#f5f6f7` / `#121315`. Fonts: Unbounded 300 for
  headings and amounts, Manrope 400/500 for text (F-010).
- **Light and dark mode** supported from the start (follows the system setting, can be switched).
- **Icons:** Tabler Icons, one size scale (16 / 20 / 24).

## 4. Layout and responsiveness

- **Mobile first.** Design for a 360 px wide screen first, then enhance for tablet and desktop.
- Mantine breakpoints: `xs` 36em, `sm` 48em, `md` 62em, `lg` 75em, `xl` 88em.
- No horizontal page scrolling on mobile. Wide tables (reports) scroll inside their own container
  with the first column (category) sticky.
- Touch targets at least 44 × 44 px. The main action (add transaction) is reachable with the thumb.

## 5. Money, numbers and dates

- Always show the currency next to an amount (`1 250.00 ₴`, `$100.00`, `€50.00`).
- Amounts are right-aligned in lists and tables and use tabular numbers (`font-variant-numeric: tabular-nums`).
- **Semantic colors:** income — green, expense — red, transfer — neutral/blue. Color is never the only
  signal: also use a sign (+ / −) or an icon.
- Amount inputs open the numeric keyboard on mobile (`inputMode="decimal"`), accept both `.` and `,`.
- Dates: `27 Oct 2026` in lists, `Oct 2026` for months. Week starts on Monday.
- Default transaction date is today; the last used account is preselected.

## 6. Feedback and states

- Every data view has **loading** (skeleton), **empty** (explanation + call to action) and **error**
  (message + retry) states — each with a Storybook story.
- While the API is waking up (night-time cold start, up to ~1 min), show a friendly
  "Waking up the server…" indicator instead of a blank page.
- Successful saves show a short notification; destructive actions (delete) ask for confirmation.
- Form validation messages appear under the field, in plain language.

## 7. Accessibility

- WCAG 2.2 AA contrast in both color schemes.
- Every input has a visible label; icon-only buttons have `aria-label`.
- Everything works with the keyboard; focus is always visible.

## 8. Text

- English, sentence case ("Add expense", not "Add Expense"), short and friendly.
- All text through i18n keys (`t('transactions.add')`) so Ukrainian can be added later.

## 9. Screen decisions

| Screen | Chosen variant | Date | Notes |
|--------|----------------|------|-------|
| App shell (F-010) | Mix from `blocks.html`: charcoal and sky colors, Unbounded + Manrope, round corners, coin-stack logo, tinted sidebar with an edge-bar marker, logo-as-expand-button collapse, pill tab bar on the phone, waking-up pill | 2026-10-27 | Colors chosen from 17 schemes. Full list in the [F-010 description](changes/features/F-010-app-shell/F-010-app-shell.md#chosen-2026-10-27) |
| Sign in / create account (F-011) | Variant 4: variant 1's split layout (charcoal brand half, form half; on the phone a charcoal band with the form card overlapping it) with variant 2's form (Sign in / Create account pill switch, 52 px fields, pill buttons) | 2026-10-28 | No report table, no tagline; neutral message for a taken email (ADR 0012); Confirm password until reset exists. See the [F-011 description](changes/features/F-011-email-password-auth/F-011-email-password-auth.md#round-2-a-mix-of-variants-1-and-2-2026-10-28) |
