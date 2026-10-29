# 0015. Default categories: created with the account, backfilled by the migration

- Status: Accepted
- Date: 2026-10-28

## Context

F-013 gives every person their own copy of the default groups and categories (PRODUCT.md). Accounts are created
in two places, email sign-up and the first Google sign-in, both through Identity's `UserManager`. Accounts that
already existed (the family's, and test accounts in the `dev` database) need the set too. The default set will
change later (Q-011), and nobody should end up with an account but no categories.

## Decision

- The set is defined once in code: `DefaultCategories` in the Domain layer, in the spreadsheet's order
  (`SortOrder` from 1).
- **Seeding with the account:** `AccountCreator` (Infrastructure) opens a database transaction, creates the user
  through `UserManager` (the user store saves through the same scoped `AppDbContext`, so it joins the
  transaction), adds the copy and commits. Both sign-up paths use it. A failure rolls back both.
- **Backfill:** the `AddCategories` migration that creates the tables also inserts the set for every existing
  user, in SQL. That SQL is a **frozen copy** of the set as of F-013, not generated from `DefaultCategories`:
  a migration must do the same thing whenever it runs, and later changes to the defaults apply to new accounts
  only.
- Names are unique per person (groups) and per group (categories): "Gifts" and "Other" exist in two groups.
  Deleting an account deletes its categories (cascade).

## Consequences

- Changing the default set later is a code change in `DefaultCategories` plus its test. Existing people keep
  their categories; giving them new ones is a separate data migration.
- The backfill uses `gen_random_uuid()` (random UUIDs); categories created by the app use UUID v7. Both are
  plain `uuid` values.
- The transaction makes sign-up a few rows heavier (7 groups, 33 categories) in one round of inserts.
- No unit test can run the transaction or the migration SQL (no database in unit tests, ADR 0005); the
  migration runs against PostgreSQL in CI's E2E and container jobs, and F-013 was checked against the `dev`
  database.
