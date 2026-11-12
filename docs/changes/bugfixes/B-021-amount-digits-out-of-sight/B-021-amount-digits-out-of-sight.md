# B-021 · The digits typed past the amount's width can't be seen

| | |
|---|---|
| Type | Bugfix |
| Priority | High (proposed: on the main form you can't see what you type) |
| Status | Done |
| Branch | `bugfix/B-020-B-022-I-032-ui-fixes` (one PR with B-020, B-022 and I-032, as the owner asked) |
| Found in | Production, 2026-11-12, the owner's Android phone (Chrome), dark theme |
| Approved | 2026-11-12 (root cause and planned fix, "Approved, build them") |

## Steps to reproduce

1. On the phone, open Add transaction (Expense) and tap the amount.
2. Type a sum longer than the amount's width, e.g. `99+666+66+…` with the phone keys.

## Expected

The amount shows the end of what is being typed (the newest digits), as a calculator does; the start moves out of
sight to the left.

## Actual

The amount stops at its width and keeps showing the start (`+ 99 + 666 + 66`); the digits typed after that can't be
seen (owner's screenshot).

## Root cause

Confirmed on 2026-11-12 in Storybook (*Transactions / Add phone*, 375 px): after `99+666+66+777+888+12345` on the
phone keys the amount's input is 311 px wide and its text 665 px, scrolled 0 px: the start shows, the end is cut off.

The amount is a text input as wide as the display at most (`.sizer` `max-width: 100%`); a longer text scrolls
inside it. When a person types on a keyboard, the browser scrolls the input to the caret. The app's keys don't type:
each key works out a new value in `TransactionDialog` and React sets it on the input, and a value set by code never
scrolls the input. So the input stays scrolled to its start. A plain number that long (11+ digits) is the same.

## Fix

Approved by the owner on 2026-11-12:

- [x] `AmountDisplay` scrolls its input to the end (`scrollLeft = scrollWidth`) whenever its value changes while the
  caret is at the end, which is always so with the app's keys: the newest digits are in sight, the start moves out
  on the left, as on a calculator. Typed on a keyboard (the desktop) nothing changes: the browser follows the caret.
- [x] The result line on top (`= 57 720 ₴`) stays as it is; it already shows the whole sum's total.

## Tests

- [x] E2E on the phone (`transactions.spec.ts`, Pixel 7): type `99+666+66+777+888+12345` on the app's keys; the input
  is scrolled to its end, and stays there after ⌫. Fails before the fix (scrolled 0 px), passes after it.
- [x] Unit (`TransactionsPage.test.tsx`, *the phone keys*): with the input made 300 px wide and its text 600 px (jsdom
  has no layout), a digit and + each set `scrollLeft` to the end. Fails before the fix, passes after it.
- [x] Screenshots at 375 px with `99+666+66+777+888+12345` typed: [light](fixed-375-light.png),
  [dark](fixed-375-dark.png) show `7 + 888 + 12 345`, the end. The desktop is typed on the keyboard, so the browser
  already followed the caret there; nothing changed for it.
