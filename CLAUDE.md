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
- **Document owner requests first.** When the owner reports a bug or proposes a feature or improvement,
  the first step is its folder, description file and backlog row with a **priority** (see "Changes" below) —
  before any investigation in code or any fix. Then confirm the priority with the owner if it isn't obvious.
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
- **Every change gets its own folder** in `docs/changes/<type>/` holding all related files: the
  description file **named like the folder** (`F-018-quick-add-income-expense/F-018-quick-add-income-expense.md`,
  from the templates in [docs/changes/README.md](docs/changes/README.md)), HTML design prototypes,
  screenshots, notes.
- **When a new feature, improvement or bugfix is added to the plan**, create its folder and description
  file right away, together with its row in `docs/BACKLOG.md` (and `docs/ROADMAP.md` if it changes a milestone).
- **Priority** `High` · `Medium` · `Low` (scale in [docs/changes/README.md](docs/changes/README.md#priority))
  is set for every improvement, bugfix and every feature added after the initial plan — in the description file
  and the backlog row.
- Short names are lowercase kebab-case and identical in the branch and the folder.

## Git workflow

- **Branches**
  - `main` — production. **The only branch deployed to hosting.** Updated only by merging `develop`
    (release pull request).
  - `develop` — integration branch; all development branches start from it and return to it.
  - `feature/…`, `improvement/…`, `bugfix/…` — **always branched from `develop`**, merged back into
    `develop` through a pull request so the user can review the code.
- **Merging**
  - Pull requests into `develop` are merged with **squash merge**: one commit per change on `develop`,
    titled like the PR (`F-012: Add expense form`). The branch is deleted after the merge.
  - Release pull requests `develop` → `main` use a **merge commit** (not squash), so `main` and `develop`
    share history and the next release has no false conflicts.
- **Pull requests**
  - Title: `<ID>: <short description>` (e.g. `F-012: Add expense form`).
  - Description (from `.github/pull_request_template.md`): a short summary, the list of changes made,
    a link to the change's description file, and how it was tested.
  - No "Generated with Claude Code" (or similar tool attribution) line in PR descriptions.
  - When squash-merging, remove any `Co-authored-by: Claude …` line GitHub suggests in the commit message.
- **Commit messages** start with the change ID and say briefly what was done:
  `F-012: Add expense form validation`, `B-007: Fix balance after transfer edit`.
  No `Co-authored-by: Claude Opus 5.5 <noreply@anthropic.com>` line (in any letter case) or other
  tool attribution in commit messages.
- **Before every push:**
  1. Pull the latest `develop` into the branch: `git pull origin develop` (merge, no rebase of pushed commits).
  2. Clean the Playwright output folders (`frontend/playwright-report/`, `frontend/test-results/`):
     `npm run clean:playwright` in `frontend/`.
  3. Update `docs/ROADMAP.md`, `docs/BACKLOG.md`, `docs/PROGRESS.md`, the change's description file
     and any other affected docs.
  4. Make sure the build and all tests pass.
- **Before every commit that changes UI**, check it in Playwright (see "Screens and design") — not only the
  tests passing, but screenshots you have looked at.
- Never commit secrets. Local secrets go to `dotnet user-secrets` / `.env.local`.

## Finishing a change: the PR is the hand-off

- **Claude's work on a change ends when its pull request is created.** Reviewing, merging and releasing are
  the owner's responsibility. Don't merge the PR and don't open a follow-up PR just to mark the change done.
- So the PR already contains the finished state of all related docs, as if it were merged:
  - status `Done` in the change's description file (acceptance criteria and tasks ticked) and in
    `docs/BACKLOG.md`;
  - `docs/ROADMAP.md` when the change finishes (or starts) a milestone;
  - a dated entry in `docs/PROGRESS.md`;
  - `docs/DESIGN_RULES.md`, ADRs, `OPEN_QUESTIONS.md` and any other doc the change affects.
- After creating the PR, give the owner its link and what to check. Change it again only when the owner asks
  (review comments) or its CI fails.

## Screens and design

- **Start from references.** Before designing a screen, look at how others solve it: well-made apps
  (budgeting and others), examples on the internet and **Mobbin** (mobbin.com — real app screens by pattern,
  e.g. "add transaction", "sidebar", "sign in"). Note in the change's description file which references were
  used and what was taken from each. Mobbin needs the owner's account: if it asks to sign in, ask the owner to
  sign in in the browser.
- Before building any screen, propose **3 design variants as HTML prototypes**: self-contained
  `.html` files (open directly in a browser, mobile and desktop layouts) saved in the change folder:
  `docs/changes/features/F-xxx-name/prototypes/variant-1.html` … `variant-3.html`.
- **Test everything with Playwright before showing it** — design variants before they are proposed, real
  screens before every commit — so the owner doesn't have to find UI issues by hand. Run the design check
  (prototypes) or the E2E tests (app), then take screenshots of every affected screen and state at phone
  (375 px) and desktop (1440 px) width, light and dark, and **look at them** (zoom into buttons, nav and rows).
  Typical misses this catches (both from the first F-010 build): text on the primary button not visible
  (same color as the button), and the app name cut off in the sidebar at its default width.
- Wait for the user's choice; record it in the change's description file and in the
  "Screen decisions" table of `docs/DESIGN_RULES.md`.
- Follow `docs/DESIGN_RULES.md` (its "Custom rules" section wins over everything else).
- Every reusable component and screen gets **Storybook** stories (mobile viewport, loading /
  empty / error states).

## Definition of done (per change)

- [ ] Acceptance criteria in the change's description file are met.
- [ ] Code follows the conventions below and builds without warnings.
- [ ] Unit tests cover the new logic (backend: xUnit; frontend: Vitest + React Testing Library).
- [ ] User-facing flows are covered by **Playwright** E2E tests.
- [ ] New UI components have Storybook stories.
- [ ] Changed screens checked in Playwright screenshots (phone and desktop, light and dark) and look right.
- [ ] CI is green.
- [ ] Docs show the change as `Done` in the PR itself (see "Finishing a change").

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
