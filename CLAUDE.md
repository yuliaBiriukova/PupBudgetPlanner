# Working agreement

This file tells Claude (and any human contributor) how we work on this project.

## At the start of every session

1. Read [docs/PROGRESS.md](docs/PROGRESS.md) — the latest entries say where we stopped.
2. Read [docs/BACKLOG.md](docs/BACKLOG.md) — pick the next `Todo` item of the current milestone
   (or the one the user asks for) and open its folder in `docs/changes/`.
3. Check [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) for anything still blocking.

## How we work

- **Ask when unclear.** If a requirement is ambiguous or you are unsure, ask the user before
  implementing. Questions that can wait go to `docs/OPEN_QUESTIONS.md`.
- **Plan in the repo.** Every change has an ID and its own folder (see "Changes" below) and a row in
  `docs/BACKLOG.md`. Update the status when work starts and finishes.
- **Log progress.** After finishing work, add a dated entry to `docs/PROGRESS.md`.
- **Record decisions.** Any significant technical decision gets a short ADR in `docs/decisions/`.
- **MVP first.** Don't build post-MVP items early; note ideas in the backlog instead.

## Changes: features, improvements, bugfixes

| Type | ID | Branch | Folder |
|------|----|--------|--------|
| Feature (incl. setup work: scaffolding, CI, deployment) | `F-001` | `feature/F-001-short-name` | `docs/changes/features/F-001-short-name/` |
| Improvement | `I-001` | `improvement/I-001-short-name` | `docs/changes/improvements/I-001-short-name/` |
| Bugfix | `B-001` | `bugfix/B-001-short-name` | `docs/changes/bugfixes/B-001-short-name/` |

- IDs are numbered separately per type and never reused.
- **Every change gets its own folder** in `docs/changes/<type>/` holding all related files:
  `README.md` (from the templates in [docs/changes/README.md](docs/changes/README.md)), HTML design
  prototypes, screenshots, notes.
- Short names are lowercase kebab-case and identical in the branch and the folder.

## Git workflow

- **Branches**
  - `main` — production. **The only branch deployed to hosting.** Updated only by merging `develop`
    (release pull request).
  - `develop` — integration branch; all development branches start from it and return to it.
  - `feature/…`, `improvement/…`, `bugfix/…` — **always branched from `develop`**, merged back into
    `develop` through a pull request so the user can review the code.
- **Commit messages** start with the change ID and say briefly what was done:
  `F-012: Add expense form validation`, `B-007: Fix balance after transfer edit`.
- **Before every push:**
  1. Pull the latest `develop` into the branch: `git pull origin develop` (merge, no rebase of pushed commits).
  2. Clean the Playwright output folders (`frontend/playwright-report/`, `frontend/test-results/`).
  3. Update `docs/ROADMAP.md`, `docs/BACKLOG.md`, `docs/PROGRESS.md`, the change's `README.md`
     and any other affected docs.
  4. Make sure the build and all tests pass.
- Never commit secrets. Local secrets go to `dotnet user-secrets` / `.env.local`.

## Screens and design

- Before building any screen, propose **3 design variants as HTML prototypes**: self-contained
  `.html` files (open directly in a browser, mobile and desktop layouts) saved in the change folder:
  `docs/changes/features/F-xxx-name/prototypes/variant-1.html` … `variant-3.html`.
- Wait for the user's choice; record it in the change `README.md` and in the
  "Screen decisions" table of `docs/DESIGN_RULES.md`.
- Follow `docs/DESIGN_RULES.md` (its "Custom rules" section wins over everything else).
- Every reusable component and screen gets **Storybook** stories (mobile viewport, loading /
  empty / error states).

## Definition of done (per change)

- [ ] Acceptance criteria in the change `README.md` are met.
- [ ] Code follows the conventions below and builds without warnings.
- [ ] Unit tests cover the new logic (backend: xUnit; frontend: Vitest + React Testing Library).
- [ ] User-facing flows are covered by **Playwright** E2E tests.
- [ ] New UI components have Storybook stories.
- [ ] CI is green.
- [ ] Docs updated (see "Before every push").

Integration tests (Testcontainers) are planned after the MVP — see ADR 0005.

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
