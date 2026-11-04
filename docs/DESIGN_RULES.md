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
- A table is as tall as its rows, with no scroll of its own up and down: the page scrolls. One wider than the screen
  shows its sideways scroll bar all the time, on a grey track in a gutter of its own under the rows, so it covers
  nothing; one that fits has no bar. The exception to the bar that shows only while scrolling (above). (2026-11-04,
  owner, F-022)
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
- Every currency field opens the same list (the shared `CurrencyPicker`): the person's own currencies first, then
  the other NBU currencies, with a search by code or name. On the desktop a dropdown under the field, over the page
  or the dialog, as tall as its rows up to 344 px; on the phone a sheet. It never opens inside the page and pushes
  what is below it down. (2026-10-31, owner, F-016)
- Every pop-up closes with Back (Android's gesture or button, the browser's Back, Alt + ←) before Back leaves the
  page, and every phone sheet also closes with a swipe down (from its handle or title, or from its content at the top),
  past a quarter of its height or on a flick. Both come with the shared `BottomSheet` / `ResponsiveDialog`; a pop-up
  built on Mantine's `Drawer` or `Modal` directly has neither. (2026-11-01, owner, I-015)
- The transaction form's amount shows no error text under it: a missing or wrong amount turns its display red, and
  the message is read out by screen readers only (visually hidden, linked to the field). Every other field keeps its
  message under it (§6); a missing category says so next to its label. (2026-11-01, owner, F-018)

## 2. Process

1. **References first.** Look at how others solve the same screen: **Mobbin** (mobbin.com, search by pattern or
   by app) and other examples open on the internet. Only references that open without the owner's sign-in — no
   banking apps or Claude's UI. The references used and what each one gave are listed in the change's
   description file.
2. Every new screen starts with **3 design variants as Storybook stories** built from the app's own parts, so a
   prototype looks exactly like the real UI (I-021, [ADR 0025](decisions/0025-prototypes-in-storybook.md)). They
   live in `frontend/src/prototypes/<ID-name>/` under *Prototypes / <ID> <name>*: the real screen with its
   components, `theme.ts`, the design system and fake data, plus only the new part. A prototype never edits the
   app's files. The change folder keeps the story links and the approved final prototype's screenshots; the
   prototype stories are deleted when the change is built. (Changes before I-021 have HTML prototypes.)
   Design work follows the **`design-screen`** skill (`.claude/skills/design-screen/`), and every variant passes
   the Playwright + axe design check before it is shown, on the story's address with Storybook running:
   `npm run design:check -- "http://localhost:6006/iframe.html?id=<story-id>"` in `frontend/` (HTML files too).
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
- **Design system in Storybook:** *Design system / Foundations* shows every token (colours of both schemes, read from
  `theme.ts`, type, corners, spacing, icons); *Design system / Components* shows every kind of element as the app
  has it. Look there before styling a new element (I-019).

### Components (I-019, owner, 2026-11-04)

Each element has one look, set once in `theme.ts` or a shared style; a screen doesn't restyle it.

