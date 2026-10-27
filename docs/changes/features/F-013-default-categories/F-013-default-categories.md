# F-013 · Default categories

| | |
|---|---|
| Type | Feature |
| Milestone | M1 — Authentication & app shell |
| Status | Todo |
| Branch | `feature/F-013-default-categories` |
| Design | not needed |

## Goal

Every new person starts with the familiar categories from the spreadsheet.

## Acceptance criteria

- [ ] Each new user (email or Google) gets their own copy of the default groups and categories from PRODUCT.md
- [ ] "Emergency" is under Health
- [ ] Order of groups and categories matches the spreadsheet

## Tasks

- [ ] Define default categories in code
- [ ] Seed on user creation
- [ ] Tests

## Tests

- Unit: Seeding creates the exact expected set.
- E2E (Playwright): Covered by F-015.

## Notes

- —
