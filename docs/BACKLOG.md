# Backlog

Index of all changes. The details of each change live in its folder in [changes/](changes/).

- Statuses: `Todo` · `In progress` · `Review` · `Done` · `Blocked` · `Dropped` (the owner decided not to build it;
  the row and the folder stay, the ID isn't reused).
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
| [F-011](changes/features/F-011-email-password-auth/F-011-email-password-auth.md) | 🎨 Sign up and sign in with email and password | Done |
| [F-012](changes/features/F-012-google-sign-in/F-012-google-sign-in.md) | Sign in with Google | Done |
| [F-013](changes/features/F-013-default-categories/F-013-default-categories.md) | Default categories | Done |
| [F-028](changes/features/F-028-invite-only-access/F-028-invite-only-access.md) | 🎨 Invite-only access (priority High, added 2026-10-29) | Done |

### M2 — Accounts & categories

| ID | Feature | Status |
|----|---------|--------|
| [F-014](changes/features/F-014-accounts/F-014-accounts.md) | 🎨 Accounts and balances | Done |
| [F-015](changes/features/F-015-categories-view/F-015-categories-view.md) | 🎨 Categories view | Done |
| [F-016](changes/features/F-016-user-settings/F-016-user-settings.md) | 🎨 User settings | Done |

### M3 — Transactions

| ID | Feature | Status |
|----|---------|--------|
| [F-017](changes/features/F-017-exchange-rates/F-017-exchange-rates.md) | NBU exchange rates | Done |
| [F-018](changes/features/F-018-quick-add-income-expense/F-018-quick-add-income-expense.md) | 🎨 Quick add: expense and income | Done |
| [F-019](changes/features/F-019-transfers-and-exchange/F-019-transfers-and-exchange.md) | 🎨 Transfers and currency exchange | Done |
| [F-020](changes/features/F-020-transactions-list/F-020-transactions-list.md) | 🎨 Transactions list | In progress |

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

Milestones M7–M13 in [ROADMAP.md](ROADMAP.md). Their features get IDs and folders when we plan them, or when the
owner asks for one.

### M9 — Privacy & categories

| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| [F-027](changes/features/F-027-delete-account/F-027-delete-account.md) | 🎨 Delete my account | Low | Todo |

## Improvements

| ID | Improvement | Priority | Status |
|----|-------------|----------|--------|
| [I-001](changes/improvements/I-001-working-agreement-rules/I-001-working-agreement-rules.md) | Working agreement: PR hand-off, Playwright checks, change docs first, design references | High | Done |
| [I-003](changes/improvements/I-003-owner-approval-before-implementation/I-003-owner-approval-before-implementation.md) | Owner approval before implementation (backend or frontend) | High | Done |
| [I-004](changes/improvements/I-004-custom-scroll-bars/I-004-custom-scroll-bars.md) | 🎨 Custom scroll bars; a dialog scrolls inside itself | Medium | Done |
| [I-005](changes/improvements/I-005-people-pagination/I-005-people-pagination.md) | 🎨 Pages on the People list; "Select all" picks the current page | Medium | Todo |
| [I-006](changes/improvements/I-006-delete-old-invite-links/I-006-delete-old-invite-links.md) | 🎨 Delete used, expired and cancelled invite links (one or many); morning cron job deletes them after 30 days | Medium | Todo |
| [I-007](changes/improvements/I-007-remove-test-data-after-tests/I-007-remove-test-data-after-tests.md) | Remove test accounts and data after tests; E2E tests clean up after themselves | High | Done |
| [I-008](changes/improvements/I-008-instant-click-feedback/I-008-instant-click-feedback.md) | Instant response to clicks on check boxes and dialog buttons (closed: fine on production) | High | Done |
| [I-009](changes/improvements/I-009-planning-only-branches/I-009-planning-only-branches.md) | Planning-only branches (`plan/…`) for lists the owner only wants in the backlog | High | Done |
| [I-010](changes/improvements/I-010-storybook-tests-in-ci/I-010-storybook-tests-in-ci.md) | Run every Storybook story in CI (play function and axe scan); a failing story fails the build | High | Dropped |
| [I-011](changes/improvements/I-011-delete-account-permanently/I-011-delete-account-permanently.md) | 🎨 Delete an account (card, cash) permanently, not only archive it | Medium | Done |
| [I-012](changes/improvements/I-012-dialog-title-spacing/I-012-dialog-title-spacing.md) | Less space between a pop-up's title and its content (all pop-ups) | Medium | Done |
| [I-013](changes/improvements/I-013-banks-from-nbu/I-013-banks-from-nbu.md) | Suggest banks from the NBU's list instead of a list in the app (after F-017) | Low | Todo |
| [I-014](changes/improvements/I-014-faster-local-tests/I-014-faster-local-tests.md) | Faster, steadier tests on the owner's laptop: no timeouts in unit and cold-start E2E runs | High | Done |
| [I-015](changes/improvements/I-015-sheet-swipe-and-back/I-015-sheet-swipe-and-back.md) | Phone pop-ups close with a swipe down and with Back | Medium | Done |
| [I-016](changes/improvements/I-016-category-month-totals/I-016-category-month-totals.md) | 🎨 This month's total next to each category when adding a transaction (after F-018) | Low | Todo |
| [I-017](changes/improvements/I-017-note-suggestions/I-017-note-suggestions.md) | 🎨 Suggest notes already used while typing a note (after F-018) | Medium | Todo |
| [I-018](changes/improvements/I-018-neon-skills-in-repo/I-018-neon-skills-in-repo.md) | Neon's Claude skills in the repo; `.claude/launch.json` ignored | Low | Done |

## Bugfixes

| ID | Bug | Priority | Status |
|----|-----|----------|--------|
| [B-001](changes/bugfixes/B-001-flaky-server-wake-test/B-001-flaky-server-wake-test.md) | Flaky "server answers quickly" unit test | High | Done |
| [B-002](changes/bugfixes/B-002-stale-tab-icon/B-002-stale-tab-icon.md) | Tab icon still shows the Vite template icon | Medium | Done |
| [B-003](changes/bugfixes/B-003-account-cards-too-big/B-003-account-cards-too-big.md) | Account cards bigger than in the prototype on the desktop | Medium | Done |
