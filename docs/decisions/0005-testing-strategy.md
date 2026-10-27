# 0005. Testing strategy

- Status: Accepted
- Date: 2026-10-27

## Context

All code should be covered by unit, integration and UI tests. The owner does not want to install
Docker locally, and integration tests were moved after the MVP.

## Decision

- **MVP:**
  - Backend unit tests: xUnit v3, NSubstitute, AwesomeAssertions. Business logic (balances, transfers,
    reports) is kept in pure classes so it can be tested without a database.
  - Frontend unit/component tests: Vitest, React Testing Library, MSW (mocked API).
  - **UI tests: Playwright** — end-to-end user flows against the real API and PostgreSQL. In CI the
    database is a GitHub Actions PostgreSQL service container; locally a Neon `dev` branch.
  - Storybook stories for every component and screen state.
- **After MVP:** integration tests with `WebApplicationFactory` + Testcontainers (PostgreSQL). They run in
  GitHub Actions, which has Docker, so local Docker stays optional.

## Consequences

- Until integration tests exist, EF Core queries and API wiring are covered indirectly by Playwright E2E tests.
