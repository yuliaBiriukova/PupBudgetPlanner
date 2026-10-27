# 0007. Run backend tests on Microsoft.Testing.Platform

- Status: Accepted
- Date: 2026-10-27

## Context

xUnit v3 (4.x) runs on Microsoft.Testing.Platform (MTP). On the .NET 10 SDK, `dotnet test` with the old
VSTest runner fails for MTP-based test projects unless the repository opts in to the new test experience.

## Decision

- `backend/global.json` sets `"test": { "runner": "Microsoft.Testing.Platform" }`.
- Test projects are executables that reference only `xunit.v3` (plus NSubstitute and AwesomeAssertions);
  no `Microsoft.NET.Test.Sdk`, `xunit.runner.visualstudio` or `coverlet.collector`.
- Code coverage, when we add it to CI, uses the MTP extension `Microsoft.Testing.Extensions.CodeCoverage`.

## Consequences

- `dotnet test` from `backend/` runs every test project; a test project can also be run directly
  (`dotnet run --project tests/...`).
- MTP options differ from VSTest (for example `--filter-method` instead of `--filter`); CI (F-008) uses the MTP syntax.
