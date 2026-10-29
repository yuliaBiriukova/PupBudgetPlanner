# Working agreement

This file tells Claude (and any human contributor) how we work on this project.

## At the start of every session

1. Read [docs/PROGRESS.md](docs/PROGRESS.md) — the latest entries say where we stopped.
2. Read [docs/BACKLOG.md](docs/BACKLOG.md) — pick the next `Todo` item of the current milestone
   (or the one the user asks for) and open its folder in `docs/changes/`.
3. Check [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) for anything still blocking.
4. Before writing any code for the change, check its description file has the owner's approval (the `Approved`
   row, see "Owner approves before implementation"). No approval → finish the plan or prototype and ask for it.

## How we work

- **Ask when unclear.** If a requirement is ambiguous or you are unsure, ask the user before
  implementing. Questions that can wait go to `docs/OPEN_QUESTIONS.md`.
- **Plan in the repo.** Every change has an ID and its own folder (see "Changes" below) and a row in
  `docs/BACKLOG.md`. Update the status when work starts and finishes.
- **Document owner requests first.** When the owner reports a bug or proposes a feature or improvement,
  the first step is its folder, description file and backlog row with a **priority** (see "Changes" below) —
  before any investigation in code or any fix. Then confirm the priority with the owner if it isn't obvious.
- **Owner approves before implementation.** Claude writes no implementation, backend or frontend, until the
  owner has explicitly approved the change:
  - **What is approved:** the description file (goal, acceptance criteria, tasks); for a 🎨 change also the
    **final prototype**; for a bugfix the root cause and the planned fix.
  - **What is implementation:** code, tests, migrations and configuration in `backend/`, `frontend/` and the
    deployment files. Planning docs, references, prototypes and reproducing a bug are not, and go ahead freely.
  - **What is approval:** the owner's explicit words in chat or on the PR, e.g. "approved, build it". Picking
    options in a design round, comments on a prototype or "looks good" are **not** approval to build: build the
    final prototype from them, show it and ask "Approve for implementation?". A change the owner asks for in so
    many words (e.g. a docs update) counts as approved by the request.
  - **Record it:** the date in the description file's `Approved` row (and, for screens, in DESIGN_RULES
    "Screen decisions") before the first line of code.
  - **Scope changes:** if building shows the change must differ from what was approved (a new screen, other
    behavior, a different data model), stop and get it approved again. The owner's review comments are approval
    of what they ask for.
  - Why: in F-028 the screens were built from a prototype the owner had never seen (see I-003).
- **Planning-only lists.** When the owner hands over a list of bugs, improvements or features to add to the
  backlog (or says "only plan these"), plan them all on one `plan/<short-name>` branch (see "Git workflow"):
  folders, description files with priorities, backlog rows, a PROGRESS entry. Implement none of them there,
  not even a small one; each is built later on its own branch, after the owner's approval. Being in the
  backlog is not approval to build.
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
  - `plan/<short-name>` (e.g. `plan/f028-follow-ups`) — **planning only**, for a list of changes the owner
    wants in the backlog without building them. Branched from `develop`, merged back through a pull request
    like the others. It carries only docs: change folders and description files, `BACKLOG.md` /
    `ROADMAP.md` rows, a `PROGRESS.md` entry, `OPEN_QUESTIONS.md`. No code, tests or prototypes; a
    working-agreement change the owner asks for together with the plan may go on it too. The planned changes
    stay `Todo`, and their description files name the branch each will be built on
    (`improvement/I-004-custom-scroll-bars`).
- **Merging**
  - Pull requests into `develop` are merged with **squash merge**: one commit per change on `develop`,
    titled like the PR (`F-012: Add expense form`). The branch is deleted after the merge.
  - Release pull requests `develop` → `main` use a **merge commit** (not squash), so `main` and `develop`
    share history and the next release has no false conflicts.
- **Pull requests**
  - Title: `<ID>: <short description>` (e.g. `F-012: Add expense form`). A planning PR:
    `Plan: <short description> (<IDs>)` (e.g. `Plan: F-028 follow-ups (I-004 – I-009)`).
  - Description (from `.github/pull_request_template.md`): a short summary, the list of changes made,
    a link to the change's description file, and how it was tested.
  - No "Generated with Claude Code" (or similar tool attribution) line in PR descriptions.
  - When squash-merging, remove any `Co-authored-by: Claude …` line GitHub suggests in the commit message.
- **Commit messages** start with the change ID and say briefly what was done:
  `F-012: Add expense form validation`, `B-007: Fix balance after transfer edit`. On a planning branch they
  start with `Plan:` and name the IDs: `Plan: Add I-004 – I-008 to the backlog`.
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
- A **planning PR** (`plan/…`) is the hand-off of the plan, not of the changes: they stay `Todo` in their
  description files and the backlog. A working-agreement change carried on it is `Done`.
- After creating the PR, give the owner its link and what to check. Change it again only when the owner asks
  (review comments) or its CI fails.

## Screens and design

- **Start from references.** Before designing a screen, look at how others solve it: **Mobbin** (mobbin.com —
  real app screens by pattern, e.g. "add transaction", "sidebar", "sign in") and other examples that are open on
  the internet (product sites, app store screenshots, design galleries). Never use as a reference an app or site
  that needs the owner's sign-in (banking apps, Claude's UI and the like), and don't ask the owner to sign in
  anywhere for references. Note in the change's description file which references were used and what was taken
  from each.
- Before building any screen, propose **3 design variants as HTML prototypes**: self-contained
  `.html` files (open directly in a browser, mobile and desktop layouts) saved in the change folder:
  `docs/changes/features/F-xxx-name/prototypes/variant-1.html` … `variant-3.html`.
- **Test everything with Playwright before showing it** — design variants before they are proposed, real
  screens before every commit — so the owner doesn't have to find UI issues by hand. Run the design check
  (prototypes) or the E2E tests (app), then take screenshots of every affected screen and state at phone
  (375 px) and desktop (1440 px) width, light and dark, and **look at them** (zoom into buttons, nav and rows).
  Typical misses this catches (both from the first F-010 build): text on the primary button not visible
  (same color as the button), and the app name cut off in the sidebar at its default width.
- Wait for the user's choice. When the choice is a mix or comes with changes, build it as one **final
  prototype**, check it like the variants, show it and ask for approval; repeat until the owner approves it in
  so many words. Only then record it (with the date) in the change's description file and in the
  "Screen decisions" table of `docs/DESIGN_RULES.md`, and start the implementation — backend included.
- Follow `docs/DESIGN_RULES.md` (its "Custom rules" section wins over everything else).
- Every reusable component and screen gets **Storybook** stories (mobile viewport, loading /
  empty / error states).

## Definition of done (per change)

- [ ] The owner approved the change (and its final prototype) before implementation; the date is in its
      description file.
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
