# Backlog

Index of all changes. The details of each change live in its folder in [changes/](changes/).

- Statuses: `Todo` · `In progress` · `Review` · `Done` · `Blocked`.
- IDs: `F-xxx` feature (incl. setup work), `I-xxx` improvement, `B-xxx` bugfix.
- 🎨 = screen work: 3 HTML design prototypes before implementation.
- Priority (improvements, bugfixes and features added after planning): `High` · `Medium` · `Low` — see
  [changes/README.md](changes/README.md#priority). Higher priority goes first.

## Features — MVP

### M0 — Foundation

| ID | Feature | Status |
|----|---------|--------|
| [F-001](changes/features/F-001-planning-docs/F-001-planning-docs.md) | Planning documents | Done |
| [F-002](changes/features/F-002-github-repository/F-002-github-repository.md) | GitHub repository | Done |
| [F-003](changes/features/F-003-backend-scaffold/F-003-backend-scaffold.md) | Backend scaffold | Done |
| [F-004](changes/features/F-004-frontend-scaffold/F-004-frontend-scaffold.md) | Frontend scaffold | Done |
| [F-005](changes/features/F-005-storybook/F-005-storybook.md) | Storybook | Done |
| [F-006](changes/features/F-006-playwright/F-006-playwright.md) | Playwright setup | Done |
| [F-007](changes/features/F-007-database/F-007-database.md) | Database and health check | Done |
| [F-008](changes/features/F-008-ci-pipeline/F-008-ci-pipeline.md) | CI pipeline | Done |
| [F-009](changes/features/F-009-render-deployment/F-009-render-deployment.md) | Deployment to Render | Done |

### M1 — Authentication & app shell

| ID | Feature | Status |
|----|---------|--------|
| [F-010](changes/features/F-010-app-shell/F-010-app-shell.md) | 🎨 App shell and navigation | Done |
| [F-011](changes/features/F-011-email-password-auth/F-011-email-password-auth.md) | 🎨 Sign up and sign in with email and password | Todo |
| [F-012](changes/features/F-012-google-sign-in/F-012-google-sign-in.md) | Sign in with Google | Todo |
| [F-013](changes/features/F-013-default-categories/F-013-default-categories.md) | Default categories | Todo |

### M2 — Accounts & categories

| ID | Feature | Status |
|----|---------|--------|
| [F-014](changes/features/F-014-accounts/F-014-accounts.md) | 🎨 Accounts and balances | Todo |
| [F-015](changes/features/F-015-categories-view/F-015-categories-view.md) | 🎨 Categories view | Todo |
| [F-016](changes/features/F-016-user-settings/F-016-user-settings.md) | 🎨 User settings | Todo |

### M3 — Transactions

| ID | Feature | Status |
|----|---------|--------|
| [F-017](changes/features/F-017-exchange-rates/F-017-exchange-rates.md) | NBU exchange rates | Todo |
| [F-018](changes/features/F-018-quick-add-income-expense/F-018-quick-add-income-expense.md) | 🎨 Quick add: expense and income | Todo |
| [F-019](changes/features/F-019-transfers-and-exchange/F-019-transfers-and-exchange.md) | 🎨 Transfers and currency exchange | Todo |
| [F-020](changes/features/F-020-transactions-list/F-020-transactions-list.md) | 🎨 Transactions list | Todo |

### M4 — Reports

| ID | Feature | Status |
|----|---------|--------|
| [F-021](changes/features/F-021-report-engine/F-021-report-engine.md) | Report engine | Todo |
| [F-022](changes/features/F-022-reports-ui/F-022-reports-ui.md) | 🎨 Reports screen | Todo |

### M5 — Family

| ID | Feature | Status |
|----|---------|--------|
| [F-023](changes/features/F-023-family-and-invitations/F-023-family-and-invitations.md) | 🎨 Family and invitations | Todo |
| [F-024](changes/features/F-024-family-views/F-024-family-views.md) | Family views | Todo |

### M6 — MVP release

| ID | Feature | Status |
|----|---------|--------|
| [F-025](changes/features/F-025-pwa/F-025-pwa.md) | Installable app (PWA) | Todo |
| [F-026](changes/features/F-026-mvp-launch/F-026-mvp-launch.md) | MVP launch | Todo |

## After MVP

Milestones M7–M13 in [ROADMAP.md](ROADMAP.md). Their features get IDs and folders when we plan them.

## Improvements

| ID | Improvement | Priority | Status |
|----|-------------|----------|--------|
| [I-001](changes/improvements/I-001-working-agreement-rules/I-001-working-agreement-rules.md) | Working agreement: PR hand-off, Playwright checks, change docs first, design references | High | Done |

## Bugfixes

| ID | Bug | Priority | Status |
|----|-----|----------|--------|
| [B-001](changes/bugfixes/B-001-flaky-server-wake-test/B-001-flaky-server-wake-test.md) | Flaky "server answers quickly" unit test | High | Done |
| [B-002](changes/bugfixes/B-002-stale-tab-icon/B-002-stale-tab-icon.md) | Tab icon still shows the Vite template icon | Review |
