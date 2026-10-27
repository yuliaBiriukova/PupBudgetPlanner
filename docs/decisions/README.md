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

Template for new ADRs:

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
## Decision
## Consequences
```
