# B-023 · A fold's hover is rounded on every corner inside a card whose cells are square

| | |
|---|---|
| Type | Bugfix |
| Priority | Low (proposed: polish on a side screen; nothing is hidden or broken) |
| Status | Done |
| Branch | `bugfix/B-020-B-022-I-032-ui-fixes` (one PR with B-020 – B-022 and I-032, as the owner asked) |
| Found in | Production, 2026-11-12, desktop, light theme |
| Approved | 2026-11-12 (root cause and planned fix, "Approved, build them") |

## Steps to reproduce

1. On the desktop, open Family → what the family sees of your money (F-030).
2. Point at a fold in the middle of the card, e.g. "Your accounts · All 11 shared".

## Expected

The hover fills the fold's cell with the cell's own corners: square in the middle of the card, rounded only where
the card's own corner is (the first cell's top, the last cell's bottom).

## Actual

The hover is rounded on all four corners, so it looks like a pill laid over the square cell (owner's screenshot).

## Root cause

Confirmed on 2026-11-12 in Storybook (*Family / Family privacy / Family page*): the three fold heads (Your
transactions, Your accounts, Private categories) each have a 12 px radius on every corner, the same as the card
around them.

The card (`.folds` in `Privacy.module.css`) is one box with rounded corners, split into cells by rules. Each fold's
head (`.foldHead`) was given the card's radius (`border-radius: var(--mantine-radius-md)`) on all four corners, so its
hover, which fills the head, is a rounded box: right only where a head's corner is the card's corner.

## Fix

Approved by the owner on 2026-11-12:

- [x] `.foldHead` is square; the first fold's head takes the card's top corners and the last fold's head its bottom
  corners while it is folded (open, its body is at the bottom, so its head is square there). The radius is the
  card's less its 1 px border, so the hover meets the border with no gap.
- [x] The other cards split into rows with a hover (the Family page, People, Accounts, Settings, Categories,
  Transactions, Reports) are checked for the same thing. One more had it: the Transactions calendar's fold head
  (*Calendar · This week*) was rounded on all four corners with the calendar under it in the same card. Its head now
  has the card's top corners only (less the border), square at the bottom. The rest are standalone boxes, pills or
  tiles, so their rounded hover is right.

## Tests

- [x] E2E (`family-privacy.spec.ts`, phone and desktop; jsdom has no layout, so no unit test): the middle head is square,
  the first rounded only at the top, the last only at the bottom, and square once it is open. Fails before the fix,
  passes after it.
- [x] Screenshots of each fold hovered at 1440 and 375 px, light and dark: the middle one
  ([light](fixed-1440-light-middle.png), [dark](fixed-1440-dark-middle.png)) fills its square cell. The calendar's
  head hovered: [light](fixed-calendar-1440-light.png), [dark](fixed-calendar-1440-dark.png).
