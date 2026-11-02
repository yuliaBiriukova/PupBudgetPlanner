# 0022. Transactions: balances summed by the database, suggestions worked out in memory, no deleting a used account

- Status: Accepted
- Date: 2026-11-01

## Context

F-018 brings the first transactions: expenses and incomes on a person's accounts (transfers come with F-019). Balances
were the opening balance only (F-014, `BalanceSheet` with no movements). The approved form (variant 7) picks the last
account used for the type and the category last used with that account, and offers the most used categories. The owner
decided in I-011 that only an account without transactions can be deleted.

## Decision

- **One `transactions` table** (`Transaction`, Domain): type (`Expense` / `Income`, stored as text), date
  (`DateOnly`, never after Kyiv's today), account, category, a whole amount above zero (`Money.Whole`), an optional note
  of up to 200 characters, created and updated times. The account and the category keep their rows while a transaction
  uses them (no action on delete; deleting the person removes everything at once). F-019 adds `Transfer` and the second
  account and amount.
- **Balances are never stored.** The database counts and sums each account's transactions per type
  (`TransactionSum`); `BalanceSheet.MovementsOf` turns that into each account's movement (incomes less expenses), added
  to the opening balance as before. Saving or deleting answers with the balances before and after, so the
  notification can count from one to the other without a second request.
- **Suggestions are worked out in memory** (`TransactionSuggestions.From`, Application): from the person's latest 1 000
  added transactions, the last account per type and the last category per account and type are the last *added* (the
  habit; an old receipt typed in late counts), and the most used categories are counted over the last 90 days (all of
  the loaded ones when none are that new), at most 8, ties going to the one used last. The form fills the pills up with
  the other categories in the report's order.
- **An account with transactions** can't be deleted (409) and can't change its currency (409): its transactions are
  in that currency. The accounts API gives each account its `TransactionCount`; the form turns Delete off with the
  reason and the currency field off (I-011's "Later (F-018)" screens).
- **The Transactions page lists the latest 50** until F-020 brings the full list with filters and paging.

## Consequences

- Pure parts (`Transaction`, `BalanceSheet`, `TransactionSuggestions`) are unit tested without a database, as the
  rest of the domain (ADR 0005); the queries themselves are covered by the E2E tests until the integration tests.
- The Accounts page costs one more grouped query; a person has thousands of transactions a year at most.
- A transaction can stay on an archived account or category when it is changed, but can't be moved to one.
