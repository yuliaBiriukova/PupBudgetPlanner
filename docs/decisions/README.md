# Architecture Decision Records

Short documents that explain **why** we made a significant decision. Never edit an accepted ADR's
decision — write a new ADR that supersedes it.

| # | Decision | Status |
|---|----------|--------|
| [0001](0001-tech-stack.md) | Tech stack: ASP.NET Core + React/TypeScript + Mantine + PostgreSQL | Accepted |
| [0002](0002-hosting-render-neon.md) | Hosting on Render (static site + API) with Neon PostgreSQL | Accepted |
| [0003](0003-auth-identity-google.md) | ASP.NET Core Identity with cookies and Google sign-in | Accepted |
| [0004](0004-exchange-rates-nbu.md) | NBU rate on the transaction date for reports | Accepted |
| [0005](0005-testing-strategy.md) | Testing strategy (integration tests after MVP) | Accepted |
| [0006](0006-libraries-licensing.md) | Avoid libraries with commercial licenses | Accepted |
| [0007](0007-test-runner-mtp.md) | Run backend tests on Microsoft.Testing.Platform | Accepted |
| [0008](0008-frontend-toolchain.md) | Frontend toolchain: Node 24 LTS and TypeScript 5.9 | Accepted |
| [0009](0009-database-conventions.md) | Database conventions: snake_case names, migrations in Infrastructure | Accepted |
| [0010](0010-docker-image.md) | Docker image and production hosting settings | Accepted |
| [0011](0011-self-hosted-fonts.md) | Self-hosted fonts with Fontsource | Accepted |
| [0012](0012-account-enumeration.md) | Not revealing which emails have an account | Accepted |
| [0013](0013-auth-api.md) | Auth API: endpoints, antiforgery, password rules and limits | Accepted |
| [0014](0014-google-sign-in.md) | Google sign-in: endpoints and linking to existing accounts | Accepted |
| [0015](0015-default-categories-seeding.md) | Default categories: created with the account, backfilled by the migration | Accepted |
| [0016](0016-invite-only-sign-up.md) | Invite-only sign-up: hashed invite links, the admin from configuration, blocking | Accepted |
| [0017](0017-accounts-sources-banks.md) | Accounts: built-in Cash and Bank, personal sources and banks, currency codes kept in the app | Accepted |
| [0018](0018-whole-amounts.md) | Whole amounts: no cents, rounded half away from zero | Accepted |
| [0019](0019-exchange-rate-cache.md) | Exchange rates: one NBU call per day, kept per date, fallback never kept | Accepted |
| [0020](0020-user-settings.md) | User settings: report currency on the account, theme on the device, rates in hryvnias | Accepted |
| [0021](0021-popup-swipe-and-back.md) | Pop-ups: own swipe code and one history step per open pop-up | Accepted |
| [0022](0022-transactions-and-balances.md) | Transactions: balances summed by the database, suggestions worked out in memory, no deleting a used account | Accepted |
| [0023](0023-transfers-one-row.md) | Transfers: one row with both accounts; the form's rate from the API, the amounts from the person | Accepted |
| [0024](0024-transactions-list-and-summary.md) | Transactions list: filters in the address, pages by offset, a separate summary at each day's rate | Accepted |
| [0025](0025-prototypes-in-storybook.md) | Prototypes are Storybook stories built from the app's own parts | Accepted |
| [0026](0026-no-copies-of-accounts.md) | No two accounts in use alike: checked in the Domain, backed by a partial unique index | Accepted |

Template for new ADRs:

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
## Decision
## Consequences
```
