# B-004 · Deleting an account deletes its transactions

| | |
|---|---|
| Type | Bugfix |
| Priority | High (wrong money data: past transactions vanish, and the reports built on them are wrong) |
| Status | Dropped (not a bug: the owner couldn't reproduce it, 2026-11-04) |
| Branch | `bugfix/B-004-deleted-account-keeps-transactions` (docs only) |
| Found in | 2026-11-04, reported by the owner |
| Approved | — (nothing to build) |

## Steps to reproduce

1. Have an account with transactions.
2. Delete the account.
3. Look at the transactions list (and, later, the reports) for the period of those transactions.

## Expected

The account is gone for the person (lists, totals, pickers), but its transactions stay, so the transactions list and
the reports for past periods don't change.

## Actual

The owner saw the account's transactions vanish together with it (2026-11-04), but couldn't make it happen again.

## Root cause

None found. The code on `develop` and `main` (2026-11-04) doesn't delete transactions with an account; it refuses to
delete an account that has any (the I-011 rule, built with F-018):

- **Database:** `transactions.account_id` and `to_account_id` point to `accounts` with no action on delete
  (`TransactionConfiguration.cs`, migrations `AddTransactions`, `AddTransfers`), so the database refuses to remove an
  account a transaction still uses. Only deleting the *person* removes their transactions (cascade from `users`).
- **API:** `AccountService.DeleteAsync` answers 409 when the account is used as a transaction's account or a
  transfer's To (`TransactionQueries.IsUsedAsync`).
- **Form:** Delete is off with "It has N transactions, so it can only be archived"; an archived account with
  transactions shows only Restore (`AccountDialog.tsx`, `AccountsPage.tsx`).
- The transactions list doesn't hide the transactions of an archived account either.

## Fix

None. The owner tried again, couldn't reproduce it and closed it as not a bug (2026-11-04). If it comes back, note
where (production or local), which account and when, and reopen it as a new bugfix.

## Tests

None: nothing changed in the code.
