# F-019 · Transfers and currency exchange

| | |
|---|---|
| Type | Feature |
| Milestone | M3 — Transactions |
| Status | Todo |
| Branch | `feature/F-019-transfers-and-exchange` |
| Design | 3 HTML prototypes required |

## Goal

Move money between own accounts, including buying and selling currency.

## Acceptance criteria

- [ ] Transfer between two own accounts in the same currency
- [ ] Between different currencies, both amounts are entered; the effective rate is shown
- [ ] The second amount is suggested from the NBU rate and can be changed
- [ ] Transfers do not count as income or expense in reports

## Tasks

- [ ] Design comes from F-018 prototypes
- [ ] Domain + API
- [ ] UI
- [ ] Storybook stories

## Design

Prototypes: shared with F-018 — see `../F-018-quick-add-income-expense/prototypes/`. Chosen variant: —

## Tests

- Unit: Transfer validation and balance effects.
- E2E (Playwright): Exchange 100 USD to UAH; both balances change.

## Notes

- —
