# F-034 · Saving jars

| | |
|---|---|
| Type | Feature |
| Milestone | M7 — Budgets |
| Priority | Medium |
| Status | Todo |
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

## Still open (Q-014)
Claude's proposals; the owner decides before the design round.

| # | Question | Proposal |
|---|----------|----------|
| 1 | Currency | One per jar; money set aside from an account in another currency is converted at the NBU rate of that day |
| 2 | Taking money out | Allowed any time (the money is the person's); the history keeps every in and out |
| 3 | Reaching the goal | The jar shows "Goal reached"; the person closes it (archived, history kept) when the money is used |
| 4 | Progress | Saved / goal with a progress bar; with a target date, "save 4,200 a month to make it" |
| 5 | Which account saved money is set aside from | The person picks it (the account with the most free money in the jar's currency comes first) |
| 6 | Moving what's left during the month | The Budget page's total "left" for the month goes down by what was moved; the categories' budgets stay as planned |
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
- [ ] Each jar shows saved so far and, with a goal, its progress; with a target date, how much to save a month to
      make it.
- [ ] **Plan per jar:** the month's plan (F-033) has amounts for jars; the Budget page shows how much of each has
      been set aside so far and how much is still to go. A new month is prefilled from last month, as F-033's
      budgets are.
- [ ] **Saved money into a jar:** the Budget page shows the month's saved money two ways, what's left of the
      budgets and income minus expenses, and the person picks one; they put all or part of it into a jar, or keep
      it free. Offered when the month closes (with the reminder on the 1st, F-033) and any time with a button on the
      Budget page.
- [ ] Jars are personal; in the family views a member's jars show as F-030 privacy allows.
- [ ] Works on the phone and on the desktop, light and dark.

## Tasks
- [ ] Settle the rest of Q-014 with the owner; update the acceptance criteria.
- [ ] References (Mobbin and open examples: Monobank jars, savings goals in budgeting apps); note them below.
- [ ] 3 prototype stories in `frontend/src/prototypes/F-034-saving-jars/`; owner picks; final prototype; owner
      approves.
- [ ] Backend, frontend, tests and docs once approved (ADR for the jar model).

## Design
References (Mobbin, other apps, the internet): —
Prototype stories: *Prototypes / F-034 Saving jars* in Storybook (`frontend/src/prototypes/F-034-saving-jars/`).
Chosen variant: — · Final prototype approved: —

## Tests
- Unit: in jars / free per account (also in another currency, and when spending eats into jar money), progress and
  "a month to make it", the month's saved money both ways, the validators; frontend components and hooks.
- E2E (Playwright): create a jar, set money aside and take it out, see the account's split; plan a jar in the
  month and see "still to go"; put the month's saved money into a jar; close a jar.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
- Built after F-033: it adds jars to the month's plan and the "saved money" choice to F-033's Budget page and
  reminder.
- "Family" privacy (F-030) decides per account what members see; jars need the same choice, or follow the accounts
  they are set aside from. Decided in the design round.
