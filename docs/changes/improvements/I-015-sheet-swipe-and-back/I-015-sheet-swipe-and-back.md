# I-015 · Phone pop-ups close with a swipe down and with Back

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Medium (confirmed by the owner, 2026-10-31) |
| Status | In progress |
| Branch | `improvement/I-015-sheet-swipe-and-back` (planned on `plan/i015-sheet-swipe-and-back`) |
| Design | No new screens: the sheets stay as they are. A small demo page to try the swipe on a phone, for the owner's approval: [prototypes/demo.html](prototypes/demo.html) |
| Approved | — |

## Goal

On the phone every pop-up is a bottom sheet (`BottomSheet`, via `ResponsiveDialog`). It closes with the X, Cancel, a
tap on the dimmed page or Escape, but not the two ways people close sheets in other apps:

- **Swipe down:** the sheet has a grab handle, which says "drag me", but dragging it does nothing.
- **Back** (Android's Back gesture or button, the browser's Back): it isn't tied to the sheet, so it leaves the page
  instead of closing the sheet, and whatever was typed in the form is gone.

Found by the owner while reviewing F-016's prototype on 2026-10-31 ("what's pop-up behaviors on mobile?"), for all
pop-ups.

## Acceptance criteria

- [ ] **Swipe down closes a sheet.** Dragging the handle or the title down moves the sheet with the finger; let go
      past a quarter of its height (the plan said about a third; a quarter is proposed with the demo), or with a
      quick flick down, and it closes; otherwise it slides back.
- [ ] Dragging the content closes the sheet only when the content is scrolled to the top and the finger moves down;
      otherwise the content scrolls as it does today (I-004).
- [ ] **Back closes the top pop-up** instead of leaving the page; the next Back goes to the previous page as usual.
      The same for the desktop dialog (decision 2).
- [ ] Closing a pop-up any other way (X, Cancel, the dimmed page, Escape, Save, a swipe) leaves no extra step in the
      history: Back afterwards goes to the previous page, and Forward doesn't open the pop-up again.
