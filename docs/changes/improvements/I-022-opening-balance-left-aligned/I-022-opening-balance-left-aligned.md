# I-022 · Opening balance typed from the left

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Low (polish: the field works) |
| Status | Done |
| Branch | `improvement/I-022-opening-balance-left-aligned` (planned on `plan/prod-testing-fixes`) |
| Design | not needed (one field's alignment; screenshots checked as usual) |
| Approved | 2026-11-06 (owner in chat: "Approved, build it") |

## Goal

The opening balance in the New account and Edit account forms is typed at the right edge of the field, unlike every
other field of the form (name, bank, date), which start at the left. The owner doesn't like it (2026-11-04, production):
the number should start at the left like the rest of the form.

## Acceptance criteria

- [x] In the account form (new and edit, phone and desktop) the opening balance's number starts at the left edge of the
      field, as the Name field's text does.
- [x] The currency sign stays at the field's right edge (`500` … `€`), so it doesn't move while typing.
- [x] Nothing else changes: the hint, a minus for a credit card's debt, the spaces between thousands on leaving the field,
      the mistakes.

## Tasks

- [x] `AccountDialog.tsx` / `Accounts.module.css`: the opening balance's input aligned left.
- [x] Storybook: the account form's stories show it (no new story needed).
- [x] DESIGN_RULES: a line that amounts typed in a form field start at the left; only the quick-add calculator display
      is right-aligned (F-018).

## Tests

- E2E: the account form's tests still pass (no behavior change).
- Screens checked in Playwright screenshots (375 and 1440 px, light and dark): New account and Edit account.

## Result (2026-11-06)

- The cause: `.amountInput` in `Accounts.module.css` set `text-align: right`; only the opening balance used it. The rule
  is gone, the tabular numbers stay. The sign is the input's right section, so it never moved; the quick-add form's
  own `.amountInput` (`TransactionForm.module.css`) is a different class and is unchanged.
- E2E: `accounts.spec.ts` checks that the opening balance is aligned like the Name field (phone and desktop).
- Checked in Playwright screenshots of New account and Edit account, 375 and 1440 px, light and dark, and a minus typed
  (`-12500`): the number starts where the Name and Opening date text start, the `₴` at the right edge.
- One wording note on the criteria: the field never showed spaces between thousands; on leaving it shows the whole
  number without them (`21500`, `amountText`). Unchanged by this change.

## Notes

- If I-023 (the opening balance as a calculator) is built first, this goes into it and is closed with it. (It wasn't:
  I-022 came first.)
- Answered by the owner (2026-11-04): the sign stays at the field's right edge, the number starts at the left.
