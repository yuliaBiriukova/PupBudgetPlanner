# 0028. Changing categories: one rule set in the Domain, hide instead of delete, our own small drag

- Status: Accepted
- Date: 2026-11-11

## Context

F-029 lets each person add, rename, reorder, move and remove their categories and groups (final prototype "Tap a
tag", approved 2026-11-11). Until then the set was read-only (F-015), seeded per person (ADR 0015) with `SortOrder`
on groups and categories and `Category.IsArchived` for a category kept only for its transactions (F-013). The
description left two points to the build: where the rules live, and whether the place list's dragging uses a library.

## Decision

- **The rules live in the Domain, in `CategorySet`:** one person's whole set (a few dozen rows) loaded with its
  categories, and every change on it: names unique per place (group names per person, category names per group,
  hidden ones counting, compared with `OrdinalIgnoreCase` like the banks' names), a category moved only to a group of
  its kind, a place counted among the shown ones from 0, the sort orders renumbered from 1 after each change (income
  groups first, then the expense ones; in a group the shown categories, then the hidden ones). The service only loads,
  calls it and saves; the unique indexes on the names (ADR 0015) catch a twin saved at the same moment and are
  answered as "name taken", like a check that found it.
- **Hide instead of delete once anything uses it:** a category with transactions is hidden (`IsArchived`), not
  deleted, so no transaction loses its category; one without is deleted. A group goes only when none of its
  categories is shown: deleted when empty, hidden (`CategoryGroup.IsArchived`, new column, migration
  `HideCategoryGroups`) when it holds only hidden ones; the only shown group of a kind stays. Showing a hidden
  category again shows its group too. Reports show a hidden group only while one of its hidden categories has an
  amount in the period.
- **One read for the whole set:** `GET /api/categories` now sends hidden groups and categories too, marked, with each
  category's transaction count (whether removing deletes or hides it). The quick-add form leaves the hidden ones out
  (`categoriesFor`); the Transactions page knows them, so a hidden category stays a valid filter. Changes are
  `POST / PUT / DELETE /api/categories[/groups]/{id}` and `…/restore`; a removal answers whether it deleted or hid.
- **Dragging is our own small hook (`useDragToSlot`), not a library:** the only drag is one short list inside a sheet
  (the place in the group), pointer events cover the mouse and touch, and the ↑ ↓ buttons beside the list move the
  item by touch or keyboard (Atlassian's guideline that every drag has a visible alternative). dnd-kit would add a
  dependency and its own accessibility layer for one list of at most a dozen rows.

## Consequences

- Every change is one request that renumbers a group or the groups in one save; the frontend fetches the categories,
  transactions and reports again after it, so names and order are the same everywhere.
- A hidden category's name is still taken in its group: typing it offers "Show it again" instead of making a twin.
- If reordering is ever needed in longer lists (or across groups by dragging), revisit the library choice.
