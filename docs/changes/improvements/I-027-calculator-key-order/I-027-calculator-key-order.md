# I-027 · The phone keys in a phone's order: 1 2 3 on top, ⌫ above Save, `.` for cents

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | Medium (proposed: the keys are used for every transaction, and the order now trips the fingers) |
| Status | Todo |
| Branch | `improvement/I-027-calculator-key-order` (planned on `plan/quick-add-keys`) |
| Design | No 3 variants: the owner gave the order ([reference-key-order.png](reference-key-order.png)). The new grid is in this file; screenshots after the build |
| Approved | — |

## Goal

The quick-add form's keys on the phone (`AmountKeys.tsx`, F-018) are in a desktop calculator's order: 7 8 9 on top,
⌫ in the top right corner. The owner wants a phone's order, as in the app they used before
([reference-key-order.png](reference-key-order.png)): 1 2 3 on top, ⌫ right above Save, and `.` in place of `00`
(owner, 2026-11-05).

## Acceptance criteria

- [ ] On the phone the keys are, row by row (owner, 2026-11-05):

      ```text
      1   2   3   +
      4   5   6   −
      7   8   9   ⌫
      .   0   =   Save
      ```

- [ ] ⌫ is right above Save; + and − keep the right column's top, as in the reference.
- [ ] The keys work as now: + − = add up a sum, = is off until there is a sum, the 9-digit limit (digits before the
      point); only their places change. `00` is gone.
- [ ] **`.` types cents** (ADR 0018: typed cents are allowed and rounded): one point a number, at most 2 digits
      after it; `.` first in a number gives `0.`; a point with nothing after it is dropped. A sum is rounded once
      worked out: `12.30+45.80` = `58`; the amount saved is whole, as on the desktop.
- [ ] The display shows the cents as typed (`12.30 + 45.80`) and the sum's result on top whole (`58`).
- [ ] The keys' labels for screen readers and the order a keyboard's Tab goes through them follow the new order.
- [ ] The desktop is unchanged (the amount is typed there).

## Tasks

- [x] Owner answers the open points (2026-11-05).
- [ ] Owner approves this file (I-003).
- [ ] The new order in `AmountKeys.tsx` (`KEYS`, the comment above it); the `.` key (`AmountKey`, `pressKey` in
      `amount.ts`) in place of `00`.
- [ ] Unit test: the keys' order.
- [ ] Storybook: the stories with the keys show the new order (no new story).
- [ ] Screenshots of the form with the keys at 375 px, light and dark (expense, income, a transfer with an exchange).

## Tests

- Unit: the keys in the new order; a sum typed with them (`12+3` =) still works; `.`: one a number, 2 digits
  after it, `.` first gives `0.`, `12.30+45.80` = `58`, the limit counts digits before the point.
- E2E (Playwright, phone): the existing quick-add tests press keys by their labels, so they keep passing; one test types
  an amount with the keys and checks the saved amount.
- Screens checked in Playwright screenshots (375 px, light and dark).

## Answered (owner, 2026-11-05)

1. **× and ÷:** not added; the amount adds up with + and − only.
2. **`.` instead of `00`:** yes. Typed cents are rounded as ADR 0018 says, so a receipt's cents can be added up
   before rounding.
3. **The category button** under the keys: not added; Save stays there and the categories in the form.

## Notes

- I-023 (the opening balance as a calculator) uses the same keys, so it gets this order and `.` too.
- I-028 (folding the keys away) changes the same keys; either can go first.
