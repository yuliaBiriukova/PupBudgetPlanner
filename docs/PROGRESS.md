# Progress log

Newest entries on top. Each entry: what was done, decisions, what's next.

## 2026-11-12 (B-018: The E2E clean-up finds test people whose tag has digits)

**Done**
- [B-018](changes/bugfixes/B-018-e2e-cleanup-digit-tags/B-018-e2e-cleanup-digit-tags.md) on
  `bugfix/B-018-e2e-cleanup-digit-tags`; the owner approved the root cause and the fix on 2026-11-11. The clean-up's
  `TEST_PERSON_EMAIL` allowed only letters and hyphens in the tag, so the screenshot scripts' people
  (`e2e-i024-shots-…`, `e2e-b004-debug-…` …) were never deleted: 51 of them in the `dev` database.
- `TEST_PERSON_EMAIL` takes digits in the tag (still needs the `-<ms>-<rand>@example.com` end, so never the admin);
  `newPerson` throws for a tag the clean-up wouldn't find. CLAUDE.md "Clean up test data" says to make test people
  with `newPerson`, in hand-run scripts too.
- Tests: `e2e/test-people.spec.ts` (no browser, desktop project): fails on the old pattern, passes now.
- Checked: the full E2E suite against this branch's API and web app (89 passed, 19 skipped); frontend lint, format,
  typecheck, unit tests and build; backend tests.
- Test data: before the run the `dev` database had 51 leftover `e2e-…` people from earlier changes; the run's
  clean-up deleted them with the run's own people. Checked through `GET /api/admin/people` as the tests' admin: the
  admin is the only `e2e-…` account left; no test invite link is waiting. The owner's account untouched.

**Next**
- Owner: review the PR.

## 2026-11-11 (F-023: Family and invitations, built)

