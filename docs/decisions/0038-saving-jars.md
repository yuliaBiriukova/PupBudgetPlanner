# 0038. Saving jars: money set aside inside real accounts, a history of moves, and jars in the month's plan

- Status: Accepted
- Date: 2026-11-27

## Context

F-034 lets a person save for goals (a car, an apartment) in **jars**. The owner chose option B (Q-014): a jar is
symbolic, it sets money aside inside the person's real accounts, so account balances keep matching the bank and each
account says how much of it is free. Money goes in from an account, comes out back to one, moves between jars, and
the Budget page can put the month's saved money into jars. The month's plan (F-033) gets an amount per jar, counted
within its total (Q-015) but not as spending (owner, 2026-11-27).

## Decision

**Data model.**

- `jars` — the person's jars: name, icon and colour (enums stored as text), currency, optional `goal` (whole) and
  `target_month` (its first day), note, `created_at`, `closed_at`. A jar is never deleted: closing it keeps its
  history, takes it off the list and frees its money; deleting the person deletes their jars.
- `jar_moves` — every move into or out of a jar: `jar_id`, `account_id`, `date` (Kyiv's), `kind` (`PutIn`,
  `TakeOut`, `MovedIn`, `MovedOut`, `SavedMoney`), `amount` in the jar's currency (negative out) and `account_amount`
  in the account's, `other_jar_id` for a move between jars and `month` for a month's saved money. The jar's history
  names each line from its kind, so the texts stay in the app's i18n.
- Only moves are stored. **What is in a jar** (the sum of `amount`), **where it lies** (per account) and **what of an
  account is in jars** (the sum of `account_amount` over the open jars' moves) are worked out on each read, as the
  balances are (ADR 0022). An account's **free** money is its balance less that; below zero when spending ate into the
  jar money, shown as "… overspent" on its card.
- **Another currency** (Q-014, 1): putting in from an account in another currency converts at today's NBU rate; the
  move keeps both amounts. Taking out takes the account amount's **share** (taking out everything leaves nothing on the
  account, whatever the rate went in at). Moving between jars keeps to jars of one currency; the money stays on its
  account.
- An account with jar moves counts as used: it can't be deleted or change its currency, as with transactions.
- `jar_budgets` — the month's plan per jar (`budget_month_id`, `jar_id`, `amount`, `order`), copied with the rest when
  a month starts from the last one (only open jars). `BudgetPlan` counts them within the total beside the groups; the
  total's overflow says "The groups and jars add up to …". Only a jar in the month's (report) currency can be planned.
  Closing a jar takes it out of this month's plan and later ones.
- `MonthBudget` adds the month's **income**, its **jars** (planned, set aside this month) and its **saved money** two
  ways: what's left of the groups' budgets (nothing over counted; a group without its own budget with its categories'
  sum) and income minus expenses, with what went into jars from that month's saved money already. Money put into
  jars is **not spending**: Spent and Left don't change; *Not in any group* is what's left after the groups and jars.
- `AccountItem.inJars` and `AccountsTotal.inJars` (at the same rates as the total) give the Accounts and Jars pages
  their split. In a family view someone else's account says what of it is in jars only when it is shared in full
  (F-030), so a balance-only card doesn't tell their jars.

**API** (personal, no `who`): `GET /api/jars` (the open jars with their places, history and this month's plan),
`POST /api/jars`, `PUT /api/jars/{id}` (the currency stays once money went in), `POST /api/jars/{id}/close`,
`POST /api/jars/{id}/moves` (`In` typed in the account's currency, `Out` / `Move` in the jar's; only as much as the jar
has on that account comes out), `POST /api/jars/saved-money` (a month's saved money split across jars in the month's
currency, each from an account, together not more than the chosen way's amount less what went in before),
`PUT /api/budget/jars/{id}`.

## Consequences

- Balances, reports and the balance at month end don't change: jar moves are not transactions.
- Putting in more than an account's free money is allowed (the form warns); the account then shows it overspent.
- The reminder on the 1st is unchanged: the saved money is offered on the Budget page, by a past month's *… is over*
  card at the end of its Jars card.
- A shared family jar is left for later.
