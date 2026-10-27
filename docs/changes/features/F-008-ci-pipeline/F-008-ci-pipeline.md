# F-008 · CI pipeline

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Todo |
| Branch | `feature/F-008-ci-pipeline` |
| Design | not needed |

## Goal

Every push and pull request is built and tested automatically.

## Acceptance criteria

- [ ] `.github/workflows/ci.yml` runs on pull requests and on pushes to `develop` and `main`
- [ ] Backend: restore, build, test
- [ ] Frontend: lint, type-check, unit tests, build; Storybook build
- [ ] Playwright E2E against the real API with a PostgreSQL service container
- [ ] Playwright report uploaded as an artifact when tests fail

## Tasks

- [ ] Write backend job
- [ ] Write frontend job
- [ ] Write E2E job with PostgreSQL service
- [ ] Add caching

## Tests

- Unit: —
- E2E (Playwright): Runs the whole E2E suite.

## Notes

- Frontend jobs use the Node version from `frontend/.nvmrc` (`actions/setup-node` with `node-version-file`), see ADR 0008.
- Frontend checks: `npm ci`, `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test`, `npm run build`.
