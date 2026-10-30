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
- Text on a filled button takes its color from the current scheme (`--pup-color-on-primary` in the theme), never
  from Mantine's autoContrast: it reads the light-mode shade only, which made white text on the light dark-mode
  button. (2026-10-28)
- Check boxes are Mantine's, themed once in `theme.ts`: a rounded square (6 px), the accent when on, an empty box
  with the fields' border. A field in focus has a 2 px accent border (F-011's sign-in style), set once in the theme for
  every field; no second ring around it. (2026-10-29)
- Scrolling areas inside the app use the shared `FadingScrollArea` (the bar shows while scrolling and fades, edges
  with more behind them fade out); the page keeps the browser's own scroll bar. A dialog or sheet puts its buttons in
  the `footer` of `ResponsiveDialog` / `BottomSheet`, so they stay put while a long content scrolls. (2026-10-29,
  I-004)
- Names of things a person picks for looks (card styles) are true in both themes: named by the look, not by a
  color that turns around in dark mode ("Solid", not "Black"). (2026-10-30, F-014)
- Amounts are whole, no cents, everywhere in the app (`1 250 ₴`, `$1 240`, `−4 312 ₴`): typed cents are rounded when
  saved, .50 away from zero ([ADR 0018](decisions/0018-whole-amounts.md)). (2026-10-30, owner, F-014)
- Menu items and buttons don't end in "…", even when they open a dialog: few people know the convention and it
  reads like a typo. (2026-10-29)
- Every size and spacing value is even, divisible by 4 or 2: paddings, margins, gaps, line heights and the spaces
  they add up to. No odd numbers, including Mantine's own (its 15 px on the right of a dialog's title row becomes
  16). (2026-10-30, owner, I-012)
- Inner gaps, paddings and margins are never bigger than the outer padding of the box they are in. In a pop-up the
  space between the title and the content equals the space between the content and the buttons, and is no bigger
  than the pop-up's outer padding (desktop dialog 20 px, phone sheet 16 px). (2026-10-30, owner, I-012)

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
   The same check runs on pages of the running app: pass their addresses (`http://localhost:5173/people`) and,
   for signed-in pages, `--storage <file>` with a Playwright storage state.
   Its screenshots are also looked at, not just its exit code.
3. The user picks one (or a mix). A mix or a choice with changes is built as one **final prototype**, checked
   like the variants and shown again.
4. **The owner approves the final prototype in so many words** ("approved, build it") before any code for the
   change is written, backend included. Picking options in a round is not approval. The approval and its date
   are recorded in the change's description file and in [Screen decisions](#9-screen-decisions) below
   (I-003).
5. Components are built in **Storybook** first (all states, mobile and desktop), then wired to the API.
6. **Before every commit that changes UI**, the changed screens are checked in Playwright: E2E tests pass and
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

- Always show the currency next to an amount (`1 250 ₴`, `$100`, `€50`); amounts are whole (custom rule, ADR 0018).
- Amounts are right-aligned in lists and tables and use tabular numbers (`font-variant-numeric: tabular-nums`).
- **Semantic colors:** income — green, expense — red, transfer — neutral/blue. Color is never the only
  signal: also use a sign (+ / −) or an icon.
- Amount inputs open the numeric keyboard on mobile (`inputMode="decimal"`), accept both `.` and `,`; cents typed
  are rounded, and the field shows the whole amount once it loses the focus.
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
| Invite page, People page (F-028) | Variant 7 (chosen after 4 rounds): variant 1's sign-in screens with "Yulia invited you"; People page with underline tabs (People · Invite links), search, sortable columns (a Sort menu on the phone), card rows with a check box left of the initials (with a mouse shown on hover or once anyone is picked, always on the phone) for bulk Block / Delete and a ⋯ menu per row; invite links grouped (Waiting cards with a visible Cancel link, Used and Expired and cancelled folded); a dialog for a new link with Copy / Share | 2026-10-29 | Approved by the owner after it was built (I-003). No sign-in method shown (privacy). See the [F-028 description](changes/features/F-028-invite-only-access/F-028-invite-only-access.md#chosen-2026-10-29) |
| Scroll bars, long dialogs (I-004) | Variant 4 (variant 2 with the owner's answers): Pup's scroll bar inside the app, a 6 px pill (10 px under the mouse) that shows while scrolling or under the pointer and fades; the list fades out at an edge with more behind it; the page keeps the browser's bar; a dialog or sheet scrolls between its pinned title and pinned buttons, with no lines; the pointer stays an arrow on the bar | 2026-10-29 | Approved by the owner before the build. See the [I-004 description](changes/improvements/I-004-custom-scroll-bars/I-004-custom-scroll-bars.md#round-2-final-prototype-2026-10-29) |
| Accounts (F-014) | Variant 10 (final, after 3 rounds): variant 4's layout (Group by Currency / Source switch, a dashed ghost card adds an account to its group) with variant 2's card styles picked per account (Solid, Tinted, Envelope, Plain; Solid turns light grey in dark mode); the form opens with the card preview and the four styles right under it; "In total" on top; any NBU currency (searchable list), own sources and banks; an X on every pop-up | 2026-10-30 | Approved by the owner before the build. The "In total, in UAH" line at NBU rates comes with F-017. See the [F-014 description](changes/features/F-014-accounts/F-014-accounts.md#approved-2026-10-30) |
| Pop-up spacing, all pop-ups (I-012) | Before / after page, round 3: the space between the title and the content equals the space between the content and the buttons and the outer padding (desktop dialog 20 px, phone sheet 16 px); the outer padding unchanged; a scrolled content fades at both edges; every value even; Add transaction uses the shared dialog on the desktop | 2026-10-30 | Approved by the owner before the build. See the [I-012 description](changes/improvements/I-012-dialog-title-spacing/I-012-dialog-title-spacing.md#before--after-page-2026-10-30) |
| Deleting an account (I-011) | Variant 3: at the end of the edit form, after a rule, "Archive or delete" with two rows (Archive; Delete for good), each with a line on what it does; the form's buttons are only Cancel and Save; Delete asks for the account's name typed, "Keep it" / "Delete for good" (red), and says how much money is still on it; archived rows get Delete next to Restore; only an account without transactions can be deleted (after F-018 Delete is off with the reason) | 2026-10-30 | Approved by the owner before the build. See the [I-011 description](changes/improvements/I-011-delete-account-permanently/I-011-delete-account-permanently.md#final-prototype-2026-10-30) |
