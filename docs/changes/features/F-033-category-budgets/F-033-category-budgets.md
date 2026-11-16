# F-033 · Monthly budgets per category

| | |
|---|---|
| Type | Feature |
| Milestone | M7 — Budgets |
| Priority | Medium |
| Status | Todo |
| Branch | `feature/F-033-category-budgets` (planned on `plan/m7-budgets-and-jars`) |
| Design | 🎨 3 prototype stories required (the Budget page with group and category budgets, "left" in the quick-add form and on Transactions, the reminder banner) |
| Approved | — |

## Goal
A person plans how much they will spend in each category (or a whole group) this month, then sees at any time how much is left in each
one, so they can slow down before a category runs out instead of finding it in the report at the month's end.
Asked by the owner on 2026-11-16 as the new M7 (in place of Quality); it was "budgets per category" in M11.

## Acceptance criteria
- [ ] A person plans each month's budget: amounts for expense categories and for expense groups, set for that month.
      A new month's plan starts prefilled with last month's amounts (groups and categories); the person changes what
      they need and saves. Amounts can be changed or removed during the month.
- [ ] **Group budgets** (e.g. Daily living 15,000): spending in all the group's categories counts against it, those
      with a budget of their own and those without. Categories inside can have their own budgets too (Eating out
      3,000), but together they may not add up to more than the group's budget: saving is blocked with a message
      that says by how much they go over (also when the group's budget is lowered below them). A group without a
      budget of its own shows the sum of its categories' budgets.
- [ ] Nothing carries over: unspent money or overspending stays in its month.
- [ ] A **Budget page** shows the month's groups and categories with budget, spent so far and left; one that went
      over shows by how much, so it stands out. Budgets are set there (no income budgets). Past months can be opened
      and edited; a month that was never planned offers to plan it.
- [ ] Budgets are personal: each person plans their own (no family budget for now).
- [ ] **When adding an expense**, each category in the quick-add form shows what is left of its own budget this
      month; a category without one shows what is left of its group's budget, if the group has one.
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
- **Group budgets too** (owner, 2026-11-16, changing Q-013 point 1): a group and its categories can both have
  budgets. The categories' budgets may not add up to more than the group's (saving is blocked). In the quick-add
  form a category shows only its own "left"; the group's "left" shows for categories without a budget of their own.

### Q-013 (owner accepted Claude's proposals as they were, 2026-11-16)

| # | Question | Answer |
|---|----------|--------|
| 1 | Budgets per category only, or also per group (e.g. Daily living)? | ~~Per category; the group shows the sum of its categories' budgets~~ Changed the same day: both, see "Group budgets too" above |
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
- [ ] Backend: budget per category or group and month (Domain, Application, migration), the rule that a group's
      categories fit within its budget, API to read a month (prefilled from the last planned one when empty) and
      save / remove budgets; ADR for the data model.
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
- Unit: spent / left per category, group and month (currency conversion, over budget, a group's spending from
  categories with and without budgets, prefill from the last planned month), the rule that categories fit within
  their group's budget (also when the group's is lowered), the validators, the reminder job's schedule; frontend
  components and hooks.
- E2E (Playwright): plan a month (prefilled from the last), add an expense, see "left" go down on the Budget page,
  in the quick-add form and on Transactions; a group budget with a category budget inside, and saving blocked when
  the categories go over the group; change and remove a budget; the banner in an unplanned month. Push is
  checked by hand on a phone (Playwright can't receive it).
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
- [F-034](../F-034-saving-jars/F-034-saving-jars.md) (saving jars, built after this) adds jars to the month's plan
  and, on the Budget page and with the reminder on the 1st, the choice to put the month's saved money into a jar.
  The Budget page's design should leave room for them.
- Replaces "Budgets / limits per category" from the post-MVP candidates (PRODUCT.md) and from M11 in the roadmap.
- [I-016](../../improvements/I-016-category-month-totals/I-016-category-month-totals.md) (this month's total next to
  each category when adding a transaction) overlaps "left" in the quick-add form: for categories with a budget (their
  own or their group's) F-033 shows what is left; I-016 would add the month's total for the others. Decide in the design round whether I-016 is
  folded in or stays apart.
- Push notifications are new to the app: they need the person's permission on each device, and on an iPhone they
  work only from the app installed on the home screen. The in-app banner covers everyone else.
- The push is the app's first scheduled job besides the keep-awake ping (Q-002); the free server sleeps at night, so
  it runs in the day, at 09:00 Kyiv (Q-013).
