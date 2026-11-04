# 0023. Transfers: one row with both accounts; the form's rate from the API, the amounts from the person

- Status: Accepted
- Date: 2026-11-02

## Context

F-019 moves money between a person's own accounts, and between two currencies buys or sells currency (an exchange).
The data model (ARCHITECTURE.md) already planned `Transfer` with `ToAccountId` and `ToAmount` on the transaction. The
approved final prototype suggests an exchange's second amount at the NBU rate of the transaction's day, and lets the
person change it to what the bank gave. Reports (F-021) must leave transfers out (business rule 2).

## Decision

- **One row per transfer**, not two linked rows (an expense and an income): the `transactions` row of type `Transfer`
  has the From account (`AccountId`, `Amount`) and the To account (`ToAccountId`, `ToAmount`) and no category. It is
  saved, changed and deleted as one, so the two sides can never part, and reports leave it out by its type.
  `CategoryId` became nullable; a check constraint (`ck_transactions_transfer_shape`) keeps a transfer with both To
  columns and no category, an expense or an income with a category and no To, and To ≠ From.
- **What To got is stored, not worked out.** Between accounts in one currency the API sets `ToAmount` to the amount
  itself; between currencies the request must carry it (the bank's figure, or the NBU suggestion the form showed),
  else 400 on `toAmount`. The rate is never stored: it is `ToAmount / Amount`.
- **Balances:** the database sums transfers on both sides: as the From account's (`TransactionSum`, minus the amount)
  and as the To account's incoming (`Incoming`, plus what it got). An account a transfer uses on either side counts as
  used: it can't be deleted or change its currency. Saving or deleting answers with both accounts' balances (four when
  a change moves it to other accounts).
- **The form's rate from the API:** `GET /api/rates?date=…` gives a day's NBU rates (or the latest earlier ones,
  marked, as F-017's `ExchangeRateService` does), never for a day after Kyiv's today. The form suggests
  `round(amount × rate)` and shows the rate as the app writes rates (one unit of the currency worth more).
- **Suggestions:** the last transfer's From and To (`LastTransfer`); transfers take no part in the category picks.

## Consequences

- Lists and reports read one row per transfer; F-021 only has to skip the `Transfer` type.
- A change can turn an expense into a transfer and back (the domain sets or clears the To side and the category).
- The rates endpoint can ask the NBU for a day not kept yet; it is cached like F-017's rates.
- The service queries are covered by the E2E test (exchange $100 for hryvnias, then delete) until the integration
  tests (ADR 0005).
