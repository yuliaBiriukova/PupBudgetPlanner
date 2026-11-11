# I-029 · Phone pop-ups: as tall as the screen allows, small ones at the bottom, all above the keyboard

| | |
|---|---|
| Type | Improvement |
| Milestone | M6 — MVP release (polish) |
| Priority | Medium (proposed: long pop-ups waste room and the keyboard covers the fields of every pop-up but the quick-add form; there is a workaround, scrolling) |
| Status | Done |
| Branch | `improvement/I-029-popup-height-and-keyboard` (planned on `plan/phone-feedback`) |
| Design | A prototype story tried first (owner, 2026-11-10), two rounds; see "Design" |
| Approved | 2026-11-11 (the owner: "Approve, build it", on the prototype's round 2) |

## Goal

On the phone every pop-up uses the screen well: one that doesn't fit takes as much of the screen as it can, a small one
sits at the bottom as now, and while the phone's keyboard is up the pop-up is above it with the field being typed and
its buttons in sight (owner, 2026-11-09).

## Today

- Phone pop-ups are bottom sheets (`BottomSheet.tsx`): as tall as their content up to **90 %** of the screen; the
  currency list's sheet a set 80 % (F-016); the quick-add form a set 90 % (F-018).
- Only the quick-add form follows the phone's keyboard (I-017, `useKeyboardInset`). Every other sheet (the account
  form, Settings' fields, the People dialogs, the currency search) stays where it is and the keyboard covers its lower
  part, often the field being typed and the buttons.

## Acceptance criteria

- [x] A phone pop-up whose content doesn't fit grows up to 16 px under the top of the screen and keeps its round top
      corners (owner's review, 2026-11-11; first built with no gap and square corners at the top, the owner's answer
      of 2026-11-10); its title and buttons stay put, the content scrolls between them (I-004).
- [x] A pop-up whose content fits is as tall as its content and sits at the bottom, as now.
- [x] While the phone's keyboard is up, **every** pop-up sits on top of it: no part of it is under the keyboard, the
      field being typed is scrolled into sight and the buttons are in sight above the keyboard. When the keyboard goes,
      the pop-up goes back to its height at the bottom.
- [x] The quick-add form is as tall as its content, like every other pop-up, not a set height (owner, 2026-11-11): no
      empty room under Save while its keys are folded (I-028); it grows when they come up. The currency search keeps
      its steady height while it is searched, now the screen less the 16 px gap.
- [x] A form opens from its top, without the keyboard (owner, 2026-11-11): on the phone its first field (a new
      account's Name, a new invite link's note) doesn't take the cursor as the pop-up opens; the keyboard comes with a
      tap on a field. A search keeps its cursor (the currency search, B-004). The desktop dialogs still put the cursor
      in the first field.
- [x] The quick-add form's sheet doesn't jump while its data loads (owner's review, 2026-11-11): the loading
      placeholder is as tall as the form was the last time on this device, so the sheet opens at the form's height and
      stays there.
- [x] Swipe down and Back still close the pop-ups (I-015).
- [x] The desktop dialogs are unchanged (centred; they already scroll inside, I-004) (owner, 2026-11-10).

## Tasks

- [x] `BottomSheet`: the height rule (as tall as the content, up to the whole screen) for every sheet, the quick-add
      form included (the `full` option is gone from `BottomSheet` and `ResponsiveDialog`); a `tall` sheet's set
      height (the searched lists: the currency list and All categories) is the screen less the top gap; the
      Transactions filters lose their set height and are as tall as their content.
- [x] The top gap (owner's review, 2026-11-11): a sheet is at most the screen, or what the keyboard leaves of it, less
      16 px (and the phone's own inset at the top), with round top corners at any height; the square corners at the
      top and `useSheetAtTop` are gone.
- [x] On the phone a form's first field isn't focused as its sheet opens: `useDesktopAutofocus` gives
      `data-autofocus` to the account form's Name and the invite link's note on the desktop only; the sheet's close
      button takes the focus, as in every sheet without a first field; the searches keep theirs.
- [x] The keyboard rule for every sheet: `useKeyboardInset` for all sheets, not only `full` ones; the field in focus
      scrolled into sight with its label and hint (`useFieldInSight`), clear of the content's fading edges.
- [x] Look through every pop-up on the phone (account form, delete dialogs, Settings, People, invite links, the
      currency search, the pickers, the quick-add form) with the keyboard up and down.
- [x] The quick-add form's loading placeholder holds the form's height on the phone: the fields' height is kept on
      the device per type (`formHeight.ts`, `pup.transactions.formHeight`) and the placeholder takes it, with the
      places of the type switch and Save; before the first time it is the short placeholder.
- [x] Storybook: *Shared / BottomSheet*: With title (short), Long with buttons (up to the top gap, round corners),
      Above the keyboard and Long above the keyboard (a stand-in keyboard through the visual viewport).
- [x] The prototype stories deleted (`frontend/src/prototypes/I-029-popup-height-and-keyboard/`).

## Design

### References

- [Material 3 bottom sheets](https://m3.material.io/components/bottom-sheets/guidelines) and Android's
  `BottomSheetBehavior`: a modal sheet may expand to the full screen; once it reaches the top its rounded corners go
  square (`shouldRemoveExpandedCorners`), so no slivers of the page show in the corners. Taken: the square corners at
  the top, the handle kept so a swipe down still reads.
- [Apple HIG: sheets](https://developer.apple.com/design/human-interface-guidelines/sheets): the medium and large
  detents; the large one leaves a gap with the page behind. Not taken: the owner chose no gap.
- [Chrome: the keyboard resizes only the visual viewport](https://developer.chrome.com/blog/viewport-resize-behavior)
  (Chrome 108+ on Android) and the viewport's `interactive-widget=resizes-content`. Taken: every sheet measures the
  visual viewport, as the quick-add form does since I-017; the `interactive-widget` switch is noted for the build, as
  Safari ignores it.

### Prototype

The owner chose to try it first (2026-11-10): one prototype story with the app's real pages and pop-ups and the new
rules laid over them, plus a stand-in for the phone's keyboard when a field is typed on a computer.

- Story: *Prototypes / I-029 Popup height and keyboard / Prototype*
  (`frontend/src/prototypes/I-029-popup-height-and-keyboard/`), deleted when the change was built; its screenshots are
  in [prototypes/](prototypes/).
- What to try: Add account (opens from its top without the keyboard; tap Name for the keyboard, then Done), its
  Currency (the search with the keyboard, then the whole list), More (a small sheet), a card's + on Accounts or the +
  on Transactions (the quick-add form as tall as its content, Transfer shorter than Expense; its Note with the
  keyboard, its amount with the app's keys).
- Controls (the toolbar's "Controls", or `args=` in the link): **I-029 rules** off shows today, to compare;
  **Square corners at the top**; **Stand-in keyboard**.
- Round 1 (2026-11-10) had the quick-add form on the whole screen, with its content's height as a switch, and the
  account form opened with the keyboard up, scrolled to Name (the form puts the cursor there as it opens). The owner
  (2026-11-11): the height follows the content; a form just opens, like Add transaction. Round 2 does both.
- Built from the app's real pages and pop-ups; the rules are CSS over the sheets' Mantine classes plus a hook that
  follows the keyboard, so the app's files are untouched.

## Tests

- Unit: `BottomSheet.test.tsx` (any sheet sits on the keyboard and goes back down with it; the field being typed is
  scrolled into sight with its label and hint, nothing scrolls while no field is typed); `AccountsPage.test.tsx` (the cursor is in Name as
  the new account's form opens on the desktop, on the phone the close button has the focus).
- E2E (Playwright, phone), `sheets.spec.ts`: the new account's form reaches 16 px under the top of the screen with
  round corners and opens from its top without the cursor in Name; with a 300 px keyboard (emulated through the visual
  viewport) the sheet sits on it, still 16 px under the top, with Name and Add account above the keys, and goes back
  when it leaves; the quick-add form is as tall as its fields and grows to the top gap when its keys come up. `shell.spec.ts`: More and Add are
  each as tall as their content (Add was a set 90 %).
- Screens checked in Playwright screenshots at 375 px (every pop-up, keyboard up and down) and 1440 px (unchanged),
  light and dark.
- The review's fix: `formHeight.test.ts`; `TransactionsPage.test.tsx` (the placeholder as tall as the form was, with
  the switch's and Save's places; the short one before the first time; unchanged on the desktop; the height
  remembered once the form shows); `sheets.spec.ts` (with the form's data 1.5 s late the sheet has the same top and
  bottom while loading and after).

## Open points

Answered by the owner on 2026-11-10:

- **The gap at the top** when a sheet grows: **none**, the sheet fills the screen like a page. Changed by the owner on
  the built change (2026-11-11): **16 px**, see "Review 2026-11-11: round corners and a gap".
- **Desktop:** **the phone only**; the desktop dialogs stay as they are.
- **Design check:** **a prototype story to try first**, then screenshots of every pop-up.

- **Corners at the top** (the prototype's switch): **square**, the prototype's default, approved as shown. Changed by
  the owner on the built change (2026-11-11): **round, as they used to be**.

## Review 2026-11-11: the sheet jumped as the form's data came

The owner, on the built change: "when I open the pop-up there's strange animation for a second when I see the rounded
corners at the top". The quick-add form fetches its data (accounts, categories, the last-used suggestions) when it
opens; on the first open after the app starts that takes up to a second. Until I-029 the sheet had a set height, so
only its inside changed. As tall as its content, it opened short with the loading placeholder and round corners, then
jumped to the form's height, its corners going square a frame later. Fixed as the last acceptance criterion says; the
desktop dialog's loading is unchanged. Left as it is: the very first open on a device (nothing to remember yet) still
grows once.

## Review 2026-11-11: round corners and a gap

The owner, on the built change: "let's keep the pop-up top corners rounded as it used to be and add small 16px gap on
the top for the pop-up that are bigger than the screen". So a sheet never touches the top of the screen: it is at most
the screen less 16 px, the dimmed page showing above it, and its top corners are round at any height, as before I-029.
With the keyboard up the same 16 px stay above a sheet that fills what the keyboard leaves. This replaces the
prototype's "no gap" and "square corners at the top"; the rest of the approved design stands. Screenshots of the
build are in [built/](built/) (375 px): the account form as it opens and with the keyboard up (light and dark), the
currency list, the quick-add form with its keys.

## Approved 2026-11-11

The owner approved round 2 of the prototype for implementation ("Approve, build it"). Its screenshots are in
[prototypes/](prototypes/): the account form as it opens and with Name tapped (375 px, light and dark), the quick-add
form as tall as its content and with its keys up, the currency search and More (375 px), and the desktop dialog,
unchanged (1440 px, light and dark).
