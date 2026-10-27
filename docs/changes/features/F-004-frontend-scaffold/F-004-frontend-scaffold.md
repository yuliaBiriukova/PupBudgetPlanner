# F-004 · Frontend scaffold

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Todo |
| Branch | `feature/F-004-frontend-scaffold` |
| Design | not needed |

## Goal

An empty React app with all agreed libraries wired up.

## Acceptance criteria

- [ ] Vite + React + TypeScript (`strict`) in `frontend/`
- [ ] Mantine (core, dates, charts, form, notifications) with a theme file and light/dark mode
- [ ] React Router, TanStack Query, react-i18next (English) configured
- [ ] ESLint + Prettier; Vitest + React Testing Library + MSW with one sample test
- [ ] Dev server proxies `/api` to the local API; script to generate API types from OpenAPI

## Tasks

- [ ] Create Vite project
- [ ] Add Mantine and the theme
- [ ] Add router, query client and i18n providers
- [ ] Configure lint/format
- [ ] Configure Vitest, RTL, MSW
- [ ] Add `openapi-typescript` script
- [ ] Add dev proxy

## Tests

- Unit: Sample component test.
- E2E (Playwright): —

## Notes

- —
