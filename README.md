# Pup Budget Planner

A personal and family budget tracker. Enter daily expenses, income and transfers between
your accounts (Monobank, PrivatBank, cash — in UAH, USD and EUR), and get monthly and yearly
reports automatically — for yourself and for your whole family.

> Status: **MVP** (Milestone 6): in use by the family at https://pup-budget-planner.onrender.com. What comes next is in
> [docs/ROADMAP.md](docs/ROADMAP.md), what was done in [docs/PROGRESS.md](docs/PROGRESS.md).

## Using Pup Budget

A short guide for the family. Pup Budget works on a phone and on a computer; everything you add is the same on both.

### Getting in

Pup Budget is invite-only. You need an invite link from someone already in it: they make one on the **Family** page
(*Invite someone*), and it works once, for 7 days. Open it, and create your account with your name, email and a
password, or with **Continue with Google**. Next time, sign in on the same page.

### Install it

Once on the home screen it opens like an app, at once, even while the free server is asleep at night.

- **Android (Chrome)** and **a computer (Chrome or Edge):** open the app and tap *Install* on the card at the top
  of the page (later: More › *Install the app*; on the computer: *Install the app* at the bottom of the sidebar).
- **iPhone or iPad (Safari):** tap ••• in Safari's bar, then *Share*, then *Add to Home Screen*, then *Add*. The
  app shows these steps too.

### First steps

Open **Accounts** and add each bank card, savings account and pocket of cash, in its own currency (*Add account*).
Its **opening balance** is what is on it today (below zero for a credit card debt). That is your starting point
instead of the spreadsheet: from here on, the balances follow what you add.

### Every day

The **+** is always at hand (*Add transaction* in the sidebar on a computer):

- **Expense** and **Income**: the amount, the account and the category; a note if you like. A note used before is
  suggested as you type.
- **Transfer**: from one account to another. Between two currencies it is an **exchange**: the app offers the NBU
  rate, and you can type what the bank really gave you.
- On the phone the amount has its own keys, and they work as a calculator: type `120+45.50` for a receipt.

A tap on a transaction opens it to change or delete it.

### Looking back

- **Transactions**: the month's spent and received at the top (‹ › or a swipe for another month, a tap on the
  month for other periods), a calendar with each day as red as it cost, where the money went by category, and every
  day as a receipt. A day or a category tapped shows only its transactions.
- **Reports**: the year by category and month, or one month in detail, in your **report currency** (set in
  **Settings**; other currencies are converted at the NBU rate).

### Family

On the **Family** page you start a family and invite the others. Everyone keeps their own accounts and transactions;
**Whose money** (in the sidebar, or the pill at the top on the phone) shows yours, one person's or the whole
family's together. Someone else's money is only to look at.

What the others see of yours is up to you, under **What the family sees** on the Family page:

- **Your transactions**: every transaction, or only the totals by category;
- **Your accounts**: each one *Everything*, *Balance only* or *Hidden*;
- **Private categories**: categories (or whole groups) whose transactions only you see.

### Good to know

- At night the free server sleeps: the first page can take up to a minute ("Waking up the server…"). After that it is
  quick.
- After a release the app says "A new version is ready." Tap *Reload* to use it.
- Without a connection you can look at what is already open, but not save.
- Your name, report currency and the light or dark look are in **Settings**.

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

Sign-up is invite-only (F-028, [ADR 0016](docs/decisions/0016-invite-only-sign-up.md)). The admin, who sees the
People page and makes invite links, is named by email; the E2E tests add their own admin as the second entry:

```bash
cd backend
dotnet user-secrets set "Access:AdminEmails:0" "<your email>" --project src/PupBudgetPlanner.Api
dotnet user-secrets set "Access:AdminEmails:1" "e2e-admin@example.com" --project src/PupBudgetPlanner.Api
```

Locally (Development) an admin email can also create its account with a password and no link. To open sign-up to
everyone, set `Access:SignUp` to `Open`.

The privacy policy (`/privacy`, F-031) gives a contact address from the frontend build setting `VITE_CONTACT_EMAIL`:
on Render an environment variable of the service (a change needs a new deploy), locally a line
`VITE_CONTACT_EMAIL=<address>` in `frontend/.env.local`. Without it the page names "the person who runs Pup Budget"
([ADR 0035](docs/decisions/0035-privacy-policy-page.md)).

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

The installable app's service worker exists only in the production build, so `e2e/pwa.spec.ts` is skipped against
the dev server. To run it locally: `npm run build`, then `npm run preview` (port 4173) with the API running, and
`E2E_BASE_URL=http://localhost:4173 npx playwright test e2e/pwa.spec.ts`. App icons are drawn from the logo by
`node scripts/make-app-icons.mjs` (only when the logo changes).

After a release, check production with the smoke tests only. They start signed out and create nothing; `--no-deps`
skips the `setup` project, which would make a test account there (B-028):

```bash
cd frontend
E2E_BASE_URL=https://pup-budget-planner.onrender.com npx playwright test e2e/smoke.spec.ts --no-deps
```

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
