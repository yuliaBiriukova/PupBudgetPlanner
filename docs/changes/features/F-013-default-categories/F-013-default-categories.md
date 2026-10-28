# F-013 · Default categories

| | |
|---|---|
| Type | Feature |
| Milestone | M1 — Authentication & app shell |
| Status | Done |
| Branch | `feature/F-013-default-categories` |
| Design | not needed |

## Goal

Every new person starts with the familiar categories from the spreadsheet.

## Acceptance criteria

- [x] Each new user (email or Google) gets their own copy of the default groups and categories from PRODUCT.md
- [x] "Emergency" is under Health
- [x] Order of groups and categories matches the spreadsheet

## Tasks

- [x] Define default categories in code (`Domain/Categories/DefaultCategories.cs`)
- [x] Seed on user creation (`AccountCreator`: the account and its categories in one transaction, both sign-up
      paths)
- [x] Accounts created before F-013 get the set too (frozen SQL in the `AddCategories` migration)
- [x] Tests

## Tests

- Unit:
  - `DefaultCategoriesTests`: the exact set, order and kinds; Emergency under Health; sort orders; ownership;
    fresh ids; name lengths and uniqueness.
  - `AppDbContextTests`: tables, the kind stored as text, cascade from the account, unique names.
  - The auth tests create accounts through `IAccountCreator`.
- Checked against the Neon `dev` database:
  - the migration backfilled every existing account;
  - a new sign-up through the API got the set;
  - every account has 7 groups and 33 categories, all identical.
- E2E (Playwright): the existing suite passes against this build. Seeing the categories is covered by F-015.

## Notes

- Owner's decision (2026-10-28): several defaults are the owner's own (Bank commission, English / Piano lessons,
  Driving, Spotify, Emergency). They stay the default while only the family uses the app; a generic set for
  other people is planned with adding own categories after the MVP (Q-011).
- Decisions: [ADR 0015](../../../decisions/0015-default-categories-seeding.md).
