# 0008. Frontend toolchain: Node 24 LTS and TypeScript 5.9

- Status: Accepted
- Date: 2026-10-27

## Context

The current versions of the agreed frontend libraries (Vitest 5, jsdom 30, React Router 8, MSW 3) require
Node 22 or newer; Node 20 is end-of-life. The Vite template now installs TypeScript 7 (the native compiler),
but typescript-eslint supports TypeScript only below 6.1 and openapi-typescript only 5.x.

## Decision

- The frontend runs on **Node 24 LTS**: `frontend/.nvmrc` holds the version, `package.json` declares
  `"engines": { "node": ">=24" }`, and CI uses the same version.
- **TypeScript is pinned to 5.9** (`~5.9`) until typescript-eslint and openapi-typescript support a newer
  major version.

## Consequences

- Locally: `nvm use 24.21.0` (or newer 24.x) before working on the frontend.
- We lose TypeScript 7's faster type-checking for now; the codebase is small, so builds stay fast.
- Upgrading TypeScript is a separate improvement once the tooling supports it.
