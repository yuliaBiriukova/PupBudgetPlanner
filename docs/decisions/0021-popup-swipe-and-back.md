# 0021. Pop-ups: own swipe code and one history step per open pop-up

- Status: Accepted
- Date: 2026-11-01

## Context

I-015: on the phone every pop-up is a bottom sheet (Mantine's `Drawer` in `BottomSheet`), on the desktop a dialog
(Mantine's `Modal` in `ResponsiveDialog`). The sheets showed a grab handle that couldn't be dragged, and Back left the
page instead of closing the pop-up, losing what was typed. Mantine has neither drag nor history handling. The owner
approved the demo on 2026-11-01, with Vaul's numbers and the three points it raised.

## Decision

- **Own swipe code, not Vaul** (`useSheetSwipe` in `BottomSheet`): Vaul would bring a second dialog system (Radix) next
  to Mantine's and the I-004 / I-012 styling would have to be built again. The hook moves Mantine's own content and
  overlay while the finger drags, with Mantine's transition paused, and then lets Mantine's exit or a slide back run
  from there, so reduced motion (`respectReducedMotion` in the theme) needs nothing of its own. The handle and the
  title take pointer events with `touch-action: none`; the content takes touch events and only starts a drag at its
  top, moving down, 100 ms after its last scroll. It closes past 25 % of the height or on a flick faster than
  0.4 px/ms (Vaul's numbers).
- **One history step per open pop-up** (`usePopupHistory`, in `BottomSheet` and in `ResponsiveDialog`'s desktop
  dialog): opening pushes a step on the same address that keeps the router's own state and adds `pupPopups` (how many
  are open). Back pops it and the pop-ups above that number close. Closing any other way calls `history.back()` itself
  and ignores its own `popstate`; a pop-up opened before that lands waits for it. The step is only taken away while it
  is still the current one: a link that moved on from it (More's sections use `replace`) or a navigation from a dialog
  keeps its place. A step whose pop-up is gone (reached with Forward) is skipped.
- The steps live outside React Router (raw `history.pushState`): they don't change the address, so the router sees a
  pop of the same page and nothing re-renders differently.

## Consequences

- Every pop-up built on `BottomSheet` / `ResponsiveDialog` gets both for free; one built on Mantine's `Drawer` or
  `Modal` directly gets neither (DESIGN_RULES custom rule).
- Closing a pop-up any way but Back makes one `popstate` the router also sees, as a pop to the same page; there are no
  loaders, so it costs nothing.
- Browsers skip history steps pushed without a user's tap when going Back; a pop-up opened by code without a tap (none
  today) would close only on the second Back.
