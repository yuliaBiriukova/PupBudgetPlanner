# I-028 · The phone keys show on a tap on the amount and fold away with Back or a swipe down

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | Medium (proposed: Back or a swipe meant for the keys closes the form, and what was typed is lost) |
| Status | Todo |
| Branch | `improvement/I-028-fold-away-keys` (planned on `plan/quick-add-keys`) |
| Design | 🎨 3 prototype stories: how the keys show they can be folded (see "Design") |
| Approved | — |

## Goal

On the phone the quick-add form opens with the app's keys under it (F-018), and they stay there: they fold away only
while the Note is typed (I-017). The owner wants to put them away to see the form, the way a phone's keyboard goes away
with Back or a swipe down. Today both of those close the whole form (I-015), and what was typed is gone (owner,
2026-11-05, production). The keys start folded and come up on a tap on the amount, like a phone's keyboard on a field
(owner, 2026-11-05).

## Acceptance criteria

- [ ] **The form opens with the keys folded**, adding and changing alike: one full-width Save at the bottom, as while
      the Note is typed (I-017).
- [ ] **A tap on the amount brings the keys up** (an exchange: on the display tapped); tapping the Note folds them for
      the phone's keyboard, as now.
- [ ] **Back** with the keys up folds them; the form stays open. The next Back closes the form, as now (I-015).
- [ ] **A swipe down on the keys** folds them; the keys follow the finger and slide back if let go early (the same
      quarter and flick as the sheets, I-015). A swipe on the sheet's handle or title still closes the form.
- [ ] The amount shows it is tapped to type (its `0` placeholder and the ring as now); the variants try how clear
      that is with the keys folded.
- [ ] Folding the keys loses nothing: the amount, the category and the note stay as typed.
- [ ] The history keeps no extra step: closing the form with the keys up (×, Save, a swipe) leaves Back to go to the
      previous page, as I-015 does.
- [ ] The desktop is unchanged (no keys there).

## Tasks

- [ ] References (Material 3 and Android's IME "hide keyboard", Gboard's ⌄ key, Monefy, 1Money, Spendee, Mobbin
      "calculator keypad", "amount input") and 3 prototype stories in
      `frontend/src/prototypes/I-028-fold-away-keys/` (*Prototypes / I-028 Fold away keys*), in the real quick-add
      form, with the swipe and Back working.
- [ ] The owner tries them on the phone, picks one; final prototype approved (I-003).
- [ ] The keys' up / folded state in `TransactionDialog.tsx`, shared with the Note's (today `typingNote`).
- [ ] Back: a history step for the keys while they are up, under the sheet's own (`popupHistory.ts`).
- [ ] Swipe: the keys' own drag, reusing `useSheetSwipe.ts`'s thresholds.
- [ ] Storybook: the form's stories with the keys folded.

## Design

What the 3 variants try (all start folded, with the tap on the amount, Back and the swipe; they differ in what tells
the person the keys can go):

1. **Nothing shown:** Back and the swipe only, like a phone's keyboard.
2. **A handle on the keys:** a small grab handle on the rule above the keys, as on the sheets.
3. **A fold key:** a ⌄ key in the pad (as Gboard's), or a ⌄ at the end of the keys' rule.

## Tests

- Unit: the form opens with the keys folded (adding and changing); Back folds the keys, then closes the form; a tap on the amount brings them back; no history step left after
  Save or ×; the swipe's fold / slide-back decision.
- E2E (Playwright, phone): the form opens folded; a tap on the amount brings the keys up; Back folds them and the
  form stays with its amount; Back again closes it; a swipe down on the keys folds them.
- Screens checked in Playwright screenshots (375 px, light and dark): keys up, folded, mid-swipe.

## Phone keyboard or the app's keys? (owner's question, 2026-11-05)

Asked with this change: would the phone's own number keyboard on a tap on the amount suit the form better than the
app's keys? **Answered by the owner (2026-11-05): keep the app's keys**, folded until the amount is tapped (this
change); Q-013 is answered. Why it was proposed:

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
2. **Q-013:** keep the app's keys.

## Notes

- I-027 changes the same keys' order; either can go first.
- B-009 (the gap under the Note) is in the same part of `TransactionDialog.tsx`, the Note's room and its folded keys;
  building them one after the other avoids conflicts.
