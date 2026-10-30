# Progress log

Newest entries on top. Each entry: what was done, decisions, what's next.

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
