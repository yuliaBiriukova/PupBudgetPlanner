# F-029 · Manage categories

| | |
|---|---|
| Type | Feature |
| Milestone | M5 — Categories & family |
| Priority | High |
| Status | Done |
| Branch | `feature/F-029-manage-categories` |
| Design | 3 prototype stories required |
| Approved | 2026-11-11 — the description and the final prototype ("final prototype for F-029 is approved, build it") |

## Goal

Each person shapes their own categories and groups instead of living with the default set: add, rename, reorder and
remove them. Added by the owner on 2026-11-06 for the MVP; before, it was planned for M9 after the MVP (Q-003).

Why before Family: F-024's family report merges categories with the same group and name, so it is built on
categories that can already be renamed, moved and hidden.

## Acceptance criteria

- [x] **Categories:** add one to a group, rename it, change its place in the group, move it to another group of the
      same kind (Income or Expenses), remove it.
- [x] **Groups:** add one (Income or Expenses), rename it, change its place among the groups of its kind, remove it.
- [x] **Removing a category:** with no transactions it is deleted for good; with transactions it is hidden: the
      quick-add form doesn't offer it for new transactions, while its past transactions keep it and the reports,
      the Transactions list and its category filter still show it (the archived category the app already supports).
      The dialog says which of the two will happen before it is confirmed.
- [x] **Removing a group:** possible once none of its categories is in use: deleted if it holds none, hidden if it
      holds only hidden ones; otherwise the page says to move or remove its categories first. The last group of a
      kind can't be removed.
- [x] **A hidden category can be shown again**, and a new category with a hidden one's name in the same group offers
      to bring the hidden one back instead of making a twin.
- [x] **Names:** not empty, and unique as now: group names per person, category names per group (hidden ones count);
      a clash says so on the field.
- [x] **The new order is used everywhere categories are listed:** the Categories page, the quick-add form's picker,
      the Transactions filters and the reports' rows. (The Transactions filters list the period's categories by
      amount, F-020's "where it went", so not in the person's order; they follow a rename or a move at once. The
      owner chose to keep them by amount, 2026-11-11.)
- [x] Changes are only to the person's own categories; nobody else's set changes.
- [x] The Categories page's line "adding, renaming and removing come later" is gone.
- [x] Works on the phone (375 px) and the desktop, light and dark; reordering works by touch and with the keyboard,
      not only by dragging with a mouse.

## Tasks

- [x] References (Mobbin and open sites) for editing a category list
- [x] 3 prototype stories (where editing lives, how reorder and remove look), final prototype approved by the owner
- [x] Domain rules (names, kinds, hide vs delete, empty group) with unit tests
- [x] API endpoints: create, rename, reorder, move, remove, restore for categories and groups; validation as
      `ProblemDetails`
- [x] UI on the Categories page with i18n texts; TanStack Query hooks; the order shown in the form, filters and
      reports
- [x] Storybook stories (editing, a clash, removing with and without transactions, loading, error)
- [x] E2E tests
- [x] DESIGN_RULES "Screen decisions" row; ARCHITECTURE's category notes

## Design

Prototype stories: *Prototypes / F-029 Manage categories* in Storybook (`frontend/src/prototypes/F-029-manage-categories/`),
removed when the page was built: the real stories are *Categories / Categories page*.
Chosen variant: variant 2, "Tap a tag" (2026-11-11) · Final prototype approved: 2026-11-11 (screenshots of the built page in `screenshots/`)

### References (2026-11-11)

Mobbin needs a sign-in, so only open pages were used (help centres and design guidelines).

