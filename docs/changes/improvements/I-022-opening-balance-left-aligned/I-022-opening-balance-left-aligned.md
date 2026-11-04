# I-022 · Opening balance typed from the left

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Low (polish: the field works) |
| Status | Todo |
| Branch | `improvement/I-022-opening-balance-left-aligned` (planned on `plan/prod-testing-fixes`) |
| Design | not needed (one field's alignment; screenshots checked as usual) |
| Approved | — |

## Goal

The opening balance in the New account and Edit account forms is typed at the right edge of the field, unlike every
other field of the form (name, bank, date), which start at the left. The owner doesn't like it (2026-11-04, production):
the number should start at the left like the rest of the form.

## Acceptance criteria

- [ ] In the account form (new and edit, phone and desktop) the opening balance's number starts at the left edge of the
      field, as the Name field's text does.
- [ ] The currency sign stays at the field's right edge (`500` … `€`), so it doesn't move while typing.
- [ ] Nothing else changes: the hint, a minus for a credit card's debt, the spaces between thousands on leaving the field,
      the mistakes.

## Tasks

- [ ] `AccountDialog.tsx` / `Accounts.module.css`: the opening balance's input aligned left.
- [ ] Storybook: the account form's stories show it (no new story needed).
- [ ] DESIGN_RULES: a line that amounts typed in a form field start at the left; only the quick-add calculator display
      is right-aligned (F-018).

## Tests

- E2E: the account form's tests still pass (no behavior change).
- Screens checked in Playwright screenshots (375 and 1440 px, light and dark): New account and Edit account.

## Notes

- If I-023 (the opening balance as a calculator) is built first, this goes into it and is closed with it.
- Answered by the owner (2026-11-04): the sign stays at the field's right edge, the number starts at the left.