- **Buttons** are 44 px pills (the theme's default; no `radius` or height on a button). Only the sign-in screens'
  button is 52 px, full width under their 52 px fields. Four kinds: the charcoal *primary* (the default, one per
  place); `variant="quiet"`, the grey word, for second choices (Cancel, Keep it, Clear all) and actions in rows;
  `variant="danger"`, the red pill that confirms a delete; `variant="danger-quiet"`, the red word with its icon for
  Delete in rows and forms. No outlined buttons (Continue with Google keeps its outline, the brand's sign-in button).
- **Icon buttons** are 44 px circles (`ActionIcon`'s default), with an `aria-label`. Icons have a 1.7 stroke.
- **One pill switch**: Mantine's `SegmentedControl` from the theme, 44 px, on the `choice` track with the picked option
  raised in the text colour; the transaction type keeps its colour. Built switches (Settings, sign-in) look the same.
- **Pills you pick**: `shared/ui/Pills.module.css`, 44 px with the fields' border, the picked one in the accent's tint;
  a picked type in its colour.
- **Fields**: 52 px, 16 px text and 16 px inside, the surface behind them and the fields' border, from the theme. A
  list's search is the same field at 48 px.
- **Menus**: 44 px items; Delete in the app's danger colour, never Mantine's `red` (it fails AA contrast).
- **The phone keypad**: 52 px pill keys and a pill Save.

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
| Accounts (F-014) | Variant 10 (final, after 3 rounds): variant 4's layout (Group by Currency / Source switch, a dashed ghost card adds an account to its group) with variant 2's card styles picked per account (Solid, Tinted, Envelope, Plain; Solid turns light grey in dark mode); the form opens with the card preview and the four styles right under it; "In total" on top; any NBU currency (searchable list), own sources and banks; an X on every pop-up | 2026-10-30 | Approved by the owner before the build. The "In total, in UAH" line at NBU rates was built with F-017 (2026-10-31), as in this prototype. See the [F-014 description](changes/features/F-014-accounts/F-014-accounts.md#approved-2026-10-30) |
| Pop-up spacing, all pop-ups (I-012) | Before / after page, round 3: the space between the title and the content equals the space between the content and the buttons and the outer padding (desktop dialog 20 px, phone sheet 16 px); the outer padding unchanged; a scrolled content fades at both edges; every value even; Add transaction uses the shared dialog on the desktop | 2026-10-30 | Approved by the owner before the build. See the [I-012 description](changes/improvements/I-012-dialog-title-spacing/I-012-dialog-title-spacing.md#before--after-page-2026-10-30) |
| Deleting an account (I-011) | Variant 3: at the end of the edit form, after a rule, "Archive or delete" with two rows (Archive; Delete for good), each with a line on what it does; the form's buttons are only Cancel and Save; Delete asks for the account's name typed, "Keep it" / "Delete for good" (red), and says how much money is still on it; archived rows get Delete next to Restore; only an account without transactions can be deleted (after F-018 Delete is off with the reason) | 2026-10-30 | Approved by the owner before the build. See the [I-011 description](changes/improvements/I-011-delete-account-permanently/I-011-delete-account-permanently.md#final-prototype-2026-10-30) |
| Categories (F-015) | Variant 7 (after 3 rounds): its own menu item after Reports (under More on the phone); on the phone and tablet every group with its categories as tags (income green, the others neutral, not buttons), a group's row (name, count, arrow) folds it and a folded group shows its first categories, Collapse all / Expand all at the top; on the desktop the list of groups on the left and the picked group's bigger tags on the right; no + or − next to groups, the words say the kind. Owner's review: on the phone and tablet every group starts folded except the one open on the desktop (Income at first), several can be open; on the desktop only one; the open groups are shared by both layouts and remembered on the device | 2026-10-31 | Approved by the owner before the build; the open groups changed at the owner's review the same day. Read-only until categories can be changed (post-MVP). See the [F-015 description](changes/features/F-015-categories-view/F-015-categories-view.md#approved-2026-10-31) |
| Settings (F-016) | Variant 4 (variant 1 with any NBU currency, after 2 rounds): one page of sections, label and a line on what it does on the left, the control on the right from 1024 px (one under the other below); Name with Cancel / Save name shown once it differs, email shown but not changeable; Report currency as a segmented choice Hryvnia / US dollar / Euro plus "Another currency" (any NBU currency), saved at once with a notification, your total in it right under it with the rates it uses; Theme Light / Dark / System, kept on the device. Every currency field (Settings, the account form) opens the same list: your currencies first, then the other NBU currencies, with a search; a dropdown over the page on the desktop, as tall as its rows up to 344 px, a sheet on the phone | 2026-10-31 | Approved by the owner before the build. The sun / moon button stays. See the [F-016 description](changes/features/F-016-user-settings/F-016-user-settings.md#round-2-final-prototype-2026-10-31) |
| Closing pop-ups (I-015) | Demo page (no new screens): a phone sheet follows the finger when dragged down by its handle or title, or by its content when the content is at its top; it closes past a quarter of its height or on a flick (0.4 px/ms), otherwise slides back; Back closes the top pop-up (desktop dialog too), other ways of closing leave nothing in the history, Forward onto a closed pop-up does nothing, a link from More replaces the sheet's step; reduced motion: follows the finger, no slide | 2026-11-01 | Approved by the owner before the build. See the [I-015 description](changes/improvements/I-015-sheet-swipe-and-back/I-015-sheet-swipe-and-back.md#demo-approved-2026-11-01) |
| Quick add: expense and income (F-018) | Variant 7 (final, after 5 rounds and 3 reviews): one form for expense and income (Transfer joins with F-019), the type as a pill switch in its title row; in order the day (a week strip, Monday first, with ‹ › and a calendar button), the account (a field with its bank or cash and its balance, opening the app's dropdown or a sheet), the amount (a calculator display: right-aligned in the type's color, no sign; a sum as arithmetic with its result on top), the category (the most used as pills, 6 on the phone and 8 on the desktop, and "All categories" with a search), the note. On the phone the app's own keys (digits, 00, ⌫, + − =, Save) under the scrolling form; on the desktop the amount is typed and the dialog has Cancel / Save. The last account used for the type and the category last used with that account come picked. A + on every account card opens the form with that account: a split edge, a column on the card's right after a thin rule in the card's colors, tinted in the card's own color under the pointer (variant 9, approved 2026-11-01 at the PR review). The Transactions page lists the latest transactions by day until F-020; a row opens the form to change or delete it | 2026-11-01 | Approved by the owner before the build. The calendar is Mantine's (`@mantine/dates`). See the [F-018 description](changes/features/F-018-quick-add-income-expense/F-018-quick-add-income-expense.md#round-5-final-prototype-2026-11-01) |
| Transfers and currency exchange (F-019) | Final prototype (F-018's variant 7 as built, with Transfer finished): Transfer as the third type in the switch; From and To where the account field is, side by side, with a swap button between them (it swaps an exchange's two amounts too); the To list leaves out the From account; between accounts of one currency one amount in the transfer's blue, no category; between currencies ("Exchange") the From amount big and the To amount smaller, suggested at the NBU rate of the picked day (the latest earlier one, said so; none → typed), with "At the NBU rate of …: $1 = … ₴" or "Your rate: … NBU: …" and "Use the NBU rate"; rates as the app writes them (one unit of the currency worth more, two decimals); the notification counts both balances and both cards light up; list rows "Transfer" / "Exchange" with the accounts and an arrow, the amount in blue without a sign (`$100 → 4 490 ₴`); Delete says what both balances go back to. No fee field; a transfer may take an account below zero | 2026-11-02 | Approved by the owner before the build. See the [F-019 description](changes/features/F-019-transfers-and-exchange/F-019-transfers-and-exchange.md#final-prototype-2026-11-02) |
| Transactions list (F-020) | Variant 8, revised (after 3 rounds): the period's spent and received big on a dark slip with a torn edge (light grey in dark mode), a bar for how much of what came in is spent and what's left; the month as its title with ‹ ›, the title opening the period list (This month, Last month, This year, All time, Custom range); on the phone a swipe on the totals moves the month, and on the phone and tablet a slim totals bar stays on top once they scroll away; a folding calendar, each day as deep a red as it cost (four steps by the month's quarters) with a green dot on days with income and a blue one on days with a transfer (both in the legend; owner's review of PR #49, 2026-11-03): closed one week, open the month, a tapped day shows only its receipt; "Where it went" bars with each category's amount and share (with Income picked, income's own in green, "Where it came from"), a tap shows only that category; every day a till receipt (dotted leaders, the day's total at the foot). Desktop: the calendar and the categories in a sticky left column whose list scrolls inside it, the filters (account, type, a picked category) over the receipts. Tablet: Account, Type and By category buttons. Phone: one Filters button with a count, the picked filters as chips with ×, one sheet. The calendar opens closed on the phone and open on the desktop and is remembered on the device; the filters are in the page's address. Variant 9 (owner's review, approved 2026-11-03): Add transaction on the slip, a light pill at the end of the month row, a round + on the phone and on a slip narrower than 560 px | 2026-11-03 | Approved by the owner before the build, with the open points' proposals. See the [F-020 description](changes/features/F-020-transactions-list/F-020-transactions-list.md#round-3-2026-11-03) |
| One look for every element (I-019) | Before / after page: every button a 44 px pill (52 px only on the sign-in screens), four kinds (primary charcoal, grey word for Cancel / Keep and row actions, red pill to confirm a delete, red word in rows), no outlined buttons; the sidebar's Add the primary pill (a 44 px circle in the rail); icon buttons 44 px circles, strokes 1.7; one pill switch on the `choice` track, the picked option raised in the text colour (the transaction type in its colour); one selectable pill (fields' border, picked in the accent's tint); one field style set in the theme; pill keys on the phone keypad; the menu's Delete in the app's red | 2026-11-04 | Approved by the owner before the build. See the [I-019 description](changes/improvements/I-019-ui-consistency/I-019-ui-consistency.md) |
| Note suggestions (I-017) | Final prototype (variant 1 with the starts-first order): the person's earlier notes in the app's dropdown under the Note field, one line a row, over the form (above the field on the desktop when there's no room below), what was typed quiet grey and the rest standing out; at most 5, first the notes that start with what was typed, then those that have it further on, each part by use and then date; ↓ ↑ Enter, Escape closes it, a row picked on pointer down; no list for an empty field or when nothing matches, the last rows kept while the next load. On the phone, while the note is typed, the app's keys fold away (a tap on the amount brings them back), the form scrolls the Note field to its top and the list hangs under it, down to Save | 2026-11-04 | Approved by the owner before the build. See the [I-017 description](changes/improvements/I-017-note-suggestions/I-017-note-suggestions.md#round-2-final-prototype-2026-11-04) |
| Reports (F-022) | Final prototype (after 1 round and the owner's reviews): the year as variant 3's table on the desktop and tablet (groups that fold to their totals, income and expenses as bars over the months, a month over the category's usual in four reds with a key, the currency named once in the corner, this month tinted with "now", Avg "÷ N months", the summary rows on the slip's charcoal; only the categories with something in the year; as tall as its rows, a sideways bar in a gutter of its own when it's too wide); on the phone a short head and the months as rows (option C: in and out as two bars, NET; the year so far on the slip; "Where the year went" by group); the month as M2, a receipt a group stacked like the Transactions page's days, and the month from the balance at the start to the end on a receipt of its own (beside them on the desktop, first on the phone); Year / Month, ‹ › over the years and months with data, the report currency as the filter pill opening the shared currency list (this visit only); a month's heading opens the month, a category's amount opens its transactions | 2026-11-04 | Approved by the owner before the build, with the open points' proposals. See the [F-022 description](changes/features/F-022-reports-ui/F-022-reports-ui.md#final-prototype-2026-11-04) |
