# F-014 · Accounts and balances

| | |
|---|---|
| Type | Feature |
| Milestone | M2 — Accounts & categories |
| Status | Todo |
| Branch | `feature/F-014-accounts` |
| Design | 3 HTML prototypes required |

## Goal

See where the money is: every bank account and cash, in its own currency.

## Acceptance criteria

- [ ] Create, edit and archive accounts: name, institution (Monobank, PrivatBank, Cash, Other), currency (UAH, USD, EUR), opening balance, opening date
- [ ] List shows each account's current balance and the total in the report currency
- [ ] Archived accounts are hidden from selection but keep their history

## Tasks

- [ ] 3 HTML prototypes
- [ ] Domain + API
- [ ] Balance calculation
- [ ] UI
- [ ] Storybook stories

## Design

Prototypes: `prototypes/` (not created yet). Chosen variant: —

## Tests

- Unit: Balance calculation, validators.
- E2E (Playwright): Create accounts and see balances and total.

## Notes

- —
