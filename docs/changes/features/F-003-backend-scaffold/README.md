# F-003 · Backend scaffold

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Todo |
| Branch | `feature/F-003-backend-scaffold` |
| Design | not needed |

## Goal

An empty but production-ready .NET 10 solution with the agreed layers and test projects.

## Acceptance criteria

- [ ] `backend/PupBudgetPlanner.slnx` with Domain, Application, Infrastructure, Api projects
- [ ] Test projects: Domain.Tests, Application.Tests (xUnit v3, NSubstitute, AwesomeAssertions)
- [ ] Nullable on, warnings as errors, analyzers, `.editorconfig`, central package management
- [ ] `dotnet build` and `dotnet test` pass with one sample test

## Tasks

- [ ] Create solution and projects with project references
- [ ] Add `Directory.Build.props` and `Directory.Packages.props`
- [ ] Add `.editorconfig`
- [ ] Add a sample unit test
- [ ] Document run commands in README

## Tests

- Unit: Sample test proves the test setup works.
- E2E (Playwright): —

## Notes

- —
