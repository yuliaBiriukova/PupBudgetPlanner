# 0009. Database conventions: snake_case names, migrations in Infrastructure

- Status: Accepted
- Date: 2026-10-27

## Context

F-007 connects the API to PostgreSQL through EF Core. A few choices affect every future table and are
painful to change once there is data:

- EF Core names tables and columns after C# types (`DataProtectionKeys`, `FriendlyName`). In PostgreSQL such
  names must always be quoted in SQL (`"FriendlyName"`), which is awkward when querying Neon by hand.
- `dotnet ef` needs a way to build `AppDbContext` without the API's secrets.
- Npgsql's EF Core provider depends on an older EF Core patch than the EF Core tools, which gives version
  conflicts between projects.

## Decision

- **snake_case** tables, columns, keys and indexes (`data_protection_keys.friendly_name`) with
  `EFCore.NamingConventions` (`UseSnakeCaseNamingConvention()`). C# code keeps PascalCase. (EF Core's own
  `__EFMigrationsHistory` table keeps its name.)
- `AppDbContext` and migrations live in Infrastructure (`Persistence/`, `Persistence/Migrations/`). A
  design-time factory gives `dotnet ef` a context with a dummy local connection string, so adding a
  migration never needs the database or the API's configuration.
- `dotnet-ef` is a **local tool** (`backend/.config/dotnet-tools.json`), so everyone uses the version that
  matches the EF Core packages.
- Migrations are applied on API start-up (single instance, see ARCHITECTURE.md). A unit test fails when the
  model has changes without a migration.
- Central package management uses **transitive pinning**, so the EF Core versions in
  `Directory.Packages.props` win over the ones other packages bring in. MSBuild warnings are errors too, so
  such conflicts fail the build.

## Consequences

- Raw SQL and Neon's SQL editor use plain lower-case names.
- New migration: `dotnet tool restore` once, then
  `dotnet ef migrations add <Name> -p src/PupBudgetPlanner.Infrastructure -s src/PupBudgetPlanner.Infrastructure -o Persistence/Migrations`.
- Migration files are marked as generated code in `.editorconfig`, so style rules don't apply to them.
