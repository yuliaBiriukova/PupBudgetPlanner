# Pup Budget Planner

A personal and family budget tracker. Enter daily expenses, income and transfers between
your accounts (Monobank, PrivatBank, cash — in UAH, USD and EUR), and get monthly and yearly
reports automatically — for yourself and for your whole family.

> Status: **planning / Milestone 0 (Foundation)**. See [docs/PROGRESS.md](docs/PROGRESS.md).

## Tech stack

| Layer    | Technology |
|----------|------------|
| Backend  | ASP.NET Core (.NET 10), EF Core, PostgreSQL, ASP.NET Core Identity (+ Google sign-in) |
| Frontend | React + TypeScript (Vite), Mantine UI, TanStack Query, React Router, Storybook |
| Tests    | xUnit, NSubstitute, AwesomeAssertions · Vitest, React Testing Library, MSW · Playwright |
| Hosting  | Render (one Docker web service: SPA + API; Storybook as a static site), Neon (PostgreSQL) |
| CI/CD    | GitHub Actions (build + tests) → Render auto-deploys `main` when checks pass |

## Documentation

| Document | What it is |
|----------|-----------|
| [docs/PRODUCT.md](docs/PRODUCT.md) | What we build: features, domain, business rules, default categories |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How it is built: structure, hosting, auth, testing, CI/CD |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Milestones: MVP first, then expansion |
| [docs/BACKLOG.md](docs/BACKLOG.md) | All changes with statuses — the source of truth for "what's next" |
| [docs/changes/](docs/changes/) | One folder per feature / improvement / bugfix with its details and design prototypes |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Dated log of what was done |
| [docs/DESIGN_RULES.md](docs/DESIGN_RULES.md) | UI/UX rules, plus a section for our custom rules |
| [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) | Questions waiting for an answer |
| [docs/decisions/](docs/decisions/) | Architecture Decision Records (why we chose what we chose) |
| [CLAUDE.md](CLAUDE.md) | Working agreement for AI-assisted development |

## Getting started

### Backend

Requires the [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) (version pinned in
`backend/global.json`).

```bash
cd backend
dotnet build                                          # build everything (warnings are errors)
dotnet test                                           # run all unit tests
dotnet run --project src/PupBudgetPlanner.Api         # API on http://localhost:5297
```

The API needs a PostgreSQL connection string (locally the Neon `dev` branch; use the direct, not pooled,
connection). Set it once — it stays out of the repository:

```bash
cd backend
dotnet user-secrets set "ConnectionStrings:Database" "Host=<host>;Database=<db>;Username=<user>;Password=<password>;SSL Mode=Require" --project src/PupBudgetPlanner.Api
```

"Continue with Google" needs the Google OAuth client (how to create it: [F-012](docs/changes/features/F-012-google-sign-in/F-012-google-sign-in.md#google-oauth-client-owner)).
Without it the app works, and the Google button comes back with an error:

```bash
cd backend
dotnet user-secrets set "Authentication:Google:ClientId" "<client id>" --project src/PupBudgetPlanner.Api
dotnet user-secrets set "Authentication:Google:ClientSecret" "<client secret>" --project src/PupBudgetPlanner.Api
```

Migrations are applied when the API starts. `GET /api/health` returns 200 without touching the database.
In Development the OpenAPI document is at `http://localhost:5297/openapi/v1.json`.

Adding a migration (see [ADR 0009](docs/decisions/0009-database-conventions.md)):

```bash
cd backend
dotnet tool restore   # once: installs the dotnet-ef version that matches EF Core
dotnet ef migrations add <Name> -p src/PupBudgetPlanner.Infrastructure -s src/PupBudgetPlanner.Infrastructure -o Persistence/Migrations
```

### Frontend

Requires **Node 24 LTS** (version in `frontend/.nvmrc`; with nvm: `nvm use 24.21.0`).

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173, proxies /api to the API on http://localhost:5297
npm test               # unit tests (Vitest)
npm run lint           # ESLint
npm run format         # Prettier (format:check only checks)
npm run typecheck      # TypeScript
npm run build          # production build to dist/
npm run api:types      # regenerate src/shared/api/schema.ts from the running API's OpenAPI document
npm run storybook      # Storybook on http://localhost:6006
npm run build-storybook # static Storybook to storybook-static/
npx playwright install chromium # once: the browser for E2E tests
npm run e2e            # Playwright E2E tests (starts the API and the dev server, or reuses running ones)
npm run e2e:ui         # Playwright UI mode
npm run e2e:report     # open the last HTML report
npm run clean:playwright # remove playwright-report/ and test-results/
```

E2E tests run against the real API, so its connection string must be set first (see Backend above).

## CI

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs on every pull request and on pushes to
`develop` and `main`, in three parallel jobs:

- **Backend** — restore, build (Release), tests.
- **Frontend** — lint, formatting, type-check, unit tests, build, Storybook build.
- **E2E (Playwright)** — the built API against a PostgreSQL service container plus the built app (`vite preview`).
  When a test fails, the HTML report is attached to the run as the `playwright-report` artifact.

## Branches

`main` (production, the only deployed branch) ← `develop` ← `feature/F-xxx-…`, `improvement/I-xxx-…`,
`bugfix/B-xxx-…`. Details in [CLAUDE.md](CLAUDE.md#git-workflow).
