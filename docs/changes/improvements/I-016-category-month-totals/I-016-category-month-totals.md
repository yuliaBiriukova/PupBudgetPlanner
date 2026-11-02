# I-016 · This month's total next to each category when adding a transaction

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | Low |
| Status | Todo |
| Branch | `improvement/I-016-category-month-totals` (planned on `plan/i016-i017-quick-add-follow-ups`) |
| Design | 🎨 3 HTML prototypes required (where the totals show in the quick-add form) |
| Approved | — |

## Goal

While picking a category in the quick-add form, you see how much has gone to it this month, as the owners' spreadsheet
shows month by month. Choosing where the money goes also shows where it has been going. Raised in F-018's design
(variant 3 had it on every category cell); the owner kept it out of F-018 and asked for it as an improvement of its own
(2026-11-01).

## Acceptance criteria

- [ ] In the quick-add form (F-018), each category shows what it got this month so far: expenses for expense
      categories, income for income ones.
- [ ] The totals are in the person's report currency; amounts in other currencies are converted at the NBU rate of
      each transaction's date (PRODUCT.md, business rule 1), whole amounts (ADR 0018).
- [ ] Transfers are not counted (business rule 2). A category with nothing this month shows no total, not `0 ₴`.
- [ ] Saving, changing or deleting a transaction updates the totals the next time the form opens.
- [ ] The totals don't slow the form down: it opens and works before they arrive.

## Tasks

- [ ] 3 HTML prototypes: where the totals go. Candidates: under each most-used pill; next to each category in the
      All categories list (dropdown on the desktop, sheet on the phone); a line under the category block for the
      picked one ("Groceries in October: 6 420 ₴").
- [ ] Owner's approval of the final prototype (I-003).
- [ ] API: this month's totals per category for the signed-in person, in the report currency (one request, with the
      categories or on its own).
- [ ] UI: the totals in the chosen place, loading without holding the form up.
- [ ] Storybook stories for the changed parts.

## Design

References: the owners' Google Sheet (category rows, month columns); Monefy's category totals around its chart.
Prototypes: `prototypes/` (not created yet). Chosen variant: — · Final prototype approved: —

## Tests

- Unit (backend): the totals per category for a month, other currencies converted at the rate of each transaction's
  date, transfers left out, nothing this month.
- Unit (frontend): the totals shown, none for an empty category, the form usable while they load.
- E2E (Playwright): add an expense, open the form again, the category's total has grown.
- Screens checked in Playwright screenshots (phone / desktop, light / dark).

## Notes

- **After F-018** (the quick-add form) is built.
- If the report engine (F-021) is built first, the totals come from it; otherwise a small query by category and month,
  which F-021 can take over.
- Priority Low (Claude's proposal): the form works without it; it adds a view of the month while adding.
