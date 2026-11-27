# F-034 · Saving jars

| | |
|---|---|
| Type | Feature |
| Milestone | M7 — Budgets |
| Priority | Medium |
| Status | In progress |
| Branch | `feature/F-034-saving-jars` (planned on `plan/m7-budgets-and-jars`) |
| Design | 🎨 3 prototype stories required (the jars list, a jar with its goal and history, putting money in and taking it out) |
| Approved | — |

## Goal
A person saves for a goal (a car, an apartment, a vacation) in a **jar**: a symbolic account with a name, a goal
amount and how much is in it so far. They see how close each goal is and how much of their money is already set
aside, so it isn't spent by accident. Asked by the owner on 2026-11-16 for M7, next to monthly budgets (F-033).

## Today
Money lives on accounts (F-014): Cash, a bank, or a source of the person's own (Deposit, …), each with one currency.
Transfers move money between accounts and are neither income nor expense (PRODUCT.md, business rule 2). There is
no way to say "this part of my Monobank money is for the car".

## Agreed (owner, 2026-11-16)
- **B: a jar sets money aside inside real accounts.** Account balances don't change and keep matching the bank;
  each account shows how much of it is in jars and how much is free.
- A jar has a **name**, an **icon or colour** (no paw or dog images), a **goal amount** and a **target date** (both
  optional) and a **note**.
