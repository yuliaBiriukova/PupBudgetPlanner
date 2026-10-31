# F-015 · Categories view

| | |
|---|---|
| Type | Feature |
| Milestone | M2 — Accounts & categories |
| Status | Done |
| Branch | `feature/F-015-categories-view` |
| Design | 3 HTML prototypes required |
| Approved | 2026-10-31: variant 7, by the owner in chat ("the variant 7 … is approved, build it") |

## Goal

See your categories grouped like in the report.

## Acceptance criteria

- [x] Read-only list of the user's category groups and categories
- [x] Adding, renaming and removing categories is post-MVP (the page says so in one line)

## Tasks

- [x] 3 HTML prototypes
- [x] Final prototype approved by the owner (variant 7, 2026-10-31)
- [x] API endpoint
- [x] UI
- [x] Storybook stories

## Design

### References (2026-10-31)

Mobbin needs a sign-in, so only open pages were used.

- [Actual Budget: categories](https://actualbudget.org/docs/budgeting/categories/): groups as header rows, categories
  under them, a group folds with an arrow and "expand / collapse all" sits at the top. Taken: the fold and the
  open-all control (variant 2).
- [Lunch Money: category groups](https://support.lunchmoney.app/setup/categories/category-groups): a separate
  Categories page, a table of groups with their categories, and income as a property of the group. Taken: the
  kind belongs to the group, shown once and not on every category (all variants).
- [Copilot Money: Categories tab](https://help.copilot.money/en/articles/9504513-categories-tab-overview):
  categories have their own tab, and you open a group to see what is in it. Taken: a list of groups with the
  picked group's categories next to it on the desktop (variant 2).
- [YNAB: adding, removing and customizing categories](https://support.ynab.com/en_us/adding-removing-and-customizing-categories-a-guide-HJFO5j909.md):
  groups in the order you use them, with categories as plain rows and no icons. Taken: the report's order, and
  rows without icons (variant 1).
- [Money Lover: categories](https://moneylover.zendesk.com/hc/en-us/articles/33742206448793-Create-edit-delete-and-merge-categories):
  income and expense categories kept apart. Taken: Income and Expenses as two parts (variants 1 and 2).
- The owners' own Google Sheet: the first column (group rows, categories under them) and its grouped-row
  brackets. Taken: the bracket down the side of a group (variant 1).

### Brief

- **Who and when:** the two of us, rarely: to see which categories there are before entering an expense, or what a
  row of the report holds. Read-only until categories can be changed (after the MVP).
- **The one job:** all 33 categories in their 7 groups, in the report's order, with Income apart from the expenses.
- **The subject's world:** the spreadsheet's first column; the category picker in Monefy.
- **Feeling:** "it's our sheet, already set up".
- **Tokens:** the app's theme as it is (charcoal and sky, Unbounded 300 for headings, Manrope 400 / 500, income
  green and expense red with a sign); nothing new for Mantine.

### Round 1: three directions (2026-10-31)

The variants also differ in where the screen lives, since that is the owner's call.

| | Thesis | Where | Phone | Desktop | One moment |
|---|---|---|---|---|---|
| [Variant 1](prototypes/variant-1.html) | The sheet's first column: quiet, dense, nothing to learn | Own menu item after Reports (under More on the phone) | One column. Income and Expenses headings with + / −. Each group's name stays on top while its categories scroll by, with a bracket down the side as in Google Sheets | Income on the left, the six expense groups in two columns | The sticky group name |
| [Variant 2](prototypes/variant-2.html) | Folded, in Settings: set up once, looked at rarely | Settings → Categories; the menu doesn't change | Seven rows, each with its first categories under the name. A row folds open, and Open all / Fold all sits at the top | The groups on the left, the picked group on the right in big type, its categories in two columns | A group's categories slide out |
| [Variant 3](prototypes/variant-3.html) | An index of tags; the risk is in the looks | Own menu item, as in variant 1 | The group's name in the heading font with + / −, its categories as tags under it | The name on the left, the tags on the right | The tags arrive group by group on the first visit |

Every variant has Loading, Couldn't load and Empty states. Empty shouldn't happen, because every account gets the
default set, but it is designed anyway (DESIGN_RULES §6). Each also has a line saying that adding, renaming and
removing come later.

Checked: the design check passes (360 to 1440 px, light and dark, every state, axe). The screenshots at 375 and
1440 px were looked at, as were these states in the Browser pane: variant 2 with a group open on the phone and on
the desktop, the Settings page, and variant 1 scrolled. Fixed on the way: a skipped heading level, `aria-label` on
the loading blocks, the scrolling area without focus, variant 2's pane fading in again on every redraw, and its
two columns reading across instead of down.

### Round 2: variant 2, new phone, tablet and desktop lists (2026-10-31)

The owner liked variant 2, but not its phone and tablet view (groups that fold open) or its list of categories on
the desktop (two ruled columns). So it lives in **Settings → Categories**, keeping variant 2's list of groups on the
desktop. Three new ways to show a group's categories:

| | Thesis | Phone and tablet | Desktop: a group's categories | One moment |
|---|---|---|---|---|
| [Variant 4](prototypes/variant-4.html) | Step in, like phone settings | The groups in two panels, Income and Expenses, each row with its first categories and an arrow. A group opens on its own screen (big name, one category per line, Categories at the top to go back) | One column in a plain panel, in the report's order | The group's screen or panel comes in from the right |
| [Variant 5](prototypes/variant-5.html) | Everything in view, as tags | Every group with its name, count and categories as tags; nothing to tap | Bigger tags | The tags come in from the right |
| [Variant 6](prototypes/variant-6.html) | One list with an index | A bar of group names stays on top and scrolls sideways. Tap a name to jump to its group, and the bar marks the group you are in. Under it, every group with its categories as plain lines (two columns on the tablet) | The list of groups (names only) stays on the left and marks the group you are reading; all groups on one page, categories as plain lines in three columns | The jump, and the mark moving with it |

Checked:
- The design check passes on variants 4–6.
- The screenshots at 375 and 1440 px were looked at.
- In the Browser pane: variant 4's group screen on the phone; variant 5 and variant 6 on the tablet. Tapping
  a group name in variant 6 lands the group just under the bar, and the bar marks it.

Fixed on the way:
- "Income" twice: the Income group's line now says only "3 categories", and variant 5 no longer has an Income
  label over the Income group.
- Variant 5's group names were bold, and its headings skipped a level.
- Variant 5 on the tablet put the names left and the tags right, which squeezed the tags; the tablet now stacks
  them like the phone.

### Round 3: variant 5 with groups that fold, in the menu (2026-10-31)

The owner liked variant 5 and asked for two changes: category groups that collapse and expand, and Categories in
the main menu instead of Settings. That makes [variant 7](prototypes/variant-7.html):

- **Where:** its own menu item after Reports. On the phone it is under More, with Family and Settings.
- **Phone and tablet:** every group is open on the first visit, with its categories as tags. A group's row (name,
  count, arrow) folds it; a folded group shows its first categories ("Rent, Bills, Home supplies and 6 more").
  Collapse all / Expand all at the top. The app remembers the folded groups on that device.
- **Desktop:** as in variant 5. The list of groups is on the left and the picked group's tags are on the right.
  Nothing folds there, because only one group is shown at a time.
- **One moment:** a group's tags come out of its row when it opens.
- **No + or − next to a group** (owner, 2026-10-31: they look like list markers). The words carry the kind: "Expenses,
  9 categories" above an expense group on the desktop, and just "3 categories" above Income, whose name says it.

Checked:
- The design check passes.
- The screenshots at 375 and 1440 px, light and dark, were looked at.
- In the Browser pane: folding and unfolding on the phone (the focus stays on the row) and the tablet with some
  groups folded.
- After dropping the signs: the design check again, the desktop screenshot, and no + or − left in the page's text.

### Approved (2026-10-31)

**Chosen variant: [variant 7](prototypes/variant-7.html)**, approved by the owner for implementation on 2026-10-31.
The desktop keeps variant 5's list of groups and the picked group's tags, as proposed.

### Owner's review: which groups are open (2026-10-31)

After trying the build locally, the owner asked for this change (approved by the request):

- **Phone and tablet:** every group starts folded except the one open on the desktop (Income on a first visit).
  Several groups can be open at once.
- **Desktop:** only one group at a time, as before.

How it works: both layouts share one list of open groups, kept on the device (`localStorage`,
`pup.categories.open`), with the most recently opened group last.
- Picking a group on the desktop makes it the only open one.
- The desktop shows the last group opened, so a group opened on the phone is the one the desktop shows next.
- With nothing open (Collapse all), the desktop shows the first group. Expand all keeps the first group as the one
  the desktop shows.
- A list stored by someone else on the same device (no known groups in it) counts as nothing stored.

## Open points (for the owner)

- **Where:** its own menu item (owner, 2026-10-31; round 2 had it in Settings).
- **Desktop:** variant 5's list and tags, as proposed (approved with variant 7, 2026-10-31).
- **Later, not in F-015:** once there are transactions (F-018), each row could show this month's amount for the
  category. That is noted here as an idea and not designed.

## Build (2026-10-31)

- **API:** `GET /api/categories` (`CategoriesController`, `ICategoryService` / `CategoryService`) returns the
  signed-in person's groups in the report's order, each with its categories in order; archived categories are left
  out. The ordering lives in `CategoriesOverview.From` (Application), so it is unit-tested without a database. No
  migration: the tables came with F-013.
- **Menu:** Categories after Reports (`IconListTree`), in the sidebar and under More on the phone.
- **Page** (`frontend/src/features/categories/`):
  - below 1200 px (Mantine `lg`), every group with its categories as tags; a group's row opens or folds it and a
    folded group shows its first categories; Collapse all / Expand all. Which groups are open follows the owner's
    review above (`openGroups.ts`);
  - from 1200 px, the list of groups and one group's tags beside it. The prototype switched at 1100 px; the app uses
    Mantine's nearest breakpoint, so 1100–1199 px shows the folding list;
  - Loading, Couldn't load (Try again) and Empty states; the "comes later" line at the end.
- **Theme:** new tokens `--pup-color-income`, `--pup-color-income-bg` and `--pup-color-tag` (light and dark), the
  prototype's colors.

## Tests

- Unit (xUnit): `CategoriesOverviewTests` (the report's order, sort order, archived left out, no groups) and
  `CategoriesControllerTests`.
- Unit (Vitest): `CategoriesPage.test.tsx`.
  - Phone: only Income open at first; several groups open, folded again and remembered; Collapse all / Expand all;
    only the group picked on the desktop open; a list stored by someone else ignored; Empty; Couldn't load with Try
    again.
  - Desktop: the list and the picked group, which becomes the only open one; the group opened last on the phone
    shown.
- E2E (Playwright): `categories.spec.ts`, a new person sees the default categories.
  - Phone: only Income open, two more opened and still open after a reload, Collapse all.
  - Desktop: pick a group.
  - `shell.spec.ts` now visits Categories, and the rail has one more icon. The More button is found by its exact
    name in every spec, since a folded group's "… and 6 more" matched it too.
- Storybook: phone (first visit light and dark, open another group, picked on the desktop, all open, all folded),
  tablet, desktop (light, dark, another group), Loading, Couldn't load, Empty.
- Checked: screenshots at 375, 834 and 1440 px, light and dark, were looked at. They include the first visit,
  several groups open, the desktop showing the group opened last, and the phone after a group was picked on the
  desktop. Folding was tried in the Browser pane, with no console errors.
- Test data: the E2E runs and the screenshots made `e2e-…@example.com` people on the `dev` database; the cleanup
  teardown deleted them (checked after the first build: the screenshot person's session no longer signs in).

## Notes

- Group and category names come from the database, so they are not translated; only the page's own text is.
