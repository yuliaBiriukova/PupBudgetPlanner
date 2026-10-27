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

Instructions will be added when the projects are scaffolded (F-003, F-004).

## Branches

`main` (production, the only deployed branch) ← `develop` ← `feature/F-xxx-…`, `improvement/I-xxx-…`,
`bugfix/B-xxx-…`. Details in [CLAUDE.md](CLAUDE.md#git-workflow).
