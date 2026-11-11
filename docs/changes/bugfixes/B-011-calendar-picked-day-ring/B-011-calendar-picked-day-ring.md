# B-011 · The picked day's black ring is broken in the Transactions calendar

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: looks broken on the main screen, but the day is picked and the list is right) |
| Status | Done |
| Branch | `bugfix/B-011-calendar-picked-day-ring` |
| Found in | Production, 2026-11-09, the owner's Android phone (Chrome), light theme |
| Approved | 2026-11-11 ("Approved, build it": the root cause and the planned fix) |

## Steps to reproduce

1. On the phone, open Transactions with the calendar on "This week".
2. Tap the first day of the week (Monday).

## Expected

An even black ring all round the picked day, the same width on every side, as on the desktop.

## Actual

The ring is broken: its left side is cut off at the calendar card's edge, and at the top right the ring stops where the
next day begins (owner's screenshot, kept out of the repo as it shows the month's totals).

## Root cause

Reproduced on 2026-11-11 in Storybook (*Transactions / Latest phone*) with Playwright as a touch phone (360 and 412 px,
3× pixels); screenshots in [repro/](repro/). Two causes, both confirmed:

1. **The ring is drawn outside the day and the days are too close for it.** `.cell[aria-pressed='true']`
   (`TransactionsPage.module.css`) draws a 2 px body-colour gap and a 2 px ring **4 px outside** the day, but the days
   are 1 px apart up to 375 px, 2 px up to 400 px and 4 px above. Each day paints its own background after the one
   before it, so the next day covers 3 px (2 px) of the ring's right side: the ring stops at its corners where the
   next day begins ([before-360-mon](repro/before-360-mon.png), [before-412-tue](repro/before-412-tue.png)). On Monday
   the ring reaches 4 of the 6 px between the day and the card's edge, so it is squeezed against the card's border.
2. **The phone keeps the tapped day "hovered".** A touch phone leaves `:hover` on the element tapped last, and
   `.cell:hover:not(:disabled)` is more specific than the picked rule, so right after the tap the black ring is
   replaced by the light grey hover ring ([before-360-mon-tapped](repro/before-360-mon-tapped.png)); it comes back
   only after a tap somewhere else. The same kind of sticky tint B-004 fixed in the currency list.

## Fix

Approved on 2026-11-11 and built (`TransactionsPage.module.css`):

- The picked day's ring goes **inside** the day: `box-shadow: inset 0 0 0 2px var(--mantine-color-text)`, as wide as
  the hover ring. Nothing next to it can cover it, nothing clips it at the card's edge, and the picked day keeps the
  size of the others. The 4 px padding of the day leaves its number, dots and amount clear of the ring.
- The hover ring only on devices that hover (`@media (hover: hover)`) and never on the picked day
  (`:not([aria-pressed='true'])`), so a tap on the phone shows the black ring at once and the desktop keeps it under
  the mouse.
- How it looks (the CSS injected into the story, no app file changed): phone
  [light, Monday](repro/proposed-360-light-mon.png), [light, the reddest day](repro/proposed-360-light-wed.png),
  [dark, the reddest day](repro/proposed-360-dark-wed.png); desktop [light](repro/proposed-1440-light.png),
  [dark](repro/proposed-1440-dark.png).

## Tests

- [x] E2E (`transactions.spec.ts`, B-011), desktop and phone: last month's first Monday picked and still hovered, as
  the phone leaves a tapped day; its ring is `inset 0 0 0 2px` in the text colour. Fails before the fix on both (the
  hover's grey ring), passes after it.
- [x] Screenshots of the real app ([built/](built/)): the phone at 375 px, "This week" with Monday (spent), Tuesday
  (nothing) and today (the reddest) picked, light and dark, and the whole page; the desktop at 1440 px, the month with
  last Sunday (the right edge), Monday, Tuesday and today picked, light and dark. An even ring all round in each, the
  day number and the amount clear of it.
