# I-027 · The phone keys in a phone's order: 1 2 3 on top, ⌫ above Save

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
([reference-key-order.png](reference-key-order.png)): 1 2 3 on top, and ⌫ right above Save (owner, 2026-11-05).

## Acceptance criteria

- [ ] On the phone the keys are, row by row (proposed, see open points):

      ```text
      1   2   3   +
      4   5   6   −
      7   8   9   ⌫
      00  0   =   Save
      ```

- [ ] ⌫ is right above Save; + and − keep the right column's top, as in the reference.
- [ ] The keys work as now: + − = add up a sum, = is off until there is a sum, 00, the 9-digit limit; only their
      places change.
- [ ] The keys' labels for screen readers and the order a keyboard's Tab goes through them follow the new order.
- [ ] The desktop is unchanged (the amount is typed there).

## Tasks

- [ ] Owner answers the open points and approves this file (I-003).
- [ ] The new order in `AmountKeys.tsx` (`KEYS`, the comment above it).
- [ ] Unit test: the keys' order.
- [ ] Storybook: the stories with the keys show the new order (no new story).
- [ ] Screenshots of the form with the keys at 375 px, light and dark (expense, income, a transfer with an exchange).

## Tests

- Unit: the keys in the new order; a sum typed with them (`12+3` =) still works.
- E2E (Playwright, phone): the existing quick-add tests press keys by their labels, so they keep passing; one test types
  an amount with the keys and checks the saved amount.
- Screens checked in Playwright screenshots (375 px, light and dark).

## Open points (for the owner)

1. **× and ÷?** The reference has them; the app's amount adds up a receipt with + and − only. Proposed: leave them out.
   Adding them means a fifth row or smaller keys, and the sum's rules change (`2×350+100`).
2. **`.` instead of `00`?** The reference has `.`; amounts are whole in the app (ADR 0018), so `.` would do nothing.
   Proposed: keep `00`.
3. **The category button** under the keys in the reference: the app has Save there and the categories in the form.
   Proposed: unchanged.

## Notes

- I-023 (the opening balance as a calculator) uses the same keys, so it gets this order too.
- I-028 (folding the keys away) changes the same keys; either can go first.
