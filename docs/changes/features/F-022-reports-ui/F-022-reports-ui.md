# F-022 · Reports screen

| | |
|---|---|
| Type | Feature |
| Milestone | M4 — Reports |
| Status | Done |
| Branch | `feature/F-022-reports-ui` |
| Design | 3 prototype stories in Storybook (I-021); the final prototype's screenshots in [prototypes/](prototypes/) |
| Approved | 2026-11-04: the final prototype with the month as M2, and the open points as proposed (owner: "I like M2 variant … approved") |

## Goal

Read the monthly and yearly report on the phone and on the desktop.

## Acceptance criteria

- [x] Yearly table like the spreadsheet: sticky category column, a visible sideways scroll bar when it is wider than
      the screen (the desktop and tablet; on the phone the year is the months as rows, the owner's pick, option C)
- [x] Monthly view with category breakdown (M2: a receipt a group, and the month's balance from the start to the end)
- [x] Pick year / month and report currency

## Tasks

- [x] 3 prototype stories
- [x] UI
- [x] Storybook stories

## Built (2026-11-04)

- **Page** `features/reports/`: `ReportsPage` (the period and currency in the address, `?year=` / `?month=` /
  `?currency=`; this year in the Settings currency when there are none), `ReportsHead`, `YearTable` (desktop and
  tablet), `YearMonths` (phone), `MonthReport` (M2); `report.ts` holds the pure parts (the address, ‹ ›, Year /
  Month, the links to Transactions, leaving out the empty categories, the four reds).
- **The open points as proposed:** the currency once in the year's corner and with every amount elsewhere; another
  currency for this visit only (in the address, so Back from Transactions keeps it; the menu opens the Settings one);
  Month opens on this month (an earlier year on its December); a category's amount (a table cell, the year's Total, a
  receipt line, a category on the phone) opens the Transactions page with that category in that month or year; ‹ ›
  go over the years and months with data only.
- **API:** the report has `firstMonth`, the person's first month with data (ADR 0027's `FirstDay`, its month), so
  ‹ stops there; F-021's API is otherwise as it was.
- **Shared:** `CurrencyPicker` has a `pill` option (the filter pill, the list 300 px wide under its end); the filter
  pill's styles moved from the Transactions page to `shared/ui/Pills.module.css` (`.select`) so both use one; a page
  with `data-wide` is up to 1600 px wide in the shell (Reports only).
- **Small changes while building:** the month's name is written in full (`October 2026`, as on the Transactions
  page; the prototype had `Oct 2026`); a category line in the month is 44 px tall, as it is a link now (the
  prototype's lines weren't links); after a save or a delete and after the report currency changes, the reports are
  fetched again. States the prototype didn't show: loading, couldn't load (Try again), nothing yet (a new person),
  nothing in a month, and a note when some amounts had no NBU rate.
- **The months before the first entry folded** (owner's review of PR #60, 2026-11-04: "if there are no data for all
  month, maybe collapse them?"; picked "one folded column"): in the year's table the months before the person's first
  month with data are one narrow column, "Jan – Oct · before your first entry", with no bars, dashes or zeros; a tap
  unfolds them, and a narrow column at their start folds them back. On the phone they are one row, "January – October ·
  Before your first entry". A month with nothing after the first entry still shows as it is.

## Design

### References (2026-11-04)

Mobbin turns the browser away (403), so the references are open help pages; the spreadsheet is the owners' own.

- **The owners' spreadsheet** (one sheet per person per year, F-021's notes) — groups → categories as rows, the twelve
  months, Total and Avg, a "Total …" row under each group, the summary rows at the foot. Taken: the table's shape in
  all three variants, the group total rows (variant 1), the frozen first column and month row (the sheet's frozen
  panes).
