# 0006. Avoid libraries with commercial licenses

- Status: Accepted
- Date: 2026-10-27

## Context

Several popular .NET libraries moved to commercial licenses (MediatR, AutoMapper, FluentAssertions v8+).
The project should stay free and simple.

## Decision

| Instead of | We use |
|------------|--------|
| MediatR | Plain application services injected into controllers |
| AutoMapper | Hand-written mapping (`ToDto()` extension methods) |
| FluentAssertions 8+ | AwesomeAssertions (Apache 2.0 fork with the same API) |

Before adding any new dependency, check its license (MIT / Apache 2.0 / BSD preferred).

## Consequences

Slightly more hand-written code, but it is explicit and easy to read.