- [ ] A link inside a sheet that opens another page (the More sheet's sections) still lands on that page, and Back
      from it returns to the page the sheet was on, not to the sheet.
- [ ] A sheet over a sheet (F-016's currency list over the account form): a swipe or Back closes only the top one.
- [ ] Closing by swipe or Back is the same as the X today: nothing is saved, and the form keeps no draft.
- [ ] With "reduce motion" on, the sheet follows the finger but doesn't spring back or slide out.
- [ ] Every sheet in the app: More, Add transaction, the account form, Archive and Delete (F-014, I-011), New invite
      link, Block and Delete (F-028), and F-016's currency lists if F-016 is built first.

## Tasks

- [x] Look at how well-made apps do it (references below); a demo page with the swipe and Back (see "Demo").
- [ ] The owner tries the demo on a real phone.
- [ ] The owner approves the plan and the demo.
- [ ] Swipe: pointer handling on the sheet's handle, title and (when scrolled to the top) content, in the shared
      `BottomSheet`.
- [ ] Back: a history step pushed when a pop-up opens and removed when it closes another way, in the shared
      `ResponsiveDialog` / `BottomSheet`, one step per open pop-up.
- [ ] Unit tests (Vitest): the history steps (open, close by X, close by Back, a sheet over a sheet, a link out of
      the More sheet); the swipe thresholds.
- [ ] E2E (Playwright, phone): a swipe closes the account form; Back closes it and stays on Accounts; Back after X
      leaves the page.
- [ ] Storybook: the sheet stories can be swiped (no new stories needed).
- [ ] Screenshots of a sheet mid-swipe at 375 px, light and dark.

## Design

### References

- [Material 3 — Bottom sheets](https://m3.material.io/components/bottom-sheets/guidelines): the drag handle, swipe
  down to dismiss, and the system Back dismissing the sheet.
- [Apple HIG — Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets): a sheet is dismissed
  by swiping it down.
- [Vaul](https://vaul.emilkowal.ski/): a React drawer with drag to close; how far and how fast a drag must be to
  close, and how dragging the content works only from the top. The demo takes its numbers as they are (its source,
  `src/constants.ts`): close past 25 % of the height (`CLOSE_THRESHOLD`) or on a flick faster than 0.4 px/ms
  (`VELOCITY_THRESHOLD`); a drag from the content waits 100 ms after the content scrolls (`SCROLL_LOCK_TIMEOUT`);
  the slide's easing `cubic-bezier(.32, .72, 0, 1)`.
- [Android — Predictive back](https://developer.android.com/design/ui/mobile/guides/patterns/predictive-back): Material
  bottom sheets have Back built in (with its predictive animation): Back is one of the ways a sheet closes.

### Decisions (owner, 2026-10-31)

Claude's four proposals, each accepted by the owner:

1. **Own code for the swipe:** own pointer handling in `BottomSheet` (a small hook), not Vaul, so the app keeps one
   kind of pop-up (Mantine's) and the I-004 / I-012 styling stays as it is. Vaul would bring a second dialog system
   (Radix) next to Mantine's.
2. **Back on the desktop** closes the dialog there too, so it works the same everywhere (the browser's Back, or
   Alt + ←).
3. **Unsaved form:** a swipe or Back closes without asking, like the X today. Asking "Discard changes?" would be a
   change of its own, for every pop-up.
4. **Order:** built after F-016, so its currency sheets are covered from the start (and the first sheet over a sheet
   is tested).

These settle the plan's questions; they aren't the approval to build. That comes after the demo page (see Tasks).

### Demo (2026-11-01, for approval)

[prototypes/demo.html](prototypes/demo.html): the app's Accounts page with its sheets as they are today (I-004,
I-012) and the planned swipe and Back added, written the way `BottomSheet` / `ResponsiveDialog` would do it. The
sheets: the account form, the currency list over it (F-016), More and Add transaction; on the desktop the form is a
dialog and the currency list a dropdown. The bar on top switches Phone / Desktop, the theme and reduced motion, says
what the last action did, and "How to try" lists what to try. On a phone narrower than 600 px it fills the screen.

How it works, as it would be built:

- **Swipe:** the handle and the title take pointer events (a finger, a mouse or a pen) and the browser doesn't scroll
  there. The content and the search over a list take touch events: a drag starts only when the content is at its top,
  the finger moves down and the content hasn't scrolled in the last 100 ms; otherwise it scrolls as before. The sheet
  and the dimmed page follow the finger; up past the start the sheet barely gives.
- **Back:** opening a pop-up adds one step to the history (same address); Back takes it away and closes the top
  pop-up. Closing another way takes the step away itself (`history.back()`, its own `popstate` ignored), so the next
  Back leaves the page. A link in More replaces the sheet's step with the new page, so Back from that page goes to the
  page under the sheet.

Points to approve with it:

1. **A quarter, not a third:** a sheet closes when let go past a quarter of its height (Vaul's number) or on a flick
   faster than 0.4 px/ms. The plan said about a third; on the tall currency list (80 % of an 812 px screen) a third is a 215 px drag, a
   quarter 160 px. Worth feeling on the phone before deciding.
2. **Forward onto a closed pop-up** does nothing visible: the step is skipped. Reopening the pop-up would be the other
   choice, but its form would be empty.
3. **The desktop currency dropdown** isn't a pop-up: Back doesn't close it, Escape and a click outside do (as today).

Checked:

- The design check (Playwright and axe at 360–1440 px, light and dark): 0 issues, 0 console errors.
- In the Browser pane, scripted: a short slow drag slides back; a long drag and a flick close; a drag on the scrolled
  currency list scrolls and doesn't close, the same drag at its top closes only the list; Back then closes the form and
  stays on Accounts; More → Categories, then Back, goes to Accounts with no sheet; × then Forward doesn't reopen;
  desktop Back closes the dialog; Escape closes the dropdown first, then the dialog; with reduced motion the sheet
  follows the finger and then snaps back or disappears.
- Screenshots at 375 and 1440 px, light and dark, of every sheet, the dropdown and a sheet mid-swipe. They found one
  thing, fixed: the sheet showed a focus ring when it took the focus on opening.
- Not checked: a real phone's touch (Android's Back gesture, iOS's edge swipe). That's the owner's try.

## Tests

- Unit: the history-step hook; the swipe's close / slide-back decision.
- E2E (Playwright, phone): swipe and Back close the account form.

## Notes

- Mantine's `Drawer` has neither drag nor history handling, which is why both are missing today.
