# F-018 · Quick add: expense and income

| | |
|---|---|
| Type | Feature |
| Milestone | M3 — Transactions |
| Status | Todo |
| Branch | `feature/F-018-quick-add-income-expense` |
| Design | 3 HTML prototypes required |

## Goal

Entering an expense on the phone is as fast as in Monefy.

## Acceptance criteria

- [ ] Add expense or income: amount, category, account, date (today by default), note
- [ ] Last used account is preselected; numeric keyboard on mobile
- [ ] Edit and delete an existing transaction
- [ ] Account balances update immediately

## Tasks

- [ ] 3 HTML prototypes (shared with F-019)
- [ ] Domain + API
- [ ] UI
- [ ] Storybook stories

## Design

Prototypes: `prototypes/` (not created yet). Chosen variant: —

## Tests

- Unit: Validators, balance effects.
- E2E (Playwright): Add expense and income; balances change.

## Notes

- **Deleting an account (I-011):** only an account without transactions can be deleted (owner, 2026-10-30). Once
  transactions exist, `DELETE /api/accounts/{id}` refuses an account that has any, and the edit form turns Delete off
  with the reason, as in the I-011 final prototype (screens "Later (F-018)"); an archived account with transactions
  keeps only Restore.
