# F-020 · Transactions list

| | |
|---|---|
| Type | Feature |
| Milestone | M3 — Transactions |
| Status | Done |
| Branch | `feature/F-020-transactions-list` |
| Design | 3 HTML prototypes required |
| Approved | 2026-11-03: [variant 8](prototypes/variant-8.html) as revised, with the plan and the open points' proposals ("variant 8 for F-020 is approved, build it"); 2026-11-03: [variant 9](prototypes/variant-9.html), Add transaction on the slip, with the round + in the phone's month row ("+ in the row, approved") |

## Goal

Find, review and correct past transactions.

## Acceptance criteria

- [x] List grouped by day, newest first, with daily totals
- [x] Filters: period, account, category, type
- [x] Open a transaction to edit; delete with confirmation
- [x] Loads more on scroll

## Tasks

- [x] 3 HTML prototypes (2026-11-02)
- [x] Round 2: 3 bolder prototypes after the owner found round 1 too plain and too technical (2026-11-03)
- [x] Round 3: the owner's mix of variants 4 and 5, together or with a view switch (2026-11-03)
- [x] Owner picks a variant; final prototype approved with the plan (variant 8, 2026-11-03)
- [x] API with filters and paging (2026-11-03)
- [x] UI (2026-11-03)
- [x] Storybook stories (2026-11-03)

## Design

### References (2026-11-02)

Mobbin needs a sign-in, so the references are open help pages, app listings and source code.