**Done**
- The owner approved F-023 for implementation on 2026-11-11 ("approved f-023, build it": the final prototype and the
  six open points' proposals); recorded in the
  [description](changes/features/F-023-family-and-invitations/F-023-family-and-invitations.md) and DESIGN_RULES
  "Screen decisions".
- Backend: the `Family` aggregate in the Domain (one owner, members with the day they joined; rename, remove, leave
  with the next owner, the last one leaving empties it); `families` and `family_members` with one family per person
  as a unique index; a family's link is an F-028 invitation with a `family_id`, and `created_account` keeps "Invited"
  to links that created the account (migration `AddFamilies`, applied to the `dev` database by the local API);
  `/api/family` (get, start, rename, invite, cancel a link, remove, leave, join); sign-up with a family's link
  (password or Google) joins the family; the admin's Delete hands an owner's family to whoever has been in it longest
  and deletes an emptied one; the link preview names the family and its members; the admin's list has the family.
- Frontend: the Family page replaces the placeholder (Name, Members, Invite someone, Leave / Delete the family; with
  no family Start a family and Join a family), its dialogs (a new link shown once with Copy / Share, Remove, Leave
  with the next owner picked); `/invite/:token` now also serves someone signed in: a family's link asks to join, or
  to leave the current family first; someone new gets F-028's sign-up with the family named, and goes on to Family.
  The admin's *Invite links* tab tags a family's links. The prototype stories were removed; *Family / Family page*
  has the owner, member, no family, loading, error and the three join pages. `PlaceholderPage` went with the last
  placeholder.
- Added in the build (in the description's "Built"): a link to your own family, and a link that no longer works for
  someone signed in, each get a line and Go to Family.
- Decisions: [ADR 0029](decisions/0029-families.md) (the `Family` aggregate, one family per person in the database,
  family links are invite links, nothing of anyone's deleted with a family or an account).
- Tests: backend 515 / 515 (30 new: `FamilyTests`, a family link's lifetime, validators, `FamilyControllerTests`);
  frontend unit tests 359 / 359 (13 new in `FamilyPage.test.tsx`); E2E `family.spec.ts` (someone new joins with the
  link and is removed; someone with an account joins and leaves), desktop and phone.
- Checked: backend build (0 warnings); frontend lint, format, typecheck, build; the design check on the Family page
  (owner, no family) and the join page (signed in: no issues; signed out: only the password eye button "overlap" F-028's
  page has too); screenshots of every state at 375 and 1440 px, light and dark, looked at (kept in the change folder's
  `screenshots/`); they caught the join page's title sitting right under the card and a dialog's first line 12 px
  low (a class losing to another stylesheet on load order), both fixed.
- Test data: the E2E runs' `e2e-…@example.com` people and their families and links, and `e2e-manual-…@example.com`
  people (with families Kovalenko and Melnyk and links noted `E2E …` and `Mom`) made for the screenshots and the design
  check; the E2E clean-up deleted the people, which deleted their families and cancelled the families' waiting links.

- Owner's review: generic placeholders, Family name "Our family" (was "Kovalenko") and Who is it for? "Their name"
  (was "Mom"); the screenshots showing them taken again and looked at. Their two `e2e-manual-…` people were removed by
  the E2E clean-up.

**Next**
- Owner: review the PR; try the Family page and a link in a second browser. Then F-024 (Family views).

## 2026-11-11 (F-023: Family and invitations, design round 1)

**Done**
- [F-023](changes/features/F-023-family-and-invitations/F-023-family-and-invitations.md) started on
  `feature/F-023-family-and-invitations`: references (Spotify, Google, Apple, Monarch and YNAB help pages; Mobbin
  needs a sign-in), the brief, the plan, and three prototype stories in *Prototypes / F-023 Family and invitations*:
  Sections, Seats, Tickets. Each is the app opened on Family with a start picked in the link (owner, no family,
  member, and opening a link signed in, while in a family, or as someone new); starting, renaming, inviting,
  cancelling a link, removing, leaving and joining all work in the story.
- Six open points with proposals in the description (the owner alone invites; an owner leaving names the next
  owner; rename; no limit; family links on the People page; nothing deleted on leaving).
- Checked: the design check on the three stories and six starts (only the password eye button "overlap" the app's
  own invite page has too); typecheck, ESLint, Prettier; every state clicked through in Playwright, screenshots at
  375 px light and dark and 1440 px looked at.
- Test data: none (Storybook only).

- The owner picked variant 1, "Sections", without changes; it is now the *Final prototype* story (variants 2 and 3
  removed), with one fix (the Start a family button 16 px under its field on the desktop, was 44). Checked again:
  the design check on its six starts, every state's screenshots at 375 and 1440 px, light and dark, kept in the change
  folder's `prototypes/`.

**Next**
- Owner: approve the final prototype and the open points' proposals for implementation (or ask for changes).

## 2026-11-11 (F-029: Manage categories, built)

**Done**
- The owner approved the final prototype ("Tap a tag") for implementation on 2026-11-11; recorded in the
  [description](changes/features/F-029-manage-categories/F-029-manage-categories.md) and DESIGN_RULES "Screen
  decisions".
- Backend: `CategorySet` in the Domain with every rule (names unique ignoring case, hidden ones counting; moves within
  a kind; places among the shown ones; hide instead of delete once used; a group goes only without shown categories,
  never the last of its kind); `CategoryGroup.IsArchived` (migration `HideCategoryGroups`, applied to the `dev`
  database by the local API); `GET /api/categories` with hidden ones and transaction counts; add, change, remove and
  restore endpoints for categories and groups; the reports leave out a hidden group with nothing in the period.
- Frontend: the Categories page's tags open the category's sheet (name, group, place with drag and ↑ ↓, Hide or
  Delete asked again), + Add, hidden tags with Show again, the group's sheet, + Add income / expense group, hidden
  groups with Show; the "come later" line is gone; the quick-add form leaves hidden ones out. The prototype stories
  were removed; the page's stories cover the sheets, a clash, a hidden twin, Hide and Delete asked, hidden ones, a
  failed save, loading and error.
- Decisions: [ADR 0028](decisions/0028-changing-categories.md) (rules in the Domain, hide instead of delete, our own
  small drag rather than dnd-kit).
- Tests: backend 485 / 485 (22 new for `CategorySet`, validators, controller, overview, report); frontend unit tests
  346 / 346; E2E `categories.spec.ts` (add, rename, reorder by keyboard, move, delete a category and a group; hide one
  with a transaction: gone from the quick-add form, still in the month's report, shown again), desktop and phone.
- Checked: backend build (0 warnings); frontend lint, format, typecheck, build, `build-storybook`; the full E2E suite
  (86 passed, 16 skipped); the design check on 8 of the page's stories (no layout or axe issues once the stories show
  full screen: Storybook's padded body had moved the phone's sheets 16 px; it still lists the dimmed backdrop under
  each open sheet as an overlap); screenshots of the page and every sheet at 375 and 1440 px, light and dark, looked
  at (kept in the change folder's `screenshots/`).
- Test data: the E2E runs' `e2e-…@example.com` people, and one `e2e-manual-…@example.com` person with an invite link
  noted `E2E manual F-029` made for a check in the browser; the E2E clean-up deleted them and cancelled the links.

**Next**
- Owner: review the PR. The Transactions filters keep listing the period's categories by amount (F-020), not in the
  person's order: the owner's choice, 2026-11-11. Then F-023 (Family and invitations).

## 2026-11-11 (F-029: Manage categories, design round 1)

**Done**
- [F-029](changes/features/F-029-manage-categories/F-029-manage-categories.md) started on
  `feature/F-029-manage-categories`: references (YNAB, Actual Budget, Lunch Money, AnyList, Atlassian's drag and drop
  accessibility), the brief and three prototype stories in *Prototypes / F-029 Manage categories*: Edit mode, Tap a
  tag, The ledger. Each is the app opened on Categories with the variant's page; changes stay in the story.
- Checked: the design check on the three stories (0 issues after one fix), their states clicked through in Playwright
  at 375 and 1440 px, light and dark, screenshots looked at; lint and typecheck on the prototype folder.
- Test data: none (Storybook's fake API only).

- The owner picked variant 2, "Tap a tag", the same day; it is the final prototype story (variants 1 and 3 removed),
  checked again (design check 0 issues, its states in Playwright at 375 and 1440 px, light and dark).

**Next**
- Owner: approve the final prototype for implementation (or ask for changes); no code before that.

## 2026-11-11 (B-017: The Filters sheet keeps its picks as it closes; two flaky unit tests)

**Done**
- [B-017](changes/bugfixes/B-017-flaky-ci-unit-tests/B-017-flaky-ci-unit-tests.md) on
  `bugfix/B-017-flaky-ci-unit-tests`. Two frontend unit tests failed on CI's `develop` pushes after #78 and #79 but
  passed on their PRs. Reproduced with all 8 cores busy and with timing logs. The owner approved the causes and the
  fix on 2026-11-11.
- A real race: as the phone's Filters sheet closed, `useTransactionFilters` cleared its draft before React Router had
  put the picks into the address, so for one render the page showed no filters and asked the API for the whole month.
  The draft now stays until the address has moved on from where it was as the sheet closed.
- The shell test's first wait was the file's cold start at the 1 s default: `LOADED` (4 s) is now shared from
  `src/test/render.tsx` (five page tests had their own copy) and used for `AppLayout.test.tsx`'s page-load waits.
- Tests: a regression test in `TransactionsPage.test.tsx` (the chip never drops out, no request without the account),
  failing before the fix. Both files ten times under load: all passing, the Filters test 2.5–3.6 s instead of
  4.4–6.1 s.
- Checked: frontend lint, format, typecheck, unit tests (327 / 327, with develop merged), build; backend build (0
  warnings; the backend isn't changed); E2E "a person finds the month's eating out…" desktop and phone, and the full
  E2E suite (80 passed, 16 skipped), against this branch's API and app.
- Test data: the E2E runs' `e2e-…@example.com` people (with their accounts and transactions); the E2E clean-up deleted
  them and cancelled their invite links. Nothing made by hand.

**Next**
- Owner: review the PR. Two I-025 tests ran past the 5 s test limit under the reproduction's heavier load (not on CI):
  left as is unless CI shows them failing.

## 2026-11-11 (B-013: Toasts at the top on the phone)

**Done**
- [B-013](changes/bugfixes/B-013-toast-hidden-on-phone/B-013-toast-hidden-on-phone.md) on
  `bugfix/B-013-toast-hidden-on-phone`. Reproduced at 412 × 800 px: the "Expense saved." toast lay exactly over the
  bottom bar (Mantine's default bottom right, full width on the phone), a white card on the white bar; not drawn under
  anything. The owner approved the cause and the fix on 2026-11-11, for all toasts.
- `AppNotifications` (in `AppProviders`): on the phone every toast comes from the top, 8 px under the header, full
  width with the 16 px gutters; the desktop keeps bottom right. No call site changed. DESIGN_RULES §6 says so.
- Tests: `AppNotifications.test.tsx` (phone top, desktop bottom right) and E2E `transactions.spec.ts` (the saved toast
  under the header and above the bar on the phone, 16 px from the bottom right on the desktop); both fail without
  the fix.
- Checked: frontend lint, format, typecheck, unit tests, build, `build-storybook`; backend tests (444 / 444, the
  backend isn't changed); the full E2E suite, desktop and phone (one auth test hit the sign-in rate limit after the
  session's many sign-ups and passed on a re-run of `auth.spec.ts`); screenshots of the toast after an expense, an
  income and a transfer at 375 and 1440 px, light and dark, looked at (in the change folder's `screenshots/`).
- Checked again after merging `develop` (B-011, B-014): lint, format, build, unit tests (326 / 326), the full E2E
  suite (82 passed, 16 skipped).
- Test data: two `e2e-manual-…@example.com` people with an account each and two invite links noted `E2E manual
  B-013`, made by hand to reproduce and check the fix, and the E2E runs' `e2e-…@example.com` people; the E2E clean-up
  deleted the people and cancelled the links.

**Next**
- Owner: review the PR.

## 2026-11-11 (B-016: The E2E job installs its browser without apt)

**Done**
- [B-016](changes/bugfixes/B-016-e2e-browser-install-hangs/B-016-e2e-browser-install-hangs.md) on
  `bugfix/B-016-e2e-browser-install-hangs`. Four E2E runs that day (B-014's PR, a push to `develop`, B-013's PR #82
  twice) failed after 8–18 minutes without running a test: `npx playwright install --with-deps chromium` ran apt for
  9 font packages while the runners couldn't resolve Ubuntu's mirrors, and apt waited about 20 s per file and mirror.
  The owner approved the cause and option 2 on 2026-11-11.
- `ci.yml`, job `e2e`: `npx playwright install chromium` without `--with-deps` (the runner already has Chromium's
  libraries; the app ships its own fonts and the tests compare no screenshots), the browser kept in the Actions cache
  keyed by the Playwright version in `package-lock.json`, and `timeout-minutes: 4` on the install step. Option 1,
  Playwright's own Docker image, was turned down: a 2 GB pull per run, a tag to bump by hand, .NET inside it.
- Checked: CI on PR #83. A CI-only change, so no local suites were run (nothing in `backend/` or `frontend/` changed).
- Test data: none.

**Next**
- Owner: review PR #83. Then B-013 (Medium), whose PR #82 can be re-run once this is in `develop`.

## 2026-11-11 (B-014: Save right after the Note's suggestions on the phone)

**Done**
- [B-014](changes/bugfixes/B-014-gap-under-note-suggestions/B-014-gap-under-note-suggestions.md) on
  `bugfix/B-014-gap-under-note-suggestions`. Reproduced in Storybook at 375 × 520 px: one earlier note listed (`phy`)
  left 200 px of empty space between the list and Save. Cause: while the list shows, the form's room under the Note
  was always the whole sheet less the Note (B-009), which fits only the longest list. The owner approved the cause and
  fix A on 2026-11-11.
- `NoteField` reports its list's height (`onList`); the room under the form is only what the list needs
  (`noteRoomHeight`), and the form scrolls only until the list's foot is just above Save. The room follows the list as
  it grows and shrinks; the desktop and the no-list case (B-009) are unchanged. DESIGN_RULES' Note suggestions row
  says so.
- Tests: `noteRoom.test.ts`, `TransactionsPage.test.tsx` (the room for one and for five notes) and E2E
  `transactions.spec.ts` on the phone (one, five, three notes: the whole list at most 32 px above Save); both
  regression tests fail without the fix. B-009's E2E test now expects Save right after the list.
- Checked: frontend lint, format, typecheck, unit tests (324 / 324), build, `build-storybook`; backend build (0
  warnings) and tests (444 / 444, the backend isn't changed); the full E2E suite, desktop and phone; screenshots at
  375 × 520 px (one, three, five notes, the list gone; light and dark) and the desktop at 1440 px, light and dark,
  looked at; the fix clicked through in the Browser pane.
- Test data: the E2E runs' `e2e-list-gap-…`, `e2e-note-gap-…` and other `e2e-…@example.com` people (with their
  accounts and transactions); the E2E clean-up deleted them and cancelled their invite links. Nothing made by hand.

**Next**
- Owner: review the PR. Then B-013 (Medium).

## 2026-11-11 (B-011: The picked day's ring inside it, at once on the phone)

**Done**
- [B-011](changes/bugfixes/B-011-calendar-picked-day-ring/B-011-calendar-picked-day-ring.md) on
  `bugfix/B-011-calendar-picked-day-ring`. Reproduced in Storybook as a touch phone at 360 and 412 px: the picked
  day's ring was drawn 4 px outside it while the days are 1–4 px apart, so the next day covered its right side and on
  Monday it was squeezed against the card's edge; and the phone leaves the tapped day hovered, where the hover's grey
  ring replaced the black one. The owner approved the cause and the fix on 2026-11-11.
- `TransactionsPage.module.css`: the picked day's ring is 2 px inside it; the hover ring only where there is a mouse
  and never on the picked day.
- Tests: an E2E test in `transactions.spec.ts` (desktop and phone), failing before the fix, passing after it.
- Checked: frontend lint, format, typecheck, unit tests (320 / 320), build, `build-storybook`; backend build and tests
  (the backend isn't changed); the full E2E suite, desktop and phone; screenshots of the real app at 375 px and
  1440 px, light and dark, looked at (in the change folder's `built/`, the reproduction in `repro/`).
- Test data: the E2E runs' `e2e-…@example.com` people, among them `e2e-ring-…` and `e2e-shots-…` for the screenshots
  (with an account and three expenses); the E2E clean-up deleted them. Nothing made by hand.

**Next**
- Owner: review the B-011 pull request.

## 2026-11-11 (B-012: The amount comes up whole above the phone keys)

**Done**
- [B-012](changes/bugfixes/B-012-amount-hidden-under-keys/B-012-amount-hidden-under-keys.md) on
  `bugfix/B-012-amount-hidden-under-keys`. Reproduced in Storybook at 375 × 640 px: a tap on an expense's amount brought
  the keys up over 71 of its 89 px and the form didn't move. Cause: the amount kept itself in sight above the keys only
  with `target`, which only an exchange's two amounts get (with their ring). The owner approved the cause and the fix
  on 2026-11-11.
- `AmountDisplay` has `typedInto` ("the keys type into it"), apart from `target` (the ring): while it is set the display
  scrolls into sight above the keys as they come up and on every key. `TransactionDialog` sets it for every type; the
  ring stays on an exchange only.
- Tests: `TransactionsPage.test.tsx` (the amount scrolled into sight as the keys come up and on a key, no ring), E2E
  `transactions.spec.ts` on the phone at 412 × 640 px (the whole amount right above the keys after the tap and while
  `125` is typed); both fail without the fix.
- Checked: frontend lint, format, typecheck, unit tests (320 / 320), build, `build-storybook`; backend build (0
  warnings) and tests (444 / 444, the backend isn't changed); the full E2E suite, desktop and phone; screenshots of the
  form with the keys up at 375 px (expense, light and dark; an exchange) and the desktop form at 1440 px, light and
  dark, looked at; the fix clicked through in the Browser pane.
- Test data: the E2E runs' `e2e-amount-sight-…` and other `e2e-…@example.com` people (with their accounts and
  transactions); the E2E clean-up deleted them and cancelled their invite links. Nothing made by hand.

**Next**
- Owner: review the PR. Then B-011, B-013 or B-014 (Medium).

## 2026-11-11 (I-029: round corners and a 16 px gap, the owner's review)

**Done**
- The owner, on the built [I-029](changes/improvements/I-029-popup-height-and-keyboard/I-029-popup-height-and-keyboard.md):
  keep the pop-ups' top corners round as they used to be, and leave a small 16 px gap above the ones taller than the
  screen. Recorded in the description file (a review section, the acceptance criteria, the open points) and in
  DESIGN_RULES (the custom rule, the "Screen decisions" row) before the code.
- `BottomSheet`: at most the screen, or what the keyboard leaves of it, less 16 px (and the phone's own inset at the
  top); a `tall` sheet is that tall; round top corners at any height. The square corners at the top and
  `useSheetAtTop` are gone.
- Tests: `sheets.spec.ts` expects the top edge 16 px under the top of the screen (the account form, with and without
  the keyboard; the quick-add form with its keys) and round corners; the three square-corner unit tests are removed.
- Checked: frontend lint, format, typecheck, unit tests, build, `build-storybook`; the full E2E suite, desktop and
  phone; screenshots at 375 px, light and dark, looked at (in the change folder's `built/`).
- Test data: the E2E runs' `e2e-…@example.com` people, among them `e2e-shots-…`; the clean-up deleted them.

**Next**
- Owner: review PR #78.

## 2026-11-11 (B-015: E2E tests in Kyiv's time zone; red CI on PR #78)

**Done**
- CI's E2E job failed on PR #78 (I-029) at 00:39 in Kyiv: two tests of `transactions.spec.ts`, on all three tries.
  Not I-029: the tests' helper dates its expenses with Kyiv's today (as the API counts days) while CI's browser is in
  UTC, where it was still yesterday, so the page had no "Today" receipt. Any CI run between midnight and 02:00 in Kyiv
  failed this way.
- [B-015](changes/bugfixes/B-015-e2e-day-after-midnight-kyiv/B-015-e2e-day-after-midnight-kyiv.md), fixed on the same
  pull request under the owner's Auto-fix: `playwright.config.ts` runs the browser (`timezoneId`) and the tests' own
  code (`TZ`) in `Europe/Kyiv`.
- Checked: shown failing first with a time zone a day behind Kyiv (CI's own error), passing in Kyiv; the full E2E
  suite, desktop and phone.
- Test data: the E2E runs' `e2e-…@example.com` people; the clean-up deleted them.

**Next**
- Owner: review PR #78.

## 2026-11-11 (I-029: Phone pop-ups as tall as their content, above the keyboard)

**Done**
- [I-029](changes/improvements/I-029-popup-height-and-keyboard/I-029-popup-height-and-keyboard.md) on
  `improvement/I-029-popup-height-and-keyboard`, built from the prototype's round 2, which the owner approved on
  2026-11-11 ("Approve, build it"; square corners at the top, the prototype's default). The prototype stories are
  deleted; their screenshots are in the change folder.
- `BottomSheet`: as tall as its content up to the whole screen (was 90 %), no gap above it; square corners once it
  reaches the top of its room (`useSheetAtTop`), the handle kept. The `full` option is gone (`BottomSheet`,
  `ResponsiveDialog`): the quick-add form is as tall as its fields and grows to the top when its keys come up. A
  `tall` sheet (the searched lists: currencies, All categories) is the whole screen (was 80 %); the Transactions
  filters lose their set height.
- Every sheet reads the phone's keyboard (`useKeyboardInset`, before only the quick-add form): it sits on it, at most
  as tall as what the keyboard leaves, and the field being typed is scrolled into sight with its label and hint
  (`useFieldInSight`), clear of the content's fading edges.
- A form opens from its top without the keyboard: `useDesktopAutofocus` puts the cursor in the new account's Name and
  the new invite link's note on the desktop only; on the phone the sheet's close button takes the focus. The currency
  and category searches keep their cursor.
- DESIGN_RULES: a custom rule for the sheets' height, corners, keyboard and first field; the "Screen decisions" row.
- Tests: `BottomSheet.test.tsx` (sits on the keyboard and goes back down; the typed field scrolled into sight;
  square corners at the top of the screen and of what the keyboard leaves), `AccountsPage.test.tsx` (the cursor in
  Name on the desktop, the close button's focus on the phone). E2E `sheets.spec.ts`: the new account's form takes the
  whole screen, opens from its top without the cursor in Name, sits on a 300 px keyboard (emulated through the visual
  viewport) with Name and Add account above it; the quick-add form is as tall as its fields and reaches the top with
  its keys. `shell.spec.ts`: Add is as tall as its content (was a set 90 %). Stories: *Shared / BottomSheet* Above
  the keyboard (light, dark), Long above the keyboard; Long with buttons now shows the whole screen.
- Checked: frontend lint, format, typecheck, unit tests (314 / 314), build, `build-storybook`; backend build and tests
  (the backend isn't changed); the full E2E suite, desktop and phone; screenshots of every phone pop-up at 375 px,
  light and dark, looked at (the account form opening, with Name typed, its currency list, editing and deleting an
  account; More; the quick-add form's Expense and Transfer, its keys, its Note typed, All categories; the filters; the
  new invite link), each typed field with the keyboard up, and the desktop dialogs at 1440 px (unchanged).
- Owner's review of the PR (2026-11-11), "a strange animation for a second" as the quick-add form opens: the form's
  data arrives up to a second after the sheet, and the sheet, now as tall as its content, opened short with the
  loading placeholder and jumped to the form's height. The placeholder is now as tall as the form was last time on the
  device (`formHeight.ts`), with the places of the type switch and Save, so the sheet opens at its final height; the
  square corners are set in the same frame as the height (`useSheetAtTop` writes the attribute itself). Tests:
  `formHeight.test.ts`, four in `TransactionsPage.test.tsx`, and `sheets.spec.ts` with the data 1.5 s late. Checked
  frame by frame with an 800 ms API in Storybook at 400 × 620 and 375 × 812: one height from the first frame.
- Test data: the E2E runs' `e2e-…@example.com` people (with their accounts), among them `e2e-shots-…` for the
  screenshots; the E2E clean-up deleted them and cancelled their invite links. Nothing made by hand; the invite link
  dialog was opened as the tests' admin and closed without creating a link.

**Next**
- Owner: review the PR. Seen while checking, not part of this change: the desktop account dialog logs the browser's
  "ResizeObserver loop completed with undelivered notifications" when its currency list closes; the People page of
  the `dev` database still lists people from earlier sessions whose emails the clean-up doesn't match
  (`e2e-i024-shots-…`: the digits in the tag).
- B-012 and B-014 next: they touch the same keyboard room in `TransactionDialog.tsx` / `BottomSheet.tsx`.

## 2026-11-11 (I-029: prototype round 2)

**Done**
- The owner's comments on the [I-029](changes/improvements/I-029-popup-height-and-keyboard/I-029-popup-height-and-keyboard.md)
  prototype: the quick-add form's height should follow its content (it took the whole screen, with empty room under
  Save); Add account should just open, like Add transaction (it opened with the keyboard up, scrolled to Name,
  because the form puts the cursor in Name as it opens).
- Round 2 of the prototype story: the quick-add form is as tall as its content like every other sheet (the switch is
  gone) and grows when its keys come up; on the phone a form's first field no longer takes the cursor as the sheet
  opens, so it opens from its top without the keyboard; the currency search keeps its cursor (B-004), the desktop
  dialogs theirs. Both are in the description file's acceptance criteria and tasks.
- Checked: the design check on the story (0 issues); Playwright screenshots at 375 px (the account form open and
  with Name tapped, the currency search, More, the quick-add form's Expense and Transfer, its Note with the keyboard,
  its amount with the keys) and 1440 px (unchanged), light and dark, looked at; prototype lint, format and typecheck
  pass. Nothing built.
- Test data: none (Storybook with fake data only).

**Next**
- Owner: try round 2, choose square or round corners at the top, and approve for implementation.

## 2026-11-10 (I-029: open points answered, prototype to try)

**Done**
- [I-029](changes/improvements/I-029-popup-height-and-keyboard/I-029-popup-height-and-keyboard.md) started on
  `improvement/I-029-popup-height-and-keyboard`. The owner's answers: no gap above a sheet that fills the screen, the
  phone only (desktop dialogs unchanged), a prototype story to try first. References noted (Material 3 sheets,
  Apple's sheets, Chrome's keyboard and the visual viewport).
- Prototype story *Prototypes / I-029 Popup height and keyboard / Prototype*: the app's real pages and pop-ups with
  the new rules laid over them, a stand-in keyboard on a computer, and controls for today's behavior, square corners
  at the top and the quick-add form's height (whole screen or as tall as its content).
- Checked: the design check on the story (0 issues, light and dark, 360 – 1440 px); Add account with and without the
  keyboard, the currency list, More, the quick-add form (Note with the keyboard, amount with its keys) clicked through
  in the Browser pane, screenshots at 375 and 1440 px, light and dark, looked at; prototype lint, format and typecheck
  pass. Nothing built.
- Test data: none (Storybook with fake data only).

**Next**
- Owner: try the prototype, choose square or round corners at the top and the quick-add form's height, and approve
  for implementation.

## 2026-11-09 (I-030: An Add button people find on the phone)

**Done**
- [I-030](changes/improvements/I-030-findable-add-button/I-030-findable-add-button.md) on
  `improvement/I-030-findable-add-button`, built from the final prototype the owner approved on 2026-11-09 (variant 8,
  the menu's pill gone). The prototype stories are deleted.
- The quick-add form opens on a type: `TransactionFormApi.add({ type })`, starting as switching to it would (a
  transfer's To from the last transfer); its title names the type while the data loads.
- `AddDial`: on every phone page a charcoal + floats 16 px above the menu; a tap dims the page and opens ⇄ + − (Expense
  nearest), the + turning into ×; each opens the form on its type, on the picked day (I-025). A type, ×, the dimmed page,
  Escape or opening another page folds them; Back adds no step. The three mount only while open (160 ms rise, none with
  reduced motion). The tab bar lost its +: four equal named places, the open one in the accent, no pill. Phone pages
  have 72 px more room under their last row.
- Empty day and month: "… Add an expense, an income or a transfer with the +."
- DESIGN_RULES: the phone's bottom under "Components", the thumb rule names the +.
- Tests: `AppLayout.test.tsx` (the four named places; the + opens the three and turns into ×; each type opens its form;
  ×, Escape, the dimmed page and another page fold them), `TransactionsPage.test.tsx` (an income on the picked day from
  the +; a transfer with the last transfer's accounts; the empty day's and month's text), the Categories page's counts
  of folded groups kept to the page (the + has `aria-expanded` too); the I-017 test of the Note's keys gets 15 s (it
  timed out at 5 s on CI's runner, about 2 s locally). E2E: `shell.spec.ts` (the + in sight on every page
  and each type opens its form; the order of the three, ×, Escape, the dimmed page and Back fold them; the last row
  clear of the +), `e2e/add.ts` opens the form from the shell for the other specs. Stories: *Shell / AppLayout* Phone
  add types open, Phone add on accounts, Phone add income.
- Checked: frontend lint, format, typecheck, unit tests, build, `build-storybook`; backend build (0 warnings) and tests
  (444 / 444, the backend isn't changed); the full E2E suite, desktop and phone; screenshots of Transactions (folded,
  open, the end of the list), the transfer form from ⇄, Accounts and an empty day at 375 px and Transactions at 768 and
  1440 px, light and dark, looked at; the story *Phone add types open* in the Browser pane.
- Test data: the E2E runs' `e2e-i030-shots-…` and other `e2e-…@example.com` people (with their accounts and
  transactions); the E2E clean-up deleted them and cancelled their invite links. Nothing made by hand.

**Next**
- Owner: review the PR. At 768 px the app already has the sidebar (the desktop layout), so the + shows up to 767 px.

## 2026-11-09 (I-030: design rounds and the approved final prototype)

**Done**
- [I-030](changes/improvements/I-030-findable-add-button/I-030-findable-add-button.md) designed on
  `improvement/I-030-findable-add-button`: references (Material 3's extended FAB, Monefy's − and + buttons, a centre FAB
  spec, two finance apps' user feedback), then prototype stories built from the real shell, pages and quick-add form.
  - Round 1: a "+ Add transaction" pill, Add in the middle of the bar, Expense and Income buttons. The owner: not the
    middle one; the pill full width; the type buttons round, without names, with Transfer too.
  - Round 2: the full-width button and round ⇄ + −. The owner: more ways for the three buttons, and the menu
    rearranged without the bar's +.
  - Round 3: four more (big Expense, the three in the bar, one + that opens the three, the three in a row), with a
    menu of four named places.
  - Final prototype: variant 8 (one + that opens ⇄ + −) with no pill behind the menu's open place. A first final was
    built from variant 9 by mistake; the owner pointed to variant 8 and it was rebuilt.
- The owner approved the final prototype on 2026-11-09 ("I approve the prototype") and asked for the planning PR to
  carry the details first. Recorded in the description file (`Approved`, acceptance criteria and tasks rewritten for
  the approved design, screenshots in `prototypes/`) and in DESIGN_RULES "Screen decisions". Nothing built.
- Checked: each round's stories with the design check (0 issues, light and dark, 360 – 1440 px) and their screenshots
  looked at; opening the three and each type's form clicked through in the Browser pane; prototype lint, format and
  typecheck pass. The prototype stories stay on the I-030 branch (a planning branch carries no prototypes).
- The owner's answer to the open point (2026-11-09): Back leaves the page as now, it doesn't fold the three first.
- Test data: none (Storybook with fake data only).

**Next**
- Owner: review the planning PR; then build I-030 on its branch.

## 2026-11-09 (Plan: the owner's phone feedback — B-011 – B-014, I-029, I-030)

**Done**
- Planned on `plan/phone-feedback` the six issues the owner reported from production on the phone; nothing built. Each
  has its folder, description file and backlog row, all `Todo`, to be built on its own branch after the owner's
  approval:
  - [B-012](changes/bugfixes/B-012-amount-hidden-under-keys/B-012-amount-hidden-under-keys.md) (High): the amount stays
    half hidden under the phone keys when tapped while partly out of sight; nothing scrolls it above the keys (I-028).
  - [I-030](changes/improvements/I-030-findable-add-button/I-030-findable-add-button.md) (High, 🎨): an Add button people
    find on the phone; a person using the app couldn't find how to add an expense or income. 3 variants to propose
    (a labelled "+ Add" pill, a centre tab with a word, Expense / Income buttons on the page).
  - [B-011](changes/bugfixes/B-011-calendar-picked-day-ring/B-011-calendar-picked-day-ring.md) (Medium): the picked
    day's black ring is broken in the calendar; likely drawn outside the cell, covered by the next day and clipped by
    the card.
  - [B-013](changes/bugfixes/B-013-toast-hidden-on-phone/B-013-toast-hidden-on-phone.md) (Medium): the "saved" toast at
    the bottom, over the bottom bar, can't be seen on the phone; Mantine's default bottom-right place.
  - [B-014](changes/bugfixes/B-014-gap-under-note-suggestions/B-014-gap-under-note-suggestions.md) (Medium): the gap
    B-009 left while the Note's suggestions show; the room is as high as the longest list.
  - [I-029](changes/improvements/I-029-popup-height-and-keyboard/I-029-popup-height-and-keyboard.md) (Medium): phone
    pop-ups as tall as the screen allows, small ones at the bottom, every one above the phone's keyboard (today only
    the quick-add form follows it).
- The bugs' root causes are suspected from reading the code, not confirmed: each is reproduced on its own branch before
  its fix is proposed for approval. Priorities proposed by Claude, for the owner to confirm. The owner's screenshots
  that show balances stay out of the repo; only the Note's one is in B-014's folder.
- Test data: none.

**Next**
- Owner: confirm the priorities and the open points (I-029's top gap and desktop, B-013's toast place, B-014's option,
  I-030's question); review the planning PR. Then B-012 and I-030 first. B-012, B-014 and I-029 touch the same
  keyboard room in `TransactionDialog.tsx` / `BottomSheet.tsx`: one after the other.
## 2026-11-06 (Plan: Manage categories in the MVP, F-029)

**Done**
- The owner asked to bring adding, renaming, reordering and removing categories into the MVP. Planned on
  `plan/manage-categories` as [F-029](changes/features/F-029-manage-categories/F-029-manage-categories.md) (High, 🎨),
  first in M5, which is now "Categories & family" (before F-023 / F-024, since the family report merges categories by
  group and name).
- The owner's choices: groups change too, not only categories; a removed category with transactions is hidden (past
  transactions and reports keep it), one without is deleted; the generic default set (Q-011) stays after the MVP.
- Q-003 answered again (yes, in the MVP); PRODUCT, ROADMAP (M5, M9), BACKLOG, OPEN_QUESTIONS and the M5 features'
  milestone updated. Nothing built for F-029; it stays `Todo`.
- The PR's E2E job failed in the I-020 accounts test (the app code is `develop`'s). The owner asked to fix it here:
  [B-010](changes/bugfixes/B-010-loose-toast-match-e2e/B-010-loose-toast-match-e2e.md). The test's loose
  `getByText('Mono black added')` also matched the earlier "mono black added" toast while it was still shown; both
  checks now match exactly. `e2e/accounts.spec.ts` 8 / 8 against this checkout's API (5298) and app (5174), since
  another chat's servers held the usual ports; frontend lint and format pass.
- Test data: the E2E run's `e2e-accounts-…` people (with their accounts); the E2E clean-up deleted them. Nothing made by
  hand.

**Next**
- Owner: review the planning PR. Then F-029: references and 3 prototype stories on
  `feature/F-029-manage-categories`, built only after the final prototype is approved.

## 2026-11-06 (B-004: The currency search takes the keys as soon as it opens)

**Done**
- [B-004](changes/bugfixes/B-004-currency-search-not-typing/B-004-currency-search-not-typing.md) on
  `bugfix/B-004-currency-search-not-typing`. Cause: the picker focused its search in an effect when `open` turned true,
  a frame before Mantine's transition drew the desktop dropdown, so there was nothing to focus; on the phone the sheet
  then gave the focus to its ×. Not the dialog: Settings had it too.
- Design: 3 prototype stories (the dropdown fixed, typing in the field, a page of the dialog); the owner chose variant
  1 and approved its final prototype on 2026-11-06 ("Approved, build it"). Screenshots in the change's `prototypes/`,
  the prototype stories deleted.
- `CurrencyPicker`: the search is focused as it is drawn (a ref callback; `data-autofocus` for the phone's sheet); the
  first match is marked as you type, Enter picks it (without sending the form), ↓ ↑ move the mark; the mark is kept for
  the search it was made in, and the keys work from what the search holds. Every currency field has it: the account
  form, Settings, the Reports page's pill. Found in the screenshots and fixed with it: the hover tint stuck where a phone
  was tapped and looked like a second mark; it is now only for devices that hover, and only a mouse marks a row.
- DESIGN_RULES: the currency field's rule says the search is in focus and how the keys work; "Screen decisions" row.
- Tests: `CurrencyPicker.test.tsx` with Mantine's real transitions (the `env="test"` shortcut had hidden the bug): the
  desktop search in focus in a dialog and typed with the keys alone, the phone sheet's search in focus, ↓ ↑ Enter,
  Escape leaves the dialog; 4 of them fail on the old picker. `accounts.spec.ts` picks the dollars with the keys alone
  (fails on the old picker: the search isn't focused). Story *Shared / Currency picker / Typing with the keys*.
- Checked: frontend lint, format, typecheck, unit tests (297 / 297), build, `build-storybook`; backend build (0
  warnings) and tests (444 / 444, the backend isn't changed); the full E2E suite, desktop and phone (73 passed, 11
  skipped for the other screen size); screenshots of the account form, Settings and the Reports pill with `dol` typed
  and ↓ pressed, and the account form after Enter, at 375 and 1440 px, light and dark, looked at; the design check on
  the prototype stories (only the open dialog's overlap over the page, as on the app's own New account story).
  A first full unit run had 11 time-outs in other features while the machine was at 100% CPU; they passed on their own
  and in a second full run.
- Test data: the E2E runs' `e2e-accounts-…`, `e2e-b004-shots-…`, `e2e-b004-debug-…` and other `e2e-…@example.com`
  people (with their accounts); the E2E clean-up deleted them and cancelled their invite links. Nothing made by hand.

**Next**
- Owner: review the PR. Seen while checking, not changed (F-016 as approved): at 1280 × 720 the desktop list under the
  account form's Currency field has room for only about one row and scrolls.

## 2026-11-06 (B-009: No empty gap under the Note on the phone)

**Done**
- [B-009](changes/bugfixes/B-009-gap-under-note/B-009-gap-under-note.md) on `bugfix/B-009-gap-under-note`. Reproduced
  in Storybook at 375 × 520 px (*Add phone* with no earlier notes: `кфс` left a 218 px empty block between the Note and
  Save). Cause: I-017's room for the list of earlier notes was added whenever the Note was typed on the phone, list or
  not. The owner approved fix A on 2026-11-06 ("Approved: build A").
- `NoteField` tells the form when its list shows (`onListed`); the room under the form and the scroll of the Note to the
  top now come only with the list. With no list the form stays where it is and the Note is only kept in sight. The
  desktop is unchanged. DESIGN_RULES' I-017 row says so.
- Tests: `TransactionsPage.test.tsx` (no room for a new note, room with the list, gone with it) and an E2E test (phone,
  375 × 520: the Note right above Save for a new note; the Note up and the list above Save for an earlier one). Both fail
  on the old code.
- Checked: frontend lint, format, typecheck, unit tests (293 / 293), build, `build-storybook`; backend build and tests
  (444 / 444, the backend isn't changed); the full E2E suite, desktop and phone (73 passed, 11 skipped for the other
  screen size); screenshots of the form at 375 × 520 (a new note, a list, the list gone, the keys after the Note) and
  1440 px, light and dark, looked at; the design check on *Note suggestions phone* and *loading*: 100 issues, the same
  as on `develop` (the open dialog over the page).
- Test data: the E2E runs' `e2e-note-gap-…`, `e2e-b009-shots-…` and other `e2e-…@example.com` people (with their
  accounts and transactions); the E2E clean-up deleted them and cancelled their invite links. Nothing made by hand.

**Next**
- Owner: review the PR.


## 2026-11-06 (I-022: The opening balance typed from the left)

**Done**
- [I-022](changes/improvements/I-022-opening-balance-left-aligned/I-022-opening-balance-left-aligned.md) on
  `improvement/I-022-opening-balance-left-aligned`. No design round (one field's alignment); the owner approved the
  description on 2026-11-06 ("Approved, build it").
- In the New account and Edit account forms the opening balance now starts at the left, where the Name and Opening date
  text start; the currency sign stays at the field's right edge. The cause was `text-align: right` on the field's
  `.amountInput` in `Accounts.module.css`, used by no other field. The quick-add form's display is unchanged.
- DESIGN_RULES: amounts typed in a form field start at the left; only the quick-add display is right-aligned. I-023's
  note now says I-022 came first.
- E2E: `accounts.spec.ts` checks the opening balance is aligned like the Name field (fails on the old rule: `right`).
- Checked: frontend lint, format, typecheck, unit tests (292 / 292), build, `build-storybook`; backend build and tests
  (444 / 444, the backend isn't changed); the full E2E suite, desktop and phone (72 passed, 10 skipped for the other
  screen size); screenshots of New account (with `1500` and with `-12500` typed) and Edit account at 375 and 1440 px,
  light and dark, looked at; the design check on the account form's stories (New account, Edit, with mistakes): Edit
  0 issues, the New account stories report the same 46 / 45 as on `develop` (the open dialog over the page).
- Test data: the E2E runs' `e2e-accounts-…`, `e2e-i022-shots-…` and other `e2e-…@example.com` people (with their
  accounts); the E2E clean-up deleted them and cancelled their invite links. Nothing made by hand.

**Next**
- Owner: review the PR. Next in the backlog: B-009 (the gap under the Note, Medium).

## 2026-11-05 (I-028: The phone keys fold away with Back or a swipe down, not the form)

**Done**
- [I-028](changes/improvements/I-028-fold-away-keys/I-028-fold-away-keys.md) on `improvement/I-028-fold-away-keys`.
  Design: 3 prototype stories (nothing shown, a handle, a ⌄ and keypad key); the owner chose variant 1 with variant
  2's handle on the keys. The final prototype was approved on 2026-11-05 ("Approved, build it"); its screenshots are
  in the change's `prototypes/`, the prototype stories are deleted.
- On the phone the quick-add form opens with its keys folded and one full-width Save, adding and changing alike. A tap
  on the amount brings them up, sliding from the sheet's edge with the sheet's grab handle on top. Back folds them
  before it closes the form; a swipe down on them folds them (the sheets' quarter and flick), a short one slides them
  back without pressing a key; a tap on the Note folds them as before. Nothing typed is lost. The desktop is
  unchanged.
- `popupHistory.ts`: the keys have a history step of their own over the sheet's. Closing a pop-up another way now takes
  away the steps over it too, in one traversal (a browser may drop a second one sent before the first lands), so the
  form closed with the keys up (×, Save, a swipe, Delete) leaves no extra Back.
- `useKeysSwipe.ts`: the keys' swipe, reusing the sheets' `shouldClose`.
- `BottomSheet`: the sheet is clipped (`overflow: clip`) instead of hidden. Storybook's quick-add story pressed a key
  while the keys were still sliding in, and the browser scrolled the whole sheet up to that key, its title out of
  sight; a clipped box can't be scrolled. Seen only in Storybook's quick clicks: Playwright couldn't reproduce it in the
  app, so no E2E test guards it.
- Tests: `TransactionsPage.test.tsx` (folded at the start, adding and changing; Back folds, then closes; no step left
  after × or Save; none on the desktop), `useKeysSwipe.test.tsx` (fold, flick, slide back without pressing, a wobbly
  press), `popupHistory.test.tsx` (a pop-up and one inside it closed together, in either order: fails on the old code),
  an E2E test (phone: folded, up on a tap, Back twice, the swipe, × leaves no step); the E2E helpers tap the amount
  before the keys. Stories: *Add phone* opens folded, *Sum on the keys* and *Exchange phone* tap the amount first.
- Checked: see the PR; the final prototype in the Browser pane and Playwright; the app's form at 375 px (opened,
  keys up, mid-swipe, folded) and 1440 px, light and dark, in Playwright screenshots, looked at.
- Test data: the E2E runs' `e2e-fold-keys-…`, `e2e-i028-shots-…` and other `e2e-…@example.com` people (with their
  accounts and transactions); the E2E clean-up deleted them and cancelled their invite links. Nothing made by hand.

**Next**
- Owner: review the PR. Built on I-027's keys (merged from `develop`: the phone's order and `.`); its E2E test now taps the
  amount before measuring the keys. Next in the same part of the form: B-009 (the gap under the Note).

## 2026-11-05 (I-027: The phone keys in a phone's order, `.` for cents)

**Done**
- [I-027](changes/improvements/I-027-calculator-key-order/I-027-calculator-key-order.md) on
  `improvement/I-027-calculator-key-order`. No variants (the owner gave the order from their reference picture); the
  owner saw one final prototype story (the real form, the keys copied into it) and approved it on 2026-11-05
  ("Approved, build it"). Its screenshots are in the change's `prototypes/`; the story is deleted.
- On the phone the keys are 1 2 3 + / 4 5 6 − / 7 8 9 ⌫ / . 0 = Save, ⌫ right above Save. `.` replaces `00` and types
  cents: one point a number, 2 digits after it, `0.` when first, a point with nothing after it dropped. The display
  shows `12.30 + 45.80` with `= 58` on top; =, Save and the saved amount are whole (ADR 0018). A lone `12.30` is
  saved as 12. The desktop is unchanged.
- Unit tests (`amount.test.ts`; the order and a sum with cents saved as 58 in `TransactionsPage.test.tsx`, both
  failing without the change) and an E2E test (phone: the order; phone and desktop: `12.30+45.80` saved as −58 ₴).
  The `SumOnTheKeys` story adds up cents.
- Checked: frontend lint, format, typecheck, build, unit tests (283 / 283), `build-storybook`; backend build and tests
  (the backend isn't changed); the full E2E suite, desktop and phone (71 passed, 9 skipped for the other screen size);
  screenshots of the expense, income and exchange forms with the keys at 375 px and the desktop form at 1440 px, light
  and dark, looked at. The design check on the prototype found only what it finds on the app's own quick-add story
  (an open dialog over the page, the page behind it), none on the keys.
- Test data: the E2E runs' `e2e-cents-…` and other `e2e-…@example.com` people (with their accounts); the E2E clean-up
  deleted them and cancelled their invite links. Nothing made by hand.

**Next**
- Owner: review the PR. Next in the backlog: I-028 (Medium, 🎨, the same keys) and B-009.

## 2026-11-05 (Plan: the phone keys and the Note — I-027, I-028, B-009)

**Done**
- Planned on `plan/quick-add-keys` the owner's list from production; nothing built. Each has its folder, description
  file and backlog row, all `Todo`:
  - [I-027](changes/improvements/I-027-calculator-key-order/I-027-calculator-key-order.md) (Medium): the phone keys in
    a phone's order, 1 2 3 on top, ⌫ above Save and `.` in place of `00` (typed cents rounded, ADR 0018), from the
    owner's reference picture; no × ÷, no category button (owner, 2026-11-05).
  - [I-028](changes/improvements/I-028-fold-away-keys/I-028-fold-away-keys.md) (Medium, 🎨): Back or a swipe down
    folds the keys instead of closing the form; the keys start folded and come up on a tap on the amount (owner,
    2026-11-05). With it the owner's question, the app's keys or the phone's number keyboard: the owner keeps the
    app's keys.
  - [B-009](changes/bugfixes/B-009-gap-under-note/B-009-gap-under-note.md) (Medium): an empty gap under the Note while
    it is typed on the phone. Likely cause, read from the code: I-017's room for the suggestions is added even when
    there is no list; to be confirmed by reproducing it.
- Priorities proposed by Claude, for the owner to confirm. The owner answered the open points on 2026-11-05; the
  answers are in the description files.
- Test data: none.

**Next**
- Owner: review the planning PR; approve each change before it is built.

## 2026-11-05 (I-024: The account list tells same-named accounts apart)

**Done**
- [I-024](changes/improvements/I-024-account-list-currency/I-024-account-list-currency.md) on
  `improvement/I-024-account-list-currency`. Design: 3 prototype stories (a code tag, two lines like the field, grouped
  by currency); the owner chose grouping by currency with changes, then asked for no groups and the account used last
  first. The final prototype was approved on 2026-11-05 ("Approved, build it"); its screenshots are in the change's
  `prototypes/`, the prototype stories are deleted.
- Each row of the quick-add form's account list (and Transfer's From and To lists) is the name and then its bank, Cash
  or own source in grey as one line that wraps, and on the right the balance with the currency's code (`$640 USD`).
  The list shows the account whose latest transaction was added most recently first, accounts without transactions
  last (oldest first). The closed fields don't change.
- Backend: the accounts API returns `lastUsedAt` per account, when its latest transaction was added (a transfer's for
  both its accounts), from the same database query as the balances and counts. `BalanceSheet.LastUsedOf` with an
  xUnit test; the API types regenerated.
- Frontend: `byLastUse` (unit test), the rows in `AccountList` (component test), stories *Transactions / Account list*
  (phone and desktop, light and dark), an E2E test (two "Mono", the dollar one picked by its row: the amount is in `$`).
- Checked: see the PR; screenshots of the Account sheet and dropdown and Transfer's To list in the app at 375 and
  1440 px, light and dark, looked at; the design check on the new story finds nothing.
- Test data: the E2E runs' `e2e-account-list-…`, `e2e-i024-shots-…` and other `e2e-…@example.com` people (with their
  accounts and transactions); the E2E clean-up deleted them and cancelled their invite links. Nothing made by hand.

**Next**
- Owner: review the PR. Next in the backlog: B-004 (Medium, 🎨).

## 2026-11-05 (B-005: The account list's scroll bar no longer covers the balances)

**Done**
- [B-005](changes/bugfixes/B-005-account-list-scroll-bar/B-005-account-list-scroll-bar.md) on
  `bugfix/B-005-account-list-scroll-bar`. Cause: Mantine draws the scroll bar over the content, and the desktop
  dropdown lists left the rows only their own 10 px padding beside it, so under the pointer the bar touched the
  balances. The owner saw the fix as a prototype story (the real screens, the gutter turned on by the story) and
  approved it on 2026-11-05 ("Approved, build it"); the prototype is deleted.
- Fix: `offsetScrollbars="present"` on the `Picker`'s list (Account, Transfer from / to, Category, the Transactions
  filter) and the currency list: a 12 px gutter for the bar while the list scrolls. Sheets, dialogs and the Note
  field's suggestions already kept clear of the bar and don't change.
- Unit tests (`Picker.test.tsx`, `CurrencyPicker.test.tsx`) and an E2E test (desktop, 10 accounts: every row ends at
  the bar); all fail without the fix.
- Checked: frontend lint, format, typecheck, build, unit tests (273 / 273), `build-storybook`; backend build and tests
  (the backend isn't changed); the full E2E suite, desktop and phone (67 passed, 9 skipped for the other screen size);
  screenshots of the Account, Category and currency dropdowns at 1440 px and the phone's Account sheet at 375 px, light
  and dark, looked at. The design check on the quick-add and New account stories finds the same 96 issues with and
  without the fix (an open dialog over the page, the desktop stories at other widths), so none are B-005's; not
  looked into further here.
- Test data: the E2E runs' `e2e-account-bar-…` and other `e2e-…@example.com` people (with their accounts); the E2E
  clean-up deleted them and cancelled their invite links. Nothing made by hand.

**Next**
- Owner: review the PR. Next in the backlog: B-004 and I-024 (Medium, both 🎨, on the account screens).

## 2026-11-05 (I-026: Prototypes in Storybook open like a page)

**Done**
- [I-026](changes/improvements/I-026-prototype-viewing/I-026-prototype-viewing.md) on
  `improvement/I-026-prototype-viewing`, approved by the owner on 2026-11-05 ("Approved, build it") after the plan was
  brought up to date: F-022 had been built, so no prototype stories were left to reshape, and point 4 (prototypes
  filling the window by default) was dropped, since the link already does it.
- The link `http://localhost:6006/?path=/story/<id>&nav=false&panel=false&globals=viewport.value:!undefined` opens
  a story filling the window without the sidebar and panel. The viewport list is now Phone 375 × 812, Tablet
  768 × 1024, Desktop 1440 × 900 (the design check's sizes); the grid / backgrounds, measure and outline buttons are
  off.
- The design-screen skill doesn't point the design check at a state through `&args=` in the address: that didn't
  change the Reports stories' state. States reached inside the page are clicked through in Playwright and their
  screenshots looked at instead.
- The rule (one story per variant, no `globals` in a prototype story, links in that form, Storybook checked running
  first) is in `CLAUDE.md`, `DESIGN_RULES.md` §2, `docs/changes/README.md` and the `design-screen` skill.
- Found in the build: Escape, also pressed inside the page, brought Storybook's sidebar and panel back (its
  shortcuts). At the owner's request Storybook's shortcuts are off (`.storybook/manager.ts`); checked in the Browser
  pane.
- Seen, not changed: Escape doesn't close the Reports page's currency list while the focus is on its pill (also
  outside Storybook's frame).
- Checked: frontend lint, format, build, `storybook build`, unit tests (in the full run 4 tests of
  `AuthPages.test.tsx` and `TransactionsPage.test.tsx` hit the 5 s timeout while other heavy jobs ran on the machine;
  both files pass on their own, 48 / 48, and no code they load is changed); this branch's Storybook in the Browser pane (link, toolbar,
  Phone / Tablet / Desktop, Light / Dark); the design check on a Reports story (0 issues). Backend and app code not
  changed.
- Test data: none.

**Next**
- Owner: review the PR.


## 2026-11-05 (I-025: Add transaction on the day picked in the calendar)

**Done**
- [I-025](changes/improvements/I-025-add-on-picked-day/I-025-add-on-picked-day.md) on
  `improvement/I-025-add-on-picked-day`; the owner approved the planned fix on 2026-11-05 ("Approved, build it").
- While the Transactions page shows one day, every Add transaction (the slip's, the sidebar's, the phone bar's +, the
  empty page's) opens the form on it: the page tells the form's provider the day on screen (`useFormDay`), and a new
  transaction starts on the request's date. Without a picked day, and on other pages, the form starts on today.
- Unit tests (picked day from the sidebar and the slip, saved with its date; today again once unpicked or on Accounts)
  and an E2E test (desktop and phone: a day of last month tapped, the shell's button, saved on that day's receipt);
  both fail without the fix.
- Checked: frontend lint, format, typecheck, build, unit tests, `build-storybook`; the full E2E suite (desktop and
  phone) against this branch's API; backend build and tests (the backend isn't changed); screenshots of the picked day
  and the form opened from it at 375 and 1440 px, light and dark, looked at.
- Test data: the E2E runs' `e2e-picked-day-…`, `e2e-shots-…` and other `e2e-…@example.com` people (with their data);
  the E2E clean-up deleted them and cancelled their invite links.

**Next**
- Owner: review the PR. Next in the backlog: I-026 (High).

## 2026-11-05 (B-008: The calendar's top cut off at the page's end, fixed)

**Done**
- [B-008](changes/bugfixes/B-008-calendar-cut-off-at-page-end/B-008-calendar-cut-off-at-page-end.md) on
  `bugfix/B-008-calendar-cut-off-at-page-end`. Found in B-007's screenshots (it was there before); the owner saw it in
  the Browser pane and asked for the fix ("fix it in this scope"). B-007's PR (#62) was merged before the fix was in
  it, so it is its own change, at the owner's choice. Cause: the sticky column is capped at the window, but its area
  ends with the receipts, above the page's bottom padding, so at the page's end the browser pushed the column up by
  16 px. Fix: the column also ends where the receipts end, never shorter than its parts' least height.
- The B-007 E2E test also checks the calendar's top at the page's end (−12 px without the fix).
- Checked: frontend lint, format, typecheck, build, unit tests; the full E2E suite (desktop and phone) against this
  branch's own API; screenshots at the page's end at 1440 × 900 and 1440 × 720, light and dark, folded and unfolded,
  looked at; walked through in the Browser pane, also with one category picked (short receipts). Backend not changed.
- Test data: an `e2e-manual-…@example.com` person with 14 expenses for the Browser pane, the screenshots' and E2E
  runs' own people (with their accounts and transactions); the E2E clean-up deleted them.

**Next**
- Owner: review the PR. Then I-025 (High).

## 2026-11-05 (B-007: "Where it went" cut off, fixed)

**Done**
- [B-007](changes/bugfixes/B-007-where-it-went-cut-off/B-007-where-it-went-cut-off.md) on
  `bugfix/B-007-where-it-went-cut-off`, approved by the owner on 2026-11-05 ("Approved, build it"). Cause: the list's
  scroll viewport took `height: 100%` of a column that has only a `max-height`, so it grew to the whole list and had
  nothing to scroll; the scroll area clipped the rest. Fix: on the desktop the viewport takes the scroll area's room
  (flex), and the column fits the window again when the page's content changes size.
- New E2E test (desktop, 1440 × 720, 14 categories): the wheel brings the last category into view and a click picks
  it; it fails without the fix.
- Checked: frontend lint, format, typecheck, build, unit tests; the full E2E suite (desktop and phone); screenshots at
  1440 × 900 and 1440 × 720, light and dark, calendar folded and unfolded, looked at; backend build and tests (the
  backend isn't changed). The E2E suite ran against this branch's own API: the one already running on 5297 was built
  before F-022 and failed the Reports tests.
- Seen, not changed (noted in the description file): at the very end of a short page the sticky column is pushed up
  and the calendar's top edge goes under the window's top; it was there before.
- Test data: the E2E runs' `e2e-where-…` and `e2e-shots-…@example.com` people (with their accounts and transactions);
  the E2E clean-up deleted them.

**Next**
- Owner: review the PR.


## 2026-11-05 (B-006: The currency sign no longer runs into the amount)

**Done**
- Reproduced [B-006](changes/bugfixes/B-006-currency-sign-overlaps-amount/B-006-currency-sign-overlaps-amount.md) in
  the quick-add stories: `135 ₴` and `$414` touch their sign on the desktop and the phone. The suspected cause (no gap)
  was wrong. The invisible copy that sets the amount input's width measured proportional digits while the input draws
  tabular ones; Unbounded's `1` and `4` are much narrower proportional, so the box came out 4–5 px too narrow and the
  number ran up to the sign (`$414`: its first `4` cut under the `$`). The owner approved the cause and the fix
  ("Approved, build it").
- Fixed in `TransactionForm.module.css`: the copy uses tabular digits like the input, and its trailing space (which put
  the extra room between a `$` and the number) became 2 px at the end of both, for the caret.
- A story `Transactions/Amount display` with `135 ₴`, `$414`, `1 250 000 ₴`, `€0`, a sum and an exchange's two amounts,
  its play function checking that each fits its box; `transactions.spec.ts` checks `135 ₴` and `$414` fit (desktop and
  phone), and fails by 4 px and 5 px with the old CSS.
- Checked: frontend lint, format, typecheck, build, unit tests, `build-storybook`; the full E2E suite (desktop and
  phone); the design check on the new story (two findings that were there before the fix: the empty input is under
  44 px wide and has no focus ring of its own, while the whole display is the tap target and draws the ring);
  screenshots of the form with `135 ₴`, the exchange with `$414` and the story at 375 and 1440 px, light and dark,
  looked at and zoomed in. Backend untouched.
- Noted in B-006, not fixed: in the Browser pane the exchange stories' scripted typing sometimes leaves `100` in the
  From field while the form holds nothing (`$10`, To `0`); typing by hand works.
- Test data: the E2E runs' own people; the E2E clean-up deleted them (with their data) and cancelled their invite links.

**Next**
- Owner: review the PR. Then B-007 and I-025 (High).

## 2026-11-04 (F-022: Reports screen, built)

**Done**
- The owner approved the final prototype with the month as M2 ("I like M2 variant … approved"; the open points as
  proposed); recorded in the description file and DESIGN_RULES "Screen decisions". The final prototype's screenshots
  (year and month, 375 and 1440 px, light and dark) are in the change's `prototypes/`; its stories are deleted.
- Built [F-022](changes/features/F-022-reports-ui/F-022-reports-ui.md) on `feature/F-022-reports-ui`: the year as the
  folding table on the desktop and tablet and as months on the phone, the month as a receipt a group with its balance;
  Year / Month, ‹ › over the periods with data, the report currency as a filter pill for this visit; the period and
  currency in the page's address; a category's amount opens its transactions. M4 (Reports) is done.
- The design round's "prototypes that open like a page" is now
  [I-026](changes/improvements/I-026-prototype-viewing/I-026-prototype-viewing.md): it was planned here as I-022, but
  `develop` gave I-022 – I-025 to the production testing fixes (#59) in the meantime. Still `Todo`.
- API: the report says the person's first month with data (`firstMonth`). Shared: `CurrencyPicker`'s `pill` option,
  the filter pill's styles moved to `Pills.module.css`, a wide page option in the shell.
- Checked: backend build and tests; frontend lint, format, typecheck, build, unit tests, `build-storybook`; the full
  E2E suite (desktop and phone) with the new Reports test; the design check on the Reports stories (0 issues on the
  page after one fix; the currency sheet's "outside the screen" at 360 px happens on the existing sheet story too);
  screenshots of the year, month, empty, couldn't-load and loading states at 375 and 1440 px, light and dark, looked
  at; walked through in the Browser pane against this branch's API (unfold, a cell to Transactions and Back, a month,
  dollars, the phone's sheet).
- The owner's review of PR #60 ("if there are no data for all month, maybe collapse them?"), with the look picked from
  three: the months before the first entry are one folded column in the year's table ("Jan – Oct · before your first
  entry", a tap unfolds them, a narrow column folds them back; while folded the card is as wide as its columns) and
  one row on the phone. Unit tests, stories (a person who started this month), the E2E check and screenshots at 375
  and 1440 px, light and dark, folded and unfolded; design check 0 issues.
- More of the owner's review, 2026-11-05: the fold buttons' hovers round and clear of the borders, the ‹ closer to Jan; no
  empty row between the groups and the summary;
  the phone's rows lit within the page's edges; and, in this PR at the owner's choice, the Transactions calendar kept
  within the page's edges below 375 px (its days 1 px apart, 44 px wide down to 360 px).
- Test data: a test person `e2e-manual-…@example.com` with two accounts and two years of transactions, and an
  `E2E manual F-022` invite link, for the walk-through; the E2E runs' own people. The E2E clean-up deleted the people
  (with their data) and cancelled the invite links.

**Next**
- Owner: review the PR. Then M5 (Family).

## 2026-11-04 (Plan: production testing, B-004 – B-007, I-022 – I-025)

**Done**
- Planned on `plan/prod-testing-fixes` the seven issues the owner found testing production, as four bugfixes and four
  improvements (the account list's item split in two). Nothing built; all `Todo`, each to be built on its own branch
  after the owner's approval:
  - [B-006](changes/bugfixes/B-006-currency-sign-overlaps-amount/B-006-currency-sign-overlaps-amount.md) (High): the
    currency sign overlaps the amount in the quick-add calculator display.
  - [B-007](changes/bugfixes/B-007-where-it-went-cut-off/B-007-where-it-went-cut-off.md) (High): "Where it went" is cut
    off on the desktop and doesn't scroll.
  - [I-025](changes/improvements/I-025-add-on-picked-day/I-025-add-on-picked-day.md) (High): Add transaction opens on
    the day picked in the calendar.
  - [B-004](changes/bugfixes/B-004-currency-search-not-typing/B-004-currency-search-not-typing.md) (Medium): nothing can
    be typed in the account form's currency search; three variants to prototype (fix the dropdown, type in the field
    itself, a list step inside the dialog), as the owner asked for another way to solve it.
  - [B-005](changes/bugfixes/B-005-account-list-scroll-bar/B-005-account-list-scroll-bar.md) (Medium): the account
    list's scroll bar covers the balances.
  - [I-024](changes/improvements/I-024-account-list-currency/I-024-account-list-currency.md) (Medium): the account list
    shows each account's currency (and bank).
  - [I-023](changes/improvements/I-023-opening-balance-calculator/I-023-opening-balance-calculator.md) (Low): the
    opening balance works as a calculator, with the app's own keys on the phone.
  - [I-022](changes/improvements/I-022-opening-balance-left-aligned/I-022-opening-balance-left-aligned.md) (Low): the
    opening balance typed from the left.
- The bugs' root causes are suspected from reading the code, not confirmed: each is reproduced on its own branch before
  its fix is proposed for approval. The owner's screenshots stay out of the repo (they show real balances).
- The owner's answers (2026-11-04): I-025 is High and I-023 Low, the other priorities as proposed. I-022: the sign
  stays at the field's right edge. I-023: the app's own keys on the phone, as in the quick-add form, but not opened
  as the account form opens. I-025: a past month without a day opens the form on today.
- Test data: none.

**Next**
- Owner: review the planning PR. Then the High ones first: B-006, B-007 and I-025.

## 2026-11-04 (F-022: Reports screen, design round 1)

**Done**
- Started [F-022](changes/features/F-022-reports-ui/F-022-reports-ui.md) on `feature/F-022-reports-ui`; status In
  progress. No code: the change isn't approved yet.
- References (the owners' spreadsheet, YNAB's Income v Expense, Actual Budget's custom reports, Monarch's cash flow,
  the app's own Transactions page) in the description file; Mobbin turns the browser away (403).
- The first round made of stories (I-021): *Prototypes / F-022 Reports* in Storybook, the real shell and parts with a
  test year in the spreadsheet's shape. Variant 1 · The sheet, filled in (frozen panes on both edges, every amount with
  its currency, the month as two receipts); variant 2 · This month, against your usual (the month first on the slip,
  the months as NET bars, categories as bars with a tick at their usual month); variant 3 · One sheet, tap a month
  (folding groups, the year as bars over the months, unusual months in four reds, a month opens as a receipt).
- Five open points with proposals in the description file (the currency in every cell, another currency only on this
  page, which month opens, a cell as a link to its transactions, the years).
- Checked: typecheck, ESLint, Prettier; the design check on every variant's stories, 4 issues left after fixes (the
  months' and groups' buttons under 44 px, their names not matching the visible text, bars drawn under the tab bar,
  the table not opening on this month), all in variant 3's month sheet on the phone: two from the shared sheet (its
  title row is a `<header>`, a second banner next to the top bar), two a receipt with nothing to focus in a scrolling
  sheet (gone once its lines are links, open point 4). Screenshots at 375 and 1440 px, light and dark, looked at
  (fixed: variant 3 too wide for 1440 px, variant 1's month half empty on the desktop, a cut-off label).
- The owner picked variant 3's year with variant 1's month; built as the final prototype (Year / Month, a month's
  heading opens it). Design check 0 issues; screenshots at 375 and 1440 px, light and dark, looked at.
- The owner found the stories "worse than HTML": planned as
  [I-026](changes/improvements/I-026-prototype-viewing/I-026-prototype-viewing.md) (High). Found: the desktop stories
  drew a fixed 1280 px frame and locked the viewport, 13 stories for 3 variants, Storybook's chrome. Done in F-022's
  stories already (no config change): one story per variant, links that open the page filling the window without the
  sidebar and panel (`&nav=false&panel=false&globals=viewport.value:!undefined`), the screen size from the toolbar. The
  Storybook config part waits for the owner's approval.
- The owner found the year awful on the phone (mobile first): three phone options on the final prototype, all with a
  shorter head — A the table tighter, B one month at a time with its usual month (recommended), C months as rows.
  Design check 0 issues; screenshots at 375 and 1440 px, light and dark, looked at.
- The owner dropped option A and asked to leave out categories with nothing in the year (and a group left without
  any); done in the final prototype. Design check on B, C and the month 0 issues; screenshots looked at.
- The owner asked for a visible scroll bar on a table wider than the screen: the year's table keeps its bars on when it
  doesn't fit (a custom rule in DESIGN_RULES). Checked at 1000 and 1024 px, light and dark; design check 0 issues.
- The owner picked phone C (months as rows) for the year; B dropped. The month's categories "look like one solid
  list": three looks with the groups set apart — M1 sections of one receipt, M2 a receipt a group (recommended), M3
  bars. Design check 0 issues; screenshots looked at.
- The report currency is now the Transactions page's filter pill, opening the shared currency list (owner: "use selects
  from the design system"). Design check 0 issues.
- The owner found the table's bars broken (over the rows, the upright one with nothing to scroll, crossing in the
  corner): now a bar only for each way that doesn't fit, in a gutter of its own. Checked at 1100 and 1440 px, light and
  dark; design check 0 issues.
- Then the table takes the height it needs and the page scrolls (owner): no scroll up and down of its own, only the
  sideways bar when it's too wide. Design check 0 issues.
- Test data: none.

**Next**
- Owner: pick the month's look; then approve the final prototype for implementation (and the open points'
  proposals); approve I-026's config part.

## 2026-11-04 (F-021: Report engine)

**Done**
- The owner approved F-021 ("Approved, build it"); recorded in the description file before the build.
- Built [F-021](changes/features/F-021-report-engine/F-021-report-engine.md): `GET /api/reports/year?year=…` and
  `GET /api/reports/month?month=yyyy-MM` (optional `currency`), one `Report` shape. The pure `ReportBuilder`
  (Application) works it out from what `ReportService` has the database sum: incomes and expenses per day, currency and
  category, and each account's movement per month. Conversion at each amount's own day; real month-end balances (this
  month equals the Accounts total); the "Other changes" row; Avg from the first month with data; months still to come
  `null`; amounts without a rate left out and marked. API types regenerated for F-022.
  [ADR 0027](decisions/0027-report-engine.md); ARCHITECTURE.md updated.
- Decided while building: the month-end balances live in `ReportBuilder` (Application), not next to `BalanceSheet`
  (Domain), as an archived account's day is a Kyiv date.
- Checked: backend build and all 440 tests (among them `ReportBuilderTests`, and `SpreadsheetYearTests`: a test year in
  the spreadsheet's shape whose every hryvnia category, group and month total matches the spreadsheet); frontend lint,
  format, typecheck, build, `build-storybook`; the full E2E suite (desktop and phone) with the new
  `e2e/reports.spec.ts` against the real NBU (auth.spec's sign-up on the desktop hit the sign-in rate limit once and
  passed when re-run). The frontend unit tests timed out locally on some Transactions page tests, with or without this
  branch's only frontend change (the generated types), while other sessions kept the CPU at 100%; CI runs them. No
  screen changed: no design check or screenshots.
- Test data: the E2E runs' own people (`e2e-reports-…@example.com` and the other specs'), deleted by their clean-up.

**Next**
- Owner: review the PR. Then F-022, the Reports screen (3 prototype stories first).

## 2026-11-04 (F-021: Report engine, plan)

**Done**
- Started [F-021](changes/features/F-021-report-engine/F-021-report-engine.md) on `feature/F-021-report-engine`;
  F-021 and M4 In progress. No code: the change isn't approved yet.
- The description file now has the full plan: the yearly and monthly report's rows and summary, Avg's months, month-end
  balances (this month equals the Accounts total), missing rates, two endpoints (`/api/reports/year`,
  `/api/reports/month`, optional `currency`), the pure `ReportBuilder`, an API-level E2E test, ADR 0027 to come; and
  seven open points with proposals (Avg in the first year and this month, accounts opened mid-year and archived ones,
  NET vs the balance's change, the spreadsheet fixture, many NBU calls at once).
- The owner answered all seven open points (Avg from the first month with data, this month counted; accounts from
  their opening month, archived ones until the month before; the real balance with an "Other changes" row; a test
  year in the spreadsheet's shape for the fixture; the first slow opening is fine). PRODUCT.md business rules 4 and 7
  updated.
- Test data: none.

**Next**
- Owner: approve F-021 before it is built.

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
  ([ADR 0026](decisions/0026-no-copies-of-accounts.md)). The migration ran on `dev`; whether it made the index there
  couldn't be read from here (no database access), so the owner checks `dev` and production with the PR's query.
- Checked: backend build and tests, frontend lint, format, typecheck, build, unit tests, `build-storybook`, the full
  E2E suite (desktop and phone), the design check on Accounts (0 issues), screenshots of the New account form with the
  copy error and of the refused restore at 375 and 1440 px, light and dark, looked at; walked through in the Browser
  pane.
- Test data: a test person `e2e-manual-…@example.com` with three accounts and an `E2E manual I-020` invite link, for
  the walk-through; the E2E runs' own people. The E2E clean-up deleted the people (with their accounts) and cancelled
  the invite links; the test person can no longer sign in.

**Next**
- Owner: review the PR; check `dev` and production for the index and for existing copies.
## 2026-11-04 (I-021: Prototypes in Storybook)

**Done**
- I-021, asked for by the owner: from now on a design round's variants and final prototype are Storybook stories in
  `frontend/src/prototypes/<ID-name>/` (*Prototypes / <ID> <name>*), made of the real screen, components, theme and
  fake data with only the new part added, so they look like the app. A prototype never edits the app's files; it is
  deleted when the change is built, and the final prototype's screenshots stay in the change folder.
  [ADR 0025](decisions/0025-prototypes-in-storybook.md).
- Rules updated in `CLAUDE.md`, `DESIGN_RULES.md` §2, `docs/changes/README.md` and the `design-screen` skill.
- The design check takes a story's address: light and dark through the Storybook global, screenshots named after the
  story. Tried on *Transactions / Transactions list / This month*: 0 issues; the 375 and 1440 px shots in both
  schemes looked at.
- Test data: none.

**Decisions**
- Picked by the owner in chat: stories (not HTML exported from Storybook, not HTML with the theme's tokens); prototype
  stories deleted after the build. Earlier changes keep their HTML prototypes.

**Next**
- The next 🎨 change (I-016 or another) is the first round made of stories.

## 2026-11-04 (I-017: Note suggestions)

**Done**
- Started I-017 (note suggestions) on `improvement/I-017-note-suggestions`; status In progress. No code: the change
  isn't approved yet.
- References (Baymard on autocomplete, the phone keyboards' word strip, the browser's and Mantine's autocomplete, the
  app's own lists and receipts) in the description file. Monefy and Wallet weren't looked at: not open without signing in.
- Three prototypes on the form as built: [variant 1 · The app's dropdown](changes/improvements/I-017-note-suggestions/prototypes/variant-1.html),
  [variant 2 · Pills by the keys](changes/improvements/I-017-note-suggestions/prototypes/variant-2.html),
  [variant 3 · From your receipts](changes/improvements/I-017-note-suggestions/prototypes/variant-3.html) (the
  category comes with the note: more than the criteria ask). In all three the app's keys fold away on the phone while a
  note is typed, so the phone's keyboard and the list have room.
- Checked: the design check on all three, 0 issues after fixes (the phone list drawn outside the sheet, an empty list
  still marked as one, a 35 px Undo, the account field's name); screenshots of all five screens at 375 and 1440 px,
  light and dark, looked at (fixed: the typed part too faint to tell apart, now grey; Undo's gaps; a list cut off with
  no fade).
- Test data: none.

- The owner chose variant 1, with the notes that start with what was typed first. Built as the
  [final prototype](changes/improvements/I-017-note-suggestions/prototypes/variant-4.html) ("si": Silpo, Simcard
  top-up, Silpo, wine for Friday, then Physio session, Kids' music lesson); the criteria say so. Design check 0 issues;
  all five screens at 375 and 1440 px, light and dark, looked at.

- The owner approved the final prototype ("the prototype is approved, build it"); recorded in the description file and
  DESIGN_RULES "Screen decisions" before the build.
- Built: `GET /api/transactions/notes` (the person's own notes of the form's type, grouped in the database, matched and
  ordered by the pure `NoteSuggestions.Of`: starts-with first, then use and date, case ignored in Ukrainian too, at most
  5); the Note field as a Mantine `Combobox` in the app's dropdown look (`NoteField.tsx`), asked for after a 200 ms
  pause; on the phone the app's keys fold to one Save while the note is typed (a tap on the amount brings them back), the
  Note field scrolls to the top with the list under it down to Save, and a full sheet follows the phone's keyboard
  (`useKeyboardInset`). Stories: suggestions on the phone and the desktop, light and dark, Ukrainian, none, loading.
- Checked: see the PR (tests, E2E, screenshots at 375 / 520-high and 1440 px, light and dark, looked at; fixed on the
  way: the desktop list shrinking instead of turning up above the field, the phone's list faded by the form's own fade).
  Not tried on a real phone: Playwright has no phone keyboard.
- Test data: the E2E run's `e2e-notes-…@example.com` people (and the spec's others), deleted by its clean-up.

**Next**
- Owner: review the PR; try the Note field on a phone (the keyboard and Save above it).

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
