# Progress log

Newest entries on top. Each entry: what was done, decisions, what's next.

## 2026-10-29 (3)

**Done**
- F-028 built (same branch and PR as the plan); M1 is done again.
  - **Backend:** `Invitation` (hashed token, 7 days, once, cancel), invite-only `register` and first Google
    sign-in, the admin from `Access:AdminEmails`, `/api/admin/people` (list, block, unblock, delete, in bulk) and
    `/api/admin/invitations`, `/api/invitations/{token}` for the invite page, `/api/auth/sign-up`. Blocking ends
    cookies within a minute; deletion removes the account's data. Migration `AddInvitations` (join dates of
    existing accounts from their UUIDv7 ids).
  - **Frontend:** `/invite/:token`, the invite-only Create account, Google and blocked messages, the People page
    (underline tabs, search, card rows with check boxes and a ⋯ menu, a bar for bulk Block / Delete, folded link
    groups, the New invite link dialog with Copy / Share), People in the sidebar and under More for the admin.
  - **Tests:** backend 161 (65 new), frontend unit 60 (17 new), E2E 35 passed, 2 skipped (an E2E admin and invite
    links for every new account); Storybook stories for both screens.
- Checked: screenshots of every screen at 375 and 1440 px, light and dark, looked at; the People page in the
  browser pane with the local test admin. Five visual fixes on the way (see the description).

**Decisions**
- ADR 0016: hashed invite links, the admin from configuration (password sign-up of an admin email only in
  Development), blocking via the security stamp checked every minute, no sign-in method shown.

**Next**
- Owner: review PR #23; after the release set `Access__AdminEmails__0` on Render; confirm Q-012.
- I-002 (corners across the app) is proposed as its own change. Then M2: F-014.

## 2026-10-29 (2)

**Done**
- F-028 started on its planning branch and PR (owner's request): five references and three HTML prototypes
  (Guest list, Receipt, Pocket) covering the invite page, a broken link, Create account without a link, Google
  without an account, and the People page with a new link, block and delete. Design check 0 issues; screenshots
  at 375 and 1440 px, light and dark, looked at.
- Product: sign-up is described as invite-only while the app is for family and friends.

**Decisions**
- The invite link is shown only once (only its hash is stored); a broken link never says who made it.

- Round 2 on the owner's feedback: variant 4 mixes variant 1's sign-in screens, variant 2's pop-up for a new
  link and variant 3's two tabs, with three tab styles and three ways to show people (card rows, table, cards)
  to pick from.

- Round 3: underline tabs chosen; variant 5 adds search for people and a switch that hides expired and cancelled
  links, and offers three people views (card rows, table, compact) and three links views (grouped, card rows,
  table). The F-028 description now has a "Screens and behavior" section and acceptance criteria for search and
  hiding links.

- Round 4: card rows and grouped links chosen. The People page no longer shows how someone signs in (privacy);
  used links are hidden by default too; one corner system (pills for buttons, tabs and nav items, circles for
  icon buttons, 12 px fields and rows, 24 px dialogs), to be applied to the app in I-002. Variant 6 offers three
  ways to reach a person's actions instead of a ⋯ menu and two ways to show old links.

- Design chosen: check boxes for bulk Block / Delete plus a ⋯ menu per row, folded Used and Expired and cancelled
  groups (variant 7, recorded in the description and DESIGN_RULES).

**Next**
- Build F-028: backend, then the frontend.

## 2026-10-29

**Done**
- Owner's request: planned F-028 "Invite-only access" in M1 (priority High). F-011 and F-012 are on `main`, so
  anyone can create an account on production today. The description lists the acceptance criteria and tasks.

**Decisions**
- Owner's choices: one invitation link per person (works once, 7 days, can be cancelled); only the admin invites
  (F-023 family links will also let new people sign up); the admin can block a person or delete their account;
  the admin is the owner, by email, from the `Access:AdminEmails` setting (kept out of the repository).
- Open: Q-012, what happens to accounts that already exist on production (proposal: they keep access).

**Next**
- F-028 before F-014: references and 3 HTML prototypes first.

## 2026-10-28 (7)

**Done**
- F-013 built; M1 is done.
  - **Domain:** the first business entities, `CategoryGroup` and `Category`, and `CategoryKind`.
    `DefaultCategories` is the spreadsheet set in its order.
  - **Database:** `category_groups` and `categories` (kind as text, cascade from the account, unique names per
    person / group). The `AddCategories` migration also gives every existing account the set.
  - **Sign-up:** email sign-up and the first Google sign-in create the account and its categories in one
    transaction (`AccountCreator`).
- Fixed on the way: the Docker build failed with CA1861 in the new migration. The image never got `.editorconfig`,
  which tells the analyzers to skip generated migrations. The Dockerfile now copies it.
- Tests:
  - backend 96 (8 new);
  - E2E 27 passed, 2 skipped against this build. Once, "creates an account, signs out and signs in again"
    stayed on `/transactions` after Sign out on desktop. It passed 3 of 3 on a rerun; watch it if it comes back.
- Checked on the Neon `dev` database:
  - all existing accounts were backfilled;
  - a new sign-up got the set;
  - every account has 7 groups and 33 categories, identical.

**Decisions**
- Owner's choice: the current set, including the owner's own categories, stays the default while only the
  family uses the app. A generic set for other people is open question Q-011 (with M9).
- ADR 0015: seeding in the account's transaction; the backfill is a frozen SQL copy in the migration.

**Next**
- M2: F-014 accounts and balances (🎨 three prototypes first).

## 2026-10-28 (6)

**Done**
- Owner's request: planned F-027 "Delete my account" for after the MVP (M9 — Privacy & categories, priority
  Low). Its description lists the acceptance criteria and four open points with proposals (Q-010).

