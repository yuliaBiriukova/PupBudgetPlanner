# F-003 · Backend scaffold

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Done |
| Branch | `feature/F-003-backend-scaffold` |
| Design | not needed |

## Goal

An empty but production-ready .NET 10 solution with the agreed layers and test projects.

## Acceptance criteria

- [x] `backend/PupBudgetPlanner.slnx` with Domain, Application, Infrastructure, Api projects
- [x] Test projects: Domain.Tests, Application.Tests (xUnit v3, NSubstitute, AwesomeAssertions)
- [x] Nullable on, warnings as errors, analyzers, `.editorconfig`, central package management
- [x] `dotnet build` and `dotnet test` pass with one sample test

## Tasks

- [x] Create solution and projects with project references
- [x] Add `Directory.Build.props` and `Directory.Packages.props`
- [x] Add `.editorconfig`
- [x] Add a sample unit test
- [x] Document run commands in README

## Tests

- Unit: Layer dependency tests (Domain references no other layer; Application does not reference
  Infrastructure or Api) prove the test setup works.
- E2E (Playwright): —

## Notes

- SDK pinned in `backend/global.json` (10.0.401, roll forward to the latest feature band).
- Tests run on Microsoft.Testing.Platform, required by xUnit v3 4.x on the .NET 10 SDK (ADR 0007).
- Analyzers: `AnalysisLevel` `latest-recommended` and code style enforced on build (`EnforceCodeStyleInBuild`);
  warnings are errors. `.editorconfig` is at the repo root (it covers the frontend too).
- The API is minimal: controllers, OpenAPI (`/openapi/v1.json` in Development), `ProblemDetails` for errors and
  status codes, enums as strings in JSON. No endpoints yet; the health check comes with F-007.
- `PupBudgetPlanner.Api.Tests` is not created yet: it is for integration tests after the MVP (ADR 0005).
