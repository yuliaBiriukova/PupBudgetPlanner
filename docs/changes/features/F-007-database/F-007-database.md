# F-007 · Database and health check

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Todo |
| Branch | `feature/F-007-database` |
| Design | not needed |

## Goal

PostgreSQL connected through EF Core, ready for the first real tables.

## Acceptance criteria

- [ ] Neon project with `main` (production) and `dev` (local development) branches
- [ ] `AppDbContext` with Npgsql; first migration; migrations applied on start-up
- [ ] ASP.NET Core Data Protection keys stored in the database
- [ ] `GET /api/health` returns 200 without touching the database
- [ ] Connection string from user-secrets locally, environment variable in production

## Tasks

- [ ] Owner creates a Neon account and project
- [ ] Add EF Core + Npgsql to Infrastructure
- [ ] Create `AppDbContext` and first migration
- [ ] Persist Data Protection keys with EF Core
- [ ] Add health endpoint
- [ ] Document local setup

## Tests

- Unit: Health endpoint test.
- E2E (Playwright): —

## Notes

- —