**Next**
- Nothing changes for the MVP: F-012 is merged (PR #19), F-013 is next.

## 2026-10-28 (5)

**Done**
- F-011 was merged into `develop` (PR #18).
- F-012 built:
  - **Backend:** Google sign-in through Identity external logins. `GET /api/auth/google` sends the person to
    Google, the callback is `/api/auth/google/callback`, and `/api/auth/google/complete` signs them in and
    returns them to the page they wanted. The first sign-in creates the account, or links to the one with the
    same email Google has verified. A cancel or failure comes back to sign in with one message. Without a
    Google client the app still starts.
  - **Frontend:** "or" and "Continue with Google" under the form on sign in and create account (variant 4),
    "Opening Google…" after the click, and the banner for a failed Google sign-in.
  - Render lists the two Google variables; README has the user-secrets commands.
- Fixed on the way: the Vite proxy rewrote the `Host` header, so locally Google would have come back to the
  API's port instead of the app.
- Tests:
  - backend 88 (30 new);
  - frontend unit 43 (3 new);
  - E2E 27 passed, 2 skipped (4 new): the redirect to Google with our callback, and a foreign callback coming
    back with the message;
  - a Storybook story for the Google error.
- Checked: screenshots at 375 and 1440 px, light and dark (sign in, create account, the error, "Opening
  Google…"); axe 0 issues.

**Decisions**
- Owner's choice: Google sign-in links to an existing email-and-password account, removes its password (nobody
  proved the email before) and ends its other sessions.
- ADR 0014: the Google flow, matching and linking, lockout not applying to Google, the proxy keeping `Host`.
- The Google app stays in Testing, with the family as test users: Google publishes it only with a privacy
  policy link, and the app has no such page yet.

**Next**
- Owner has created the Google OAuth client (own project, test users); sets it on Render and checks Google
  sign-in after the release.
- F-013: default categories for every new person, email or Google.

## 2026-10-28 (4)

**Done**
- F-011: owner chose variant 4 (recorded in the F-011 description and `DESIGN_RULES.md`).
- F-011 built:
  - **Backend:** Identity accounts (`users` and the other Identity tables in snake_case, new migration) and
    `/api/auth` me / register / login / logout. Every other endpoint needs a signed-in person. The cookie is
    HTTP-only and lasts 30 days. Antiforgery is a readable cookie plus a header. Errors are neutral
    (ADR 0012), with rate limits per IP and lockout.
  - **Frontend:** the variant 4 sign-in and sign-up pages, a start-up screen while the app asks who is signed
    in, redirects both ways, and the person's name and a working Sign out in the shell.
- Tests:
  - backend 58 (30 new);
  - frontend unit 40 (18 new);
  - E2E 23 passed, 2 skipped. A setup project signs the shell tests in.
  - Storybook stories for the auth screens and the start-up screen.
- Checked in the running app against Neon `dev`: curl through every endpoint; screenshots at 375 and 1440 px in
  light and dark; axe 0 issues.
- Fixed on the way: dark-mode filled buttons had white text on the light button (also "Page not found"); new
  custom design rule.

**Decisions**
- ADR 0013: auth API details: endpoints, fallback policy, cookie, antiforgery filter, length-only passwords,
  lockout, rate limits, table names.
- "Continue with Google" comes with F-012, not as a dead button now.

**Next**
- Owner reviews the F-011 pull request.
- F-012: sign in with Google.

## 2026-10-28 (3)

**Done**
- F-011 started (branch `feature/F-011-email-password-auth`): three sign-in / sign-up prototypes made with the
  `design-screen` skill in the F-010 theme: Ledger page (the form beside a sample of the yearly report),
  Pocket (charcoal page, form docked under the thumb, a pill switch) and Receipt (a paper strip with a torn edge).
  Each shows sign in, create account, their error states, the busy button and the waking-up note.
- References noted in the F-011 description (YNAB, Stripe, Lunch Money, an Eleken roundup). Mobbin's screens need
  an account, so it wasn't used.
- Design check: 0 issues on all three. It first caught a small "Sign in instead" link and inputs without a focus
  outline. Screenshots at 375 and 1440 px, light and dark, were looked at, and they caught the floating
  waking-up pill covering the logo row. It is now a note in the form.

- F-011 round 2, from the owner's feedback (variant 1's layout without the report table, variant 2's colors and
  form, not variant 3): `prototypes/variant-4.html`. Desktop: charcoal brand half and the form half. Phone: a
  charcoal band with the name, and the form card overlapping it. Design check 0 issues; screenshots looked at.
- Variant 4 revised: the tagline "Every hryvnia in its place." removed. A taken email on Create account now gets a
  neutral banner ("We couldn't create an account with this email" + "Sign in with this email") instead of
  saying the account exists; format errors have their own screen in the prototype.
- Variant 4: the desktop line under the name is now "Income, expenses and transfers across all your accounts and
  currencies. Monthly and yearly reports build themselves, for you and your family." (owner's pick of 8). Create
  account got a Confirm password field: without password reset (no email until after the MVP), a typo would
  lock the person out.

**Decisions**
- ADR 0012: no account enumeration. One message for a wrong email or password, a neutral sign-up message for a
  taken email, rate limiting on the auth endpoints per IP. Sign-up moves to "Check your email" once email exists
  (after the MVP).

**Next**
- Owner confirms variant 4 or asks for changes. Then the Identity setup and `/api/auth` endpoints, the forms and
  the protected routes.

## 2026-10-28 (2)

**Done**
- I-001: new working rules from the owner, in `CLAUDE.md`, `docs/changes/README.md`, `docs/DESIGN_RULES.md`,
  the `design-screen` skill and the PR template:
  - the PR is the hand-off: it already marks the change `Done` in all docs; merging is the owner's job, no
    separate "mark done" PR;
  - Playwright check with screenshots looked at before showing design variants and before every UI commit;
  - a reported bug or proposed feature / improvement gets its folder, description and backlog row first;
  - priority `High` / `Medium` / `Low` for improvements, bugfixes and features added later (new backlog column);
  - design starts from references: Mobbin and open examples on the internet — nothing that needs the owner's
    sign-in (banking apps, Claude's UI).
- B-002 closed by the owner: `Done`, priority `Medium`.

**Next**
- F-011: sign up and sign in — first under the new rules (references on Mobbin, Playwright look-check).

## 2026-10-28

**Done**
- B-002: the tab icon on Render was still the Vite template icon. The server sends the new logo; browsers kept
  the old icon cached under the same URL, `/favicon.svg`. The icon links in `index.html` now carry `?v=2`, and
  the smoke E2E test checks that each declared icon URL is versioned and loads the logo.

**Next**
- Release B-002 to `main` and check the tab icon on Render.
- F-011: sign up and sign in; then the shell shows the signed-in person.

## 2026-10-27 (18)

**Done**
- B-001: fixed the flaky unit test "shows nothing when the server answers quickly" that failed CI on `develop`
  after PR #14. It moved the fake clock before the real health check had answered; it now waits for the
  request to finish. The health mock in that test answers after a real 50 ms delay, so the case is checked
  every run.

**Next**
- Merge B-001, then the release `develop` → `main` (PR #13).
- F-011: sign up and sign in; then the shell shows the signed-in person.

## 2026-10-27 (17)

**Done**
- F-010 merged into `develop` (PR #12) and marked Done in its description and the backlog.

**Decisions**
- Owner dropped the F-010 task to compare the sidebar with Claude's UI: it needed a claude.ai sign-in, and the
  chosen logo-as-expand-button pattern already follows it.

**Next**
- Release `develop` → `main` (PR #13).
- F-011: sign up and sign in; then the shell shows the signed-in person.

## 2026-10-27 (16)

**Done**
- F-010: the app shell is built (`frontend/src/app/shell/`). Theme: charcoal and sky, Unbounded + Manrope
  (self-hosted, ADR 0011). Desktop sidebar with the smooth collapse, logo-as-expand button and drag / keyboard
  resize; phone top bar, pill tab bar, More and Add sheets; routes with placeholder pages; the waking-up pill.
- Tests: 22 unit tests, E2E on desktop and phone (12 passed, 2 skipped: device-specific tests), Storybook
  stories. Build without warnings: libraries split into their own chunks.
- Fixed: the API client bypassed MSW in tests (kept `fetch` from start-up).
- Fixed after the owner's testing: icons shrank to dots in the collapsed sidebar (only labels may shrink now);
  More and Add on the phone filled the screen. They are now bottom sheets like the prototype (shared
  `BottomSheet`: grab handle, rounded top, as tall as the content). E2E checks for both.
- Browser icon: the app logo instead of the Vite template icon (SVG, ICO and an iPhone touch icon).

**Next**
- Open the F-010 pull request into `develop`.
- F-011: sign up and sign in; then the shell shows the signed-in person.

## 2026-10-27 (15)

**Done**
- F-010: the sidebar collapse is smooth: only the width animates, and icons, logo and avatar stay on one axis
  (checked frame by frame). Labels fade out, and the collapse button and footer icons fade.
- F-010: 13 new color schemes in `blocks.html` (17 in all), light and dark, within the chosen setup. Each is 8
  colors per mode; the rest is derived. Every text and control pair passes WCAG AA in both modes.

**Decisions**
- Owner picked **charcoal and sky** as the color scheme; recorded in the F-010 description and `DESIGN_RULES.md`.

**Next**
- F-010: theme in `theme.ts`, layout components, routes with placeholder pages, the waking-up pill, Storybook.

## 2026-10-27 (14)

**Done**
- F-010 round 2: three new full directions made with the `design-screen` skill: Ledger, Banknote and Pocket
  (`prototypes/variant-1…3.html`), with a drag-to-resize sidebar that also collapses with an icon button.
- F-010 round 3, at the owner's request (options for every block): `prototypes/blocks.html`, a mix-and-match
  prototype with 14 blocks of 2–4 options each (colors, type, corners, logo; sidebar surface, open-section marker,
  collapse button, desktop Add, sidebar bottom; phone tab bar, top bar, More menu; a whose-money switch; the
  waking-up state). It has new options too: graphite and tangerine colors, Fira Sans, a dark sidebar column, a
  Claude-like logo-as-expand button, and Expense, Income and Transfer as separate Add buttons.
- Design check: tells apart horizontal scrollers (any `overflow-x` container, not only `.table-wrap`) and now
  checks every option of a mix-and-match prototype (`BLOCKS` / `setBlock` / `resetBlocks`). `blocks.html`: 0
  issues. A deliberately undersized button in one option was caught, so the option loop works.

**Decisions**
- Owner chose a mix: ink colors, Unbounded + Manrope, round corners, a coin-stack logo, a tinted sidebar with an
  edge bar marking the open section, the logo as the expand button in the rail, a pill tab bar on the phone, and a
  pill while the server wakes up. Gold logo replaced by copper `#cd8a5c` (pale blue and sage still in the
  prototype to compare). The sidebar's minimum width now fits the whole app name (236 px with Unbounded). Recorded
  in the F-010 description and in `DESIGN_RULES.md`.

**Next**
- F-010: theme in `theme.ts`, layout components, routes with placeholder pages, the waking-up pill, Storybook.

## 2026-10-27 (13)

**Done**
- F-010: first round of app shell prototypes made and rejected by the owner (too close to the default component
  library look, fonts too bold, icons and text misaligned). Prototypes removed; the feedback and technical
  findings are in the F-010 description, new custom rules in `DESIGN_RULES.md`.
- Kept: project skill `design-screen` (`.claude/skills/`) against generic "AI default" design, and a Playwright +
  axe design check for HTML prototypes: `npm run design:check -- <file.html>` in `frontend/` (`axe-core` added as
  a dev dependency).

**Next**
- F-010 from the start: look at how Claude's UI collapses its sidebar, then 3 new prototypes with the skill.

## 2026-10-27 (12)

**Done**
- F-009: code merged into `develop` (PR #9); first release `develop` → `main` (PR #10, merge commit).
- Owner set up Render (Blueprint on `main`, connection string to Neon `main`) and the cron-job.org keep-awake ping
  (`*/14 7-22 * * *`, Europe/Kyiv). Live: https://pup-budget-planner.onrender.com, Storybook at
  https://pup-budget-planner-storybook.onrender.com.
- Production checked: health, SPA and client routes, API 404, HTTPS redirect, HSTS, caching, Brotli; Playwright
  E2E 4/4 against the production URL.
- Render's free plan has no metrics, so the CI "Docker image" job now runs the container with a 512 MB limit and
  reports `docker stats`: 44 MiB after start-up, 57 MiB after 400 requests. Image 251 MB; warm requests 0.15–0.17 s.
- Cold start after 17 min idle (cron job paused): 23.4 s for the first request, then 0.17–0.19 s.
- F-009 done; **M0 Foundation done.**

**Next**
- M1: F-010 app shell and navigation (3 design prototypes first).

## 2026-10-27 (11)

**Done**
- F-008: CI pipeline merged into `develop` (PR #8).
- F-009 (code part): multi-stage `Dockerfile` (Node 24 → .NET 10 SDK publish with ReadyToRun → `aspnet:10.0`,
  non-root, port 8080, workstation GC) and `.dockerignore`. The API serves the React build from `wwwroot` with an
  `index.html` fallback for client routes; unknown `/api` routes stay ProblemDetails 404s; `/assets` cached for a
  year, the rest `no-cache`. Forwarded headers (`For`/`Proto`) trusted from Render's proxy; HTTPS redirection only
  in Development, HSTS in production.
- `render.yaml`: Docker web service (free, Frankfurt, `main`, deploy after checks pass, health check
  `/api/health`, `ConnectionStrings__Database` set in the dashboard) and the Storybook static site.
- New CI job "Docker image": builds the image, runs it against PostgreSQL, smoke-tests health, SPA, client route
  and API 404. No local Docker, so CI is where the image is checked.
- Checked locally: the published app in `Production` against Neon `dev` (all routes and headers as expected);
  ReadyToRun `linux-x64` publish works. Backend: clean build, 15 tests pass.
- Owner setup steps written in the F-009 change file.

**Decisions**
- ADR 0010: Docker image and production hosting settings.

**Next**
- Owner: Render account + Blueprint, connection string (Neon `main`, direct), first release `develop` → `main`,
  cron-job.org keep-awake ping. Then measure memory and cold start and finish F-009.

## 2026-10-27 (10)

**Done**
- F-007: database and health check merged into `develop` (PR #7).
- F-008: GitHub Actions workflow `.github/workflows/ci.yml` with three parallel jobs — Backend (restore,
  Release build, tests), Frontend (lint, format check, type-check, unit tests, build, Storybook build) and
  E2E (Playwright against the real API with a PostgreSQL 17 service container; report uploaded on failure).
  npm and NuGet caching; older PR runs cancelled on a new push.
- Playwright's `webServer` now starts the API too (user-secrets / Neon `dev` locally) and, in CI, serves the
  production build with `vite preview` on port 4173. New E2E test: `/api/health` through the app's proxy.
  E2E (4 tests) passes locally in both modes; backend build is clean, 7 tests pass; lint, format, type-check,
  unit tests, build and Storybook build pass.

**Next**
- F-009: deployment to Render.

## 2026-10-27 (9)

**Done**
- F-006: Playwright setup merged into `develop` (PR #6).
- F-007: EF Core 10 + Npgsql in Infrastructure: `AppDbContext` with snake_case names, first migration
  (`data_protection_keys`), migrations applied on start-up, Data Protection keys stored in the database.
  Connection string `ConnectionStrings:Database` from user-secrets locally, environment variable in production.
  `GET /api/health` (no database access). New test projects `Api.Tests` and `Infrastructure.Tests`
  (7 tests in total); `dotnet-ef` as a local tool. Build is clean, tests pass.
- Neon project created by the owner (branches `main` and `dev`). Checked against `dev`: migration
  applied, Data Protection key stored and reused after a restart, `/api/health` returns 200 without a query.
- API produces JSON only; frontend API types regenerated (they now include `/api/health`).

**Decisions**
- ADR 0009: snake_case database names, migrations and a design-time factory in Infrastructure, EF Core
  versions pinned transitively.

**Next**
- F-008: CI pipeline.

## 2026-10-27 (8)

**Done**
- F-005: Storybook merged into `develop` (PR #5).
- F-006: Playwright 1.64 in `frontend/`: projects `desktop-chromium` and `mobile-chromium` (Pixel 7), web server
  starts `npm run dev` (reuses a running one locally), CI-ready settings, smoke test for the home page in
  `frontend/e2e/`. Scripts `e2e`, `e2e:ui`, `e2e:report`, `clean:playwright`. E2E (2 tests), lint, typecheck,
  unit tests and build pass.

**Next**
- F-007: database and health check.

## 2026-10-27 (7)

**Done**
- F-004: frontend scaffold merged into `develop` (PR #4).
- F-005: Storybook 10.6 (Vite builder) in `frontend/.storybook/`: stories wrapped in `AppProviders` (Mantine theme,
  query client, i18n), toolbar for light/dark mode, Mobile / Tablet / Desktop viewport presets (Mobile by default),
  docs and a11y addons, `eslint-plugin-storybook`. Sample story for `ColorSchemeToggle` with a play function.
  Lint, typecheck, tests, app build and Storybook build pass without warnings.

**Next**
- F-006: Playwright setup.

## 2026-10-27 (6)

**Done**
- F-003: backend scaffold merged into `develop` (PR #3).
- F-004: frontend scaffold in `frontend/`: Vite 8 + React 19 + TypeScript (strict), Mantine 9 with theme and
  light/dark mode, React Router 8, TanStack Query, react-i18next (English, typed keys), openapi-fetch client with
  generated types, ESLint + Prettier, Vitest + RTL + MSW (5 tests), `/api` dev proxy. Lint, typecheck, tests and
  build pass.

**Decisions**
- ADR 0008: frontend needs Node 24 LTS; TypeScript pinned to 5.9 (tooling doesn't support TypeScript 7 yet).

**Next**
- F-005: Storybook.

## 2026-10-27 (5)

**Done**
- F-003: backend scaffold in `backend/`: `PupBudgetPlanner.slnx` with Domain, Application, Infrastructure, Api and
  Domain.Tests, Application.Tests; central package management, warnings as errors, analyzers, `.editorconfig`.
  `dotnet build` is clean and `dotnet test` passes (3 tests).

**Decisions**
- ADR 0007: backend tests run on Microsoft.Testing.Platform (required by xUnit v3 4.x on the .NET 10 SDK).

**Next**
- F-004: frontend scaffold.

## 2026-10-27 (4)

**Done**
- F-001: planning docs merged into `develop` (PR #1, squash merge).
- F-002: private GitHub repo `yuliaBiriukova/PupBudgetPlanner` with `main` and `develop` (default branch);
  squash and merge commits allowed, rebase disabled, branches deleted after merge.

**Next**
- F-003: backend scaffold.

## 2026-10-27 (3)

**Done**
- Data model: enums documented (`TransactionType`, `CategoryKind`, `Currency`, `Institution`, `FamilyRole`,
  `RateSource`), stored as text; consistency rules for transactions.
- Change description files renamed from `README.md` to the folder name (`F-018-…/F-018-….md`);
  backlog links point to them.
- Rules added: squash merge for PRs into `develop` (merge commit for releases into `main`); every PR has a
  short description of its changes (template in `.github/pull_request_template.md`); a folder and description
  file are created as soon as a change is added to the plan.

**Next**
- Owner finishes reviewing the planning docs.
- F-002: `gh auth login`, create the repo, configure merge settings, open the F-001 pull request.

## 2026-10-27 (2)

**Done**
- Added the git workflow to `CLAUDE.md`: `main` (only deployed) ← `develop` ← `feature/F-…`,
  `improvement/I-…`, `bugfix/B-…`; commit messages start with the ID; pre-push checklist.
- Created `docs/changes/` with one folder per change and templates; 26 MVP features (F-001 – F-026)
  replace the old `T-xxx` tasks.
- Design process: 3 HTML prototypes per screen, stored in the change folder.
- Hosting revised (ADR 0002): one Render service serving SPA + API — standard setup, least risk for
  Google sign-in; keep-awake ping 07:00–23:00; Data Protection keys in the database.
- Storybook: free Render static site.
- All open questions answered.
- Branches `develop` and `feature/F-001-planning-docs` created locally.

**Next**
- F-002: owner runs `gh auth login`, then create the repo, push, open the F-001 pull request.
- F-003 / F-004: scaffold backend and frontend.

## 2026-10-27

**Done**
- Analysed the Google Sheets budget (Yulia 2026, Vlad 2026) and derived the default categories and the report layout.
- Agreed on the stack: ASP.NET Core (.NET 10) + React/TypeScript + Mantine, PostgreSQL on Neon, hosting on Render,
  GitHub Actions CI, Identity with Google sign-in, NBU exchange rates, Playwright for UI tests, Storybook.
- Created the repository with planning documents and ADRs 0001–0006.
- Installed the GitHub CLI.

**Decisions**
- Integration tests and email (Resend) moved to after the MVP; Google sign-in is in the MVP.
- Categories are personal; removing default categories and private data are after the MVP.
- One family per person. UI in English; Ukrainian later. Recurring transactions are out of scope.