- **YNAB · Income v Expense** ([help](https://support.ynab.com/en_us/income-v-expense-Byu1BYWRq)) — income on top,
  expense categories under it, months as columns with Average and Total, the net income at the foot; a group's
  arrow folds it to its total. Taken: the summary at the foot, folding groups (variant 3).
- **Actual Budget · Custom reports** ([docs](https://actualbudget.org/docs/reports/custom-reports/)) — one report as a
  table or as bars, "Total" vs "Time" (one sum or by month), empty rows shown or not. Taken: bars and the table of the
  same numbers on one screen (variant 3), "1 more with nothing" instead of empty rows in the month (variants 1, 2).
- **Monarch · Cash flow** ([help](https://help.monarch.com/hc/en-us/articles/20504904768020-Cash-Flow),
  [monthly review](https://help.monarch.com/hc/en-us/articles/4402543752468-Monthly-Progress-Report)) — income,
  expenses and savings by month, monthly or yearly, the breakdown as ranked category bars; on the phone a monthly
  review rather than a table. Taken: the month first on the phone (variant 2), categories as bars.
- **The app's own Transactions page** (F-020) — the period's totals on the dark slip with a torn edge, days as till
  receipts with dotted leaders, the calendar's four steps of red. Taken: the slip (variant 2), the month as a receipt
  (variants 1 and 3), the four reds for unusual months (variant 3), the summary band in the slip's charcoal.

### Brief

- **Who and when:** once a month, on the desktop, reading the year like their sheet; on the phone, a look at this
  month or the last one, or at one category.
- **The one job:** see where the year's money went, month by month, and whether the balance grows. First seen: the
  table (desktop), the month's totals (phone, variant 2).
- **The subject's world:** the spreadsheet they kept for years, its frozen panes and its bottom line; till receipts.
- **One feeling:** "the sheet, but it fills itself in": calm, dense, in control.

### Plan from the design system

- **Reused:** the app shell, the page title, the pill switch (Year / Month), 44 px icon buttons for ‹ ›, the shared
  `CurrencyPicker` (every currency field opens the same list), Pup's scroll bar (`ScrollArea` from the theme), the
  Transactions page's slip and receipt paper, the heat tokens, `ResponsiveDialog`, amounts as the app writes them.
- **New:** the yearly table (frozen first column and month row; this month's column in the active tint, "now" under
  it; future months empty; nothing as "–"; Avg says what it divides by, "÷ 11 months"), the summary rows on the slip's
  charcoal. The table reaches down to the page's foot and scrolls inside, so there is one scroll with the month row
  frozen. No new token.
- **Shell:** the Reports page is wider than the other pages (up to 1600 px instead of 880), as the year needs the room;
  in the prototypes this is done from the prototype's own styles.
- **Motion:** none besides a group folding (variant 3).
- **Slop check:** dropped a row of stat cards over the table (the summary rows are the numbers); no icons in rows; one
  loud thing per variant.

### Round 1 (2026-11-04)

Stories in Storybook (`npm run storybook` in `frontend/`), *Prototypes / F-022 Reports*, one story per variant (I-026:
the links open the page filling the window, the screen size and the scheme from the toolbar), made of the app's shell,
components and theme, with a test year in the spreadsheet's shape (F-021's test fixture: January–October filled in,
November under way, December to come). Phone / desktop and light / dark are switched in the toolbar.

1. **Variant 1 · The sheet, filled in** — the spreadsheet as it is: every group with a heading row and a "Total …" row,
   every amount with its currency (DESIGN_RULES §5), frozen panes on both edges (the categories on the left, Total and
   Avg on the right; on the phone and tablet only the categories), the table opens with this month in sight. The
   summary rows at the foot on the slip's charcoal, the balance in the display face. **Month**: the same rows as a
   receipt, only the categories with something, and beside it (under it on the phone) a second receipt with the month
   from the balance at the start to the end.
   - [Variant 1](http://localhost:6006/?path=/story/prototypes-f-022-reports--variant-1-the-sheet&nav=false&panel=false&globals=viewport.value:!undefined)
2. **Variant 2 · This month, against your usual** — the month first, as the phone reads it: Spent / Received on the
   dark slip with NET, the other changes and what is on the accounts at the end; the twelve months as bars of their NET
   to pick from; every category as a bar with a tick at its usual month (the year's Avg), red with "… over your usual"
   when it's a quarter over. **Year**: the table with the numbers alone and the currency named once ("In ₴ UAH").
   - [Variant 2](http://localhost:6006/?path=/story/prototypes-f-022-reports--variant-2-usual-month&nav=false&panel=false&globals=viewport.value:!undefined)
3. **Variant 3 · One sheet, tap a month** (the risk) — no Year / Month switch: one table whose groups fold to their
   totals, so the whole year fits on one screen (1440 px: all twelve months, Total and Avg, no scrolling); income and
   expenses as bars over their months; a month that cost more than the category's usual turns red in four steps (a
   quarter more, half more, twice, three times). A month's heading opens it as the receipt in a dialog (a sheet on the
   phone).
   - [Variant 3](http://localhost:6006/?path=/story/prototypes-f-022-reports--variant-3-one-sheet&nav=false&panel=false&globals=viewport.value:!undefined)

Design check: 4 issues left, all in variant 3's month sheet on the phone. Two come from the shared sheet (Mantine's
title row is a `<header>`, so the page has a second banner beside the top bar; to look at when it's built); two are
the receipt having nothing to focus in a scrolling sheet, gone once its lines are links (open point 4).

### Open points

1. **The currency in every cell.** DESIGN_RULES §5 says an amount always shows its currency; in a table of 14 columns
   it makes the cells wide, so variant 1 scrolls sideways on the desktop too. Variants 2 and 3 name it once in the
   table's corner. Proposal: in the yearly table once in the corner, everywhere else with the amount (a rule to add).
2. **Picking another currency** changes the report only on this page (Settings keeps the person's report currency).
   Proposal: for this visit only; the page opens in the Settings currency.
3. **The month opens on** this month (under way), or the last whole month in the first days of a month? Proposal:
   this month, as Transactions does.
4. **A cell as a link** to its transactions (F-021's note, ADR 0024): a tap on a category's month opens the
   Transactions page with that month and category. Not in the prototypes yet; proposal: yes, in every variant.
5. **Years:** ‹ › go back to the first year with data; before it and after this year they are off.

Chosen variant: variant 3's year with variant 1's month (owner, 2026-11-04: "I like the separate reports for month
(in variant 1) and year (in variant 3)").

### Final prototype (2026-11-04)

[The year](http://localhost:6006/?path=/story/prototypes-f-022-reports--final-year&nav=false&panel=false&globals=viewport.value:!undefined); the month in three looks below.

- **Year** (variant 3): the groups fold to their totals (a group's row unfolds it), so the whole year fits on a 1440 px
  screen; income and expenses as bars over their months; a month over the category's usual in four reds, the key above
  the table; the currency named once in the table's corner; this month tinted with "now"; Avg "÷ 11 months"; the
  summary rows on the slip's charcoal. On the phone the group column stays put and the months scroll, opening on this
  month.
- **Month** (variant 1): two receipts, the categories with something in the month ("2 more with nothing" for the
  rest) and the month from the balance at the start to the end; side by side on the desktop, one under the other on
  the phone.
- **Between them:** Year / Month; a month's heading in the year opens that month; in the month ‹ › go month by month.
- **Open points** as proposed (none answered yet): the currency once in the year's corner and with every amount in the
  month; another currency for this visit only; the month opens on this month; a cell or a receipt line opens its
  transactions (not in the prototype); ‹ › only over years with data.
- Checked: the design check on both stories, 0 issues; screenshots at 375 and 1440 px, light and dark, looked at.

### The year on the phone (2026-11-04)

The owner: "we're working in mobile first, the report looks awful on mobile". On a 375 px phone the table showed two
and a half months beside a group column half the screen wide, and the head (title, period, Year / Month, the
currency's full name) and the colour key took a third of the screen before it. Every option below has a shorter head
(no big title, the tab bar says Reports; Year / Month and the currency's code on one row, the period under them) and
keeps the desktop and the month as they are. Option A (the desktop's table made tighter, four months on the phone)
was dropped by the owner the same day ("phone A is bad").

- **B · One month at a time** — the sheet's rows with two columns, a month and its usual month (the
  year's Avg), red in four steps when over; the months as chips above, "Year" for the totals; a swipe on the table
  moves the month; groups fold. (dropped: the owner picked C)
- **C · Months as rows** — the year so far on the slip (spent, received, on the accounts now), the months as rows (in
  and out as two bars, NET), a month opens its receipts; "Where the year went" under them, groups with their total and
  usual month, opening their categories. **Picked by the owner** (2026-11-04: "I like variant C"). [The year](http://localhost:6006/?path=/story/prototypes-f-022-reports--final-year&nav=false&panel=false&globals=viewport.value:!undefined)

Checked: the design check on the three and the month, 0 issues; screenshots at 375 and 1440 px, light and dark, looked
at (fixed: A's group names cut off and A opening on January, B's names cut off, C's received figure running off the
slip).

**Categories with nothing in the year aren't shown** (owner, 2026-11-04), in the year on every screen size, nor a group
left without any; the month's receipt counts only the year's categories in "N more with nothing". The API still gives
every category in use (F-021); the screen leaves the empty ones out. In the test year: Sport, English lessons, Books and
Spotify.

**A visible scroll bar** (owner, 2026-11-04: "if table doesn't fit the width of the screen then show a visible
scroll"): when the year's table is wider than the screen (the desktop's table below about 1300 px, a tablet), its bars
stay on, the sideways one on a grey track under the rows; a table that fits has none. A rule in DESIGN_RULES "Custom
rules", the exception to the bar that shows only while scrolling. Checked at 1000 and 1024 px, light and dark; the
design check on B, C and the month 0 issues.

The owner then found the bars broken ("the scroll is broken"): both lay over the table, the upright one showed with
nothing to scroll and covered the last column, and the two crossed in the corner. Now each way that doesn't fit gets
a bar in a 20 px gutter of its own (the rows stop before it), on a grey track 4 px in from the card's edges, the two
tracks stopping short of each other; the scroll area keeps one kind, so it isn't rebuilt and keeps this month in
sight. Checked at 1100 px (both bars) and 1440 px (none), light and dark; design check 0 issues.

Then (owner: "table should take as much height as it needs and do not have vertical scroll"): the table is as tall as
its rows and the page scrolls; it no longer reaches only to the window's foot, so the month row scrolls away with the
page (the category column still stays put while the months scroll sideways). Only the sideways bar is left. Checked at
1100 px with two groups unfolded and at 1440 px, light and dark; design check 0 issues.

## Tests

- Unit: Table rendering. `report.test.ts` (the address, ‹ ›, Year / Month, the links, empty categories left out, the
  reds, amounts); `ReportsPage.test.tsx` (the phone's months opening a month, a receipt line's link, ‹ › over the
  years with data, another currency, nothing yet, couldn't load; the desktop's table unfolding with its links, a month
  opened from its heading). Backend: `ReportBuilderTests` for `FirstMonth`.
- E2E (Playwright): Entered transactions appear in the report (`reports.spec.ts`, phone and desktop): the year shows
  them, the month opens with its balance, Groceries' line opens Groceries' transactions.

## Notes

- —

### The month: groups set apart (2026-11-04)

The owner: "we need to improve monthly report. The categories are hard to distinguish, they look like one solid
list" — the group names were small grey labels over the same dotted lines. Every look below has the month's balance
on a receipt of its own (beside the categories on the desktop, first on the phone; "Other changes" with a note on what
they are) and shows only the categories with something in the month.

- **M1 · Sections** — one receipt; each group's name in the display face with its total on the same line, its
  categories under it, quieter and a little in; a dashed rule between groups.
  [M1](http://localhost:6006/?path=/story/prototypes-f-022-reports--final-month-sections&nav=false&panel=false&globals=viewport.value:!undefined)
- **M2 · A receipt a group** (recommended; **picked and approved by the owner**, 2026-11-04) — each group its own receipt, name and total on top, stacked like the
  Transactions page's days. [M2](http://localhost:6006/?path=/story/prototypes-f-022-reports--final-month-receipts&nav=false&panel=false&globals=viewport.value:!undefined)
- **M3 · Bars** — no paper; each group a block with its share of the month's spending and its total, its categories
  as bars of their share. [M3](http://localhost:6006/?path=/story/prototypes-f-022-reports--final-month-bars&nav=false&panel=false&globals=viewport.value:!undefined)

Checked: the design check on the year and the three looks, 0 issues; screenshots at 375 and 1440 px, light and dark,
looked at (fixed: the balance's "Rates, exchanges, new accounts" cut off on the phone, now "Other changes" with a note).

### The report currency as the design system's select (2026-11-04)

The owner: "the currency select should use selects from the design system" — the 52 px field with the currency's name
was the only field in the head. Now it is the Transactions page's filter pill ("All accounts", "All types"): a coins
icon, the code, a chevron; it opens the shared currency list (yours first, then every NBU currency, a search) as a
300 px dropdown under it on the desktop and a sheet on the phone, so the custom rule "every currency field opens the
same list" still holds. In the prototype it is a copy of `CurrencyPicker` with the pill as its button; built, it is an
option of the shared one (the account form and Settings keep the field). Design check on the year and the three month
looks 0 issues; screenshots at 375 and 1440 px, light and dark, looked at.
