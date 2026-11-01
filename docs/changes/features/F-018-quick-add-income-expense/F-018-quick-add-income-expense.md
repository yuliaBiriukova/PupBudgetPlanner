# F-018 · Quick add: expense and income

| | |
|---|---|
| Type | Feature |
| Milestone | M3 — Transactions |
| Status | Done |
| Branch | `feature/F-018-quick-add-income-expense` |
| Design | 3 HTML prototypes required |
| Approved | 2026-11-01, by the owner in chat ("I approve variant 7 for the current feature, build it"): the final prototype, [variant 7](prototypes/variant-7.html), with its three reviews; expense and income (transfer and exchange in it are F-019's) |

## Goal

Entering an expense on the phone is as fast as in Monefy.

## Acceptance criteria

- [x] Add expense or income: amount, category, account, date (today by default), note
- [x] Last used account is preselected; numeric keyboard on mobile (the app's own number keys, as approved)
- [x] The category last used with the picked account is preselected (owner, 2026-11-01)
- [x] A transaction can be added from an account on the Accounts page, with that account picked (owner,
      2026-11-01)
- [x] Edit and delete an existing transaction
- [x] Account balances update immediately

## Tasks

- [x] 3 HTML prototypes (shared with F-019)
- [x] Domain + API
- [x] UI
- [x] Storybook stories

## Design

### References (2026-11-01)

Mobbin needs a sign-in, so the references are open pages: app store listings, reviews and help pages.

- **Monefy** ([App Store](https://apps.apple.com/app/id1212024409),
  [review](https://mobile.softpedia.com/android/Monefy-Android-Review-2301.html)) — what the owners use today: the
  categories around the home chart, − / + buttons, a built-in calculator for the amount, tap a category to add.
  Taken: the calculator keys (variant 1) and "tap the category first" (variant 3).
- **Cashew** ([source on GitHub](https://github.com/jameskokoska/Cashew)) — an open-source budget app whose add screen
  puts the amount on top and the account, date and note around it. Taken: the amount as the first and biggest thing,
  the rest as small chips.
- **CoinKeeper** ([help: an expense](https://enhelp.coinkeeper.me/How-to-create-an-expense-income-8681c0bd7d0c46df9ef13ffd2c96c19c),
  [widget](https://enhelp.coinkeeper.me/Widget-and-how-to-work-with-it-d83666f9f1b84baa8181b1d3701f3e10)) — an
  expense is "this account → that category", and the widget offers the most used pairs. Taken: the most used
  categories first ("Often"), the last used account preselected.
- **The owners' Google Sheet** — category groups as rows, months as columns. Taken: variant 3's grid of cells with
  this month's totals, and variant 2's ledger lines.

### Brief

- **Who and when:** one of the couple, on the phone, right after paying (often one-handed, at a till or in a taxi);
  sometimes several lines of one receipt. On the desktop: catching up on a few transactions in a row.
- **The one job:** get the amount and the category in, in a few seconds. The amount is seen first.
- **The subject's world:** a receipt and its lines, a calculator, the spreadsheet's category rows, the card the money
  left from.
- **One feeling:** quick and done; the balance has already changed when the sheet closes.

### Token plan

- **Palette:** the app's theme (charcoal `#26292e` buttons, sky accent `#2a62a3` / `#8ec1ec`, page `#f5f6f7` /
  `#121315`) plus the fixed meanings: expense red `#b3261e` / `#f2958c`, income green `#1f7a4d` / `#7fd1a4`, transfer
  blue (the accent). The type's color is on the amount and on the picked type, nowhere else.
- **Type:** Unbounded 300 for the amount (44–48 px on the phone) and the calculator keys, Manrope 400/500 for the rest;
  tabular figures, a true − and +, the currency as `formatMoney` puts it (`250 ₴`, `$100`).
- **Shape:** 12 px fields and keys, 24 px sheet corners, pills for chips and buttons; the existing float shadow only
  on pop-ups.
- **Motion:** one moment: after a save the notification counts the account's balance to its new value; the new row
  on the list is lit and fades. Nothing else moves.
- **The bold element:** variant 1 the amount and the keys, variant 2 the "balance after" line, variant 3 the grid of
  category cells with this month's totals.
- **Mantine:** `SegmentedControl` / `Tabs`, `TextInput` with `inputMode`, `Chip`-like buttons, `Combobox` for the
  lists, `DatePicker` (Monday first), the shared `ResponsiveDialog` / `BottomSheet` (swipe and Back, I-015). Variant
  1's keys are a custom component.

### Round 1 (2026-11-01)

Prototypes in [`prototypes/`](prototypes/) (open from disk; the bar on top picks the view, screen and theme; "About this
direction" lists the decisions). Every variant has the same screens: add an expense, filled in, the category list,
the account and date pickers, income, nothing entered, couldn't save, saved, transfer and exchange (F-019), the
Transactions page, edit, delete.

- [Variant 1 · Calculator](prototypes/variant-1.html) — the sheet is a pocket calculator: the app's own keys
  (digits, 00, ⌫, + and − to add up a receipt, Save), the amount big in the type's color, the 8 most used categories
  as two rows of tags, account / date / note as chips. Three taps; the phone's keyboard never opens. Desktop: a
  dialog without the keys.
- [Variant 2 · Ledger slip](prototypes/variant-2.html) — the amount on top with the phone's number keyboard, then
  Category, Account, Date, Note as ledger lines, and the slip's last line: the balance before and after, live while
  you type. Save and new for a receipt of several lines.
- [Variant 3 · Categories first](prototypes/variant-3.html) — + opens every category as the cells of a sheet with
  this month's total in each; tap one, type the amount (phone keyboard), Save. On the desktop the grid and the form
  side by side.

Shared by all three:

- The account is the last one used **for this type** (expense, income, transfer each remember their own), the date
  is today, the type is Expense.
- A save closes the form (variant 2 also has Save and new), the row comes in on top of the list and the notification
  counts the account's balance to its new value. Couldn't save keeps everything typed.
- Edit opens the same form from a row of the list, titled "Edit expense"; Delete asks first and says what the
  balance goes back to.
- Pickers: a sheet over the form on the phone, a dropdown under the field on the desktop (as the currency list,
  F-016). The date picker: Today, Yesterday, then the month, Monday first.
- Transfer (F-019) lives in the same form as the third type: From and To; between currencies the second amount is
  suggested at the NBU rate and can be changed, with "Your rate" next to the NBU's.

Checked: the design check (Playwright + axe at 360–1440 px, light and dark, every screen) passes with 0 issues, and
the screenshots of every screen at 375 and 1440 px, light and dark, were looked at.

### Round 2 (2026-11-01): variant 1 with options

The owner liked variant 1 and asked to see more ways to type the money and to pick the category.
[Variant 4](prototypes/variant-4.html) is variant 1 with both parts open to choice: the preview bar has an
**Amount** and a **Category** row, any of each can be combined, and every screen follows (the choice is kept on the
device).

Amount:

- **Calculator keys** — variant 1 as it was: the amount big and centered, the app's own keys with + and −.
- **Calculator display** — the same keys, the amount on a screen above them like a calculator's, right-aligned, the
  sum (`120 + 130`, `= 250 ₴`) on its top line.
- **Keys + recent amounts** — the keys with a row of the last amounts for the picked category (Groceries: 612, 250,
  1 140 ₴); one tap fills the amount.
- **Phone keyboard** — the amount big and centered, typed on the phone's number keyboard; Save as a full-width button.
- **Boxed field** — variant 2's field: label left, the amount right-aligned in a box, the phone's number keyboard.

Category:

- **Tags** — variant 1 as it was: the 8 most used in two rows that scroll sideways, "All categories" opens the list.
- **Cells with totals** — the 5 most used as cells with this month's total, the 6th cell opens all (variant 3's grid,
  small).
- **Select** — one field with the category and its group; it opens the list with a search.
- **Groups** — the report's groups as a row of words (Often, Home, Daily, Health …), the picked group's categories as
  tags under it: every category in two taps.
- **Search** — a "Find a category" field; the most used show under it until you type, then the matching ones. It
  opens the letters keyboard, so it suits the phone-keyboard amount more than the own keys.

Checked: the design check passes with 0 issues for every option (each with the other part at its default) at 360–1440
px, light and dark; every combination opens every screen without errors; screenshots of each option at 375 and 1440
px, light and dark, were looked at.

### Round 3: final prototype (2026-11-01)

The owner chose the **calculator display** for the amount and **tags with search** for the category, with two
review notes: a sum looked wrong (`−1 000-1000` with `= 0 ₴`, `−1 000+1000` with `= 2 000 ₴`: the expense's minus read
as part of the sum), and the amount should be a little smaller on the phone.
[Variant 5 (final)](prototypes/variant-5.html) is variant 1 with those choices:

- **Amount:** a calculator display above the app's own keys: "Amount" on its top line, the amount right-aligned in
  the type's color with the account's currency (`250 ₴`). No − or + before it (owner's review: next to the + and −
  keys it confuses); the color and the Expense / Income switch above it say which it is, so color isn't the only
  signal (DESIGN_RULES §5). The list, the notification and Delete keep their signs. 34 px on the phone, 40 px from
  768 px.
- **A sum** is shown as arithmetic while it is typed: `1 200 + 350` in the text's color, no currency, its result on
  the top line in the type's color (`= 1 550 ₴`). `=` or Save turns it into the amount (`1 550 ₴`). ⌫ or Backspace
  takes away the last digit or sign (owner's review: a trailing space after + or − kept them from being deleted). A
  sum of zero or less shows its result muted and can't be saved: "The sum must be more than zero."
- **Desktop:** no keys; the amount and a sum are typed into the display, Enter or Save works it out and saves.
- **Category:** "Find a category" above your 8 most used expense categories (two rows of tags that scroll sideways);
  typing shows the matching ones by name or group in their place ("sub" finds Spotify, Phone, Subscriptions).
  "All categories" opens the whole list by group. Income shows its 3 categories, no search. On the phone the search
  opens the letters keyboard over the keys; picking a tag closes it.
- Everything else as in variant 1: the type switch, the account (the last used for this type) and date chips, the
  note behind a chip, transfer and exchange (F-019), edit, delete, the notification counting the balance.

Checked: the design check passes with 0 issues (360–1440 px, light and dark, every screen); a sum typed on the keys
and on the desktop keyboard was tried in the Browser pane; screenshots of every screen at 375 and 1440 px, light and
dark, were looked at.

### Round 4 (2026-11-01): account and day options

The owner asked for different ways to pick the day and the account. [Variant 6](prototypes/variant-6.html) is
variant 5 with both open to choice in the preview bar (**Account**, **Day**), any of each combined; everything else
is variant 5.

Account:

- **Chip + list** — variant 5 as it is: the chip opens your accounts with their balances.
- **Chip + list by currency** — the same chip; the list grouped by currency (Hryvnia, US dollar, Euro).
- **Field with balance** — a full-width field with the account, its bank or cash and its balance now; it opens the list.
- **Most used + Other** — your 3 most used accounts as tags, one tap each, and Other for the rest.
- **Row of cards** — every account as a small card with its balance, in a row that scrolls sideways.

Day:

- **Chip + calendar** — variant 5 as it is: Today; it opens Today, Yesterday and the month.
- **Day pills** — Today, Yesterday and the 4 days before them (Tue 27 …) in a row, and Earlier for the calendar; an
  earlier day picked becomes the first pill.
- **Day before / after** — ‹ Today, 29 Oct ›; the middle opens the calendar.
- **Week strip** — this week's days, Monday first, the picked day filled and today marked; arrows for the week before,
  a calendar button for anything else.
- **Phone's own picker** — the chip opens the phone's date picker (wheels on iPhone, a calendar on Android).

The inline options take more height: with the keys on the phone the form scrolls a little under the amount.
Transfer keeps its From → To; the day options apply to it too.

Checked: the design check passes with 0 issues for every option (it found the balance missing from the account
field's spoken name, fixed); every combination opens every screen on the phone and the desktop without errors;
screenshots of each option at 375 and 1440 px, light and dark, were looked at (Other wrapped to its own line in
"Most used + Other", fixed).

### Round 5: final prototype (2026-11-01)

The owner chose the **field with balance** for the account and the **week strip** for the day, and asked for: adding
a transaction from the Accounts page with that account picked; the last used account picked when the form opens; a
Note field on the phone too (not a chip); the app's scroll bar and faded edges in the form; From and To looking like
the account field (same size, with select arrows); the calendar not cut off; account dropdowns like the app's other
dropdowns. [Variant 7 (final)](prototypes/variant-7.html) is variant 5 with all of it:

- **Order:** amount, category, account, day, note. The category is picked every time; the account and the day are
  mostly right as they come.
- **Account:** a full-width field with the account, its bank or cash and its balance now, and select arrows. It opens
  the accounts in a dropdown like the currency list (F-016): under the field, as wide as it, one line per account with
  its balance, the picked one in the accent, up to 344 px; a sheet on the phone. The last account used for this type
  is picked when the form opens; the hint under the field says so ("Used last for expenses").
- **From the Accounts page:** every account card gets a + in its top right corner. It opens the form with that
  account picked (also as From for a transfer, and it stays when the type changes). After saving, you are back on
  Accounts, the card's balance has changed and the card lights up. Tapping the card still opens the account form
  (F-014).
- **Day:** the week strip: this week's days, Monday first, the picked day filled, today outlined; ‹ › for the weeks
  before; the calendar button for anything else. The calendar is never cut off: the desktop dropdown is as tall as
  the calendar and opens above the button when there is no room under it.
- **Note:** a field on the phone as on the desktop.
- **Scrolling:** the form scrolls in the app's scroll area (I-004): the bar shows while scrolling and the edges with
  more behind them fade. On the phone the form scrolls under the amount, above the keys.
- **Transfer:** From and To keep their size and get the select arrows; both open the same account dropdown, and the
  To list leaves out the From account.
- Everything else as variant 5.

Checked: every screen opens without errors on the phone and the desktop; the + flow was tried in the Browser pane (500
₴ from Privat card: its card went from 12 784 ₴ to 12 284 ₴ and lit up); the desktop calendar opens whole; the design
check and screenshots of every screen at 375 and 1440 px, light and dark (they found screens opening scrolled where the
last one was left, fixed).

#### Owner's review of variant 7 (2026-11-01)

- No hint under the account field ("Used last for expenses" removed); the last used account is still picked.
- No error text under the amount: the red field is enough. The message stays for screen readers (visually hidden,
  linked to the field). This goes against DESIGN_RULES §6 ("messages appear under the field") for the amount only;
  it becomes a custom rule if approved.
- "Pick a category." sits next to the Category label instead of under the tags.
- The account dropdown scrolled although all accounts fitted: its height was measured without its 1 px borders. Fixed
  for every dropdown.
- Question: account and day before the amount, or before the category? Variant 7 now has an **Order** switch in the
  preview bar: "Amount, category, account, day" (as before), "Account and day on top", "Account and day before
  category". With either of the last two, the category tags are below the keys on the phone, so picking a category
  needs a scroll.
- At the owner's request two more orders: "Day, amount, account" and "Day, account, amount", the category after them
  and the note last in both. On the phone the category tags are below the keys in both as well.

#### Owner's second review of variant 7 (2026-11-01): the order decided

- **Order:** day, account, amount, category, note (the Order switch is gone).
- **Day:** "Day before / after" from round 4 instead of the week strip, on top, because it takes less room:
  ‹ Today, 29 Oct ›; the arrows go a day back or forward (not past today), the middle opens the calendar. The calendar
  in the prototype is drawn by hand; in the app it is Mantine's (`@mantine/dates`, already used by the account form),
  themed like the rest.
- **Category:** no search field in the form. The 8 most used as pills (two rows that scroll sideways; a category
  picked from the list comes first), and "All categories" (with a small arrow) opens every category with a search: a
  dropdown on the desktop, a sheet on the phone.
- On the phone the category pills are below the keys, so the form scrolls to them.

Checked: every screen opens without errors on the phone and the desktop; the day arrows and the category search
("sub" finds Spotify, Phone, Subscriptions) tried in the Browser pane; the design check passes with 0 issues;
screenshots of the main screens at 375 and 1440 px, light and dark, looked at.

#### Owner's third review of variant 7 (2026-11-01)

- **Category picked for you:** the category of the latest expense (or income) from the account is picked when the form
  opens, and again when the account changes, until you pick one yourself; an account without any picks none. Changing
  a transaction keeps its own category.
- **Day:** the week strip is back on top (with its calendar button), in place of "day before / after".
- **Spacing:** every block is built the same way: a 24 px label row, 8 px, its control; between blocks the pop-up's
  padding, 16 px on the phone and 20 px on the desktop (I-012). Buttons in a label row (‹ ›, the calendar, All
  categories) keep 44 px to tap but take only the row's 24 px. Measured in the Browser pane: 16 / 20 px between every
  block, 8 px inside each.

- **Category pills wrap** onto the next line inside the pop-up instead of a row that scrolls sideways past its edge
  (owner's review: they didn't fit the phone screen).
- **How many:** the 6 most used on the phone (3 lines), 8 on the desktop (owner, 2026-11-01). A picked category that
  isn't among them comes first and the last one drops off, so there are never more. Income shows its 3.

Checked: every screen opens without errors on the phone and the desktop; the category picked for Mono black
(Groceries), after switching to Wallet (Eating out) and Privat card (none), and a category picked by hand kept when
the account changes, tried in the Browser pane; the design check passes with 0 issues; screenshots at 375 and 1440 px,
light and dark, looked at.

### Open points (answered by the owner, 2026-11-01)

1. **Where to edit before F-020:** the Transactions page gets a short list of the latest transactions (by day, newest
   first) to open one and change or delete it; F-020 replaces it with the full list, filters and paging. *Agreed.*
2. **Future dates:** the calendar and the week strip stop at today; no planned payments. *Agreed.*
3. **Tap a category to save:** no; a category is only picked, and Save saves (fewer mistakes, one more tap). *Agreed.*
4. **This month's total per category:** not in F-018; planned as an improvement of its own,
   [I-016](../../improvements/I-016-category-month-totals/I-016-category-month-totals.md). *Agreed.*
5. **Note suggestions** (asked by the owner with the answers): the notes already used, suggested while typing a
   note; planned as [I-017](../../improvements/I-017-note-suggestions/I-017-note-suggestions.md), not in F-018.

## Build (2026-11-01)

Built from [variant 7](prototypes/variant-7.html) after the owner's approval.

- **API** ([ADR 0022](../../../decisions/0022-transactions-and-balances.md)): `/api/transactions` lists the latest 50
  and adds, changes and deletes an expense or an income; `/api/transactions/suggestions` gives the form its picks.
  Saving or deleting answers with the account's balance before and after. Balances on the Accounts page now include the
  transactions. An account with transactions can't be deleted or change its currency (409); the accounts API gives
  each account its number of transactions.
- **The form** (`TransactionDialog`): Expense / Income in the title row; the week strip with ‹ › and Mantine's calendar
  (Today and Yesterday, Monday first, nothing after today); the account field with its dropdown or sheet; the
  calculator display (the app's own keys on the phone, typed on the desktop, Enter saves); the category pills (6 / 8)
  with All categories and its search; the note. A missing amount turns the display red with its message read out only
  (a new custom rule in DESIGN_RULES); "Pick a category." next to its label. A failed save keeps everything typed.
- **Opened from** the + in the sidebar and the tab bar, the + on every account card (that account picked for both
  types), and a row of the Transactions page (to change or delete it; Delete asks and says what the balance goes back
  to). After a save the notification counts the balance to its new value, the row lights up on the Transactions page
  and the card on the Accounts page.
- **The account form** (I-011's "Later (F-018)" screens): Delete is off with the reason once the account has
  transactions, the currency is fixed, and an archived account with transactions keeps only Restore.
- **Shared pop-ups:** `ResponsiveDialog` / `BottomSheet` take a control in the title row (`heading`), buttons before
  the close button (`actions`), a wider dialog (`size`) and a full-height sheet (`full`). A tap on a label or an input in
  a sheet's title row no longer starts a swipe (the Expense / Income switch didn't switch on the phone).

Decisions made while building, within the approved prototype:

- Transfer and exchange are F-019's: the switch has Expense and Income for now.
- Changing the type keeps the amount, the day and the note (the prototype kept the amount only).
- "Last used" is the last added, whatever its day; the most used are counted over 90 days. With no history yet the
  pills are the first categories in the report's order, and the first account in use is picked.
- The list's line says "The full list with filters comes later" instead of naming F-020.
- Escape closes only the open list or calendar, not the form under it.

Checked: backend and frontend unit tests, the E2E test on the desktop and the phone, the design check on the
Transactions and Accounts pages (0 issues), axe on the open form and its lists (it found the calendar's days of other
months too faint: now hidden, as in the prototype); every state at 375 and 1440 px, light and dark, looked at (fixed:
the display, keys and switch in the page's own color in dark mode; the phone's calendar not filling its sheet; the
amount not in focus on the desktop when the form's data came after it opened).

Owner's review of the PR (2026-11-01): the Note was Mantine's small default input; it is now the app's field, as the
account form's Name (52 px, 16 px text, the fields' border).

## Tests

- Unit (backend): `TransactionTests`, `BalanceSheetTests` (movements), `TransactionValidatorTests`,
  `TransactionSuggestionsTests`, `TransactionsControllerTests`, `AccountsControllerTests` (the 409s), the model test.
- Unit (frontend): `amount.test.ts` (the calculator), `days.test.ts`, `formDefaults.test.ts`, `TransactionsPage.test.tsx`
  (the list, adding on the desktop and with the phone keys, what is missing, a failed save, the category following the
  account, income, the week strip, changing and deleting, the + on a card, Delete off).
- E2E (Playwright): `transactions.spec.ts`: an expense from an account's card, changed and deleted, then an income;
  the balance changes; Delete off on the account.

## Notes

- **Deleting an account (I-011):** only an account without transactions can be deleted (owner, 2026-10-30). Once
  transactions exist, `DELETE /api/accounts/{id}` refuses an account that has any, and the edit form turns Delete off
  with the reason, as in the I-011 final prototype (screens "Later (F-018)"); an archived account with transactions
  keeps only Restore.
