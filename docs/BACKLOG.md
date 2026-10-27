# Backlog

Source of truth for all work. Statuses: `Todo` · `In progress` · `Review` · `Done` · `Blocked`.
IDs: `T-xxx` tasks, `B-xxx` bugs. Screens marked 🎨 need 3 design variants before implementation.

## M0 — Foundation

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T-001 | Planning docs (product, architecture, roadmap, backlog, design rules, ADRs, working agreement) | Done | |
| T-002 | Create private GitHub repo and push | In progress | Waiting for `gh auth login` |
| T-003 | Scaffold backend solution (Domain, Application, Infrastructure, Api + test projects), analyzers, `.editorconfig` | Todo | |
| T-004 | Scaffold frontend (Vite + React + TS, Mantine, Router, TanStack Query, i18n, ESLint/Prettier, Vitest) | Todo | |
| T-005 | Set up Storybook with Mantine theme, light/dark and mobile viewports | Todo | |
| T-006 | Set up Playwright with a first smoke test | Todo | |
| T-007 | **Spike:** deploy hello-world API (Docker) + SPA to Render with `/api/*` rewrite; verify cookie, cold start, memory | Todo | Fallback in ARCHITECTURE "Known risks" |
| T-008 | Neon project with `main` and `dev` branches; EF Core + first migration; `/api/health` | Todo | User creates Neon account |
| T-009 | GitHub Actions CI (backend, frontend, Storybook build, E2E) | Todo | |
| T-010 | `render.yaml` Blueprint; auto-deploy after checks pass; Storybook static site | Todo | User creates Render account |

## M1 — Authentication & app shell

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T-101 | 🎨 App shell & navigation (mobile + desktop) — 3 variants | Todo | |
| T-102 | 🎨 Sign in / sign up screens — 3 variants | Todo | |
| T-103 | Identity setup: register, login, logout, `me` endpoints, cookie, antiforgery | Todo | |
| T-104 | Google sign-in (external login, account linking) | Todo | User creates Google OAuth client |
| T-105 | Frontend auth: forms, protected routes, session handling, "waking up the server" indicator | Todo | |
| T-106 | Seed default categories for each new user | Todo | Q-001 |
| T-107 | E2E: sign up, sign in, sign out | Todo | |

## M2 — Accounts & categories

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T-201 | 🎨 Accounts screen (balances by account + total) — 3 variants | Todo | |
| T-202 | Accounts API: create, edit, archive; balances | Todo | |
| T-203 | Accounts UI | Todo | |
| T-204 | Categories API (read) + categories list in UI | Todo | Editing is post-MVP |
| T-205 | Settings: display name, report currency | Todo | |
| T-206 | E2E: create accounts, see balances | Todo | |

## M3 — Transactions

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T-301 | 🎨 Quick add transaction (expense / income / transfer) — 3 variants | Todo | Mobile-first, must be fast |
| T-302 | 🎨 Transactions list with filters — 3 variants | Todo | |
| T-303 | NBU exchange rate client + on-demand cache | Todo | |
| T-304 | Transactions API: create, edit, delete, list with filters | Todo | |
| T-305 | Transfers and currency exchange (two amounts, effective rate, NBU suggestion) | Todo | |
| T-306 | Transactions UI: quick add, list, edit, delete | Todo | |
| T-307 | E2E: add expense, income, transfer, exchange; balances update | Todo | |

## M4 — Reports

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T-401 | 🎨 Monthly / yearly report — 3 variants | Todo | Spreadsheet-like table, must work on mobile |
| T-402 | `ReportBuilder` (pure logic) with thorough unit tests | Todo | Q-004 |
| T-403 | Reports API (month, year, report currency) | Todo | |
| T-404 | Reports UI | Todo | |
| T-405 | E2E: report matches entered transactions | Todo | |

## M5 — Family

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T-501 | 🎨 Family screen (members, invite) — 3 variants | Todo | |
| T-502 | Family API: create, invite link, accept, leave, remove member | Todo | |
| T-503 | Data access rules: members can read each other's data | Todo | |
| T-504 | "Me / member / Family" switcher in transactions, accounts and reports | Todo | |
| T-505 | Combined family report (merge categories by group + name) | Todo | |
| T-506 | E2E: invite, accept, see family report | Todo | |

## M6 — MVP release

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T-601 | PWA: manifest, icons, service worker, install prompt | Todo | |
| T-602 | Responsive polish, accessibility pass, empty / error states | Todo | |
| T-603 | Production launch checklist (secrets, backups, Neon limits, budget) | Todo | |
| T-604 | Short user guide in README | Todo | |

## After MVP

See [ROADMAP.md](ROADMAP.md) milestones M7–M13. Tasks will be broken down when we start them.

## Bugs

| ID | Bug | Status | Notes |
|----|-----|--------|-------|
| — | | | |
