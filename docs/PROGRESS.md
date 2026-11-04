# Progress log

Newest entries on top. Each entry: what was done, decisions, what's next.

## 2026-11-04 (I-020: No two accounts alike)

**Done**
- Built [I-020](changes/improvements/I-020-no-duplicate-accounts/I-020-no-duplicate-accounts.md) on
  `improvement/I-020-no-duplicate-accounts`, approved by the owner in chat ("approved build"). An exact copy of an
  account in use (name ignoring case and spaces, currency, source, own source or bank) is refused when adding,
  editing or restoring; archived accounts don't count. The rule is in the Domain (`Account.CopyIn`); the form finds
  a copy before sending and shows the API's answer (400 on `name`, 409 on restore) the same way.
- A partial unique index `ix_accounts_no_copies_in_use` (migration `NoCopiesOfAccounts`, SQL: EF Core can't model an
  expression index) catches two saves at the same moment. Decided while building: when a database already has
  copies, the migration skips the index with a warning instead of failing the deploy or changing anyone's accounts
  ([ADR 0025](decisions/0025-no-copies-of-accounts.md)). The migration ran on `dev`; whether it made the index there
  couldn't be read from here (no database access), so the owner checks `dev` and production with the PR's query.
- Checked: backend build and tests, frontend lint, format, typecheck, build, unit tests, `build-storybook`, the full
  E2E suite (desktop and phone), the design check on Accounts (0 issues), screenshots of the New account form with the
  copy error and of the refused restore at 375 and 1440 px, light and dark, looked at; walked through in the Browser
  pane.
- Test data: a test person `e2e-manual-…@example.com` with three accounts and an `E2E manual I-020` invite link, for
  the walk-through; the E2E runs' own people. All removed by the E2E clean-up (see the PR).

**Next**
- Owner: review the PR; check `dev` and production for the index and for existing copies.

## 2026-11-04 (Plan: I-020)

**Done**
- The owner asked whether accounts with the same name, currency, bank and source should be possible; today nothing
  stops it. Planned as [I-020](changes/improvements/I-020-no-duplicate-accounts/I-020-no-duplicate-accounts.md)
  (Medium, Todo) on `plan/i020-no-duplicate-accounts`: an exact copy of an account in use is refused (name compared
  ignoring case and spaces) when adding, editing or restoring; another currency, bank or source stays allowed;
  archived accounts don't count; the backend checks it too, with a unique index. No prototypes: the messages use the
  app's existing error and notification.
- Test data: none.

**Next**
- Owner: review and approve I-020 (the wording of the two messages, and the archived-accounts rule) before it is
  built on `improvement/I-020-no-duplicate-accounts`.

## 2026-11-04 (I-019: One look for every element)

**Done**
- The owner found the sidebar's Add transaction unlike the app's other buttons and asked for every UI element to be
  aligned: planned as [I-019](changes/improvements/I-019-ui-consistency/I-019-ui-consistency.md) (Medium, proposed).
  Audit from the code: buttons in five heights (36 px, Mantine's default, is the most used, below the touch target),
  seven not pills, three Cancel styles, the red Delete built three times; four builds of the pill switch in two colour
  sets; pills with two borders; the 52 px field style copied into six screens; icon buttons in three sizes and two
  shapes; three icon strokes. Proposal and open points in the description file.
- The owner asked for the design system in Storybook ("add design system to storybook"), approved by the request:
  *Design system / Foundations* (colour tokens of both schemes side by side, read from `theme.ts`; type; corners and
  spacing measured in the browser; icons) and *Design system / Components* (buttons, icon buttons, switches, pills and
  chips, fields, check boxes and menus, each variant built with the app's own props and styles, with where it is used
  and "Differs" on what I-019 aligns). Settings' `Choice` is exported for it; no screen changed.
- Checked: types, lint and format; all 10 pages render at 375 and 1440 px, light and dark, with no errors and no
  sideways scroll; screenshots looked at (fixed: the colour groups' names repeated in each column).
- Test data: none.

- The owner's answers: Cancel the grey word everywhere; the keypad's keys as pills (a comparison of today, pill and
  circle keys, [keypad-round-keys.html](changes/improvements/I-019-ui-consistency/prototypes/keypad-round-keys.html));
  44 px for every button, 52 px only on sign-in. The [before / after page](changes/improvements/I-019-ui-consistency/prototypes/before-after.html)
  showed every element today and after; its design check flags only the "Today" column (36 and 40 px buttons, and the
  menu's Delete in Mantine's red at 3.2:1 contrast). The owner approved it ("Approved, build it"); recorded in the
  description file and DESIGN_RULES "Screen decisions" before the build.
- Built: the look is set once in `theme.ts` (button variants `quiet`, `danger`, `danger-quiet`; 44 px pills and icon
  circles; one field; one `SegmentedControl` switch; 44 px menu items) and `shared/ui/Pills.module.css`; every screen
  moved to it, the copied styles removed. Storybook *Design system / Components* now shows the one look; DESIGN_RULES
  has a "Components" section.
- Checked: types, lint and format; unit tests (227); the full E2E suite (56 passed, 6 skipped as before; it caught the
  rail's + off the icons' axis, fixed and its test re-run); the app and Storybook build; screenshots of every changed
  screen's stories at 375 and 1440 px, light and dark, looked at.
- Test data: the E2E runs' own people, removed by their teardown; nothing made by hand.
- Kept as they are, on purpose: Continue with Google's outline (the brand's button), People's selection bar (light
  buttons on its dark bar), the form's Today / Yesterday (picks, not buttons), the phone tab bar's round + (52 px), the
  48 px search fields inside the currency and category lists, and the read-only invite link field.

**Next**
- Owner: review the PR.

## 2026-11-03 (F-020: Transactions list)

**Done**
- The owner approved variant 8 with the open points' proposals ("variant 8 for F-020 is approved, build it"); recorded
  in the description file and DESIGN_RULES "Screen decisions" before the build.
- API: `GET /api/transactions` with the filters (period, account, category, type) and pages of 30;
  `GET /api/transactions/summary`: spent, received, each day's and each category's, in the report currency at the
  NBU rate of each day (one account picked: its own currency). [ADR 0024](decisions/0024-transactions-list-and-summary.md).