- [YNAB: adding, removing and customizing categories](https://support.ynab.com/en_us/adding-removing-and-customizing-categories-a-guide-HJFO5j909.md):
  on the phone an *Edit Plan* mode and a separate *Reorder* mode with drag handles and a check mark to finish; a
  plus beside each group's header adds a category; hidden categories collect at the foot of the list; it advises
  hiding a category with history instead of deleting it. Taken: the edit mode with grips (variant 1), + at the end of
  a group, hidden ones at a group's foot.
- [Actual Budget: categories](https://actualbudget.org/docs/budgeting/categories/): no mode; a small menu on each
  category and group (Rename, Hide, Delete), hidden ones shown in a lower contrast after "Toggle hidden categories",
  and Delete with history asks where its transactions go. Taken: one ⋯ menu per row; hidden ones in a lower
  contrast (all variants).
- [Lunch Money: editing categories](https://support.lunchmoney.app/setup/categories/editing-categories): a reorder
  grip on each row that also sets the order of the pickers and the budget; a row opens an *Edit category* panel with
  Archive and Delete in it; archived ones in a folded "show archived" section, still in the reports' filters. Taken:
  a category's own panel with its name, group, place and remove (variant 2); the order is used everywhere (all).
- [AnyList: categories](https://help.anylist.com/articles/category-group): a list's categories edited in one place:
  a drag control on the right of each row, a tap on the name renames it, Add category at the end, Done. Taken: the
  name renamed where it stands (variants 1 and 3).
- [Atlassian: drag and drop accessibility](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines):
  every drag needs a visible alternative, a ⋯ menu on the item with the moves (to the top, up, down, to another
  list), named after the item, and the move announced. Taken: Move up / Move down / Move to another group in every
  row's menu, so reorder works by touch, mouse and keyboard (all variants).

### Brief

- **Who and when:** the Kyiv couple, rarely: setting up their own set once (after the defaults), then now and then
  a new category ("Pets"), a rename, or one they no longer use. Mostly on the phone, a big tidy-up on the desktop.
- **The one job:** change the set without fear: see at once what a change does (deleted or only hidden, where a
  category ends up), and never lose a past transaction.
- **The subject's world:** the spreadsheet they kept for years, whose rows they typed and dragged themselves; a
  household ledger's headings.
- **The feeling:** tidy and safe, "it's my list now".

### Plan from the design system

- **Reused:** the Categories page as it is (F-015: folding groups of tags on the phone, the list of groups and one
  group's tags on the desktop), its CSS, the app shell, `ResponsiveDialog` (sheet on the phone), the theme's buttons
  (primary, `quiet`, `danger`, `danger-quiet`), 52 px fields, the pick pills, the 44 px icon buttons, the ⋯ menus as
  on the People page, the toasts.
- **New:** a row of a category with a grip and a ⋯ menu (variants 1 and 3); tags that are buttons and a dashed
  "+ Add" tag (variant 2); a hidden category in a lower contrast with an eye-off icon and Show; a drop line in the
  accent while a row is dragged. No new token.
- **Motion:** only the dragged row following the finger, the drop line showing where it lands.
- **The bold element:** variant 1 the flip from tags into rows with grips; variant 2 the place in the group shown as
  a short list inside the category's own sheet; variant 3 the year's money next to every name.
- **Slop check:** dropped a coloured icon per category (not in this change, and an icon in a tinted circle per row is
  on the list), no cards per group (structure from rules and headings, as F-015), Delete always the app's red word
  and only the confirm in the red pill.

### Round 1 (2026-11-11)

Each story is the app opened on Categories (the other pages work too) with the variant's page; every change is kept
in the story only. The fake set has one hidden category (Netflix in Subscriptions) and five never used (Tax, Sport,
Games, Driving, Emergency), so both Hide and Delete can be tried. Common to all three: removing says first whether it
deletes (no transactions) or hides (with the count) and what a hidden one still keeps; a group goes only once it has
no categories in use, otherwise it says what to do first; a clash of names says so under the field, and a new name
that a hidden category has offers "Show it again"; every drag has the same moves in the row's menu.

1. **[Variant 1: Edit mode](http://localhost:6006/?path=/story/prototypes-f-029-manage-categories--variant-1&nav=false&panel=false&globals=viewport.value:!undefined)**
   — *read as now, edit when you mean to.* The page is F-015's; **Edit** turns the groups into rows, each with a grip
   and a ⋯ menu (Rename in place, Move up / down / to another group, Hide or Delete — the menu already says which),
   + Add category under each group and + Add group under each kind; hidden ones at the group's foot with Show;
   **Done** turns it back. Desktop: the groups with grips on the left, the picked group's rows on the right.
   Trade-off: the most familiar (YNAB, AnyList) and nothing can be changed by a stray tap; one more step to start.
2. **[Variant 2: Tap a tag](http://localhost:6006/?path=/story/prototypes-f-029-manage-categories--variant-2&nav=false&panel=false&globals=viewport.value:!undefined)**
   — *every tag is a door.* No mode: the tags become buttons (44 px), a dashed **+ Add** ends each group's tags and
   hidden ones are dashed and quiet. A tag opens its own sheet: Name, Group (pills of its kind), **Place in the group**
   as a short list with it marked (drag it or ↑ ↓), and at the end, after a rule, Hide or Delete with what it does. A
   group's pencil (Edit group on the desktop) opens the same for the group. Trade-off: one place per thing, the same
   on phone and desktop; tidying many is a sheet each.
3. **[Variant 3: The ledger](http://localhost:6006/?path=/story/prototypes-f-029-manage-categories--variant-3&nav=false&panel=false&globals=viewport.value:!undefined)**
   — *the sheet they kept for years* (the risk). One list always ready to change: a name is typed over where it
   stands, **Enter** adds a row under it (a few typed one after another), Escape takes it back; a grip drags a row
   anywhere in its kind, into another group too; each row shows its entries and this year's money, the groups and
   kinds their totals, so it's plain what Hide keeps. Replaces F-015's tags. Trade-off: fastest for a big tidy-up and
   the money makes the choice clear; on the phone a stray tap puts the cursor in a name, and the page looks like a
   spreadsheet rather than F-015's tags.

Checked: the design check (360–1440 px, light and dark, axe) on the three stories: 0 issues (its first run found
variant 3's names without a focus ring the check can see, fixed); the states inside the pages clicked through in
Playwright at 375 and 1440 px, light and dark, and their screenshots looked at (edit mode, menus, a clash, Hide, a
group that can't go, the category and group sheets, a new row in the ledger, dragging into another group).

The owner picked variant 2 on 2026-11-11, without changes. Variants 1 and 3 were removed from Storybook then (the
links above no longer open); this section keeps what they were.

### Final prototype (2026-11-11)

**[Final prototype](http://localhost:6006/?path=/story/prototypes-f-029-manage-categories--final&nav=false&panel=false&globals=viewport.value:!undefined)**:
variant 2 as shown in round 1.

- **The page** stays F-015's (folding groups on the phone and tablet, the groups' list and one group beside it on the
  desktop). Its categories' tags become buttons (44 px; income ones in the income colours). After them comes a
  dashed **+ Add**, then the hidden ones, dashed and quiet with an eye-off icon. "Adding, renaming and removing come
  later" is gone.
- **A category's sheet** (a dialog on the desktop) opens on a tap on its tag. It has:
  - **Name**, which takes the cursor only on the desktop.
  - **Group**, as pills of the groups of its kind.
  - **Place in the group**: the group's other categories in order with this one marked. Its grip drags it, and
    ↑ ↓ move it one place by touch or keyboard. The list is left out when there is nothing to place it among.
  - After a rule, **Hide this category** or **Delete this category**, with a line saying which and why (the
    transaction count). Its button asks again in the same sheet: Keep it, or Hide / Delete (the red pill).
- **Cancel / Save** close the sheet. Saving moves the category if its group or place changed and confirms with a toast.
- **A new category:** + Add opens the same sheet empty, placed at the group's end, with Add.
- **A hidden category's sheet** says it keeps its transactions, with **Show again**: it comes back at the end of its
  group.
- **A group's sheet** opens from its pencil (Edit group on the desktop). It has the Name, its place among the groups
  of its kind, and Remove: Delete or Hide when it can go, otherwise why not (still has categories; the only group of
  its kind). "+ Add income group" and "+ Add expense group" open it empty with the kind as pills. Hidden groups show at
  the end of their kind with Show.
- **Names:** a clash says so under the field. A hidden category's name offers "Show it again".

Checked: the design check on the story (360–1440 px, light and dark, axe): 0 issues. Its states clicked through in
Playwright at 375 and 1440 px, light and dark, and the screenshots looked at: a category's sheet, moving it up, a
clash, Hide and its question, the group's sheet, a new category, a hidden category shown again, Delete of an unused one.

The owner approved the final prototype for implementation on 2026-11-11 ("final prototype for F-029 is approved,
build it").

### Open points

- **Dragging in the build:** settled: the prototype's own small drag (pointer events, a drop line, scrolling at the
  edges) stays for the place in the group, no library ([ADR 0028](../../../decisions/0028-changing-categories.md)).
- **Where hidden ones show:** settled by the pick: as dashed, quiet tags after + Add in their group; hidden groups at
  the end of their kind.

## Build (2026-11-11)

- **Backend:** `CategorySet` (Domain) holds the rules; `CategoryGroup.IsArchived` is new (migration
  `HideCategoryGroups`), `Category.GroupId` can change. `GET /api/categories` sends hidden groups and categories too,
  marked, with each category's transaction count; changes are `POST /api/categories`, `PUT / DELETE
  /api/categories/{id}`, `POST /api/categories/{id}/restore` and the same under `/api/categories/groups`. A name in use
  is a 400 on `name` (a hidden twin says so), a group that can't go a 409. The year and month reports leave out a hidden
  group with nothing in the period. [ADR 0028](../../../decisions/0028-changing-categories.md).
- **Frontend:** the Categories page's tags are buttons opening `CategorySheet`; + Add, hidden tags, the group's pencil
  (Edit group on the desktop) opening `GroupSheet`, hidden groups with Show and + Add income / expense group after each
  kind. `PlaceList` with the `useDragToSlot` hook and ↑ ↓; `categoryRules.ts` checks names and removals before
  anything is sent. Every change fetches the categories, transactions and reports again. The quick-add form leaves
  hidden ones out (`categoriesFor`).
- **Screenshots** of the built page at 375 and 1440 px, light and dark, in `screenshots/`.

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
