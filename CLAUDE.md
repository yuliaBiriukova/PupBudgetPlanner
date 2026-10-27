# Working agreement

This file tells Claude (and any human contributor) how we work on this project.

## At the start of every session

1. Read [docs/PROGRESS.md](docs/PROGRESS.md) — the latest entries say where we stopped.
2. Read [docs/BACKLOG.md](docs/BACKLOG.md) — pick the next `Todo` task of the current milestone
   (or the one the user asks for).
3. Check [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) for anything still blocking.

## How we work

- **Ask when unclear.** If a requirement is ambiguous or you are unsure, ask the user before
  implementing. Questions that can wait go to `docs/OPEN_QUESTIONS.md`.
- **Plan in the repo.** Every feature, task and bug lives in `docs/BACKLOG.md` with an ID
  (`T-xxx` for tasks, `B-xxx` for bugs). Update the status when work starts and finishes.
- **Log progress.** After finishing a task, add a dated entry to `docs/PROGRESS.md`
  (what was done, what's next).
- **Record decisions.** Any significant technical decision gets a short ADR in `docs/decisions/`.
- **MVP first.** Don't build post-MVP features early; note ideas in the backlog instead.

## Screens and design

- Before building any screen, propose **3 visual variants** (mockups) and wait for the user's choice.
- Record the chosen variant in the "Screen decisions" section of `docs/DESIGN_RULES.md`.
- Follow `docs/DESIGN_RULES.md`. Every reusable component and every screen gets **Storybook** stories
  (including mobile viewport and loading / empty / error states).

## Definition of done (per task)

- [ ] Code follows the conventions below and builds without warnings.
- [ ] Unit tests cover the new logic (backend: xUnit; frontend: Vitest + React Testing Library).
- [ ] User-facing flows are covered by **Playwright** E2E tests.
- [ ] New UI components have Storybook stories.
- [ ] CI is green.
- [ ] `docs/BACKLOG.md` and `docs/PROGRESS.md` are updated.

Integration tests (Testcontainers) are planned after the MVP — see ADR 0005.

## Git workflow

- `main` is always deployable; Render deploys it automatically after CI passes.
- One branch per task: `feature/T-012-add-expense-form`, `fix/B-003-wrong-balance`.
- Changes reach `main` through a pull request so the user can review the code.
- Commit messages: imperative, short subject, task ID in the subject (`T-012: Add expense form`).
- Never commit secrets. Local secrets go to `dotnet user-secrets` / `.env.local`.

## Coding conventions

### Backend (C#)

- Nullable reference types on, warnings as errors, file-scoped namespaces.
- Layers: `Domain` → `Application` → `Infrastructure` / `Api` (see ARCHITECTURE.md). Controllers are
  thin: no business logic.
- Money is `decimal`; currency is an ISO 4217 code (`UAH`, `USD`, `EUR`). Transaction dates are
  `DateOnly`; technical timestamps are UTC `DateTimeOffset`.
- DTOs are `record`s; mapping is written by hand (no AutoMapper).
- Every async method takes a `CancellationToken`.
- Validation with FluentValidation; errors returned as RFC 7807 `ProblemDetails`.

### Frontend (TypeScript)

- `strict` TypeScript, no `any`.
- Feature folders (`src/features/<feature>`), shared code in `src/shared`.
- Server data only through TanStack Query hooks; API types are generated from the backend OpenAPI document.
- UI only through Mantine components and theme tokens; no hard-coded colors.
- All user-visible text goes through i18n keys (English now, Ukrainian later).
- ESLint + Prettier must pass.