- **Personal jars** for now; a shared family jar later.
- **Two links to the monthly budget (F-033):**
  1. **Plan per jar:** the month's plan also has amounts for jars ("Car: 5,000"), and the Budget page shows how much
     of it has been set aside so far and how much is still to go.
  2. **Saved money into a jar:** what was saved can go into a jar or stay free to spend; the person chooses. The
     app shows both amounts and the person picks which to use: what's **left of the month's budgets** (planned
     20,000, spent 17,000 → 3,000) or the month's **income minus expenses** (NET, as in the report). Offered
     **when the month closes** (with the reminder on the 1st: "Last month 3,000 was saved — put it into a jar or
     keep it?") and **any time during the month** with a button on the Budget page.
  3. **Split across jars** (owner, 2026-11-16): the saved money can be divided between several jars in one go
     (saving for two things), the rest staying free. Amounts are typed per jar, or filled **by this month's plan**:
     each jar gets what is still to go of its planned amount, as far as the money reaches.

### Q-014 and Q-015 (owner accepted Claude's proposals as they were, 2026-11-16)

| # | Question | Answer |
|---|----------|--------|
| 1 | Currency | One per jar; money set aside from an account in another currency is converted at the NBU rate of that day |
| 2 | Taking money out | Allowed any time (the money is the person's); the history keeps every in and out |
| 3 | Reaching the goal | The jar shows "Goal reached"; the person closes it (archived, history kept) when the money is used |
| 4 | Progress | Saved / goal with a progress bar; with a target date, "save 4,200 a month to make it" |
| 5 | Which account saved money is set aside from | The person picks it (the account with the most free money in the jar's currency comes first) |
| 6 | Moving what's left during the month | ~~The Budget page's total "left" for the month goes down by what was moved~~ Changed by the owner, 2026-11-27: money put into jars is not an expense; the month's *Spent* and *Left* and the categories' budgets don't change. The jars' plan is a part of the month's total (Q-015), shown in *Where the … goes* |
| 7 | Free money shrinks below what's in jars (spent from an account with money set aside) | The account shows a warning "2,000 of the jar money was spent"; the person takes it out of a jar or tops the account up |
| 8 | Where | A Jars section on the Accounts page (or its own page in the menu), decided in the design round |
| 9 | Do the jars planned in the month count within F-033's total for the month? (Q-015) | Yes: the total is what the person plans to spend and set aside, so the groups' budgets plus the planned jar amounts may not be bigger than it |

## Options considered
The main choice was what "symbolic" means for the balances.

| | A. A jar is an account of its own | B. A jar sets money aside inside real accounts |
|---|---|---|
| Putting money in | A transfer from a real account to the jar | "Set aside 5,000 from Monobank UAH" |
| Real account's balance in the app | Goes down by what went into jars, so it no longer matches the bank app (unless the money really moved, e.g. to a Monobank jar) | Unchanged, matches the bank; the account shows "25,000 · 20,000 in jars · 5,000 free" |
| Reports, balance at month end | Unchanged (transfers aren't income or expense) | Unchanged |
| Spending the goal (buying the car) | An expense from the jar | An expense from the real account; the jar is emptied and closed |
| New to build | Little: an account kind with a goal | A new "set aside" record and the "free" amount on accounts |

B was chosen: the jar is symbolic, the money stays where it really is, account balances keep matching the bank, and
the person sees how much is free to spend. A jar that is a real separate place (a Monobank jar, a deposit) is already
an account today.

## Acceptance criteria
- [ ] A person creates a jar with a name, an icon or colour, a currency and, optionally, a goal amount, a target
      date and a note; edits it; closes it (archived, history kept).
- [ ] They set money aside into a jar from one of their accounts and take it back out; the jar's history lists
      every in and out with its date and account.
- [ ] Account balances don't change; each account with jar money shows its balance, how much is in jars and how
      much is free. The total on the Accounts page shows the same split.
- [ ] Reports and the balance at month end don't change.
- [ ] A jar has one currency; money set aside from an account in another currency is converted at the NBU rate of
      that day. Money can be taken out any time.
- [ ] Each jar shows saved so far and, with a goal, a progress bar; with a target date, how much to save a month to
      make it. A jar that reached its goal shows "Goal reached"; the person closes it when the money is used.
- [ ] If spending eats into an account's jar money (free money below zero), the account shows a warning ("2,000 of
      the jar money was spent"); the person takes it out of a jar or tops the account up.
- [ ] **Plan per jar:** the month's plan (F-033) has amounts for jars; the Budget page shows how much of each has
      been set aside so far and how much is still to go. A new month is prefilled from last month, as F-033's
      budgets are. The planned jar amounts count within the month's total: the groups' budgets plus the jars may not
      be bigger than it (saving is blocked, as in F-033).
- [ ] **Saved money into a jar:** the Budget page shows the month's saved money two ways, what's left of the
      budgets and income minus expenses, and the person picks one; they put all or part of it into one jar or split
      it across several, each from an account they pick (the one with the most free money in that jar's currency
      first), and keep the rest free. The split shows an amount per jar, typed by hand or filled with one button
      **by this month's plan** (each jar gets what is still to go of its planned amount, in the plan's order, until
      the money runs out); together the amounts may not be more than the saved money, and what is not given out
      stays free. Offered
      when the month closes (with the reminder on the 1st, F-033) and any time with a button on the Budget page;
      money put into jars is not an expense: the month's *Spent* and *Left* and the categories' budgets don't
      change (owner, 2026-11-27).
- [ ] The jars' plan is a part of the month's total (Q-015): *Where the … goes* shows *Jars* as a part beside the
      groups, and the slip's "… isn't in any group" and *Not in any group* leave it out.
- [ ] Jars are personal; in the family views a member's jars show as F-030 privacy allows.
- [ ] Works on the phone and on the desktop, light and dark.

## Tasks
- [x] Settle Q-014 and Q-015 with the owner; update the acceptance criteria (2026-11-16).
- [ ] References (Mobbin and open examples: Monobank jars, savings goals in budgeting apps); note them below.
- [ ] 3 prototype stories in `frontend/src/prototypes/F-034-saving-jars/`; owner picks; final prototype; owner
      approves.
- [ ] Backend, frontend, tests and docs once approved (ADR for the jar model).

## Design
References (open pages only, nothing that needs a sign-in):
- [monobank Banka](https://monobank.ua/en/banka): a jar is drawn as a glass jar whose fill level rises toward the goal,
  with a name, a goal and a date. Taken: the fill level as the jar's own picture (variant 2).
- [YNAB targets](https://support.ynab.com/en_us/getting-started-with-targets-ryAEP08xC): a thin progress bar under each
  target and "how much more is needed" for the month. Taken: the bar and the line "save … a month to make it" (all
  variants).
- [Monzo savings goals](https://monzo.com/blog/2018/07/19/set-savings-goals): pots next to the main balance, each with a
  name, an image and a goal. Taken: jars sit next to the accounts, the money in them told apart from the rest
  (variant 1).
- [Actual Budget, envelope budgeting](https://actualbudget.org/docs/getting-started/envelope-budgeting): envelopes are
  virtual, the money stays on the real accounts. Taken: option B as agreed, the account saying what of it is set aside.
- [Goodbudget](https://www.nerdwallet.com/finance/learn/goodbudget-app-review): savings envelopes kept apart from the
  monthly ones. Taken: jars as their own list, not mixed into the month's budgets.

Brief: the couple sets money aside for a car, an apartment, a holiday, inside the Monobank or Deposit account where it
really lies. The one job: see how close each goal is and how much of the money on the accounts is still free to spend;
that comes first. The subject's world: a glass jar on the shelf, an envelope with "for the car" on it, the Deposit
card. The feeling: "calm, it's put away".

Plan from the design system: reused the Accounts page's head, *In total*, groups and `AccountCard` (copied into the
prototype to add the free / in jars line), `AddCard`, `ResponsiveDialog` / `BottomSheet`, the pill switch, `Pills`, the
fields, the budget's 6 px bar. New: the jar card or tile, the jar's dialog (saved, goal, bar, the month's pace, where
the money lies, history), *Put in / Take out* with the account picked from pills (the most free money first), *New
jar*. A jar's colour is one of Mantine's palette colours from the theme (no new token). Motion: only the bar filling
after a put in.

Round 1 (2026-11-17), three directions:
1. **On Accounts**: a *Jars* row of cards between *In total* and the accounts; each account card says what of it is
   free and what is in jars, *In total* the same for everything. Bold element: the free amount.
2. **A page of drawn jars** (after Budget in the menu): every jar drawn as a glass jar filled to its progress, with
   what is set aside and what is free on top. Bold element: the jars filling up.
3. **The ledger** (a page of their own): a table, a row per jar with saved, goal, still to go, a month to make it and
   what went in each of the last months; a row opens in place with its history and *Put in / Take out* right there.
   Bold element: the months, as in the spreadsheet.

The month's plan for jars and the split of the saved money (F-033's Budget page) come in round 2, on the variant the
owner picks.
Prototype stories: *Prototypes / F-034 Saving jars* in Storybook (`frontend/src/prototypes/F-034-saving-jars/`), in
the app's shell, Olena's accounts from the Accounts stories with five jars (one goal reached, one account whose jar
money was partly spent):
- [Variant 1: On Accounts](http://localhost:6006/?path=/story/prototypes-f-034-saving-jars--variant-1&nav=false&panel=false&globals=viewport.value:!undefined)
- [Variant 2: Drawn jars](http://localhost:6006/?path=/story/prototypes-f-034-saving-jars--variant-2&nav=false&panel=false&globals=viewport.value:!undefined)
- [Variant 3: Ledger](http://localhost:6006/?path=/story/prototypes-f-034-saving-jars--variant-3&nav=false&panel=false&globals=viewport.value:!undefined)

In every variant a jar opens (a dialog, or in place in the ledger) with Put in / Take out that work while the story is
open, and *New jar* opens the form. Variants 2 and 3 are shown at `/jars`; the *Jars* item in the menu is described,
not drawn.

Round 2 (owner, 2026-11-17: "I like variant 2 and 3, maybe we can add toggle for how to display the jars"; the Jars
item missing from the menu; how money gets into jars; jars in the budget):
[Final prototype](http://localhost:6006/?path=/story/prototypes-f-034-saving-jars--final-prototype&nav=false&panel=false&globals=viewport.value:!undefined)
(its `start` control opens Budget or Accounts first; the menu works too):
- **Menu:** *Jars* after Budget in the sidebar, and under More on the phone after Budget.
- **Jars page:** what is set aside and what is free on top; a pill switch *Jars* / *Table*, kept on the device: the
  drawn jars (variant 2) with *Put in* under each, or the ledger (variant 3) with its rows opening in place; under them
  the accounts the jar money lies on, each with its free part.
- **Money into a jar, three ways:** *Put in* (under a jar, or in its dialog) from an account, the most free money
  first; *To a jar* in the same dialog moves money from one jar to another, the money staying on its account; and the
  Budget page's saved money split across jars. *Take out* gives it back to an account. The history names each
  ("Moved to Apartment", "November's saved money").
- **Budget page:** a *Jars* card after the groups with something planned or spent: what is still to go of the jars'
  plan, a row per planned jar (set aside of planned, its bar), *Plan a jar for November*. A row opens the jar's plan:
  the amount, a button with the pace that makes the goal by its date, and a red line when the groups' budgets and the
  jars come to more than the month's total (Save blocked). A *Saved in November so far* card first in the month's
  column (after the groups on the phone; *November is over* for a past month, as the reminder on the 1st offers):
  what's left of the budgets and income minus expenses side by side, *Put into jars* opens the split: pick which
  amount, *Fill by November's plan* or type per jar, each from an account, *Into jars* and *Stays free* under them.
- **Accounts page:** variant 1's cards: free and in jars under the balance; *In total* says the same.
- ~~Not drawn yet: the slip's "… isn't in any group" and *Where the 80 000 ₴ goes* still leave the jars out~~ Drawn
  2026-11-27 (below).

Owner's review of the final prototype (2026-11-17), built into the same story:
1. *Put in / Take out / To a jar* use the quick-add form's fields: the calculator display for the amount, the account
   field and its list (each account's free money, or how much of the jar lies on it, on the right; the most free money
   first), and a jar field and list built the same way.
2. The jar's history is folded under a *History* row with its icon and count; it opens on a click.
3. Money in another currency goes into a jar (Q-014, 1): putting in, the accounts in the jar's currency come first, then
   the others; from one in another currency the amount is typed in its currency, with "4 135 ₴ into Car at today's NBU
   rate, $1 = 41.35 ₴" under it. The account's free money goes down in its own currency. The Budget's split keeps to
   accounts in the jar's currency.
4. Account cards: from the tablet's width every card is one height in its row, with room for the free and in-jars
   lines, so the balances line up.
5. The saved money moved from the month's column to the end of the *Jars* card (a block with the two amounts and *Put
   into jars*), so *Where the … goes* and *Spent outside the plan* keep the column as F-033 has it.

Owner's second review (2026-11-17):
1. The jar's pencil opens *Edit …*: the new-jar form filled in (a jar with money keeps its currency), *Close jar* at its
   end with what it does.
2. Account cards: the two lines were too tall; three ways with one line at most, each a story opening on Accounts:
   - [Account cards 1: One line](http://localhost:6006/?path=/story/prototypes-f-034-saving-jars--cards-1&nav=false&panel=false&globals=viewport.value:!undefined):
     "30 000 ₴ free" under the balance, the jars' amount with the jar icon on the right of the same line.
   - [Account cards 2: Free only](http://localhost:6006/?path=/story/prototypes-f-034-saving-jars--cards-2&nav=false&panel=false&globals=viewport.value:!undefined):
     only "30 000 ₴ free" under the balance; no jars' amount on the card (owner, 2026-11-17: first it was on the bank
     line, the owner kept the free line and dropped the jar one). The card keeps a bank card's 1.59:1 shape.
   - [Account cards 3: Free first](http://localhost:6006/?path=/story/prototypes-f-034-saving-jars--cards-3&nav=false&panel=false&globals=viewport.value:!undefined):
     the free money is the big number, "free of 250 000 ₴" and the jars' amount under it.
   On a narrow card (five in a row) the line of 1 and 3 wraps in two; the card is 3:2 instead of a bank card's 1.59:1
   so it still fits.
3. At most five cards in a row, each at least 224 px wide: five at 1920 px (the page column is 1200 px), four at
   1440 px, three at 1024 px; where one fits per row (a tablet's column) the card is flatter (2.6:1).
4. *New jar* on the shelf is level with the jars' bodies, under the lids.

Owner's third review (2026-11-17):
1. A jar open for many months, in the table: the months shown (as many as fit, three to six) page back and forth with
   arrows above the table ("Aug – Nov 2026"), back to the page that starts with the oldest jar money; an *Earlier*
   column before them holds everything put in before the first month shown, so a row still adds up to *Saved*. Every
   month column is as wide. The fake data has an apartment jar since January 2025 to show it. On the phone and tablet
   (two lines per jar) there are no month columns; a jar's history is in its opened row.
2. *Account cards 2: Free only*: "X free" is above the balance now.
3. When spending ate into the jar money the card says "Jars short by 1 789 ₴" (with the warning icon) instead of
   "−1 789 ₴ free", as the move dialog's account list already did.
4. The *Jars* card on Budget is where round 3 put it: in the right column after the groups with a plan, *Saved in
   November so far* at its end. On a narrow column the *Put into jars* button covered the two amounts; it is now under
   them.

Claude's UX review of the prototypes (2026-11-17, asked by the owner: "fix what looks bad and breaks UX/UI
principles"), built into the same stories:
1. *New jar* / *Edit*: the currency is the app's one currency list (the shared `CurrencyPicker`, custom rule of F-016)
   instead of a four-way switch; a jar with money shows it greyed with the reason. *By* is a month picker
   (`MonthPickerInput`, cleared with its ×) instead of a month typed as text.
2. *Close jar* asks first, from the jar's window and from its edit form: "Close Car?", how much becomes free, *Keep it*
   / *Close jar* (DESIGN_RULES §6: an action that can't be taken back is confirmed).
3. A jar's name is whole on the shelf: on two lines when it needs them ("Summer in the Carpathians" was cut), the
   jars of a line sharing their rows so the amounts stay level.
4. The table's rows show they open: a chevron after the jar's name, turned over when open (the phone rows had one);
   the cells are 2 px tighter a side so the table still fits. A month arrow with nowhere to go is only dimmer, no grey
   disc.
5. *Put in / Take out*: a missing amount only turns the display red, as the transaction form does (custom rule of
   F-018); the line under it stays for a limit ("Only … of the jar lies on …").
6. *Account cards 3: Free first*: jars short no longer shows "−1 789 ₴" big in red, which read as a debt next to the
   credit card's; it is "0 ₴" with "Jars short by 1 789 ₴" under it. On all three cards the free line and the balance
   are 4 px apart (they touched).
7. Small ones: *Where the jar money lies* says "Jars short by …" in red, as the cards do; the History row's icon starts
   on the rows' left edge; *Take out* has its minus in the reached jar's window too; the Budget's two saved amounts
   stand together instead of at the card's two halves.

Seen and left for the owner to decide: the shelf has *New jar* twice (the button and the dashed jar); the split's
*From …* is a plain select that appears once an amount is typed, not the move dialog's account field; "To a jar" (the
switch), "Move from Car" (the title) and "Move" (the button) name one thing three ways; a required field's placeholder
turns red with the error and reads as a typed value (the theme's, app-wide).
Owner, 2026-11-27, on these: *New jar* stays twice (the button and the dashed jar) on every width; the move is
"To a jar" on the switch and "Move to jar" in the title and on the button (built into the final prototype); the red
placeholder is fixed app-wide in its own change, [I-035](../../improvements/I-035-calm-error-placeholders/I-035-calm-error-placeholders.md).

Owner, 2026-11-27, two more, built into the final prototype:
1. **The split's account:** the move dialog's account field (the bank under the name, the free money on the right, the
   most free money first) under a jar once an amount is typed for it (owner, the same day: not from the start), with a
   *From* label before it in the icons' column instead of "From" in every option.
2. **Jars aren't spending:** "Do not count money put into jars as an expense, it's just the money that was planned for
   some spending that can't be spent for something else. But show the jars in *Where the 80 000 ₴ goes*." The month's
   *Spent* and *Left* don't change when money goes into a jar; the split's hint says so. *Where the 80 000 ₴ goes* has
   *Jars* (the month's jar plan, 32 000 ₴, 40 %) as a part sorted with the groups, its row bringing the Jars card into
   view; *Not in any group* and the slip's "… isn't in any group" are what's left after the groups and the jars
   (500 ₴, was 32 500 ₴).
3. **The Jars page's totals** (explained to the owner): *Set aside* is every jar's money in hryvnias at the NBU rate;
   *Free to spend* is every account's balance in hryvnias (*In total* on Accounts) minus *Set aside*. An account whose
   jars are short takes its shortfall off *Free to spend* (owner: "Keep subtracting"); accounts with no jars count as
   free in full.

Owner, 2026-11-27: *Where the jar money lies* should be an h2 heading, and the block "seems redundant or not
straight-forward": other variants asked for. The heading is now set as the app's other section headings ("Where it
went": the display font, 18 px). Three directions, each a story opening on Jars with the block under the shelf:
- [Jar money 1: Only when short](http://localhost:6006/?path=/story/prototypes-f-034-saving-jars--jar-money-1&nav=false&panel=false&globals=viewport.value:!undefined):
  no list. Which account holds a jar's money is already in the jar's window, each account's free money on Accounts.
  Only while an account's jars are short, a box says so in a sentence ("Mono black has 48 211 ₴, but its jars hold
  50 000 ₴: 1 789 ₴ of the jar money was spent.") with *Take out* (the jar with the most money on it).
- [Jar money 2: Bars](http://localhost:6006/?path=/story/prototypes-f-034-saving-jars--jar-money-2&nav=false&panel=false&globals=viewport.value:!undefined):
  each account with jar money: its balance, one bar with a piece per jar in the jar's own colour and the free rest an
  outline, the jars named with their amounts under it and what is free (or short) at the right. Two or three accounts
  in a row on a wide screen.
- [Jar money 3: How Free adds up](http://localhost:6006/?path=/story/prototypes-f-034-saving-jars--jar-money-3&nav=false&panel=false&globals=viewport.value:!undefined):
  a small table of every account, jars or not: in jars, free (another currency's in hryvnias under it), ending in
  *Free to spend* — the number on top, so it explains itself. It shows that a credit card's debt (Mono credit,
  −4 312 ₴) is taken off *Free to spend* too.
The final prototype keeps the list as it was (with the h2) until one is picked.

Owner, 2026-11-19: **no table view for jars.** The final prototype's Jars page is the shelf only: the *Jars* / *Table*
switch and the ledger with its months are gone from it (points about the table above, the third review's 1 and the UX
review's 4, no longer apply to the final prototype). A jar's ins and outs are in its window, under *History*.
*Variant 3: Ledger* stays as round 1's story.

Owner, 2026-11-19: **account cards: "Free only"** ("let's keep cards 2 variant, create final prototype and remove the
rest"). The prototype is now one story, the
[Final prototype](http://localhost:6006/?path=/story/prototypes-f-034-saving-jars--final-prototype&nav=false&panel=false&globals=viewport.value:!undefined)
(its `start` control opens Budget or Accounts first; the menu works too). The stories *Variant 1–3* and *Account cards
1–3* and their code are deleted, so their links above no longer open. What the final prototype is:
- **Menu:** *Jars* after Budget in the sidebar, under More on the phone.
- **Jars page:** what is set aside and what is free on top; the jars drawn on a shelf, each filled to its progress, with
  its name (whole, on two lines at most), what is saved, its share of the goal or "Goal reached", and *Put in* under
  it; a dashed *New jar* after them; under the shelf, the accounts the jar money lies on, each with its free part or
  "Jars short by …". No table view.
- **A jar's window:** saved, the bar, to go, the month's pace and plan, the note, where the money lies, *History*
  folded; *Take out* / *Put in*, or *Take out* / *Close jar* once the goal is reached; the pencil opens *Edit*.
- **Put in / Take out / To a jar:** the quick-add form's amount display and account field, a jar field for a move,
  another currency at today's NBU rate.
- **New jar / Edit:** name, icon, colour, the app's currency list, goal, a month picker for *By*, note; *Close jar* at
  the end of *Edit*. Closing asks first.
- **Budget page:** the *Jars* card after the groups with a plan (a row per planned jar, *Plan a jar for November*, the
  saved money with *Put into jars* and its split across jars).
- **Accounts page:** *In total* says what is free and what is in jars; a card with jar money says "30 000 ₴ free"
  above its balance, or "Jars short by 1 789 ₴" with the warning icon; no jars' amount on the card; at most five cards
  in a row.

Chosen variant: 2 "Drawn jars" (the table view of 3 dropped), account cards "Free only" (2026-11-19) · Final prototype
approved: —

## Tests
- Unit: in jars / free per account (also in another currency, and when spending eats into jar money), progress and
  "a month to make it", the month's saved money both ways, the split by this month's plan (money enough for all
  jars, and running out part-way), the validators; frontend components and hooks.
- E2E (Playwright): create a jar, set money aside and take it out, see the account's split; plan a jar in the
  month and see "still to go"; split the month's saved money across two jars (by the plan and by hand), the rest
  staying free; close a jar.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
- Built after F-033: it adds jars to the month's plan and the "saved money" choice to F-033's Budget page and
  reminder.
- "Family" privacy (F-030) decides per account what members see; jars need the same choice, or follow the accounts
  they are set aside from. Decided in the design round.
