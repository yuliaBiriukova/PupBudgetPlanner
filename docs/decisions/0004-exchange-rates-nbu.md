# 0004. NBU rate on the transaction date for reports

- Status: Accepted
- Date: 2026-10-27

## Context

Accounts are in UAH, USD and EUR; reports need one currency. The spreadsheet used
`GOOGLEFINANCE("CURRENCY:USDUAH")`, which always returns **today's** rate — so past months changed
every time the rate moved.

## Decision

- Reports convert each transaction with the **official NBU rate on the transaction date**
  (NBU open API, has full history, free).
- Rates are fetched on demand and cached in our database.
- **Currency exchanges** (transfers between accounts in different currencies) store **both real amounts**,
  so the actual Monobank / PrivatBank rate is kept exactly. The NBU rate is only used to suggest the
  second amount.
- Monobank's public API was rejected for reports: current rates only, no history.

## Consequences

- Reports are stable and reproducible.
- Account balances at month end are converted with the NBU rate of the last day of that month.