- The Transactions page as variant 8: the totals slip (‹ ›, the period list, a swipe on the phone, the slim bar once it
  scrolls away), the folding spending calendar (remembered on the device), Where it went, the filters (desktop,
  tablet, the phone's Filters sheet with chips), every day as a till receipt with its total, loading more on scroll.
  The filters are the page's address; a phone sheet's picks go into it once the sheet's Back step is gone.
- Tests: backend summary, filter validator and controller tests; frontend unit tests for the filters, the calendar and
  the page; stories for every state (`Transactions/Transactions list`); an E2E test (pick Eating out, reload, change
  one and delete another on its receipt).
- Checked: the full E2E suite (56 passed, 6 skipped as before; a first run failed the new test on a stale Vite module,
  passed after a restart); frontend lint, format, types, build and unit tests; backend build and tests; Storybook builds;
  the design check on the real page (0 issues, 0 console errors); screenshots at 360, 375, 834 and 1440 px, light and
  dark, looked at (fixed: the receipts as wide as the column on the tablet, now 520 px as in the prototype; a
  hand-made address with an unknown account broke the totals, now the id is left out; the slip's "Try again" link was
  blue on charcoal, now in the slip's own colour).
- Test data: one test person (`e2e-manual-…@example.com`, an invite link noted "E2E manual check F-020") with four
  accounts and 122 transactions in the `dev` database for the browser checks and screenshots; removed by the E2E
  clean-up (signing in as it now fails). The E2E runs' own people removed by their teardown.

- Owner's review: the calendar marks days with a transfer with a blue dot, as income's green one, with Transfer in the
  legend (the summary's days now count their transfers). Checked at 360, 375 and 1440 px, light and dark; test data
  as above (a second test person, removed the same way).
- Owner's review: Add transaction on the totals slip. Prototyped first as [variant 9](changes/features/F-020-transactions-list/prototypes/variant-9.html)
  (three phone placements); the owner approved the round + in the phone's month row. Built: a light pill at the end
  of the month row, a round + on the phone and on a slip narrower than 560 px (768 px with the full sidebar); with one
  account in use picked the form opens with it. Checked: design check on the prototype and on the real page, 0 issues;
  screenshots of the slip at 360, 375, 768, 834, 1024 and 1440 px, light and dark; test data as above (a third test
  person, removed the same way).

**Next**
- Owner: review the PR. Open point 6 (search by note) is to be planned as an improvement with I-017.

## 2026-11-03 (F-020 design round 3)

**Done**
- From the owner's picks in round 2 (variant 4's receipts, variant 5's calendar and category bars, totals made
  prominent; variant 6 out), two prototypes on the same parts:
  [variant 7 · Receipts and calendar together](changes/features/F-020-transactions-list/prototypes/variant-7.html) and
  [variant 8 · Receipts or calendar](changes/features/F-020-transactions-list/prototypes/variant-8.html) (a view
  switch). Both open with the period's totals big on a dark slip, with a spent-of-received bar; the category bars show
  each one's share.
- Checked: the design check passes on both with 0 issues; every screen at 375 and 1440 px, light and dark, looked at.
- The owner found that variant 8's Receipts / Calendar switch blanked the page: its buttons used `data-view`, the
  attribute of the prototype's own Phone / Tablet / Desktop switcher, so a click resized the frame to nothing. Renamed;
  the switch was clicked both ways in the browser. The checks had missed it because they open each screen directly
  instead of clicking the switch.
- Test data: none.

- The owner chose variant 8 and asked for a folding calendar instead of the switch: closed it is a row with a strip of
  the month's days in their colours, open it is the full calendar (closed at first on the phone, open on the desktop).
  The design check found the open calendar's days 43 px wide on a 360 px phone (the frame took the room); on narrow
  phones the open calendar now has no frame. Opening, tapping a day and folding were clicked in the browser.
- The owner didn't like the closed strip; closed, the calendar now shows one week of day squares (this week, or the
  picked day's), with "Show the month". Design check 0 issues; tapping a day in the week, opening the month, picking
  a day and folding back to its week clicked in the browser.
- On the desktop the filters moved to the top of the receipts column, right above the receipts (owner's request);
  design check 0 issues.
- Phone first, at the owner's request: spent and received side by side (the first receipt starts at 469 px instead of
  567 at 375 px), a swipe on the totals moves the month, a slim totals bar stays on top once they scroll away (a tap
  goes back up), the three filters fit one row. Checked: design check 0 issues; the swipe and the bar tried with real
  touch events (next month stops at October, the period list doesn't open after a swipe, a tap on the bar scrolls up);
  fixed: "Catego…" cut off at 360 px, the bar's top 8 px hidden under the app bar.
- The owner still saw the filters cut off and found the desktop's categories unreachable by scrolling. Phone filters
  are now one Filters button with a count, the picked ones as chips with ×, and one sheet (account and type pills,
  category bars, Clear all / Show N). On the desktop the sticky column fits the window and "Where it went" scrolls
  inside it, passing the wheel on to the page at its end. Checked: design check 0 issues; the sheet tapped through at
  360 px (pick, show, clear one chip, clear all); the wheel over the categories reaches the last one, then scrolls the
  page; the scroll bar moved off the percentages.
- The owner: the wheel at the categories' end (or top) must not scroll the receipts. The list now keeps the wheel,
  and the sticky column is fitted to the visible window on every scroll so the list's end is always reachable.
  Checked with the wheel in 900 and 760 px tall windows: past the list's end and top the page stays put, at the top
  of the page and after scrolling; design check 0 issues.
- Owner's review: the calendar's fold has only its arrow; the Filters sheet no longer stretches its sections apart
  when Income or Transfers is picked (Income now shows its own categories in green); the sheet's scroll bar moved
  off the rows. Tapped through at 375 px, light and dark; design check 0 issues.
- With no filters on, the phone shows the Filters button alone (no "All accounts and categories" line).
- The calendar has the desktop's rounded frame on the phone too, with the page's 16 px margins (12 px below 375 px,
  so the days stay 44 px wide: 44.3 px at 360, 44.7 at 375); an edge-to-edge band tried first was not what the owner
  wanted. Design check 0 issues, looked at 360 and 375 px, light and dark.

**Next**
- Owner: more changes to variant 8, or approve it (with the open points) for implementation.

## 2026-11-03 (F-020 design round 2)

**Done**
- The owner found round 1 too plain and too technical. Round 2 has three bolder directions, each with one idea from
  the couple's world and friendlier words, on the app's theme:
  [variant 4 · Till receipts](changes/features/F-020-transactions-list/prototypes/variant-4.html) (every day a receipt
  slip, the month's receipt of categories filters),
  [variant 5 · Spending calendar](changes/features/F-020-transactions-list/prototypes/variant-5.html) (days coloured by
  what they cost, a day or a category picked from the picture),
  [variant 6 · Wallet and statement](changes/features/F-020-transactions-list/prototypes/variant-6.html) (account
  cards as the filter, the balance after every row, the filters as a sentence).
- More references in the description file (Money Manager's calendar, Copilot Money, Spendee, a Dribbble expense
  tracker, a till receipt and a bank statement).
- Checked: the design check passes on all three with 0 issues (it found month arrows squeezed below 44 px on the
  phone, a skipped heading level, calendar days whose names left out their visible text, and an income dot and hidden
  ⋯ buttons under open lists; all fixed). Every screen at 375 and 1440 px, light and dark, looked at (fixed: the
  month's receipt and the category bars pushing the days off the phone's first screen, now behind a button; a
  rent day washing out the calendar, now coloured by the month's quarters; muddy dark-mode calendar colours; the
  wallet's ⋯ pushing amounts out of line; the picked card off screen on the phone).
- Test data: none.

**Next**
- Owner: pick a variant from either round (or a mix) and answer the open points; then a final prototype and the
  plan for approval.

## 2026-11-02 (F-020 design variants)

**Done**
- F-020 started on `feature/F-020-transactions-list` (status In progress). References (Monefy, Monize, PocketGuard,
  Toshl, the owners' sheet, F-018's list as built), the brief and the token plan are in the description file.
- Three variants for the owner, each with phone, tablet and desktop, light and dark, and every state (filters, lists,
  nothing found, loading more, edit, delete, loading, error, no transactions):
  [variant 1 · Month ledger](changes/features/F-020-transactions-list/prototypes/variant-1.html),
  [variant 2 · Pocket stream](changes/features/F-020-transactions-list/prototypes/variant-2.html),
  [variant 3 · Filters and the month strip](changes/features/F-020-transactions-list/prototypes/variant-3.html).
- Six open points for the owner (daily totals, their currency, the default period, transfers with one account picked,
  filters in the address, search by note).
- Checked: the design check passes on all three with 0 issues (it found variant 2's chip buttons 42 px tall and
  variant 3's day bars too narrow to be buttons; fixed: the chips are 44 px, the strip is one chart a mouse can click);
  every screen at 375 and 1440 px, light and dark, looked at (fixed: stretched select buttons, "That's all of All
  time.", a swiped row hiding its text, the desktop trash button pushing amounts out of line, the year's total cut off
  on the phone, the jump to a day not scrolling).
- Test data: none.

**Next**
- Owner: pick a variant (or a mix) and answer the open points; then a final prototype and the plan for approval.

## 2026-11-02 (F-019: Transfers and currency exchange)

**Done**
- The owner approved the final prototype, the plan and the four open points as proposed ("Approved, build F-019");
  recorded in the description file and DESIGN_RULES "Screen decisions" before the code.
- **API:** `Transfer` as a third transaction type, one row with both accounts (`ToAccountId`, `ToAmount`), no category
  (migration `AddTransfers` with a check constraint). Balances, "used" accounts, save and delete count both sides; the
  suggestions give the last transfer's From and To; `GET /api/rates?date=…` gives the form the day's NBU rates.
  ADR 0023.
- **App:** Transfer in the quick-add switch with From / swap / To; an exchange's second amount suggested at the NBU
  rate of the picked day, "Your rate" / "Use the NBU rate", the earlier-rate and no-rate lines; on the phone the keys
  type into the display with the ring. Transactions rows "Transfer" / "Exchange", "Edit exchange", Delete saying what
  both balances go back to, the notification counting both, both cards lit on Accounts.
- Found while checking: a gap between `$` and the number in the amount display (F-018's), and the To display hidden
  under the phone keys; both fixed.
- Tests: backend (validator, domain, balances, suggestions, rates controller), frontend (`exchange.test.ts`,
  `defaultTo`, 7 transfer tests on the page), E2E (an exchange of $100 for hryvnias and its delete, desktop and
  phone). New stories for transfer, exchange (NBU rate, own rate, phone, earlier rate, no rate), edit and delete.
- Before the push: backend build (0 warnings) and 325 tests; frontend lint, format, typecheck, 201 unit tests, build,
  Storybook build; the full E2E suite (54 passed, 6 skipped as one-layout tests). Screenshots of the built screens
  (transfer, To list, exchange at the NBU and own rate, swapped, saved with both cards lit, Transactions, Edit exchange,
  Delete) at 375 and 1440 px, light and dark, looked at; the flow walked through in the Browser pane on both sizes.
  Nothing to fix.
- Test data: a person `e2e-manual-…@example.com` with three accounts and a few transfers (made through the API with an
  `E2E manual check F-019` invite link, used by it), plus the E2E tests' people; all removed by the E2E clean-up, and
  checked through the admin API (no `e2e-` people left). The same again for the check before the push. The owner's
  data untouched.

**Next**
- Owner: review the PR. Then F-020 (the full Transactions list).

## 2026-11-02 (F-019 final prototype)

**Done**
- F-019 started on `feature/F-019-transfers-and-exchange`. Its design rounds were F-018's (every variant had Transfer
  and Exchange screens), so the next step is a final prototype rather than 3 new variants:
  [F-019 final prototype](changes/features/F-019-transfers-and-exchange/prototypes/variant-1.html), F-018's variant 7
  as built with Transfer finished: From / To with a swap button (new), the exchange's second amount suggested at the
  NBU rate of the day with "Your rate" / "Use the NBU rate", the rate written as the app writes rates ($1 = … ₴ both
  ways), the earlier-rate and no-rate states, the notification counting both balances, both cards lit on Accounts,
  "Transfer" / "Exchange" rows, edit and delete.
- The description file has references (Wise, Wallet by BudgetBakers, CoinKeeper), the brief, the build plan
  (one row per transfer, a rates endpoint for the form) and 4 open points for the owner.
- Checked: the design check passes with 0 issues (it found the "Use the NBU rate" link too small to tap, fixed);
  every screen at 375 and 1440 px, light and dark, looked at (fixed: the two-balance notification wrapping badly, the
  To amount's line hidden under the phone keys).
- Test data: none.

**Next**
- Owner: answer the open points and approve the final prototype and plan for implementation, or ask for changes.

## 2026-11-02 (I-018: Neon skills in the repo)

**Done**
- The owner asked to commit the Neon skills and ignore `launch.json`, which had been untracked since the first
  sessions. Planned as I-018 (Low) and done: `.claude/skills/neon/`, `.claude/skills/neon-postgres/` and
  `skills-lock.json` committed as installed (checked for secrets first: none); `.claude/launch.json` (laptop-only
  paths) added to `.gitignore`.
- Checked: git status is clean apart from the ignored file. No app code changed, so no builds or tests were run.
- Test data: none.

**Next**
- Owner: review and merge the I-018 PR. Then F-019: a final prototype for transfers and exchange, for approval.

## 2026-11-02 (plan: I-016, I-017)

**Done**
- Two follow-ups of F-018's design review planned on `plan/i016-i017-quick-add-follow-ups`, nothing built:
  - I-016 (proposed priority Low): this month's total next to each category in the quick-add form, in the report
    currency (the owner kept it out of F-018 and asked for it as an improvement);
  - I-017 (proposed priority Medium): the person's notes already used, suggested while typing a note.
- Both come after F-018 and need 3 HTML prototypes and the owner's approval before they are built.
- Test data: none.

**Next**
- Owner: confirm the priorities and review the planning PR. F-018 is merged (#44).

## 2026-11-02 (B-003: smaller account cards, in the F-018 PR)

**Done**
- The owner found the account cards bigger than in the prototype. Root cause: the app shell caps pages at 880 px
  (F-010) while the prototypes since F-014 drew 1040 px, so three cards fit per row instead of four. The owner chose
  smaller cards over wider pages. Planned as B-003 (Medium) and fixed in the F-018 PR: cards from 180 px, four per row
  on the desktop (190 × 119 px); the split edge 44 px there; the balance sized from the room left and its own length.
- Checked: lint, format, typecheck, unit tests (185), build, Storybook build, E2E (52); screenshots at 375, 768 and
  1440 px, light and dark, measured and looked at.
- Test data: one `e2e-manual-…@example.com` person, removed by the E2E clean-up (checked).

**Next**
- Owner: review and merge PR #44.
- The other pages are also narrower than their prototypes (880 px against 1040 px); not changed, as the owner chose.

## 2026-11-01 (F-018 review: split edge built)

**Done**
- The owner approved variant 9 ("Approved, build it"); recorded in the description file and the F-018 screen decision.
- Built: the split edge on every account card (`AccountCard`'s `onAdd`), 52 px on the phone and 48 px wider, in the
  card's own colors; the corner + is gone. New stories for it.
- Checked: lint, format, typecheck, all unit tests (183), build, Storybook build, the full E2E suite (52); screenshots
  of the Accounts page at 375 and 1440 px, light and dark, looked at.
- Test data: one `e2e-manual-…@example.com` person with sample accounts and transactions for the screenshots, removed
  by the E2E clean-up (checked: no `e2e-` people left).

**Next**
- Owner: review and merge PR #44.

## 2026-11-01 (F-018 review: split edge chosen, final prototype)

**Done**
- The owner chose option D (split edge). Variant 9 (final) has only it, with the balance kept at today's size next to
  the column. Design check 0 issues; close-ups at 375 and 1440 px, light and dark, looked at.
- Test data: none.

**Next**
- Owner: approve variant 9 for implementation, or ask for changes.

## 2026-11-01 (F-018 review: the + on account cards, round 6)

**Done**
- The empty Transactions page's Add transaction button is 48 px like the page buttons (it was Mantine's default size).
- The owner asked for other variants of the + on account cards. Variant 8: the Accounts page as built with four options
  (quiet corner, Add by the balance, receipt edge, split edge) and today's for comparison; hover in the card's own
  colors in all of them. Design check 0 issues for every option; close-ups at 375 and 1440 px, light and dark, looked
  at.
- Test data: none.

**Next**
- Owner: pick an option (or a mix); then it becomes the final prototype for approval before the app changes.

## 2026-11-01 (F-018 review: the note field)

**Done**
- Owner's review: the Note was Mantine's small default input, unlike the app's other fields. It is now the account
  form's field: 52 px, 16 px text, the fields' border and surface. Screenshots at 375 and 1440 px, light and dark,
  looked at; the form's unit tests, lint and typecheck pass.
- Test data: one `e2e-manual-…@example.com` person with four accounts and seven transactions for the screenshots,
  deleted through the admin API afterwards (checked).

## 2026-11-01 (F-018 built)

**Done**
- The owner approved variant 7 ("I approve variant 7 for the current feature, build it"); recorded in the description
  file and DESIGN_RULES (screen decision, and the custom rule for the amount's error read out only).
- Backend: `Transaction` (expense or income), the `transactions` table, `/api/transactions` (latest 50, add, change,
  delete, with the balance before and after) and `/api/transactions/suggestions`; balances on the Accounts page include
  the transactions; an account with transactions can't be deleted or change its currency (409). ADR 0022.
- Frontend: the quick-add form as approved (week strip and Mantine's calendar, account field, calculator display with
  the app's keys on the phone, category pills with All categories and a search, note), opened from the shell's +, a +
  on every account card and a row of the new latest-transactions list; delete asks first; the notification counts the
  balance. The account form turns Delete and the currency off once there are transactions (I-011's "Later" screens).
  `ResponsiveDialog` / `BottomSheet` got a title-row control, title-row buttons, a width and a full-height sheet.
- Found and fixed while checking: the Expense / Income switch didn't switch on the phone (a sheet's title row started a
  swipe on labels); Escape in a list or the calendar closed the form too; dark-mode display and keys in the page's
  color; the phone calendar not filling its sheet; faint days of other months in the calendar (axe).
- Checked: backend tests (306), frontend lint, format, typecheck, unit tests, build, Storybook build; the full E2E suite
  (52, the new `transactions.spec.ts` on the desktop and the phone); the design check on Transactions and Accounts (0
  issues); axe on the open form and its lists; screenshots of every state at 375 and 1440 px, light and dark. Not run:
  the Storybook stories themselves (too slow, owner 2026-10-30). The Browser pane didn't draw while the app window was
  behind, so the screenshots were taken with headless Playwright.
- Test data: two people `e2e-manual-…@example.com` with four accounts and seven transactions each, made through the API
  for the screenshots; removed by the E2E clean-up (checked: no `e2e-` people left). The E2E runs cleaned up after
  themselves.
- Seen, not changed: axe reports a second banner landmark while any titled phone sheet is open (the account form too,
  before F-018).

**Next**
- Owner: review and merge the F-018 PR. Then F-019 (transfers and exchange) or F-020 (the full list).

## 2026-11-01 (F-018 final prototype, variant 7)

**Done**
- The owner chose the field with balance (account) and the week strip (day). Variant 7 (final) is variant 5 with them
  and the owner's other notes: a + on every account card on the Accounts page opens the form with that account picked
  (new acceptance criterion); the last used account picked, with a hint; a Note field on the phone; the form scrolls in
  the app's scroll area with faded edges; From and To with select arrows; a calendar dropdown that is never cut off;
  account dropdowns like the currency list (one line, as wide as the field). Order: amount, category, account, day,
  note.
- The shared prototype base changed with it (account rows, dropdown placement), so all seven variants were re-checked.
- Checked: every screen opens without errors on the phone and the desktop; the + flow tried in the Browser pane;
  screenshots of every screen at 375 and 1440 px, light and dark, looked at (one fix: screens opened scrolled where
  the last one was left).
- Owner's review of variant 7, done in it: no hint under the account; no error text under the amount (the red field;
  the message read out only); "Pick a category." next to its label; the account dropdown no longer scrolls when it
  fits (its height left out the borders, fixed for every dropdown); an Order switch shows the account and the day on
  top or before the category, and (asked next) day, amount, account and day, account, amount. Every screen checked in the Browser pane in each order; the design check run again on
  all seven variants; screenshots of the orders at 375 and 1440 px looked at.
- Owner's second review, done in variant 7: the order is day, account, amount, category, note; the day is "day
  before / after" (less room than the week strip); the category has the most used as pills and every category with a
  search in the "All categories" dropdown (no search field in the form). The calendar will be Mantine's
  (`@mantine/dates`). Checked in the Browser pane; design check 0 issues; screenshots looked at.
- Owner's third review, done in variant 7: the category last used with the account is picked (new acceptance
  criterion), following the account until one is picked by hand; the week strip is back on top; every block built
  the same way (24 px label row, 8 px, control; 16 / 20 px between blocks), measured in the Browser pane; the category
  pills wrap instead of running past the phone's edge, 6 most used on the phone and 8 on the desktop. Design check 0 issues; screenshots at 375 and 1440 px, light
  and dark, looked at.
- The owner answered the open points: the latest-transactions list on the Transactions page until F-020, no future
  dates, no saving on a category tap, and this month's totals per category as an improvement of its own (I-016);
  plus note suggestions while typing (I-017). Both planned on `plan/i016-i017-quick-add-follow-ups`.
- Test data: none.

**Next**
- Owner: approve variant 7 for implementation, or ask for changes.

## 2026-11-01 (F-018 design round 4)

**Done**
- The owner asked for other ways to pick the account and the day. Variant 6 is variant 5 with both open to choice
  in the preview bar: Account (chip + list, chip + list by currency, field with balance, most used + Other, row of
  cards) and Day (chip + calendar, day pills, day before / after, week strip, the phone's own picker). Variant 5 is
  unchanged (its account, date and note chips now come from one place so variant 6 can swap them).
- Checked: the design check passes for every option (one fix: the account field's spoken name); every combination
  opens every screen on the phone and the desktop without errors; screenshots of each option at 375 and 1440 px,
  light and dark, looked at (one fix: Other wrapped in "Most used + Other").
- Test data: none.

**Next**
- Owner: pick an Account and a Day option; then variant 5 gets them as the final prototype for approval.

## 2026-11-01 (F-018 final prototype)

**Done**
- The owner chose the calculator display and tags with search. Variant 5 (final) is variant 1 with them, and the
  owner's two notes: a sum is shown as arithmetic (no expense sign, no currency) with its result on the display's top
  line, `=` or Save turns it into the amount, a sum of zero or less can't be saved; the amount is 34 px on the phone.
  "Find a category" sits above the 8 most used tags and replaces them with the matching ones while typing.
- Checked: the design check passes (0 issues; its run found the exchange's second amount 36 px tall on the phone,
  fixed); sums typed on the keys and on the desktop keyboard tried in the Browser pane; screenshots of every screen at
  375 and 1440 px, light and dark, looked at (the empty field's sign standing apart from its 0, fixed).
- Owner's review of variant 5, both fixed in it: no − or + before the amount on the display (the type's color and
  switch say it); Backspace couldn't take away a + or − (the field showed a space after it, which was all Backspace
  deleted). Tried in the Browser pane on the keys and the desktop keyboard; the design check passes again (0 issues);
  screenshots at 375 px, light and dark, looked at.
- Test data: none.

**Next**
- Owner: approve variant 5 for implementation (and the four open points), or ask for changes.

## 2026-11-01 (F-018 design round 2)

**Done**
- The owner liked variant 1 and asked for more ways to type the money and pick the category. Variant 4 is variant 1
  with both open to choice in the preview bar: Amount (calculator keys, calculator display, keys + recent amounts,
  phone keyboard, boxed field) and Category (tags, cells with totals, select, groups, search).
- Checked: the design check passes for every option (its first run found list markup inside the cells and group
  words narrower than 44 px, both fixed); every combination opens every screen without errors; screenshots of each
  option at 375 and 1440 px, light and dark, were looked at (they found the display's label row taking the shell's
  56 px top-bar style, and long names broken mid-word in the cells, both fixed).
- Test data: none.

**Next**
- Owner: pick an Amount and a Category option (and answer the open points); then the final prototype.

## 2026-11-01 (F-018 design round 1)

**Done**
- F-018 quick add started on `feature/F-018-quick-add-income-expense`, design only (not approved, no code).
  - References: Monefy (calculator, tap a category), Cashew (amount first), CoinKeeper (account → category, most used
    pairs), the owners' Google Sheet. Mobbin needs a sign-in.
  - 3 prototypes in `prototypes/`, each with the transfer and exchange of F-019 (shared design), edit, delete, the
    pickers and the error states:
    - 1 · Calculator: the app's own keys with + and −, the 8 most used categories as tags, account / date / note chips;
    - 2 · Ledger slip: the phone's number keyboard, ledger lines, the balance before and after while typing, Save and new;
    - 3 · Categories first: every category as a cell with this month's total, then the amount; side by side on the desktop.
  - Four open points in the description file: where to edit before F-020, future dates, tap-to-save in variant 1,
    this month's totals in variant 3.
- Checked: the design check passes on all three (0 issues); its first run found 40 px segments and calendar days and
  narrow empty amount fields on the phone, all fixed. Screenshots of every screen at 375 and 1440 px, light and dark,
  were looked at; they found a category list that shrank to one row, a Note chip on a line of its own, long names
  broken mid-word in variant 3's cells, a second focus ring on the amount, and a dropdown hanging off the dialog, all
  fixed.
- Test data: none; nothing was run against the database.

**Next**
- Owner: pick a variant (or a mix) and answer the open points; then the final prototype.

## 2026-11-01 (I-015 build)

**Done**
- I-015 built on `improvement/I-015-sheet-swipe-and-back`, as approved on 2026-11-01 (the owner's "implement" for the
  demo with its three points as proposed; recorded in the description file and DESIGN_RULES before any code):
  - `useSheetSwipe` in `BottomSheet`: drag the handle, the title, or the content from its top; closes past a quarter of
    the height or on a flick, otherwise slides back; Mantine's own transitions do the rest, so reduced motion snaps.
  - `usePopupHistory` in `BottomSheet` and the desktop dialog: one history step per open pop-up; Back closes the top
    one, other ways of closing take the step away, Forward onto a closed one does nothing. More's sections replace
    the sheet's step.
  - ADR 0021; a DESIGN_RULES custom rule and "Screen decisions" row; a `SwipeAndBack` story.
  - Tests: unit tests for both hooks, `sheets.spec.ts` (phone and desktop) with a real touch drag on the currency list.
- Checked: backend 267 tests; frontend lint, format, typecheck, 149 unit tests, build, Storybook build and 50 E2E tests
  (6 skipped: the 2 from before, and the new ones meant only for the phone or only for the desktop);
  screenshots of the real sheets (form, mid-swipe, currency list over the form, More, desktop dialog) at 375 and
  1440 px, light and dark; the story swiped and closed with Back in the Browser pane. Not checked: a real phone.
- Test data: the E2E runs and one screenshot run made `e2e-…@example.com` people on the `dev` database; the cleanup
  teardown deleted them after each run. Nothing was made by hand.

**Next**
- Owner: review the I-015 PR and try it on a phone. Then F-018 (quick add).

## 2026-11-01 (I-015 demo)

**Done**
- I-015 (phone pop-ups close with a swipe down and with Back) started on `improvement/I-015-sheet-swipe-and-back`.
  Demo only, not approved, no code:
  - References: Vaul's numbers taken as they are (close past 25 % of the height or on a 0.4 px/ms flick; 100 ms after
    a scroll before the content can be dragged), Material and Android for Back.
  - `prototypes/demo.html`: Accounts with the account form, the currency list over it, More and Add transaction, the
    swipe and Back working as they would in `BottomSheet` / `ResponsiveDialog`.
  - Three points for the owner: a quarter instead of a third, Forward onto a closed pop-up is skipped, the desktop
    currency dropdown isn't closed by Back.
- Checked: the design check passes (0 issues), scripted drags, Back, Forward, the More link, the desktop dialog and
  reduced motion behave as planned, and screenshots at 375 and 1440 px, light and dark, were looked at (one fix: the
  sheet's own focus ring). A real phone's touch isn't checked yet.
- Test data: none; nothing was run against the database.

**Next**
- Owner: try the demo on a phone and approve I-015 for implementation, or ask for changes.

## 2026-10-31 (F-016 build)

**Done**
- F-016 user settings built on `feature/F-016-user-settings`, as approved on 2026-10-31 (variant 4 with the shared
  currency list; recorded in the description file and DESIGN_RULES "Screen decisions" before any code). M2 is done.
  - Backend: the report currency is kept on the account (`users.report_currency`, migration `AddReportCurrency`, UAH
    for everyone before); `GET /api/settings`, `PUT /api/settings/name`, `PUT /api/settings/report-currency` (any
    NBU currency); "In total" on Accounts in the person's report currency, its rates in hryvnias as the NBU publishes
    them (ADR 0020).
  - Settings page: Name and email (Cancel / Save name once it differs), Report currency (Hryvnia / US dollar / Euro
    saved at once, plus Another currency from the list, the total in it right under it), Theme (Light / Dark /
    System, kept on the device).
  - `CurrencyPicker` (shared): the account form's currency field uses it too. A dropdown under the field on the
    desktop, over the page or the dialog; a sheet on the phone; your currencies first. New custom rule in
    DESIGN_RULES.
  - Tests: backend 267, frontend unit 137, E2E 46 (2 skipped) on desktop and phone, including the new
    `settings.spec.ts`. Lint, format, typecheck, the build and the Storybook build pass. Storybook stories for the
    page and the picker.
- Checked: the design check passes on the real Settings and Accounts pages. Screenshots at 375 and 1440 px, light and
  dark, of the list open, a search, a picked zloty, a name being changed and the account form's list were looked at.
  They found two things, both fixed: the account form's dropdown turned up over the field's label when there was
  little room below it (now it stays under it and gets shorter), and in dark mode the switch's track had the page's
  colour. The flow was also tried in the Browser pane.
- Test data: the E2E runs made `e2e-…` people on the `dev` database, removed by the cleanup teardown after each run.
  For the screenshots and the Browser-pane check one more test person (`e2e-shots-…@example.com`, with three accounts)
  was made through the API; the cleanup teardown deleted it in the same session. The migration added the
  `report_currency` column on the `dev` database.

**Next**
- Owner: review the F-016 PR. M3 continues with F-018 (quick add).

## 2026-10-31 (plan: I-015)

**Done**
- I-015 (phone pop-ups close with a swipe down and with Back) planned on `plan/i015-sheet-swipe-and-back`, proposed
  priority Medium. Found by the owner while reviewing F-016's prototype: the sheets have a grab handle that can't be
  dragged, and Back leaves the page instead of closing the sheet.
- The owner confirmed the priority and decided the open points: own swipe code in `BottomSheet` (no library), Back
  closes the desktop dialog too, no "Discard changes?" question, built after F-016.
- Test data: none.

**Next**
- Owner: review the planning PR. F-016 is still waiting for the final prototype's approval.

## 2026-10-31 (F-016 final prototype)

**Done**
- The owner chose variant 1 and asked about people whose money is in other currencies. Variant 4 (final) is
  variant 1 with "Another currency" under Hryvnia / US dollar / Euro: the account form's searchable list of NBU
  currencies, the person's own first. Any NBU currency works as the report currency because the total converts
  through the hryvnia (F-017).
- Owner's review: the currency list opened inside the page and used the browser's scroll bar. Now a dropdown over
  the page on the desktop and a sheet on the phone, with I-004's fading scroll bar. The dropdown is as tall as its
  rows, up to 344 px.
- Owner's review: every currency field uses the same list, own currencies first. The account form's Currency
  (F-014) gets the same dropdown and phone sheet; added to the prototype as "Account form: currency", and to F-016's
  scope as one shared component.
- The design check passes; the list, a search, a picked PLN and Couldn't save were looked at at 375 and 1440 px,
  light and dark, and tried in the Browser pane.
- Test data: none.

**Next**
- Owner: approve variant 4 for implementation (and the open points 1, 2 and 4), or ask for changes.

## 2026-10-31 (F-016 design round 1)

**Done**
- F-016 user settings started on `feature/F-016-user-settings`, design only (not approved, no code). It is the last
  M2 item: F-014 and F-015 are done.
  - References: GitHub's theme settings, Actual Budget's settings page, Lunch Money's primary currency, Apple's HIG
    for settings. Mobbin needs a sign-in.
  - 3 prototypes in `prototypes/`:
    - 1, one page with everything in place: currency and theme as segmented choices that save at once, the name
      with its own Save, your total right under the currency;
    - 2, rows with their values that open a sheet (phone) or a dialog (desktop) with Save; the currency choices
      show your total in each;
    - 3, pick by seeing: three cards with your total in each currency, the theme as small pictures of the app.
  - Open points with Claude's proposals in the description file: the theme kept on the device (name and currency on
    the account); the sun / moon button stays; only UAH, USD and EUR; email shown but not changeable.
  - The design check passes on all three (it first found the layouts too tight at 768 px, a small Try again and the
    field's focus ring; all fixed). The screenshots at 375 and 1440 px, light and dark, were looked at, and the
    pop-ups, errors and name editing were tried in the Browser pane.
- Test data: none; nothing was run against the database.

**Next**
- Owner: pick a variant (or a mix) and answer the open points; then the final prototype for approval.

## 2026-10-31 (F-017)

**Done**
- F-017 NBU exchange rates, built on `feature/F-017-exchange-rates` (approved 2026-10-31):
  - Backend:
    - one NBU call brings a day's rates of every account currency, kept in the new `exchange_rates` table;
    - if the day isn't published or the NBU can't be reached, the latest earlier rates are used and marked, and
      never stored under the later day;
    - one call at a time, and a 5-minute pause after a failure;
    - "today" is Kyiv's date;
    - `GET /api/accounts/total` gives the total.
  - Accounts page: "In total, in UAH" as in F-014's final prototype, with the rates and their date, notes for
    earlier rates and no rates, a skeleton while loading, and the count up or down after a change.
  - Tests: backend unit tests (conversion, the total, the NBU client, the service with the NBU faked, Kyiv's date),
    frontend unit tests, Storybook stories for every state, and the accounts E2E test.
  - CI's E2E run asks an NBU stub with fixed rates. Locally the real NBU is asked, so stub rates never land in the
    `dev` database.
  - ADR 0019; ARCHITECTURE "Exchange rates" updated.
- Checked:
  - Storybook screenshots of every state at 375 and 1440 px, light and dark. They turned up one fix: the info icon
    now stays on the first line when the note wraps on the phone.
  - The real app in the Browser pane with the real NBU: 12 000 ₴ + $500 gave 34 765 ₴ at $1 = 45.53 ₴, matching the
    NBU's 45.5293 for 31 Oct.
- Test data:
  - The E2E runs made `e2e-…` accounts on the `dev` database; the cleanup teardown removed them.
  - The Browser-pane check added two accounts to the tests' admin; both were deleted in the same session.
  - The `dev` database keeps the real NBU rates it fetched; they are a cache, not test data.

**Next**
- Owner: review the F-017 PR. F-018 (quick add) is next in M3.

## 2026-10-31 (F-015 build)

**Done**
- F-015 categories view built on `feature/F-015-categories-view`. The owner approved variant 7 on 2026-10-31
  (recorded in the description file and DESIGN_RULES "Screen decisions" before any code):
  - API: `GET /api/categories`, the person's groups and categories in the report's order, archived categories left
    out. No migration.
  - Menu: Categories after Reports (under More on the phone).
  - Page: below 1200 px every group as tags, with Collapse all / Expand all. From 1200 px the list of groups and the
    picked group's tags. Loading, Couldn't load and Empty states.
  - Owner's review after trying it locally: on the phone and tablet every group starts folded except the one open on
    the desktop (Income at first), and several can be open; the desktop shows one. Both layouts share the open
    groups, remembered on the device. The E2E specs now find the More button by its exact name ("… and 6 more" in a
    folded group matched it too).
  - Decision: the wide layout starts at Mantine's `lg` (1200 px) and not the prototype's 1100 px, to keep to the
    theme's breakpoints.
  - New theme tokens for income and tags.
- Checked after the review change: backend 209 tests, frontend 121 unit tests, lint, format, build and 44 E2E tests
  (phone and desktop) pass. The screenshots at 375, 834 and 1440 px, light and dark, were looked at, including the
  phone after a group was picked on the desktop. Folding was tried in the Browser pane.
- Test data: the E2E runs and the two screenshot runs made `e2e-…@example.com` people on the `dev` database; the
  cleanup teardown deleted them all, the screenshot people included. Nothing was made by hand.

**Next**
- Owner: review the F-015 PR.
- Then F-016 (user settings) or F-017 (NBU rates).

## 2026-10-31 (F-015 design round 1)

**Done**
- F-015 categories view started on `feature/F-015-categories-view`, design only (not approved, no code):
  - References: Actual Budget, Lunch Money, Copilot Money, YNAB, Money Lover, and the owners' own sheet. Mobbin needs
    a sign-in.
  - 3 prototypes in `prototypes/`:
    - 1, the sheet's first column, as its own menu item;
    - 2, folded groups inside Settings;
    - 3, an index of tags, as its own menu item.
  - The design check passes on all three, and the screenshots and key states were looked at (details in the
    description file).
- Round 2: the owner liked variant 2 (in Settings) but not its folding groups on the phone and tablet or its
  two-column list on the desktop. Variants 4–6 keep variant 2's place and desktop list of groups:
  - 4, a group opens on its own screen; a panel on the desktop;
  - 5, every group with tags on the phone; tags on the desktop;
  - 6, one list with a sticky index of groups.

  The design check passes on all three, and the screenshots and the tablet were looked at.

- Round 3: the owner liked variant 5 and asked for groups that collapse and expand, and Categories in the main menu.
  Variant 7 does both (folding on the phone and tablet; the desktop keeps variant 5's list and tags). The design
  check passes, and the screenshots and the folding were looked at. Then, at the owner's request, no + or − next to
  groups (they look like list markers); the words say the kind.
- Test data: none; nothing was run against the database.

**Next**
- Owner: approve variant 7 for implementation, or ask for changes (approved the same day, see "F-015 build").

## 2026-10-31 (I-014)

**Done**
- I-014 faster, steadier tests on the owner's laptop, built on `improvement/I-014-faster-local-tests` (approved
  2026-10-31):
  - Unit tests: Vitest on 4 workers (was 7), isolation kept; the People "200 people" test queries by label and has a
    15 s timeout. 3 runs in a row pass in 23–26 s; before, it timed out in about half the runs.
  - E2E: `setup` opens the app once before the tests run in parallel, and 3 local workers (was 4). From a cold start
    (Vite's cache cleared): 3 of 3 runs pass in 58–59 s at about 40% CPU; before, 1 min 50 s with 4 timeouts and the
    CPU at 100%.
  - `CLAUDE.md`: while working on a change, run only the affected tests; every suite once before the commit and
    push; a suite longer than a minute runs in the background.
  - The measurements behind each choice are in the description file. No ADR: the Vitest pool and isolation are
    unchanged.
- Test data: the E2E runs (6 to compare worker counts, 3 to check) made `e2e-…` accounts and `E2E` invite links on
  the `dev` database; the cleanup teardown removed them after every run. Nothing was made by hand.

**Next**
- Owner: review the I-014 PR.

## 2026-10-31 (plan: I-014)

**Done**
- I-014 (faster, steadier tests on the owner's laptop) planned on `plan/i014-faster-local-tests`, priority High.
  Found by the owner: I-011 took almost an hour, looked stuck and loaded the computer.
- Measured every suite on `develop`: backend 25 s; frontend unit 1 min 45 s, with the People "200 people" test
  timing out at 5 s; E2E 1 min 50 s from a cold start with 4 `page.goto` timeouts, 52 s and all passing once warm.
  Details and the likely causes are in the description file.
- Test data: the two E2E runs made `e2e-…` accounts on the `dev` database; the cleanup teardown removed them after
  each run. Nothing was made by hand.

**Next**
- Owner: confirm the priority, review the planning PR, and approve I-014 before it is built.

## 2026-10-30 (I-011)

**Done**
- I-011 delete an account for good, built on `improvement/I-011-delete-account-permanently`:
  - Design round: references (YNAB, Actual Budget, BudgetBakers Wallet, GitHub, NN/g; Mobbin needs a sign-in) and
    3 prototypes on F-014's final one. The owner chose variant 3 and approved it on 2026-10-30, after the
    "only accounts without transactions" rule was added to it.
  - API: `DELETE /api/accounts/{id}` (204, or 404 for someone else's account); own sources and banks stay.
  - UI:
    - the edit form ends with "Archive or delete";
    - its buttons are only Cancel and Save;
    - Delete asks for the account's name, says how much money is still on it, and shows "Keep it" and a red
      "Delete for good";
    - Archived rows have Delete next to Restore;
    - after deleting, a notification shows and the total counts down.
  - Tests: controller tests, frontend unit tests, Storybook stories, and an E2E test (desktop and phone).
  - Checked in Playwright screenshots at 375 and 1440 px, light and dark, and by hand in the Browser pane. That
    found two misses, both fixed: Delete was charcoal instead of red, and the name field didn't take the focus.
- Test data: the E2E and screenshot runs made `e2e-…@example.com` people on the `dev` database; the cleanup teardown
  removed them after every run.
- Not caused by this change, but seen while testing:
  - the People test "picks at most 200 people at a time" times out at 5 s on this machine (about 8 s alone, on
    `develop` too);
  - `auth.spec`'s sign-in test failed once with "That didn't go through" and passed 6 of 6 reruns.

**Decisions**
- Only an account without transactions can be deleted (owner); F-018 adds the check once transactions exist (noted
  in F-018).

**Next**
- Owner: review the I-011 PR.

## 2026-10-30 (I-012 built)

**Done**
- I-012 (less space between a pop-up's title and its content) built on `improvement/I-012-dialog-title-spacing`,
  as approved (round 3 of the before / after page), in the shared `ResponsiveDialog` and `BottomSheet` styles:
  - desktop dialog: title → content 20 px (was 49), content → buttons 20 px (was 24); the title's line 28 px, the
    title row without bottom padding and with 16 px on the right (Mantine's 15), the body 12 px on top, the footer
    12 px on top;
  - phone sheet: 16 / 16 px (was 23 / 20); no 60 px minimum for the title row, the body 8 px on top, the footer 8 px
    on top;
  - Add transaction on the desktop uses `ResponsiveDialog` instead of its own `Modal` (its stylesheet is gone).
- Two details the build turned up, inside the approved spacing: the first thing in a pop-up's content has no top
  margin (New invite link, Block and Delete had 10–16 px of their own, which made 30–36 px under the title), and the
  More sheet (no title) keeps its 4 px under the grab handle.
- Checked: every pop-up (shared dialog short and long, scrolled; account form; Archive; New invite link; Block;
  Delete; Add transaction; More) measured and screenshotted in Storybook at 375 and 1440 px, light and dark, and
  the screenshots looked at.
- E2E: "a dialog taller than the window scrolls inside itself" now uses a 280 px tall window (was 320): with the
  tighter spacing the New invite link dialog fits in 320 px on the desktop. All E2E tests pass (40, 2 skipped).
- Unit tests: 7 auth, invite and People page tests time out at 5 s on this machine, on `develop` too without this
  change; they pass alone. Typecheck, lint, Prettier and the build pass.
- Test data: the E2E runs made `e2e-…` accounts and `E2E` invite links on the `dev` database; their `cleanup`
  teardown removed them after every run. Nothing was made by hand.

**Next**
- Owner: review the PR.

## 2026-10-30 (plan: drop I-010)

**Done**
- I-010 (run every Storybook story in CI) dropped by the owner before it was built, on `plan/drop-i010`: running
  the stories takes too long (all ~112 stories headless took ~10 minutes while building I-012), so stories are no
  longer run as tests, neither during development nor in CI. Stories are still written, play functions included;
  CI keeps `build-storybook`.
- New status `Dropped`: the row and the folder stay, the ID isn't reused (BACKLOG, changes/README).
- I-012 paused: its frontend code was reverted; its approved plan and before / after page are committed on
  `improvement/I-012-dialog-title-spacing` (status stays `In progress`).

**Next**
- Owner: review the planning PR.

## 2026-10-30 (plan: Storybook stories in CI)

**Done**
- I-010 planned (not built) on the planning branch `plan/storybook-tests-in-ci`: run every Storybook story in CI —
  its play function and an axe scan — so a failing story or an accessibility violation fails the build. Today CI
  only builds Storybook. Prompted by F-014, where running every story by hand after calling the change ready found
  a real UI gap. Proposed priority High.
- The plan compares the Vitest addon (`@storybook/addon-vitest`, recommended: no running Storybook, fits the Vitest 5
  already here, Storybook's own advice for Vite projects) with the test runner (`@storybook/test-runner`, superseded);
  `a11y.test` goes from `'todo'` to `'error'`; the page-level axe rules `landmark-one-main` and `page-has-heading-one`
  are off for stories by default and on again for whole screens; every story runs in light and dark; a new
  `npm run test:stories`; two steps in the Frontend CI job, estimated at ~1 more minute.

**Next**
- Owner: confirm the priority, review the planning PR, and approve I-010 before it is built on
  `improvement/I-010-storybook-tests-in-ci`.

## 2026-10-30 (plan: F-014 follow-ups)

**Done**
- Owner's findings while testing F-014, planned (not built) on `plan/f014-follow-ups`; each will be built on its own
  branch after approval:
  - I-011 delete an account (card, cash) permanently, not only archive it (🎨, Medium). Open points with Claude's
    proposals: Delete on an archived account next to Restore; once F-018 brings transactions, deleting takes them
    (and whole transfers) along, with the name typed to confirm. Built after F-014 is merged.
  - I-012 less space between a pop-up's title and its content, for all pop-ups (Medium). Measured: 49 px on the
    desktop dialog; the likely cause is the I-004 scroll area around the body, which brings Mantine's top padding
    back. One before / after page for approval instead of 3 variants.
- The third finding (a zero opening balance should clear when the field is focused) is fixed in F-014 itself, on
  its branch.
- Added the same day: I-013 suggest banks from the NBU's list instead of a list in the app (Low, after F-017). F-014
  keeps a fixed list, the owner's: Credit Agricole, Izibank, Sense Bank and ProCredit Bank are removed there.

**Next**
- Owner: confirm the three priorities (Medium, Medium, Low) and review the planning PR.

## 2026-10-30 (8)

**Done**
- F-014, owner's review: **no cents**. Amounts are whole units everywhere in the app (`48 211 ₴`, `$1 240`,
  `−4 312 ₴`). The owner's answers: typed cents are rounded when saved, for the whole app, .50 away from zero.
  - API: `Money.Whole` (Domain) rounds the opening balance when an account is saved; the validator takes any amount
    in range. Migration `RoundOpeningBalances` rounds balances saved with cents before (test databases only).
  - App: `formatMoney` shows whole amounts; amount fields read cents and show the whole amount once they lose the
    focus (`1240,50` → `1241`); the field starts at `0`.
  - Recorded: ADR 0018, a DESIGN_RULES custom rule and §5, ARCHITECTURE, the F-014 description.
- The longest accounts page test ("adds the first account", about 2 s on its own) gets a 10 s limit; a busy
  machine had pushed it past 5 s.
- Checked:
  - backend build and tests (201, 6 new);
  - lint, format, typecheck, build, Storybook build;
  - unit tests (110), with only the older invite page and People "200 people" tests past their 5 s limit, as before;
  - all 25 stories headless (steps, axe, screenshots);
  - the field rounding watched in the Browser pane (Storybook: `1240,50` → `1241`);
  - E2E 40 passed, 2 skipped;
  - the design check of the real page with amounts sent with cents (stored and shown whole), with screenshots at
    375 and 1440 px, light and dark, looked at.
- Noted: with Storybook's dev server running as well, a full unit run had 7 tests past 5 s; with it stopped, only
  the usual 2.
- Test data: one `e2e-design-…@example.com` person with sample accounts for the design check, deleted through the
  admin API afterwards; only the owner's account and the tests' admin are left in `dev`.

## 2026-10-30 (7)

**Done**
- F-014, owner's review: Credit Agricole, Izibank, Sense Bank and ProCredit Bank removed from the suggested banks
  (9 are left). Taking the banks from the NBU instead is planned as I-013 (after F-017) on `plan/f014-follow-ups`.
- The accounts page test waits longer for the first render (up to 4 s): it had failed twice as the first test of its
  file in a busy full run, at 1.6 and 2.1 s; it then passed in three full runs.
- Checked: lint, format, typecheck, build; unit tests (accounts 22 in every run; the full suite three times, only the
  older invite page and People "200 people" tests passing the 5 s limit, as before); all 25 stories headless (steps,
  axe, screenshots); the suggestions watched in the Browser pane (Storybook, first visit); E2E 40 passed, 2 skipped.
  Backend unchanged; not rerun.
- Test data: none created by hand; the E2E clean-up removed the tests' own accounts.

## 2026-10-30 (6)

**Done**
- F-014, owner's review: a zero opening balance (a new account, or an edited one at 0.00) clears when its field
  takes the focus; left empty, it shows 0.00 again and counts as 0. The other two findings are planned on
  `plan/f014-follow-ups`: I-011 delete an account permanently, I-012 less space under a pop-up's title.
- Checked: lint, format, typecheck, build, Storybook build; the accounts unit tests (22, 3 new) three runs in a row;
  all 25 stories run headless (steps, axe, screenshots), the 20 page stories with no issues; the focus fix watched in
  the Browser pane (Storybook, phone); E2E 39 passed and 2 skipped in the full run, and the sign-in and accounts
  specs twice more, all passed.
- Not green on this machine, unchanged by F-014: in a full unit run with the dev servers up, two to nine older
  tests (sign-up, invite page, People "200 people") pass the 5 s limit; one sign-in E2E test failed once on the
  phone and passed on both reruns (also seen in I-004). The accounts page test failed once in that heavy run and
  passed in every run after.
- Backend unchanged since its last green run (195 tests); not rerun.
- Test data: none created by hand; the E2E clean-up removed the tests' own accounts.

**Next**
- Owner: review the F-014 PR and the planning PR (I-011, I-012).

## 2026-10-30 (5)

**Done**
- F-014 Accounts and balances built on `feature/F-014-accounts`, as approved (final prototype `variant-10.html`,
  without the "In total, in UAH" line, which comes with F-017):
  - backend: accounts, the person's own sources and banks, any NBU currency, card styles, archive and restore;
    balances and totals per currency from `BalanceSheet`; `/api/accounts`; migration `AddAccounts`;
  - frontend: the Accounts page with the Currency / Source switch, "In total" per currency, cards in four styles
    with a ghost card per group, archived accounts with Restore, and the account form (card preview with the
    styles, searchable currency list, sources and banks as pills, typed ones with suggestions).
  - Small choices within the design, listed in the description: Archive turns the edit dialog into the question
    (no second dialog); with no banks yet the bank's name field shows right away; "Add account" waits for the
    accounts to load; Escape in the currency list closes only the list.
- Checked: backend build and tests (195), frontend lint, typecheck, build, Storybook build, unit tests (104: 19
  for the page and form, 17 for money), E2E 40 passed and 2 skipped (1 new test, desktop and phone), the design
  check of the real page (no issues of its own; the sidebar's resize handle overlapping the nav by 4 px shows on
  every page, from the app shell), screenshots at 375 and 1440 px, light and dark, looked at, and the form, currency
  list, archive and restore tried in the browser.
- Owner asked whether everything was tested with all the tools. Added: every new Storybook story run headless (its
  steps, an axe scan, a screenshot looked at). It found the form's mistakes too quiet: the field didn't turn red and
  the hint stayed above the message. Fixed to the sign-in fields' style (red border, alert icon, the message in the
  hint's place), and the focus now goes to the first field with a mistake. The 20 page stories pass with no axe issues;
  the 5 card stories only get the page-level rules every component story gets (no main landmark, no h1). CI green.
- Noted, not changed: on this machine, with the API and Vite running, two existing unit tests (People "picks at most
  200 people", invite page "creates the account with the link") sometimes pass the 5 s limit in a full run; both
  pass on their own, and the second also fails without F-014's tests.
- Test data: two people made for checking by hand (`e2e-manual-…` and `e2e-design-…@example.com`, with their
  accounts) and their two invite links (used). The E2E clean-up deleted both people with their data; afterwards the
  `dev` database had only the owner's account and the tests' admin, and no waiting test links.

**Decisions**
- ADR 0017: Cash and Bank are built in (named by the app), own sources and banks are personal rows found by name,
  currencies are ISO codes listed once in the Domain, balances are worked out, never stored.

**Next**
- Owner: review the F-014 PR.
- Then F-015 (categories view) or F-017 (NBU rates, with the "In total, in UAH" line).

## 2026-10-30 (4)

**Done**
- F-014 approved by the owner: the design (final prototype `variant-10.html`) and the build. Recorded in the
  description (`Approved` row) and in DESIGN_RULES "Screen decisions", with a new custom rule: names of card styles
  fit both themes.
- Owner's choice: F-014 is built first. The "In total, in UAH" line, which needs NBU rates, moves to F-017. F-017's
  acceptance criteria now include it, using F-014's final prototype as its design.

**Next**
- Build F-014: backend (accounts, sources, banks, balances, API), then the Accounts page.

## 2026-10-30 (3)

**Done**
- F-014, the owner's feedback: the card style names must fit both themes. Renamed in the final prototype: Black →
  Solid (charcoal in light mode, light grey in dark mode), Sky → Tinted; Envelope and Plain stay. The description
  and the screenshots are updated. Checked: the design check (0 issues), the edit dialog in light and dark.

**Next**
- Owner: approve the final prototype for implementation, and choose how the NBU rates come (F-017 first, or F-014
  fetches today's rates).

## 2026-10-30 (2)

**Done**
- F-014, the owner's choice: variant 9 with the preview, with the style next to the preview. Also back in F-014:
  the total of all accounts in the report currency at NBU rates. This had been moved to F-017 on 2026-10-29;
  F-017's description now says so.
- The final prototype `variant-10.html`:
  - the card preview with four style tiles right under it, at the top of the form;
  - "In total" led by everything in UAH at today's NBU rates, with the rates and their date, then each currency;
  - when today's rates are missing, the earlier ones are used and the line says so;
  - on the phone: a smaller preview, and Archive and Cancel side by side, so the styles stay in view.
- Checked: the design check (0 issues), screenshots of every screen at 375, 834 and 1440 px, light and dark.
  No code written: the change isn't approved yet.

**Next**
- Owner: approve the final prototype for implementation, and choose how the NBU rates come: F-017 first, or
  F-014 fetches today's rates.

## 2026-10-30

**Done**
- F-014, the owner's feedback on round 2, recorded in the description:
  - an X on every pop-up;
  - variant 6 out;
  - variant 2's card styles wanted, picked per account, on variant 4's layout (group switch, ghost card);
  - a bug: the currency search drew a second outline when focused;
  - "In total" asked for when grouped by currency.
- Design round 3: variants 7 · Style thumbnails, 8 · Flip the card, 9 · Preview and named styles. All three share
  the same list, form and fixes:
  - card styles from variant 2: Black (light grey in dark mode), Sky, Envelope and Plain;
  - a new account takes its source's style (Bank black, Cash envelope) until one is picked;
  - "In total" in both groupings;
  - an X on the dialogs, the More sheet and the currency list;
  - one focus border on the search (and no second, browser-drawn clear button);
  - the ghost card dashed in accent blue.
- Checked: the design check (0 issues), screenshots at 375, 834 and 1440 px, light and dark, looked at and zoomed
  into the style pickers. Found and fixed in the checks: variant 9's style drawings lost their shape inside the
  pills. No code written: the change isn't approved yet.

**Next**
- Owner: pick the style picker (7, 8 or 9) and answer whether "Black" keeps its name in dark mode. Then the final
  prototype goes to the owner for approval.

## 2026-10-29 (12)

**Done**
- F-014, the owner's feedback on round 1, recorded in the description with new acceptance criteria:
  - any NBU currency;
  - personal sources: Cash and Bank by default, own sources can be added;
  - personal banks under Bank, typed in the form and remembered;
  - a Currency / Source group switch;
  - an add button for each group;
  - an archived balance shown, muted, only when it isn't zero.

  Variant 1's table is dropped.
- Design round 2: three card variants:
  - 4 · Paper cards: every card the same, a ghost card adds to its group;
  - 5 · Your colors: six colors to pick, each with a dark-mode version; "+ Add" in the group heading;
  - 6 · Charcoal columns: all cards charcoal, light in dark mode; a column per group with an add link under it.

  Answered in the description: why Monobank's cards were black, and how dark cards turn around in dark mode.
- Checked: the design check (0 issues), screenshots of every state at 375, 834 and 1440 px, light and dark. The
  tablet now shows two cards per row, and no text overlaps. No code written: the change isn't approved yet.

**Next**
- Owner: pick a variant or a mix for the final prototype.

## 2026-10-29 (11)

**Done**
- F-014 Accounts and balances started on `feature/F-014-accounts` (M2 is now in progress).
- Owner's choice: the list shows a total per currency for now. The single total in the report currency needs NBU
  rates and moves to F-017.
- Design round 1: references (Actual Budget, YNAB, Copilot Money, Spendee, Monefy; Mobbin answered 403), a brief
  and 3 prototypes: 1 · Ledger (a table grouped by currency, double-ruled total rows), 2 · Wallet (bank-card tiles
  grouped by bank, totals on a charcoal band), 3 · Currency columns (one column per currency, its total large on
  top). Each covers the list, first visit, loading, error, new / edit / archive, archived and the moment after
  adding.
- Checked: the design check (0 issues, 0 console errors), screenshots of every state at 375 and 1440 px, light
  and dark, looked at. No code written: the change isn't approved yet.

**Next**
- Owner: pick a variant (or a mix) and answer the open points in the F-014 description (archived accounts leave
  the totals, restore, currency fixed once there are transactions, no delete). Then the final prototype goes to the
  owner for approval.

## 2026-10-29 (10)

**Done**
- I-004 custom scroll bars, on `improvement/I-004-custom-scroll-bars`:
  - design round 1: references (Mantine ScrollArea and Modal, Material 3 dialogs and sheets, Apple HIG scroll
    views, Radix) and 3 prototypes: 1 · Quiet pill, 2 · Shows while you scroll, 3 · Sky rail;
  - round 2: the owner picked variant 2, built as the final prototype `variant-4.html` with the owner's answers:
    the page keeps the browser's own bar; a long dialog keeps its buttons pinned at the bottom, with no line over
    them (the bottom fade is enough); the pointer stays an arrow on the bar, as on every scroll bar;
  - approved by the owner ("Approved, build it") and built: a shared `FadingScrollArea` (Mantine ScrollArea that
    shows its bar while scrolling or under the mouse and fades the edges with more behind them), the bar's look once
    in the theme, a pinned `footer` slot in `ResponsiveDialog` and `BottomSheet` (the People dialogs use it), and
    the sidebar's sections scroll in a low window. The app shell's grid row now follows the window's height (a low
    window cut off the bottom of the sidebar before).
- Checked: lint, typecheck, build, unit tests 68 (4 new), E2E 38 passed locally (1 new, desktop and phone; the
  clean-up removed the test data), screenshots at 375 and 1440 px, light and dark, looked at.
- Noted, not changed: in Storybook the People stories show the phone sheet 16 px to the right (the same on
  `develop`; the app is fine). One E2E sign-in test failed once locally and passed when run again.

**Next**
- Owner: review the I-004 PR.

## 2026-10-29 (9)

**Done**
- I-007, approved by the owner's request (docs only): a "Clean up test data" rule in `CLAUDE.md`. Accounts and
  data made for testing (by hand, through the API, or by E2E tests against the shared `dev` database) are removed
  in the same session through the People page or `POST /api/admin/people/delete`; test invite links are cancelled
  until I-006 lets us delete them. The owner's own account and data are never touched. The PROGRESS entry says
  what was removed. Also a definition-of-done item and a PR template checklist item.
- I-008 closed without changes: the owner tested on production and clicks respond fine there; the delay was seen
  on localhost (development build).
- I-007, E2E clean-up (added and approved by the owner the same day): a `cleanup` teardown project runs after every
  E2E run, passed or failed. Signed in as the tests' admin, it deletes the accounts whose emails match `newPerson`'s
  `e2e-…@example.com` pattern and cancels the tests' waiting invite links. The tests' admin stays (an admin can't
  delete themselves; every run reuses it). The People test's link note is now `E2E for Olena`, so the clean-up
  recognises it.
- Checked against the `dev` database: two full runs (36 passed, 2 skipped) and one run with the People test made to
  fail on purpose. After each, only the owner's account and the tests' admin were left, and no test link was
  waiting. Lint, typecheck, unit tests (64) pass. The unit tests need Node 24 (the shell's Node 20 can't start
  Vitest's workers).
- Test data from this change: E2E accounts and links, all removed by the clean-up itself. Left on purpose: the tests'
  admin `e2e-admin@example.com` (created by the first run). 18 waiting links made before this change (12 "For
  Petro", 3 "For Olena", 3 without a note), which the clean-up doesn't recognise, were cancelled at the owner's
  request; `dev` has no waiting links left. They can be deleted once I-006 is built.

**Next**
- Owner: review and merge PR #27.
- Then I-004, I-005, I-006 prototypes, or F-014 (accounts and balances).

## 2026-10-29 (8)

**Done**
- Owner's findings after F-028, planned (not built) on the planning branch `plan/f028-follow-ups`; each will be
  built on its own branch after approval:
  - I-004 custom scroll bars, a dialog scrolls inside itself (🎨, Medium);
  - I-005 pages on the People list, "Select all" picks the current page (🎨, Medium);
  - I-006 delete used, expired and cancelled invite links, one or many, and auto-delete them 30 days after they
    stop being usable, showing the date, by a cron job every morning (🎨, Medium; the 30 days and the morning
    cron job are the owner's answers);
  - I-007 remove test accounts and data after tests (docs, High; approved by the request);
  - I-008 instant response to clicks on check boxes and dialog buttons (High).
- I-009, owner's request, done: planning-only branches. A list of changes the owner only wants in the backlog is
  planned on one `plan/<short-name>` branch that carries only docs; the PR is titled `Plan: …`, the changes stay
  `Todo`. In `CLAUDE.md` (how we work, git workflow, PR hand-off), `docs/changes/README.md` and the PR template.
- Owner's question: are the F-028 dialogs the design library's own? They are Mantine components with Pup styles on
  top, through the shared `ResponsiveDialog`: on desktop a Mantine `Modal` (radius `xl` = 24 px, width 480, padding
  `lg`, the title in the display font, weight 300, 20 px); on the phone the shared `BottomSheet`, built from
  Mantine's `Drawer` parts with its own CSS (height of its content up to 90 % of the screen, rounded top, grab
  handle, own header and body padding, surface color). Mantine's open/close transitions are left at their
  defaults.

**Next**
- Owner: confirm the priorities and review the planning PR. Then, each on its own branch: I-007 (docs), I-008
  (measure, then root cause for approval), and the prototypes for I-004, I-005 and I-006.

## 2026-10-29 (7)

**Done**
- F-028, found by the owner testing on localhost: bulk delete of 201 people failed with a 400 (the API takes at
  most 200) and a misleading "Try again in a moment". Fixed as approved:
  - Pick all shown stops at 200, the rest of the check boxes are disabled, and the bar says "That's the most at
    once";
  - a refused request says "Pick at most 200 people at a time.";
  - disabled check boxes now look grey.
- Flaky menu unit tests fixed (approved): Mantine's transitions are off in unit tests (`env="test"`). The flake
  noted in F-028 is gone: 64 tests passed in 10 runs out of 10.
- The dev database was cleaned by the owner through the People page: only the owner's account is left.
- `develop` (with I-003) merged into the branch.
- Checked: lint, typecheck, build, unit tests 64 (2 new), the "People at max" stories at 375 and 1440 px, light and
  dark. E2E ran in CI, not locally (it would add test accounts to the cleaned dev database).

**Next**
- Owner: merge PR #23; set `Access__AdminEmails__0` on Render before the release; release `develop` → `main`.

## 2026-10-29 (6)

**Done**
- Owner's request: I-003 "Owner approval before implementation" (priority High). Claude writes no backend or
  frontend code for a change until the owner has explicitly approved it: the description file and, for screens,
  the final prototype (for a bugfix: the root cause and the planned fix). Picking options in a design round is not
  approval. The approval date goes into a new `Approved` row of the description file. The rule is in
  `CLAUDE.md`, `docs/changes/README.md`, `DESIGN_RULES.md`, the `design-screen` skill and the PR template.
- Why: F-028's screens and backend were built from variant 7 before the owner had seen it. The owner has since
  approved variant 7 (2026-10-29); F-028's description records that on its branch.

**Next**
- Owner: review the I-003 PR and PR #23 (F-028).

## 2026-10-29 (5)

**Done**
- F-028: the owner approved variant 7 and the build. The approval came after the build: variant 7 had been
  recorded as chosen and built without being shown first. Recorded in the description (`Approved` row) and in
  DESIGN_RULES "Screen decisions". The rule that prevents this from now on is I-003 (PR #24).

**Next**
- Owner: review PR #23 again; after the release set `Access__AdminEmails__0` on Render and look through the
  "Before invites" accounts.

## 2026-10-29 (4)

**Done**
- F-028 review of the People tab (owner's comments on PR #23):
  - check boxes show only on hover: in their own column left of the initials, shown on hover or keyboard focus
    and on every row once anyone is picked; always shown on the phone (no hover there). The owner turned down a
    first try that put the box in place of the initials;
  - card side paddings: the check box and the ⋯ now sit 16–20 px from the card's edges (the initials were 6 px
    from the left edge); empty check boxes have the fields' border, so they show in dark mode;
  - the check box is 12 px from the initials, the same as the initials from the name;
  - sorting: Person, Joined and Invited with headers on the desktop (a second click turns the order around),
    a Sort menu on the phone;
  - "Block…" and "Delete account…" lost the "…" (a new custom rule in DESIGN_RULES).
- Prototype variant 7 updated to match: check boxes on the left, shown on hover, sort headers and the phone's Sort menu
  (a new screen "Sorted: newest first"), menu items without "…".
- Design check on the app (it now opens pages of the running app too, with `--storage` for signed-in pages):
  - Check boxes are themed once (`theme.ts`): a rounded square in the accent; the md radius had made them circles
    and the primary color made them charcoal, unlike the prototype;
  - every field in focus has the sign-in fields' 2 px accent border, set once in the theme (Mantine alone only
    changed the border color); a first try with the buttons' offset ring made a double ring and was dropped;
  - Cancel link is 44 px tall on the phone;
  - the sidebar's resize line no longer fades in when reduced motion is on;
  - the check itself: a check box inside its label counts the label as the target, and screen-reader-only text
    is skipped.
- People columns come by the list's own width (a container query, 720 px): on a tablet next to the sidebar they
  ran into each other, so there the list keeps the phone's card rows; Joined is a little wider for "Blocked <date>".
- The search field has no visible label (owner's request); screen readers still hear "Search people". The count
  moved into the field and shows only while searching ("2 of 9"): the tab already has the total.
- Variant 7: Copy on a new link no longer makes the card jump (it redrew the dialog and replayed the card's
  entrance; now only the button changes). The app was not affected.
- Used, expired and cancelled links are cards with icons, like Waiting, and the lines between the link groups are
  gone (owner's requests).
- Variant 7 matched to the app: Mantine's check and dash icons centered in the box, the primary-color focus ring on
  buttons, the accent border on fields (drawn by the search box, no ring on the input inside), the link cards with
  icons, no lines between groups, "Cancel link" without a gap.
- Q-012 answered: accounts made before invites keep access; the admin reviews them on the People page after the
  release.
- Checked: unit tests (2 new for sorting), E2E (35 passed, 2 skipped), the design check on variant 7 and on the
  app's People pages (0 issues), screenshots at 375 and 1440 px,
  light and dark, of the hover, picked, sorted and menu states.

**Next**
- Owner: review PR #23 again; after the release set `Access__AdminEmails__0` on Render and look through the
  "Before invites" accounts.

## 2026-10-29 (3)

**Done**
- F-028 built (same branch and PR as the plan); M1 is done again.
  - **Backend:** `Invitation` (hashed token, 7 days, once, cancel), invite-only `register` and first Google
    sign-in, the admin from `Access:AdminEmails`, `/api/admin/people` (list, block, unblock, delete, in bulk) and
    `/api/admin/invitations`, `/api/invitations/{token}` for the invite page, `/api/auth/sign-up`. Blocking ends
    cookies within a minute; deletion removes the account's data. Migration `AddInvitations` (join dates of
    existing accounts from their UUIDv7 ids).
  - **Frontend:** `/invite/:token`, the invite-only Create account, Google and blocked messages, the People page
    (underline tabs, search, card rows with check boxes and a ⋯ menu, a bar for bulk Block / Delete, folded link
    groups, the New invite link dialog with Copy / Share), People in the sidebar and under More for the admin.
  - **Tests:** backend 161 (65 new), frontend unit 60 (17 new), E2E 35 passed, 2 skipped (an E2E admin and invite
    links for every new account); Storybook stories for both screens.
- Checked: screenshots of every screen at 375 and 1440 px, light and dark, looked at; the People page in the
  browser pane with the local test admin. Five visual fixes on the way (see the description).

**Decisions**
- ADR 0016: hashed invite links, the admin from configuration (password sign-up of an admin email only in
  Development), blocking via the security stamp checked every minute, no sign-in method shown.

**Next**
- Owner: review PR #23; after the release set `Access__AdminEmails__0` on Render; confirm Q-012.
- I-002 (corners across the app) is proposed as its own change. Then M2: F-014.

## 2026-10-29 (2)

**Done**
- F-028 started on its planning branch and PR (owner's request): five references and three HTML prototypes
  (Guest list, Receipt, Pocket) covering the invite page, a broken link, Create account without a link, Google
  without an account, and the People page with a new link, block and delete. Design check 0 issues; screenshots
  at 375 and 1440 px, light and dark, looked at.
- Product: sign-up is described as invite-only while the app is for family and friends.

**Decisions**
- The invite link is shown only once (only its hash is stored); a broken link never says who made it.

- Round 2 on the owner's feedback: variant 4 mixes variant 1's sign-in screens, variant 2's pop-up for a new
  link and variant 3's two tabs, with three tab styles and three ways to show people (card rows, table, cards)
  to pick from.

- Round 3: underline tabs chosen; variant 5 adds search for people and a switch that hides expired and cancelled
  links, and offers three people views (card rows, table, compact) and three links views (grouped, card rows,
  table). The F-028 description now has a "Screens and behavior" section and acceptance criteria for search and
  hiding links.

- Round 4: card rows and grouped links chosen. The People page no longer shows how someone signs in (privacy);
  used links are hidden by default too; one corner system (pills for buttons, tabs and nav items, circles for
  icon buttons, 12 px fields and rows, 24 px dialogs), to be applied to the app in I-002. Variant 6 offers three
  ways to reach a person's actions instead of a ⋯ menu and two ways to show old links.

- Design chosen: check boxes for bulk Block / Delete plus a ⋯ menu per row, folded Used and Expired and cancelled
  groups (variant 7, recorded in the description and DESIGN_RULES).

**Next**
- Build F-028: backend, then the frontend.

## 2026-10-29

**Done**
- Owner's request: planned F-028 "Invite-only access" in M1 (priority High). F-011 and F-012 are on `main`, so
  anyone can create an account on production today. The description lists the acceptance criteria and tasks.

**Decisions**
- Owner's choices: one invitation link per person (works once, 7 days, can be cancelled); only the admin invites
  (F-023 family links will also let new people sign up); the admin can block a person or delete their account;
  the admin is the owner, by email, from the `Access:AdminEmails` setting (kept out of the repository).
- Open: Q-012, what happens to accounts that already exist on production (proposal: they keep access).

**Next**
- F-028 before F-014: references and 3 HTML prototypes first.

## 2026-10-28 (7)

**Done**
- F-013 built; M1 is done.
  - **Domain:** the first business entities, `CategoryGroup` and `Category`, and `CategoryKind`.
    `DefaultCategories` is the spreadsheet set in its order.
  - **Database:** `category_groups` and `categories` (kind as text, cascade from the account, unique names per
    person / group). The `AddCategories` migration also gives every existing account the set.
  - **Sign-up:** email sign-up and the first Google sign-in create the account and its categories in one
    transaction (`AccountCreator`).
- Fixed on the way: the Docker build failed with CA1861 in the new migration. The image never got `.editorconfig`,
  which tells the analyzers to skip generated migrations. The Dockerfile now copies it.
- Tests:
  - backend 96 (8 new);
  - E2E 27 passed, 2 skipped against this build. Once, "creates an account, signs out and signs in again"
    stayed on `/transactions` after Sign out on desktop. It passed 3 of 3 on a rerun; watch it if it comes back.
- Checked on the Neon `dev` database:
  - all existing accounts were backfilled;
  - a new sign-up got the set;
  - every account has 7 groups and 33 categories, identical.

**Decisions**
- Owner's choice: the current set, including the owner's own categories, stays the default while only the
  family uses the app. A generic set for other people is open question Q-011 (with M9).
- ADR 0015: seeding in the account's transaction; the backfill is a frozen SQL copy in the migration.

**Next**
- M2: F-014 accounts and balances (🎨 three prototypes first).

## 2026-10-28 (6)

**Done**
- Owner's request: planned F-027 "Delete my account" for after the MVP (M9 — Privacy & categories, priority
  Low). Its description lists the acceptance criteria and four open points with proposals (Q-010).

**Next**
- Nothing changes for the MVP: F-012 is merged (PR #19), F-013 is next.

## 2026-10-28 (5)

**Done**
- F-011 was merged into `develop` (PR #18).
- F-012 built:
  - **Backend:** Google sign-in through Identity external logins. `GET /api/auth/google` sends the person to
    Google, the callback is `/api/auth/google/callback`, and `/api/auth/google/complete` signs them in and
    returns them to the page they wanted. The first sign-in creates the account, or links to the one with the
    same email Google has verified. A cancel or failure comes back to sign in with one message. Without a
    Google client the app still starts.
  - **Frontend:** "or" and "Continue with Google" under the form on sign in and create account (variant 4),
    "Opening Google…" after the click, and the banner for a failed Google sign-in.
  - Render lists the two Google variables; README has the user-secrets commands.
- Fixed on the way: the Vite proxy rewrote the `Host` header, so locally Google would have come back to the
  API's port instead of the app.
- Tests:
  - backend 88 (30 new);
  - frontend unit 43 (3 new);
  - E2E 27 passed, 2 skipped (4 new): the redirect to Google with our callback, and a foreign callback coming
    back with the message;
  - a Storybook story for the Google error.
- Checked: screenshots at 375 and 1440 px, light and dark (sign in, create account, the error, "Opening
  Google…"); axe 0 issues.

**Decisions**
- Owner's choice: Google sign-in links to an existing email-and-password account, removes its password (nobody
  proved the email before) and ends its other sessions.
- ADR 0014: the Google flow, matching and linking, lockout not applying to Google, the proxy keeping `Host`.
- The Google app stays in Testing, with the family as test users: Google publishes it only with a privacy
  policy link, and the app has no such page yet.

**Next**
- Owner has created the Google OAuth client (own project, test users); sets it on Render and checks Google
  sign-in after the release.
- F-013: default categories for every new person, email or Google.

## 2026-10-28 (4)

**Done**
- F-011: owner chose variant 4 (recorded in the F-011 description and `DESIGN_RULES.md`).
- F-011 built:
  - **Backend:** Identity accounts (`users` and the other Identity tables in snake_case, new migration) and
    `/api/auth` me / register / login / logout. Every other endpoint needs a signed-in person. The cookie is
    HTTP-only and lasts 30 days. Antiforgery is a readable cookie plus a header. Errors are neutral
    (ADR 0012), with rate limits per IP and lockout.
  - **Frontend:** the variant 4 sign-in and sign-up pages, a start-up screen while the app asks who is signed
    in, redirects both ways, and the person's name and a working Sign out in the shell.
- Tests:
  - backend 58 (30 new);
  - frontend unit 40 (18 new);
  - E2E 23 passed, 2 skipped. A setup project signs the shell tests in.
  - Storybook stories for the auth screens and the start-up screen.
- Checked in the running app against Neon `dev`: curl through every endpoint; screenshots at 375 and 1440 px in
  light and dark; axe 0 issues.
- Fixed on the way: dark-mode filled buttons had white text on the light button (also "Page not found"); new
  custom design rule.

**Decisions**
- ADR 0013: auth API details: endpoints, fallback policy, cookie, antiforgery filter, length-only passwords,
  lockout, rate limits, table names.
- "Continue with Google" comes with F-012, not as a dead button now.

**Next**
- Owner reviews the F-011 pull request.
- F-012: sign in with Google.

## 2026-10-28 (3)

**Done**
- F-011 started (branch `feature/F-011-email-password-auth`): three sign-in / sign-up prototypes made with the
  `design-screen` skill in the F-010 theme: Ledger page (the form beside a sample of the yearly report),
  Pocket (charcoal page, form docked under the thumb, a pill switch) and Receipt (a paper strip with a torn edge).
  Each shows sign in, create account, their error states, the busy button and the waking-up note.
- References noted in the F-011 description (YNAB, Stripe, Lunch Money, an Eleken roundup). Mobbin's screens need
  an account, so it wasn't used.
- Design check: 0 issues on all three. It first caught a small "Sign in instead" link and inputs without a focus
  outline. Screenshots at 375 and 1440 px, light and dark, were looked at, and they caught the floating
  waking-up pill covering the logo row. It is now a note in the form.

- F-011 round 2, from the owner's feedback (variant 1's layout without the report table, variant 2's colors and
  form, not variant 3): `prototypes/variant-4.html`. Desktop: charcoal brand half and the form half. Phone: a
  charcoal band with the name, and the form card overlapping it. Design check 0 issues; screenshots looked at.
- Variant 4 revised: the tagline "Every hryvnia in its place." removed. A taken email on Create account now gets a
  neutral banner ("We couldn't create an account with this email" + "Sign in with this email") instead of
  saying the account exists; format errors have their own screen in the prototype.
- Variant 4: the desktop line under the name is now "Income, expenses and transfers across all your accounts and
  currencies. Monthly and yearly reports build themselves, for you and your family." (owner's pick of 8). Create
  account got a Confirm password field: without password reset (no email until after the MVP), a typo would
  lock the person out.

**Decisions**
- ADR 0012: no account enumeration. One message for a wrong email or password, a neutral sign-up message for a
  taken email, rate limiting on the auth endpoints per IP. Sign-up moves to "Check your email" once email exists
  (after the MVP).

**Next**
- Owner confirms variant 4 or asks for changes. Then the Identity setup and `/api/auth` endpoints, the forms and
  the protected routes.

## 2026-10-28 (2)

**Done**
- I-001: new working rules from the owner, in `CLAUDE.md`, `docs/changes/README.md`, `docs/DESIGN_RULES.md`,
  the `design-screen` skill and the PR template:
  - the PR is the hand-off: it already marks the change `Done` in all docs; merging is the owner's job, no
    separate "mark done" PR;
  - Playwright check with screenshots looked at before showing design variants and before every UI commit;
  - a reported bug or proposed feature / improvement gets its folder, description and backlog row first;
  - priority `High` / `Medium` / `Low` for improvements, bugfixes and features added later (new backlog column);
  - design starts from references: Mobbin and open examples on the internet — nothing that needs the owner's
    sign-in (banking apps, Claude's UI).
- B-002 closed by the owner: `Done`, priority `Medium`.

**Next**
- F-011: sign up and sign in — first under the new rules (references on Mobbin, Playwright look-check).

## 2026-10-28

**Done**
- B-002: the tab icon on Render was still the Vite template icon. The server sends the new logo; browsers kept
  the old icon cached under the same URL, `/favicon.svg`. The icon links in `index.html` now carry `?v=2`, and
  the smoke E2E test checks that each declared icon URL is versioned and loads the logo.

**Next**
- Release B-002 to `main` and check the tab icon on Render.
- F-011: sign up and sign in; then the shell shows the signed-in person.

## 2026-10-27 (18)

**Done**
- B-001: fixed the flaky unit test "shows nothing when the server answers quickly" that failed CI on `develop`
  after PR #14. It moved the fake clock before the real health check had answered; it now waits for the
  request to finish. The health mock in that test answers after a real 50 ms delay, so the case is checked
  every run.

**Next**
- Merge B-001, then the release `develop` → `main` (PR #13).
- F-011: sign up and sign in; then the shell shows the signed-in person.

## 2026-10-27 (17)

**Done**
- F-010 merged into `develop` (PR #12) and marked Done in its description and the backlog.

**Decisions**
- Owner dropped the F-010 task to compare the sidebar with Claude's UI: it needed a claude.ai sign-in, and the
  chosen logo-as-expand-button pattern already follows it.

**Next**
- Release `develop` → `main` (PR #13).
- F-011: sign up and sign in; then the shell shows the signed-in person.

## 2026-10-27 (16)

**Done**
- F-010: the app shell is built (`frontend/src/app/shell/`). Theme: charcoal and sky, Unbounded + Manrope
  (self-hosted, ADR 0011). Desktop sidebar with the smooth collapse, logo-as-expand button and drag / keyboard
  resize; phone top bar, pill tab bar, More and Add sheets; routes with placeholder pages; the waking-up pill.
- Tests: 22 unit tests, E2E on desktop and phone (12 passed, 2 skipped: device-specific tests), Storybook
  stories. Build without warnings: libraries split into their own chunks.
- Fixed: the API client bypassed MSW in tests (kept `fetch` from start-up).
- Fixed after the owner's testing: icons shrank to dots in the collapsed sidebar (only labels may shrink now);
  More and Add on the phone filled the screen. They are now bottom sheets like the prototype (shared
  `BottomSheet`: grab handle, rounded top, as tall as the content). E2E checks for both.
- Browser icon: the app logo instead of the Vite template icon (SVG, ICO and an iPhone touch icon).

**Next**
- Open the F-010 pull request into `develop`.
- F-011: sign up and sign in; then the shell shows the signed-in person.

## 2026-10-27 (15)

**Done**
- F-010: the sidebar collapse is smooth: only the width animates, and icons, logo and avatar stay on one axis
  (checked frame by frame). Labels fade out, and the collapse button and footer icons fade.
- F-010: 13 new color schemes in `blocks.html` (17 in all), light and dark, within the chosen setup. Each is 8
  colors per mode; the rest is derived. Every text and control pair passes WCAG AA in both modes.

**Decisions**
- Owner picked **charcoal and sky** as the color scheme; recorded in the F-010 description and `DESIGN_RULES.md`.

**Next**
- F-010: theme in `theme.ts`, layout components, routes with placeholder pages, the waking-up pill, Storybook.

## 2026-10-27 (14)

**Done**
- F-010 round 2: three new full directions made with the `design-screen` skill: Ledger, Banknote and Pocket
  (`prototypes/variant-1…3.html`), with a drag-to-resize sidebar that also collapses with an icon button.
- F-010 round 3, at the owner's request (options for every block): `prototypes/blocks.html`, a mix-and-match
  prototype with 14 blocks of 2–4 options each (colors, type, corners, logo; sidebar surface, open-section marker,
  collapse button, desktop Add, sidebar bottom; phone tab bar, top bar, More menu; a whose-money switch; the
  waking-up state). It has new options too: graphite and tangerine colors, Fira Sans, a dark sidebar column, a
  Claude-like logo-as-expand button, and Expense, Income and Transfer as separate Add buttons.
- Design check: tells apart horizontal scrollers (any `overflow-x` container, not only `.table-wrap`) and now
  checks every option of a mix-and-match prototype (`BLOCKS` / `setBlock` / `resetBlocks`). `blocks.html`: 0
  issues. A deliberately undersized button in one option was caught, so the option loop works.

**Decisions**
- Owner chose a mix: ink colors, Unbounded + Manrope, round corners, a coin-stack logo, a tinted sidebar with an
  edge bar marking the open section, the logo as the expand button in the rail, a pill tab bar on the phone, and a
  pill while the server wakes up. Gold logo replaced by copper `#cd8a5c` (pale blue and sage still in the
  prototype to compare). The sidebar's minimum width now fits the whole app name (236 px with Unbounded). Recorded
  in the F-010 description and in `DESIGN_RULES.md`.

**Next**
- F-010: theme in `theme.ts`, layout components, routes with placeholder pages, the waking-up pill, Storybook.

## 2026-10-27 (13)

**Done**
- F-010: first round of app shell prototypes made and rejected by the owner (too close to the default component
  library look, fonts too bold, icons and text misaligned). Prototypes removed; the feedback and technical
  findings are in the F-010 description, new custom rules in `DESIGN_RULES.md`.
- Kept: project skill `design-screen` (`.claude/skills/`) against generic "AI default" design, and a Playwright +
  axe design check for HTML prototypes: `npm run design:check -- <file.html>` in `frontend/` (`axe-core` added as
  a dev dependency).

**Next**
- F-010 from the start: look at how Claude's UI collapses its sidebar, then 3 new prototypes with the skill.

## 2026-10-27 (12)

**Done**
- F-009: code merged into `develop` (PR #9); first release `develop` → `main` (PR #10, merge commit).
- Owner set up Render (Blueprint on `main`, connection string to Neon `main`) and the cron-job.org keep-awake ping
  (`*/14 7-22 * * *`, Europe/Kyiv). Live: https://pup-budget-planner.onrender.com, Storybook at
  https://pup-budget-planner-storybook.onrender.com.
- Production checked: health, SPA and client routes, API 404, HTTPS redirect, HSTS, caching, Brotli; Playwright
  E2E 4/4 against the production URL.
- Render's free plan has no metrics, so the CI "Docker image" job now runs the container with a 512 MB limit and
  reports `docker stats`: 44 MiB after start-up, 57 MiB after 400 requests. Image 251 MB; warm requests 0.15–0.17 s.
- Cold start after 17 min idle (cron job paused): 23.4 s for the first request, then 0.17–0.19 s.
- F-009 done; **M0 Foundation done.**

**Next**
- M1: F-010 app shell and navigation (3 design prototypes first).

## 2026-10-27 (11)

**Done**
- F-008: CI pipeline merged into `develop` (PR #8).
- F-009 (code part): multi-stage `Dockerfile` (Node 24 → .NET 10 SDK publish with ReadyToRun → `aspnet:10.0`,
  non-root, port 8080, workstation GC) and `.dockerignore`. The API serves the React build from `wwwroot` with an
  `index.html` fallback for client routes; unknown `/api` routes stay ProblemDetails 404s; `/assets` cached for a
  year, the rest `no-cache`. Forwarded headers (`For`/`Proto`) trusted from Render's proxy; HTTPS redirection only
  in Development, HSTS in production.
- `render.yaml`: Docker web service (free, Frankfurt, `main`, deploy after checks pass, health check
  `/api/health`, `ConnectionStrings__Database` set in the dashboard) and the Storybook static site.
- New CI job "Docker image": builds the image, runs it against PostgreSQL, smoke-tests health, SPA, client route
  and API 404. No local Docker, so CI is where the image is checked.
- Checked locally: the published app in `Production` against Neon `dev` (all routes and headers as expected);
  ReadyToRun `linux-x64` publish works. Backend: clean build, 15 tests pass.
- Owner setup steps written in the F-009 change file.

**Decisions**
- ADR 0010: Docker image and production hosting settings.

**Next**
- Owner: Render account + Blueprint, connection string (Neon `main`, direct), first release `develop` → `main`,
  cron-job.org keep-awake ping. Then measure memory and cold start and finish F-009.

## 2026-10-27 (10)

**Done**
- F-007: database and health check merged into `develop` (PR #7).
- F-008: GitHub Actions workflow `.github/workflows/ci.yml` with three parallel jobs — Backend (restore,
  Release build, tests), Frontend (lint, format check, type-check, unit tests, build, Storybook build) and
  E2E (Playwright against the real API with a PostgreSQL 17 service container; report uploaded on failure).
  npm and NuGet caching; older PR runs cancelled on a new push.
- Playwright's `webServer` now starts the API too (user-secrets / Neon `dev` locally) and, in CI, serves the
  production build with `vite preview` on port 4173. New E2E test: `/api/health` through the app's proxy.
  E2E (4 tests) passes locally in both modes; backend build is clean, 7 tests pass; lint, format, type-check,
  unit tests, build and Storybook build pass.

**Next**
- F-009: deployment to Render.

## 2026-10-27 (9)

**Done**
- F-006: Playwright setup merged into `develop` (PR #6).
- F-007: EF Core 10 + Npgsql in Infrastructure: `AppDbContext` with snake_case names, first migration
  (`data_protection_keys`), migrations applied on start-up, Data Protection keys stored in the database.
  Connection string `ConnectionStrings:Database` from user-secrets locally, environment variable in production.
  `GET /api/health` (no database access). New test projects `Api.Tests` and `Infrastructure.Tests`
  (7 tests in total); `dotnet-ef` as a local tool. Build is clean, tests pass.
- Neon project created by the owner (branches `main` and `dev`). Checked against `dev`: migration
  applied, Data Protection key stored and reused after a restart, `/api/health` returns 200 without a query.
- API produces JSON only; frontend API types regenerated (they now include `/api/health`).

**Decisions**
- ADR 0009: snake_case database names, migrations and a design-time factory in Infrastructure, EF Core
  versions pinned transitively.

**Next**
- F-008: CI pipeline.

## 2026-10-27 (8)

**Done**
- F-005: Storybook merged into `develop` (PR #5).
- F-006: Playwright 1.64 in `frontend/`: projects `desktop-chromium` and `mobile-chromium` (Pixel 7), web server
  starts `npm run dev` (reuses a running one locally), CI-ready settings, smoke test for the home page in
  `frontend/e2e/`. Scripts `e2e`, `e2e:ui`, `e2e:report`, `clean:playwright`. E2E (2 tests), lint, typecheck,
  unit tests and build pass.

**Next**
- F-007: database and health check.

## 2026-10-27 (7)

**Done**
- F-004: frontend scaffold merged into `develop` (PR #4).
- F-005: Storybook 10.6 (Vite builder) in `frontend/.storybook/`: stories wrapped in `AppProviders` (Mantine theme,
  query client, i18n), toolbar for light/dark mode, Mobile / Tablet / Desktop viewport presets (Mobile by default),
  docs and a11y addons, `eslint-plugin-storybook`. Sample story for `ColorSchemeToggle` with a play function.
  Lint, typecheck, tests, app build and Storybook build pass without warnings.

**Next**
- F-006: Playwright setup.

## 2026-10-27 (6)

**Done**
- F-003: backend scaffold merged into `develop` (PR #3).
- F-004: frontend scaffold in `frontend/`: Vite 8 + React 19 + TypeScript (strict), Mantine 9 with theme and
  light/dark mode, React Router 8, TanStack Query, react-i18next (English, typed keys), openapi-fetch client with
  generated types, ESLint + Prettier, Vitest + RTL + MSW (5 tests), `/api` dev proxy. Lint, typecheck, tests and
  build pass.

**Decisions**
- ADR 0008: frontend needs Node 24 LTS; TypeScript pinned to 5.9 (tooling doesn't support TypeScript 7 yet).

**Next**
- F-005: Storybook.

## 2026-10-27 (5)

**Done**
- F-003: backend scaffold in `backend/`: `PupBudgetPlanner.slnx` with Domain, Application, Infrastructure, Api and
  Domain.Tests, Application.Tests; central package management, warnings as errors, analyzers, `.editorconfig`.
  `dotnet build` is clean and `dotnet test` passes (3 tests).

**Decisions**
- ADR 0007: backend tests run on Microsoft.Testing.Platform (required by xUnit v3 4.x on the .NET 10 SDK).

**Next**
- F-004: frontend scaffold.

## 2026-10-27 (4)

**Done**
- F-001: planning docs merged into `develop` (PR #1, squash merge).
- F-002: private GitHub repo `yuliaBiriukova/PupBudgetPlanner` with `main` and `develop` (default branch);
  squash and merge commits allowed, rebase disabled, branches deleted after merge.

**Next**
- F-003: backend scaffold.

## 2026-10-27 (3)

**Done**
- Data model: enums documented (`TransactionType`, `CategoryKind`, `Currency`, `Institution`, `FamilyRole`,
  `RateSource`), stored as text; consistency rules for transactions.
- Change description files renamed from `README.md` to the folder name (`F-018-…/F-018-….md`);
  backlog links point to them.
- Rules added: squash merge for PRs into `develop` (merge commit for releases into `main`); every PR has a
  short description of its changes (template in `.github/pull_request_template.md`); a folder and description
  file are created as soon as a change is added to the plan.

**Next**
- Owner finishes reviewing the planning docs.
- F-002: `gh auth login`, create the repo, configure merge settings, open the F-001 pull request.

## 2026-10-27 (2)

**Done**
- Added the git workflow to `CLAUDE.md`: `main` (only deployed) ← `develop` ← `feature/F-…`,
  `improvement/I-…`, `bugfix/B-…`; commit messages start with the ID; pre-push checklist.
- Created `docs/changes/` with one folder per change and templates; 26 MVP features (F-001 – F-026)
  replace the old `T-xxx` tasks.
- Design process: 3 HTML prototypes per screen, stored in the change folder.
- Hosting revised (ADR 0002): one Render service serving SPA + API — standard setup, least risk for
  Google sign-in; keep-awake ping 07:00–23:00; Data Protection keys in the database.
- Storybook: free Render static site.
- All open questions answered.
- Branches `develop` and `feature/F-001-planning-docs` created locally.

**Next**
- F-002: owner runs `gh auth login`, then create the repo, push, open the F-001 pull request.
- F-003 / F-004: scaffold backend and frontend.

## 2026-10-27

**Done**
- Analysed the Google Sheets budget (Yulia 2026, Vlad 2026) and derived the default categories and the report layout.
- Agreed on the stack: ASP.NET Core (.NET 10) + React/TypeScript + Mantine, PostgreSQL on Neon, hosting on Render,
  GitHub Actions CI, Identity with Google sign-in, NBU exchange rates, Playwright for UI tests, Storybook.
- Created the repository with planning documents and ADRs 0001–0006.
- Installed the GitHub CLI.

**Decisions**
- Integration tests and email (Resend) moved to after the MVP; Google sign-in is in the MVP.
- Categories are personal; removing default categories and private data are after the MVP.
- One family per person. UI in English; Ukrainian later. Recurring transactions are out of scope.