- **Monefy** ([App Store](https://apps.apple.com/app/id1212024409)) — what the owners use today: one period at a time
  (day, week, month, year, a range) switched at the top, the account picked in the top bar, the period's totals on the
  home screen. Taken: the month as the unit you step through (variant 1) and the period's totals over the list.
- **Monize** ([Transactions wiki](https://github.com/kenlasko/monize/wiki/Transactions)) — an open-source web app: a
  filter panel (accounts, categories, period presets such as "Month to date", a custom range, text search), each
  active filter shown as a chip with its own × when the panel is closed, a click on a row opens the edit form.
  Taken: removable chips for the active filters (variants 2 and 3) and the period presets.
- **PocketGuard** ([filtering on mobile](https://pocketguard.com/news/transaction-filtering-mobile/)) — filters open
  from one icon on the Transactions screen: date range, accounts, categories and more in one screen. Taken: variant 3's
  one Filters sheet on the phone.
- **Toshl** ([expenses, incomes and transfers](https://toshl.com/blog/how-to-track-expenses-incomes-and-transfers-web-app/),
  [filtering](https://toshl.com/blog/filtering-your-financial-data-and-making-needles-easier-to-find-than-haystacks-web-app/))
  — the month label opens a quick month pick; with one account picked, a transfer shows as money out of or into that
  account. Taken: the month label as a button (variant 1), a transfer seen from the picked account (open point 4).
- **The owners' Google Sheet** — a month is a column of numbers that add up. Taken: variant 1's ledger table on the
  desktop, with the day's total aligned under the amounts.
- **F-018's list as built** — rows with the category, the account and note under it, the amount on the right in the
  type's color with a true sign; a row opens the form; Delete in the form asks first. Kept in every variant.

### Brief

- **Who and when:** on the phone, checking "did I enter the coffee?" or fixing a wrong amount right after paying; on
  the desktop at the month's end, going through a month or one category ("how much on eating out in October?") before
  reading the report.
- **The one job:** find a transaction fast and fix it. First seen: the newest days with what each day cost.
- **The subject's world:** a bank statement and a till receipt (lines by date, a total under them), the month column
  of their spreadsheet.
- **Feeling:** calm and in control: nothing missing, every number adds up.

### Token plan

The app's theme (F-010, DESIGN_RULES §3) is fixed: charcoal buttons, sky accent, Unbounded 300 for headings and big
amounts, Manrope 400/500 for text, radius 12 / 24, the expense red, income green and transfer blue of F-018 / F-019.
The variants differ in structure and density, not in colors:

- **Amounts:** tabular figures, right-aligned, a true − / +; a day's total in the text color (muted) with its sign, a
  received total in green.
- **Motion:** only F-018's: the row just saved lights up and fades; a deleted row's balance counts in the notification.
- **The bold element:** variant 1 the ledger table, variant 2 the month headers in the stream, variant 3 the month
  strip of spending bars.
- **Mantine:** table rows and the strip are CSS modules on theme tokens; chips, menus and sheets are the app's own
  `Picker` / `BottomSheet` / `ResponsiveDialog`.

### Variants (2026-11-02)

- [Variant 1 · Month ledger](prototypes/variant-1.html) — the spreadsheet's month: you step through months
  (‹ October 2026 ›), with the month's spent and received on top; account and category as two select buttons and the
  type as a switch; on the desktop a dense ledger table (Category, Account, Note, Amount) with each day's total under
  the amount column, a ⋯ on the row for Edit / Delete. More of the month loads on scroll; at its end "Show September".
- [Variant 2 · Pocket stream](prototypes/variant-2.html) — one endless stream, newest first, across months: a sticky
  month header with the month's totals, days with their totals. Four chips (Period, Account, Category, Type); an
  active chip shows its value and its own ×, and a line says what the filters found ("Groceries in October: 38, spent
  6 420 ₴"). Swipe a row left on the phone (a trash button under the pointer on the desktop) to delete it.
- [Variant 3 · Filters and the month strip](prototypes/variant-3.html) — the period on top as a strip of bars, one per
  day, as tall as the day's spending (with a mouse a bar jumps to its day); the period's spent and received. All
  filters in one panel: on the right on the desktop, a "Filters" sheet with "Show 38 transactions" on the phone; several
  accounts and categories can be picked (a whole group at once). Active filters as chips above the list. Delete only
  from the form.

Every variant: a row opens the edit form (F-018 / F-019's, as built) where Delete asks first and says what the balance
goes back to; a "Nothing found" state with "Clear filters"; loading, loading more, error and no-transactions states.

### Round 2 (2026-11-03)

The owner's feedback on round 1: **too plain and too technical**. Each new variant has one memorable idea from the
couple's world (a till receipt, a calendar, their bank cards), friendlier words ("You spent… and received…", "Where it
went") and filters that sit inside the picture instead of a row of form controls. Theme, fonts and colors stay the
app's.

More references:

- **Money Manager** by Realbyte ([help: Home tab](https://help.realbyteapps.com/hc/en-us/articles/360046150874-Home-tab))
  — a calendar tab with the month's income and spending. Taken: the month as a calendar (variant 5).
- **Copilot Money** ([design analysis](https://blakecrosley.com/fr/guides/design/copilot-money)) — charts are how
  you move around the data, not decoration: a tap on a chart's part shows its breakdown, a swipe moves the period.
  Taken: "Where it went" bars and calendar days that filter the list (variant 5), the period's receipt lines
  (variant 4).
- **Spendee** ([App Store](https://apps.apple.com/app/spendee-budget-app-planner/id635861140)) — wallets as cards;
  reviewers dislike having to swipe between cards instead of seeing them all. Taken: account cards as the account
  filter (variant 6), sideways only on the phone and all at once on the desktop.
- **Expense Tracker App** shot on Dribbble ([Purrweb](https://dribbble.com/shots/12917678-Expense-Tracker-App)) — a
  cheerful look that stands apart from banking apps, the scanned receipt next to the purchase. Taken: the receipt as
  the day's shape (variant 4).
- **A till receipt and a bank statement** — lines with dotted leaders and the total at the foot; a statement's
  balance after every line. Taken: variant 4's slips, variant 6's running balance.

Variants:

- [Variant 4 · Till receipts](prototypes/variant-4.html) — every day is a receipt slip with torn edges: the day on
  top, a line per transaction with a dotted leader to its amount (account and note under it), the day's total at the
  foot. The month is the page's big title (‹ October 2026 ›, the title opens the period list) with a sentence under it:
  "You spent 54 813 ₴ and received 63 700 ₴." On the desktop the month's own receipt stays on the left: every
  category with what it cost; a click on a line shows only that category. On the phone that receipt opens from a
  "By category" button. Account and type as two buttons.
- [Variant 5 · Spending calendar](prototypes/variant-5.html) — the month as a calendar (Monday first), each day as
  deep a red as what it cost (four steps, by the month's quarters) with the amount in it and a green dot on days with
  income. Tap a day to see only that day ("Only Saturday, 24 Oct · Show all of October"). "Where it went": the month's
  categories as bars; pick one and the calendar and the list show only it (when did we eat out this month?). On the
  desktop the calendar and the bars stay on the left, the days on the right; on the phone the bars open from a
  button.
- [Variant 6 · Wallet and statement](prototypes/variant-6.html) — the accounts as F-014's cards on top (Solid,
  Tinted, Envelope, Plain), All accounts first with the total; pick a card and the list becomes its statement with the
  balance after every row. The filters are the heading, a sentence changed word by word: "**Everything** in **all
  categories**, **October 2026**". Each day starts with its date as a big number. A row opens the form; on the desktop
  a ⋯ beside it has Edit and Delete.

The open points above stand for these variants too; variant 5 answers point 3 with "this month" (a calendar is a
month), and its only periods are a month or a day.

### Round 3 (2026-11-03)

The owner's feedback on round 2: she likes variant 4's receipts, but the period's spent and received must be more
visible, on top of the page, so they catch the eye; she likes variant 5's calendar and the category bars with their
share, but its list is too plain; variant 6 is out. She asked for a combination or a switch between views, so both
are built on the same parts:

- **Totals on top (both):** the period's spent and received, big (48 px on the desktop), on a dark slip with a torn
  bottom edge (light grey in dark mode, like F-014's Solid card); a bar for how much of what came in is spent and a line
  "86% of what came in is spent; 8 887 ₴ left" (or "Spent … more than came in"). The month is its title with ‹ ›, and
  the title opens the period list.
- **Where it went (both):** variant 5's bars with each category's amount and share of the spending; a click shows only
  that category, in the calendar too.
- [Variant 7 · Receipts and calendar together](prototypes/variant-7.html): one page: the totals, then the calendar and
  the categories (on the left on the desktop, sticky; on the phone one after another with the top five categories and
  "All 16 categories"), then variant 4's receipts. Tap a day to see only its receipt.
- [Variant 8 · Receipts or calendar](prototypes/variant-8.html): the totals, then a switch **Receipts | Calendar**.
  Receipts: the slips, with the categories on the left on the desktop and behind a "By category" button on the
  phone. Calendar: the calendar and the categories, with the receipt of the day you tap (the latest day at first)
  under it on the phone and on the right on the desktop. The calendar is one month: with This year, All time or a range
  only Receipts is on.
- New open point 7 (variant 8): whether the switch remembers the last view on the device. *Proposal:* yes, like the
  open category groups of F-015.

**Variant 8, revised (2026-11-03):** the owner chose variant 8 to work on and asked for the calendar to fold instead
of the Receipts / Calendar switch. Now [variant 8 · Receipts with a folding calendar](prototypes/variant-8.html): the
totals, the filters, a **Calendar** section, then the receipts. Closed, the section is one row, "Calendar" with a strip
of the month's days in their colours (the picked day marked); a tap opens the full calendar, where a day shows only
its receipt ("Only Saturday, 10 Oct · Show all of October"). At first it is closed on the phone, so the receipts start
right under the totals, and open on the desktop, in the left column above "Where it went". On the phone the
categories open from "By category". With This year, All time or a range there is no calendar. Open point 7 becomes:
the calendar remembers open or closed on the device. *Proposal:* yes.

The owner didn't like the closed calendar's strip of the month's days. Now closed it shows **one week** of the same day
squares (Monday to Sunday, "This week", or the picked day's week as "5 Oct – 11 Oct"), so a day can be tapped
without opening the month; "Show the month" opens it, "Show one week" folds it back. The colour legend shows only with
the whole month.

At the owner's request the filters (account, type, a picked category) head the receipts column on the desktop, right
above the first receipt. On the phone they stay above the calendar.

**Phone first (2026-11-03).** The owner asked to improve the phone. Measured at 375 px, the first receipt started
567 px down (about 170 px of it visible above the tab bar), the filters were 448 px wide in a 375 px screen ("By
category" cut off), and once you scrolled the totals and the month were gone. Now:

- **Compact totals:** spent and received side by side (28 px, 24 px on phones up to 400 px), the bar and its line
  under them; the block is 171 px instead of 266, and the first receipt starts at 469 px.
- **Swipe the totals** left or right for the next or previous month (or year), as Copilot Money moves between
  periods; the totals follow the finger a little, and nothing happens past this month. ‹ › stay for a mouse and the
  keyboard.
- **A slim totals bar:** once the big totals scroll away, a dark bar with a torn edge stays under the app's top bar:
  the month, spent and received; a tap goes back to the top. Phone and tablet only.
- ~~**Filters in one row:** three equal buttons~~ — still cut off on the owner's screen ("Accou…", "Categ…"). Replaced
  by **one Filters sheet** (PocketGuard's pattern): below 768 px one "Filters" button with how many are on, and each
  picked filter as a chip with its own × next to it ("Wallet ×", "Eating out ×"; nothing picked: the button alone,
  the owner asked to drop the "All accounts and categories" line). The sheet holds Account and Type as pills and the category bars with their shares; picks apply at
  once, the button says "Show 5 transactions", "Clear all" next to it. Chips wrap, so nothing is cut off. Tablet and
  desktop keep the separate buttons.
- **Desktop: "Where it went" scrolls.** The sticky left column was taller than the window, so the lower categories
  could never be reached. Now the column is at most the window's height and the category list scrolls inside it
  (the app's fading scroll area, its bar in the gap beside the column). ~~At the list's end the wheel goes on to scroll
  the page.~~ The owner: at the list's top or end the wheel must not scroll the receipts. Now the list keeps the wheel
  at both ends (`overscroll-behavior: contain`), and the column is fitted to the visible part of the window at every
  scroll position, so the list's last row is always on screen when the list is (at the top of the page it is short,
  about three rows in a 900 px window, and grows to the window's height as the page scrolls).
- **Owner's review of the sheet and the fold:** the calendar's head has no "Show the month" / "Show one week" words,
  only the arrow (the whole row still folds it; screen readers hear "show the whole month"). In the Filters sheet the
  sections stay at the top when the categories go away, so Transfers no longer leaves a gap between Account and Type;
  with Income picked the sheet (and the desktop's column) shows income's own categories in green, "Where it came
  from"; a type that doesn't fit the picked category drops it. A sheet's scroll bar sits in its side margin, not over
  the rows.
- **The calendar's frame everywhere:** on phones up to 400 px it had been dropped to keep the days 44 px wide. ~~An
  edge-to-edge band~~ was tried; the owner wants the desktop's frame with its margins. Now the phone has the same
  rounded, bordered frame, 16 px from the screen's edges and 8 px inside (days 44.7 px at 375 px); below 375 px it
  sits 12 px from the edges, 6 px inside, so the days stay 44 px (44.3 px at 360 px).

### Round 4: Add transaction on the slip (2026-11-03)

At the PR review the owner asked for an Add transaction button in the black totals slip, and for a prototype first.
[Variant 9](prototypes/variant-9.html) is variant 8 with it:

- **Desktop and tablet:** a light pill "+ Add transaction" at the end of the month row, in the slip's own light colour
  (as the Solid card's + column of F-018). On a slip narrower than 560 px (a tablet with the full sidebar) it is a
  round + with the same name for screen readers, so it never runs into the month.
- **The phone has no room for the words in the month row.** Three options (the Screen switch): under the totals as
  the slip's last row (about 52 px taller, the first receipt starts lower); a round + in the month row (below 375 px
  the month's name is 17 px so the arrows keep their room); or no button (the tab bar's + only, one tap away).
- With one account picked, the form opens with that account (F-018's + on a card does the same).
- References: Monefy (the owners' current app: add sits right by the period's totals), F-014's Solid card and its +
  column (F-018) for the colours.
- Checked: design check 0 issues; screenshots at 360, 375, tablet and desktop, light and dark (fixed: the round + at
  360 px crowded the › arrow; the pill ran into the month on the tablet).
- **Approved 2026-11-03:** the owner picked the round + in the phone's month row ("+ in the row, approved").

### Open points (approved with variant 8 on 2026-11-03: each proposal as written)

1. **Daily totals:** what a day's header shows. *Proposal:* what was spent that day (−) and, when there was income,
   what was received (+, green), side by side. Transfers aren't counted (business rule 2).
2. **Currency of the totals:** a day can mix hryvnias, dollars and euros. *Proposal:* the totals in the report currency,
   converted at the NBU rate of the day (business rule 1, as reports will do); with one account picked, in that
   account's currency.
3. **The default period:** what the page shows when opened. *Proposal:* follows the chosen variant: this month
   (variant 1 and 3), or everything (variant 2).
4. **Transfers with one account picked:** *Proposal:* a transfer shows as money out of the picked account (− in blue)
   or into it (+ in blue), so the account's list reads like its statement.
5. **Filters kept:** *Proposal:* the filters are part of the page's address (`/transactions?account=…&month=2026-10`),
   so Back, a reload and a shared link keep them, and the Reports screen (F-022) can link a cell to its transactions.
   They aren't remembered between visits.
6. **Search by note** (e.g. "Silpo") isn't in this feature's criteria. *Proposal:* plan it as an improvement after
   F-020, together with I-017's note suggestions.

## Tests

- Unit: the filter logic (`filters.test.ts`: the address there and back, the period, stepping, the type and category
  rules), the calendar (`calendar.test.ts`), the page (`TransactionsPage.test.tsx`: receipts with day totals, the
  totals and their share, a category from Where it went, a day from the calendar, the phone's Filters sheet and chips,
  nothing found and Clear filters, loading more, no transactions, an error); backend `TransactionSummaryTests`,
  `TransactionFilterValidatorTests` and the controller's list, summary and bad requests.
- E2E (Playwright, `transactions.spec.ts`): the month's eating out picked (Where it went on the desktop, the Filters
  sheet on the phone), kept after a reload, one changed and another deleted on its receipt, the totals following.

## Notes

- F-018 built a stand-in Transactions page (the latest 50 by day, a row opens the form); F-020 replaces it.

## Build (2026-11-03)

Built from the approved variant 8 on `feature/F-020-transactions-list`; decisions in
[ADR 0024](../../../decisions/0024-transactions-list-and-summary.md).

- **API:** `GET /api/transactions?from&to&accountId&categoryId&type&offset&limit` (30 a page, newest day first, then
  the last added) and `GET /api/transactions/summary` with the same filters: spent, received and a count per day
  (transfers counted, never spent or received), the period's categories largest first (the picked one left out of
  their own filter, so another can be picked), all in the report currency at the NBU rate of each day, or in the
  account's own with one account picked. One account matches the transfers it is the To of. Worked out in
  `TransactionSummary.Of` (pure, unit-tested). F-018's `LatestTransactions` is gone.
- **Page:** `TotalsSlip` (the dark slip, ‹ ›, the period list, the swipe on the phone), the slim totals bar below
  1024 px, `SpendingCalendar` (folding; open or closed kept in `localStorage`), `WhereItWent`, `TransactionFilters`
  (desktop: Account, Type, a category chip with ×; tablet: Account, Type, By category; phone: Filters with a count,
  chips, one sheet), `Receipts` (loads the next 30 as the end comes within 240 px). The filters are the address
  (`filters.ts`, `useTransactionFilters`); a phone sheet's picks go into it once the sheet's Back step is gone
  (`afterPopupsClose` in `popupHistory.ts`). A transfer seen from the one picked account is `−` or `+` in blue
  (`SignedAmount`'s `account`).
- **Colours:** the slip is the Solid card's tokens; new tokens for the received figure, the slip's track, the paper,
  its dots and shadow, and the four heat steps (`theme.ts`).
- **Where the prototype said nothing:** the account, type and period lists are the app's dropdowns (the currency
  list's look, the picked one in the accent) rather than the prototype's ticks; with no filters on, an empty month says
  "Nothing in October 2026" without a Clear filters button; an account or a category that isn't the person's (an old
  or hand-made address) is left out once the lists are known; "Show September 2026" is offered at the end of every
  month.
- **Owner's review (2026-11-03):** a day with a transfer gets a blue dot in the calendar next to income's green one,
  and the legend lists Transfer after Income; the summary's days count their transfers (`DayTotal.Transfers`), and a
  day's name for screen readers says "a transfer" or "2 transfers". Checked at 360, 375 and 1440 px, light and dark.
- **Checked:** the design check on the real page (October, a picked day, this year) with 0 issues and 0 console
  errors; screenshots at 360, 375, 834 and 1440 px, light and dark, of the month, the open calendar, a picked day,
  the Filters sheet (empty and with picks), filters on, the slim bar after scrolling, nothing found, the period list,
  By category on the tablet, the account list, Eating out picked, Income, this year, the edit form and the desktop
  scrolled with its sticky column; the Filters sheet closed by Show and by Back, the picks kept in the address both
  ways, loading more and the end of the month in the Browser pane.
