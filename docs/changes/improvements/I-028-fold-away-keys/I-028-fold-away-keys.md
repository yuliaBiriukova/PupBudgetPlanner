# I-028 · The phone keys show on a tap on the amount and fold away with Back or a swipe down

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | Medium (proposed: Back or a swipe meant for the keys closes the form, and what was typed is lost) |
| Status | Done |
| Branch | `improvement/I-028-fold-away-keys` (planned on `plan/quick-add-keys`) |
| Design | 🎨 3 prototype stories, then the final prototype (see "Design"); screenshots in [prototypes/](prototypes/) |
| Approved | 2026-11-05 (owner: "Approved, build it", the final prototype) |

## Goal

On the phone the quick-add form opens with the app's keys under it (F-018), and they stay there: they fold away only
while the Note is typed (I-017). The owner wants to put them away to see the form, the way a phone's keyboard goes away
with Back or a swipe down. Today both of those close the whole form (I-015), and what was typed is gone (owner,
2026-11-05, production). The keys start folded and come up on a tap on the amount, like a phone's keyboard on a field
(owner, 2026-11-05).

## Acceptance criteria

- [x] **The form opens with the keys folded**, adding and changing alike: one full-width Save at the bottom, as while
      the Note is typed (I-017).
- [x] **A tap on the amount brings the keys up** (an exchange: on the display tapped); tapping the Note folds them for
      the phone's keyboard, as now.
- [x] **Back** with the keys up folds them; the form stays open. The next Back closes the form, as now (I-015).
- [x] **A swipe down on the keys** folds them; the keys follow the finger and slide back if let go early (the same
      quarter and flick as the sheets, I-015). A swipe on the sheet's handle or title still closes the form.
- [x] The amount shows it is tapped to type (its `0` placeholder and the ring as now); the variants try how clear
      that is with the keys folded. The owner chose nothing more than that (final prototype), and the sheet's grab
      handle on the keys while they are up.
- [x] Folding the keys loses nothing: the amount, the category and the note stay as typed.
- [x] The history keeps no extra step: closing the form with the keys up (×, Save, a swipe) leaves Back to go to the
      previous page, as I-015 does.
- [x] The desktop is unchanged (no keys there).

## Tasks

- [x] References (Material 3 and Android's IME "hide keyboard", Gboard's ⌄ key, Monefy, 1Money, Spendee, Mobbin
      "calculator keypad", "amount input") and 3 prototype stories in
      `frontend/src/prototypes/I-028-fold-away-keys/` (*Prototypes / I-028 Fold away keys*), in the real quick-add
      form, with the swipe and Back working.
- [x] The owner tries them, picks one; final prototype approved (I-003, 2026-11-05).
- [x] The keys' up / folded state in `TransactionDialog.tsx` (`keysUp`; a tap on the Note folds them, `typingNote`
      keeps the Note's room).
- [x] Back: a history step for the keys while they are up, over the sheet's own (`usePopupHistory`). Closing a pop-up
      another way now takes away the steps over it too, in one traversal (`popupHistory.ts`), so the form closed with
      the keys up leaves no step.
- [x] Swipe: the keys' own drag (`useKeysSwipe.ts`), reusing `useSheetSwipe.ts`'s `shouldClose`; the keys slide up as
      they come and down as they fold (200 ms, off with reduced motion), with the sheet's grab handle on top.
- [x] Storybook: the form's stories open with the keys folded; *Sum on the keys* and *Exchange phone* tap the amount
      first and show them up with the handle. The prototype stories are deleted.

## Design

What the 3 variants try (all start folded, with the tap on the amount, Back and the swipe; they differ in what tells
the person the keys can go):

