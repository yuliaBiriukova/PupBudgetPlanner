# F-007 · Database and health check

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Review |
| Branch | `feature/F-007-database` |
| Design | not needed |

## Goal

PostgreSQL connected through EF Core, ready for the first real tables.

## Acceptance criteria

- [x] Neon project with `main` (production) and `dev` (local development) branches
- [x] `AppDbContext` with Npgsql; first migration; migrations applied on start-up
- [x] ASP.NET Core Data Protection keys stored in the database
- [x] `GET /api/health` returns 200 without touching the database
- [x] Connection string from user-secrets locally, environment variable in production

## Tasks

- [x] Owner creates a Neon account and project
- [x] Add EF Core + Npgsql to Infrastructure
- [x] Create `AppDbContext` and first migration
- [x] Persist Data Protection keys with EF Core
- [x] Add health endpoint
- [x] Document local setup

## Tests

- Unit: `HealthControllerTests` — `GET /api/health` returns 200 with `{ "status": "Healthy" }`; the controller has
  no dependencies, so it cannot touch the database. `AppDbContextTests` — the migrations match the model
  (no pending model changes) and names are snake_case. Neither test opens a database connection.
- E2E (Playwright): — (the API joins the E2E run in F-008).
- Manual, against the Neon `dev` branch: the first start applied `InitialCreate`, created `data_protection_keys`
  and stored a key; the second start applied nothing and reused that key; `GET /api/health` returned
  `200 {"status":"Healthy"}` without any database query.

## Notes

- EF Core 10.0.14, Npgsql EF Core provider 10.0.3, `EFCore.NamingConventions` (snake_case) — see
  [ADR 0009](../../../decisions/0009-database-conventions.md).
- `AppDbContext` (Infrastructure `Persistence/`) implements `IDataProtectionKeyContext`; the first migration
  `InitialCreate` creates `data_protection_keys`. Data Protection uses the application name `PupBudgetPlanner`.
- `AddInfrastructure(configuration)` registers the context and Data Protection; `MigrateDatabaseAsync` runs
  before the API starts serving requests.
- Connection string name: `ConnectionStrings:Database`. Locally `dotnet user-secrets` (Api project,
  `UserSecretsId` `pup-budget-planner-api`); on Render the `ConnectionStrings__Database` environment variable
  (F-009). Without it the API stops at start-up with a message that says how to set it.
- `/api/health` is a plain controller with `[AllowAnonymous]`, ready for when authentication arrives (F-011).
- `dotnet-ef` is a local tool (`backend/.config/dotnet-tools.json`); a design-time factory lets
  `dotnet ef migrations add` work without the database.
- Neon connection string: take the **direct** (not pooled) one — there is one API instance, and migrations run
  over the same connection. Npgsql format:
  `Host=<host>;Database=<db>;Username=<user>;Password=<password>;SSL Mode=Require`.
- Neon project `PupBudgetPlanner` with branches `main` (production) and `dev` (local development). Render should
  use the same region as Neon (Frankfurt was recommended) — F-009.
- Controllers produce `application/json` only (global `[Produces]` filter), so the OpenAPI document and the
  generated frontend types (`frontend/src/shared/api/schema.ts`, regenerated here) list one content type.
- Data Protection keys are stored **unencrypted** in the database (ASP.NET Core logs a warning about it). Anyone
  who can read the database could forge sign-in cookies, but they could already read all the data. Encrypting
  the keys with a certificate can be added later if needed.
- On the very first start EF Core logs a failed `SELECT … FROM "__EFMigrationsHistory"` before creating that
  table; this is expected. The "No instantiatable types implementing `IEntityTypeConfiguration`" warning goes away
  with the first entity configuration (F-011).
