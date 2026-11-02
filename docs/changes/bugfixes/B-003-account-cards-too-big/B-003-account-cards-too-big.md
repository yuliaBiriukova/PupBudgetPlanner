# B-003 · Account cards bigger than in the prototype on the desktop

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (the page works; it doesn't look as approved) |
| Status | Done |
| Branch | Fixed in `feature/F-018-quick-add-income-expense` (PR #44): the owner found it in that PR's review |
| Found in | 2026-11-01, F-018's PR review, local app at 1440 px |
| Approved | 2026-11-02, by the owner in chat ("Smaller cards only"), after the root cause and the two fixes were explained |

## Steps to reproduce

1. Open the Accounts page at 1440 px with several accounts in one currency.
2. Compare the cards with the F-014 final prototype (variant 10) or F-018's variant 9.

## Expected

Four cards per row of the group, about 230 × 145 px each, as in the prototypes.

## Actual

Three cards per row, 257 × 162 px each, and a bigger balance (23 px instead of 19 px).

## Root cause

The app shell caps every page's content at 880 px (F-010's `AppLayout.module.css`), so the cards have 800 px. The F-014
prototype (and F-015, F-016, F-018's) drew the page at 1040 px, 960 px for the cards. With the cards' minimum width of
190 px and 14 px gaps only three fit in 800 px, and the cards stretch to fill the row. It has been so since F-014 was
built; F-018's split edge didn't change it.

## Fix

The owner chose to keep the page width and make the cards smaller (rather than widen every page to 1040 px): from a
tablet's list width the cards' minimum width is 180 px, so four fit in 800 px (about 189 px wide, still bank-card
proportions). On narrower cards the split edge is 44 px wide on the desktop, and the balance is sized from the room
left and from its own length, so a long amount still fits on one line.

## Tests

- Unit: `AccountCard.test.tsx`: the split edge is its own button next to the card, and the balance gets its length.
- Screenshots of the Accounts page at 375, 768 and 1440 px, light and dark, measured: four cards per row at 1440 px,
  190 × 119 px (three of 196 px at 768 px); `1 250 000 ₴` fits on one line next to the edge.
- Lint, format, typecheck, all unit tests (185), build, Storybook build and the full E2E suite (52) pass.
- Test data: one `e2e-manual-…@example.com` person with sample accounts for the screenshots, removed by the E2E clean-up
  (checked).