1. **Nothing shown:** Back and the swipe only, like a phone's keyboard.
2. **A handle on the keys:** a small grab handle on the rule above the keys, as on the sheets.
3. **A fold key:** a ⌄ key in the pad (as Gboard's), or a ⌄ at the end of the keys' rule.

### References

Mobbin needs a sign-in for most screens, so it wasn't used; only pages that open without one.

- Android's keyboard (Gboard and others): Back hides the keyboard before it leaves the screen, and Gboard has had a
  ⌄ key of its own to hide it; Samsung phones add a "hide keyboard" button to the navigation bar
  ([Android Central](https://www.androidheadlines.com/?p=1043772),
  [Samsung community](https://eu.community.samsung.com/t5/galaxy-s23-series/minor-suggestion-show-button-to-hide-keyboard/td-p/7505304)).
  Taken: Back folds the keys first (all variants) and the ⌄ (variant 3). People also ask how to *remove* that key,
  so not everyone wants one: variant 1 has none.
- Material 3's bottom sheets ([Compose `DragHandle`](https://kotlinlang.org/api/compose-multiplatform/material3/androidx.compose.material3/-bottom-sheet-defaults/-drag-handle.html),
  [Flutter `BottomSheet`](https://api.flutter.dev/flutter/material/BottomSheet-class.html)): a 32 × 4 handle on top
  says the sheet can be dragged; moves under 8 px are taps. Taken: the handle on the keys (variant 2), the same 8 px
  before a tap on a key becomes a swipe (all).
- Vaul's numbers, already the app's sheets' (I-015): fold past a quarter of the height or on a flick, else slide
  back. Taken as they are for the keys.
- Monefy ([App Store](https://apps.apple.com/app/id1212024409)) and the money apps in I-027's reference keep their own
  keys on screen all the time; none of them folds them. The owner's ask goes past them: the keys only while typing.

### Brief

- **Who and when:** on the phone, one hand, adding an expense in a few seconds or changing one later.
- **The job:** see the whole form (category, note) and put the keys away like a phone's keyboard, without losing what
  was typed; get them back with a tap on the amount.
- **Their world:** the phone's own keyboard, which goes away with Back and comes with a tap on a field.
- **The feeling:** in control, nothing lost.

### Plan

- **Reused:** the quick-add form as built (copied into the prototype folder), its keys and Save, the full-width Save
  of I-017 (while the note is typed), the sheet's grab handle (`BottomSheet`), the app's history steps
  (`popupHistory.ts`, unchanged) and the sheets' swipe numbers (`shouldClose` from `useSheetSwipe.ts`).
- **New:** the keys' up / folded state, their own history step over the sheet's, their swipe; each variant's part
  (variant 2: the handle on the keys and their edge left above Save; variant 3: a ⌄ row over the keys and a keypad key
  beside Save). No new tokens.
- **Motion:** the keys slide up from the sheet's edge as they come and down as they fold (200 ms); off with reduced
  motion. Nothing else moves.
- **The bold element:** none new; the form stays as it is, the keys go.
- Slop check: no icon in a tinted circle (the keypad key is a key like the others), no hint text or arrow telling
  people what to do; variant 3's ⌄ is a quiet icon button.

### Round 1: three variants (2026-11-05)

Stories in `frontend/src/prototypes/I-028-fold-away-keys/` (*Prototypes / I-028 Fold away keys*; deleted with the
build, so the links below no longer open): the Transactions page with the quick-add form open, its keys folded. Tap the amount for the keys; fold them with Back (Alt + ← on a
computer), a swipe down on them (the mouse works too) or the variant's part. A row of the page opens a transaction to
change; Transfer to an account in dollars has two amounts. All three: the keys start folded (adding and changing), a
tap on the Note folds them for the phone's keyboard as now, and closing the form with them up (×, Save, a swipe on the
title, Delete) leaves no extra Back.

| Story | Thesis | Link |
|---|---|---|
| Variant 1: Nothing shown | Like the phone's keyboard: Back or a swipe; folded, Save alone and the amount's `0`. Most room for the form, nothing to learn, but nothing says the keys can go | [open](http://localhost:6006/?path=/story/prototypes-i-028-fold-away-keys--variant-1&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 2: A handle | The sheet's grab handle on the keys; folded, their edge with the handle stays above Save, tap it or drag it up for the keys. Says "drag me" in the app's own language; the edge costs 44 px of the folded form | [open](http://localhost:6006/?path=/story/prototypes-i-028-fold-away-keys--variant-2&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 3: A keys button | A ⌄ over the keys folds them (as Gboard's); folded, a keypad key beside Save brings them back. The clearest both ways and one-handed, but the ⌄ row takes 40 px of the form while the keys are up | [open](http://localhost:6006/?path=/story/prototypes-i-028-fold-away-keys--variant-3&nav=false&panel=false&globals=viewport.value:!undefined) |

Checked: the design check on the three stories; in the Browser pane and Playwright at 375 px, light and dark: opens
folded, a tap on the amount brings the keys up, a sum typed, Back folds them with the sum kept and Back again closes
the form (no step left), a short drag slides back without pressing a key, a long one folds them, × with the keys up
leaves no step, variant 2's edge and variant 3's ⌄ and keypad key work. Screenshots of folded, up and mid-swipe looked
at. The desktop dialog is the app's own and doesn't change.

### Round 2: the final prototype (2026-11-05)

The owner chose variant 1 with variant 2's handle on the keys while they are up (2026-11-05). So: the form opens with
the keys folded and Save alone; a tap on the amount brings them up with the sheet's grab handle on their top edge
(inside their own top padding, no room taken); Back or a swipe down folds them; nothing is left of them while folded.

| Story | Link |
|---|---|
| Final prototype | [open](http://localhost:6006/?path=/story/prototypes-i-028-fold-away-keys--final&nav=false&panel=false&globals=viewport.value:!undefined) |

Checked: the design check on the story (its 22 findings are the same as the three variants', none in the keys: the
form's overlay over the page, the amount's input, the page's bars); in the Browser pane and Playwright at 375 px,
light and dark: opens folded, a tap on the amount brings the keys up with the handle, `12 + 3` typed, Back folds them
with the sum kept, Back again closes the form with no step left, a swipe folds them. Screenshots of folded, up,
mid-swipe and swiped looked at. Approved by the owner on 2026-11-05 ("Approved, build it"); its screenshots (375 and
1440 px, light and dark, and the keys up at 375 px) are in [prototypes/](prototypes/).

Built: closing the form with the keys up removed the keys' history step and then the sheet's; the prototype waited for
the first to go before closing. The build takes both away in one traversal in `popupHistory.ts`.

## Tests

- Unit: the form opens with the keys folded (adding and changing); Back folds the keys, then closes the form; a tap on
  the amount brings them back; no history step left after Save or ×; the desktop has none
  (`TransactionsPage.test.tsx`); the swipe folds past a quarter or on a flick, slides back otherwise without pressing
  the key, a wobbly press stays a press (`useKeysSwipe.test.tsx`); a pop-up and one inside it closed together leave no
  step, in either order (`popupHistory.test.tsx`).
- E2E (Playwright, phone): the form opens folded; a tap on the amount brings the keys up; Back folds them and the
  form stays with its amount; Back again closes it; a swipe down on the keys folds them.
- Screens checked in Playwright screenshots (375 px, light and dark): keys up, folded, mid-swipe.

## Phone keyboard or the app's keys? (owner's question, 2026-11-05)

Asked with this change: would the phone's own number keyboard on a tap on the amount suit the form better than the
app's keys? **Answered by the owner (2026-11-05): keep the app's keys**, folded until the amount is tapped (this
change). Why it was proposed:

- **For the app's keys:** the amount is a calculator (`1200+350−100`), and the phone's number keyboards can't type
  it: iOS's decimal pad has no + or −, and Android's depends on the keyboard (Gboard's number pad has them, Samsung's
  and others' often not). Save is always in the same place under the thumb. Nothing jumps: the phone's keyboard
  squeezes the sheet as it opens and closes (I-017 had to follow the visual viewport for it). The keys look like the
  app in light and dark; the phone's keyboard looks like whatever keyboard is installed. Money apps with a sum (Monefy,
  1Money, Spendee, the app in I-027's reference) all use their own keys.
- **For the phone's keyboard:** no code to keep up, Back and a swipe close it on their own, the person's own keyboard
  (sound, vibration). It's what the desktop and the plain fields use.
- What tips it: the sum. Without the app's keys, `+` and `−` would have to be buttons of their own beside the amount.
  This change takes away the keys' one drawback the owner met: they can't be put away.

## Answered (owner, 2026-11-05)

1. **When the keys show:** always folded when the form opens, adding or changing; up on a tap on the amount.
2. **The app's keys or the phone's keyboard:** keep the app's keys.

## Notes

- I-027 changes the same keys' order; either can go first.
- B-009 (the gap under the Note) is in the same part of `TransactionDialog.tsx`, the Note's room and its folded keys;
  building them one after the other avoids conflicts.
