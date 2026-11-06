# F-029 · Manage categories

| | |
|---|---|
| Type | Feature |
| Milestone | M5 — Categories & family |
| Priority | High |
| Status | Todo |
| Branch | `feature/F-029-manage-categories` |
| Design | 3 prototype stories required |
| Approved | — (date the owner approved the description and the final prototype) |

## Goal

Each person shapes their own categories and groups instead of living with the default set: add, rename, reorder and
remove them. Added by the owner on 2026-11-06 for the MVP; before, it was planned for M9 after the MVP (Q-003).

Why before Family: F-024's family report merges categories with the same group and name, so it is built on
categories that can already be renamed, moved and hidden.

## Acceptance criteria

- [ ] **Categories:** add one to a group, rename it, change its place in the group, move it to another group of the
      same kind (Income or Expenses), remove it.
- [ ] **Groups:** add one (Income or Expenses), rename it, change its place among the groups of its kind, remove it.
- [ ] **Removing a category:** with no transactions it is deleted for good; with transactions it is hidden: the
      quick-add form doesn't offer it for new transactions, while its past transactions keep it and the reports,
      the Transactions list and its category filter still show it (the archived category the app already supports).
      The dialog says which of the two will happen before it is confirmed.
- [ ] **Removing a group:** possible once none of its categories is in use: deleted if it holds none, hidden if it
      holds only hidden ones; otherwise the page says to move or remove its categories first. The last group of a
      kind can't be removed.
- [ ] **A hidden category can be shown again**, and a new category with a hidden one's name in the same group offers
      to bring the hidden one back instead of making a twin.
- [ ] **Names:** not empty, and unique as now: group names per person, category names per group (hidden ones count);
      a clash says so on the field.
- [ ] **The new order is used everywhere categories are listed:** the Categories page, the quick-add form's picker,
      the Transactions filters and the reports' rows.
- [ ] Changes are only to the person's own categories; nobody else's set changes.
- [ ] The Categories page's line "adding, renaming and removing come later" is gone.
- [ ] Works on the phone (375 px) and the desktop, light and dark; reordering works by touch and with the keyboard,
      not only by dragging with a mouse.

## Tasks

- [ ] References (Mobbin and open sites) for editing a category list
- [ ] 3 prototype stories (where editing lives, how reorder and remove look), final prototype approved by the owner
- [ ] Domain rules (names, kinds, hide vs delete, empty group) with unit tests
- [ ] API endpoints: create, rename, reorder, move, remove, restore for categories and groups; validation as
      `ProblemDetails`
- [ ] UI on the Categories page with i18n texts; TanStack Query hooks; the order shown in the form, filters and
      reports
- [ ] Storybook stories (editing, a clash, removing with and without transactions, loading, error)
- [ ] E2E tests
- [ ] DESIGN_RULES "Screen decisions" row; ARCHITECTURE's category notes

## Design

References (Mobbin, other apps, the internet): — (when the work starts). F-015's references (Actual Budget, Lunch
Money, Copilot Money, YNAB, Money Lover) already show how some of them edit categories.
Prototype stories: *Prototypes / F-029 Manage categories* in Storybook (`frontend/src/prototypes/F-029-manage-categories/`).
Chosen variant: — · Final prototype approved: — (screenshots in `prototypes/`)

## Tests

- Unit: the domain rules above (backend); the editing UI (frontend).
- E2E (Playwright): add, rename, reorder and remove a category and a group; a removed category with transactions is
  gone from the quick-add form and still in the report.
- Screens checked in Playwright screenshots (phone / desktop, light / dark): the Categories page while editing, the
  remove dialogs, the quick-add picker after a change.

## Notes

- Owner's choices (2026-11-06): before Family, priority High; a category with transactions is hidden, not deleted;
  groups can be changed too, not only categories; the generic default set for new people (Q-011) stays for later.
- What is already there: `Category.IsArchived` (F-013), the quick-add form doesn't offer archived categories but keeps
  one on a transaction that has it (F-018), and the reports show an archived category while it has amounts (F-021).
- Not in this change: icons or colors for categories, merging two categories, a category's own currency or budget
  (budgets are M11).
- Family (F-024): the combined report merges by group and name, so two people's renamed categories merge only if the
  names match. F-024 decides what to show for categories only one person has.
