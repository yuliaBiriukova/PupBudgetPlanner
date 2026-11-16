# F-033 · Monthly budgets per category

| | |
|---|---|
| Type | Feature |
| Milestone | M7 — Budgets |
| Priority | Medium |
| Status | Todo |
| Branch | `feature/F-033-category-budgets` |
| Design | 🎨 3 prototype stories required (the Budget page, "left" in the quick-add form and on Transactions, the reminder banner) |
| Approved | — |

## Goal
A person plans how much they will spend in each category this month, then sees at any time how much is left in each
one, so they can slow down before a category runs out instead of finding it in the report at the month's end.
Asked by the owner on 2026-11-16 as the new M7 (in place of Quality); it was "budgets per category" in M11.

## Acceptance criteria
- [ ] A person plans each month's budget: an amount per expense category, set for that month. A new month's plan
      starts prefilled with last month's amounts; the person changes what they need and saves. Amounts can be changed
      or removed during the month.
- [ ] Nothing carries over: unspent money or overspending stays in its month.
- [ ] A **Budget page** shows the month's categories with budget, spent so far and left; a category that went over
      shows by how much, so it stands out. Budgets are set there, per expense category (no income budgets); each
      group shows the sum of its categories. Past months can be opened and edited; a month that was never planned
      offers to plan it.
- [ ] Budgets are personal: each person plans their own (no family budget for now).
- [ ] **When adding an expense**, each category in the quick-add form shows what is left of its budget this month.
- [ ] **On the Transactions page**, a short summary of this month's budget sits next to the month's list.
- [ ] **Reminder on the 1st of the month:**
  - an in-app banner the first time the person opens the app in a month they haven't planned yet ("Plan this
    month's budget", with a button to the Budget page), until they plan it or close it;
  - a phone push notification on the 1st at 09:00 Kyiv time, for people who turned it on (asked once, per device; works from the
    installed app, F-025).
- [ ] The amounts are in the person's report currency; spending in other currencies is converted at the NBU rate of
      each transaction's date (PRODUCT.md, business rule 1), whole amounts (ADR 0018), the same numbers as the
      monthly report.
- [ ] Editing or deleting a transaction updates "spent" and "left" right away.
- [ ] Works on the phone and on the desktop, light and dark.

## Agreed (owner, 2026-11-16)
- Priority Medium; the new M7 "Budgets" replaces "Quality" (whose integration tests stay a post-MVP idea without a
  milestone).
- Budgets are set **month by month**, not once for all months; a new month is **prefilled from last month**.
- **No carry-over** between months.
- "Left" shows on a **Budget page**, **when adding an expense** and **on the Transactions page**.
- A **reminder on the 1st**: an **in-app banner** and a **phone push notification**.

### Q-013 (owner accepted Claude's proposals as they were, 2026-11-16)

| # | Question | Answer |
|---|----------|--------|
| 1 | Budgets per category only, or also per group (e.g. Daily living)? | Per category; the group shows the sum of its categories' budgets |
| 2 | Family: personal budgets only, or a family budget on the combined view? | Personal budgets only for now; a family budget later if needed |
| 3 | Income categories? | No budgets for income |
| 4 | Can you look at past months' budgets? | Yes, switch months as on the report; a past month's budget can still be edited |
| 5 | A month the person skipped (never planned): what do the Budget page and "left" show? | The page offers to plan it (prefilled from the last planned month); no "left" in the quick-add form until it is planned |
| 6 | Push time on the 1st | 09:00 Kyiv time |

## Tasks
- [x] Settle Q-013 with the owner; update this file (2026-11-16).
- [ ] References (Mobbin and open examples: budgeting apps' category budget screens); note them below.
- [ ] 3 prototype stories in `frontend/src/prototypes/F-033-category-budgets/`; owner picks; final prototype;
      owner approves.
- [ ] Backend: budget per category and month (Domain, Application, migration), API to read a month (prefilled from
      the last planned one when empty) and save / remove budgets; ADR for the data model.
- [ ] Push notifications: web push (VAPID keys on Render and in user-secrets, subscriptions per device, the service
      worker's push handler), a job that sends the reminder on the 1st; turning it on and off in Settings; ADR.
- [ ] Frontend: the Budget page, "left" in the quick-add form and on Transactions, the reminder banner, TanStack
      Query hooks, i18n keys, Storybook stories.
- [ ] Tests (below); docs: PRODUCT.md, ARCHITECTURE.md, DESIGN_RULES "Screen decisions".

## Design
References (Mobbin, other apps, the internet): —
Prototype stories: *Prototypes / F-033 Category budgets* in Storybook (`frontend/src/prototypes/F-033-category-budgets/`).
Chosen variant: — · Final prototype approved: —

## Tests
- Unit: spent / left per category and month (currency conversion, over budget, prefill from the last planned month),
  the validators, the reminder job's schedule; frontend components and hooks.
- E2E (Playwright): plan a month (prefilled from the last), add an expense, see "left" go down on the Budget page,
  in the quick-add form and on Transactions; change and remove a budget; the banner in an unplanned month. Push is
  checked by hand on a phone (Playwright can't receive it).
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
- Replaces "Budgets / limits per category" from the post-MVP candidates (PRODUCT.md) and from M11 in the roadmap.
- [I-016](../../improvements/I-016-category-month-totals/I-016-category-month-totals.md) (this month's total next to
  each category when adding a transaction) overlaps "left" in the quick-add form: for categories with a budget F-033
  shows what is left; I-016 would add the month's total for the others. Decide in the design round whether I-016 is
  folded in or stays apart.
- Push notifications are new to the app: they need the person's permission on each device, and on an iPhone they
  work only from the app installed on the home screen. The in-app banner covers everyone else.
- The push is the app's first scheduled job besides the keep-awake ping (Q-002); the free server sleeps at night, so
  it runs in the day, at 09:00 Kyiv (Q-013).
