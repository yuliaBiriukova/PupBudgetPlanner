# F-026 · MVP launch

| | |
|---|---|
| Type | Feature |
| Milestone | M6 — MVP release |
| Status | Done (2026-11-14); released 2026-11-14 (#107); left: the owner's launch-checklist rows and the owner's part of the smoke check |
| Branch | `feature/F-026-mvp-launch` |
| Design | not needed for the review itself; a fix that changes how a screen looks becomes its own 🎨 change |
| Approved | 2026-11-14 (the plan, "Approved, start"); 2026-11-14 the findings list: fix #1 – #6 here, leave #7 ("Fix 1–6, leave 7") |

## Goal

Release the MVP and start using it instead of the spreadsheet: every screen checked once more as a whole, at every
size and in both colour schemes, the production setup checked against a list, a short guide for the family, and
the release to `main`.

## How the work goes

Five steps. Steps 1, 3 and 4 are reviews and docs, so they start as soon as this plan is approved. Step 2 (fixes)
writes code, so it waits for the owner's second approval, of the findings list.

1. **Review pass** — Claude goes through every screen and state below and writes what it finds into
   [`findings.md`](findings.md) in this folder: what, where (screen, width, scheme), a screenshot sent in chat, and a
   proposed priority from [the scale](../../README.md#priority). Nothing is fixed during the review.
2. **Fixes** — the owner goes through `findings.md` and approves it ("approved, fix these"):
   - small fixes (a missing `aria-label`, a contrast token, a wrong text, a focus ring, an empty state's line) are
     made on this branch, each with its test;
   - anything bigger (a screen that should look different, new behaviour, a backend change) gets its own `I-` or
     `B-` change with a priority and a backlog row, and goes through the usual approval (and a prototype for 🎨).
     The owner decides for each whether it has to be in before the launch or can wait.
3. **Launch checklist** — below; Claude checks what the repository and the public addresses show, the owner checks
   the dashboards (Claude doesn't sign in to them).
4. **User guide** — a short "Using Pup Budget" section in the README (outline below), and the README's stale status
   line ("planning / Milestone 0") replaced.
5. **Release** — this PR into `develop`, then a release PR `develop` → `main` (merge commit) with everything not yet
   on `main`; the owner merges it. After the deploy, a smoke check on production (below).

## Acceptance criteria

- [x] Every screen and state in the review list was looked at at 375, 768 and 1440 px, light and dark; the real
      pages passed the axe check (`npm run design:check` on the running app with `--storage`); keyboard-only use
      and 200% zoom tried on each page.
- [x] `findings.md` lists every finding with a priority and what happened to it (fixed here, its own change, or
      left with the owner's word).
- [x] Every finding the owner put before the launch is fixed and covered by a test.
- [ ] Every row of the launch checklist is ticked, with the date and who checked it. (Claude's rows done; the owner's
      are left to the owner.)
- [x] The README has the user guide and a current status line.
- [x] The full E2E suite is green against the production build (phone and desktop), and CI is green.
- [ ] The release PR `develop` → `main` is open (#107, merged 2026-11-14); after the owner merges it, the
      production smoke check passes (Claude's part passed; the owner's is left).

## Review list

Each page at **375 px** (phone), **768 px** (tablet) and **1440 px** (desktop), **light and dark**. For every page:
layout (nothing cut off, overlapping or scrolling sideways; touch targets 44 px), the axe scan (contrast, labels,
names, landmarks, headings), keyboard (Tab order, visible focus, Escape closes pop-ups, Enter submits), 200% browser
zoom (DESIGN_RULES §7), and the texts (sentence case, through i18n keys, no leftover English placeholders).

| Area | Screens and states |
|------|--------------------|
| Start | Startup screen: waking up, offline ("You're offline."), server error; 404 page |
| Sign-in | Sign in, Create account, Continue with Google error, wrong password, blocked account; invite page: valid, used, expired, cancelled link |
| Shell | Sidebar open and collapsed, phone tab bar and More, the + menu, waking-up and offline pills, install card and install sheet, update toast, toasts on phone and desktop |
| Transactions | Empty month, a full month, calendar open and closed, a picked day, a picked category, filters (sidebar, tablet buttons, phone sheet), periods (custom range), long notes and big amounts |
| Add transaction | Expense, income, transfer, exchange (NBU rate, own rate, no rate), the phone keys and the calculator, note suggestions, validation errors, edit and delete, the keyboard on the phone |
| Accounts | No accounts yet, grouped by currency and by source, add / edit (card styles, currency list), archive, restore, delete for good, the "In total" line without rates |
| Reports | Monthly and yearly, empty year, another report currency, a family report, rates missing |
| Categories | Manage: add, rename, reorder, remove a category and a group; the last category of a group; a long name |
| Family | No family yet, owner, member, invite links (one list), privacy settings, a member's view with hidden accounts |
| Settings | Name, report currency (incl. another currency), theme |
| People (admin) | People list with search and sort, bulk Block / Delete, Invite links tab with its groups, a new link dialog |

**Error states** checked on top of the empty ones: the API down while the app is open (a save fails), a 500 from one
request, the NBU unreachable (rates missing), the session expired (back to Sign in), a slow first request at night
(waking up), offline after the app is installed.

**How:** a signed-in test person made with `newPerson` (tag `f026-review`) on the local app against the `dev`
database, with test accounts, transactions and a family made through the UI or the API; the design check and
screenshots run from throwaway scripts in the git-ignored `frontend/test-results/`. Error states are made by stopping the API, Playwright's
`route()` and offline mode. All test people and links are deleted at the end (CLAUDE.md "Clean up test data"), and
the PROGRESS entry says so.

## Launch checklist

| # | Check | Who | Done |
|---|-------|-----|------|
| 1 | Render env vars set on `pup-budget-planner`: `ConnectionStrings__Database` (Neon `main`, direct), `Authentication__Google__ClientId` / `ClientSecret`, `Access__AdminEmails__0`, `Access__SignUp = InviteOnly`, `Cleanup__Secret` | Owner (dashboard) | — |
| 2 | No secrets in the repository or its history (search for connection strings, client secrets, keys) | Claude | Claude, 2026-11-14: none in the files or the history; the only password is CI's throwaway PostgreSQL container's (`postgres`), and no `.env` or secrets file is tracked |
| 3 | Production uses the Neon `main` branch, the local app and E2E only `dev` | Owner (Neon), Claude (config) | Claude, 2026-11-14: no connection string in the repo's settings; production's comes only from Render's setting, the local one from user-secrets. Owner: — |
| 4 | Neon free plan: the current restore window (history retention) noted here, and how to restore a branch to a moment written down; storage and compute hours this month far from the limits (0.5 GB, 100 CU-hours) | Owner (Neon console) | — |
| 5 | Render free plan: instance hours used this month vs 750, the service not suspended, auto-deploy only from `main` after checks pass (`render.yaml`) | Owner (dashboard), Claude (`render.yaml`) | Claude, 2026-11-14: `render.yaml` deploys the app and Storybook only from `main`, `autoDeployTrigger: checksPass`, free plan. Owner: — |
| 6 | cron-job.org: the keep-awake ping (every 14 min, 07:00–23:00 Kyiv) and the morning clean-up (07:05) both green in their recent history | Owner (cron-job.org) | — |
| 7 | Google sign-in: the consent screen is in Testing, and every family member who signs in with Google is a test user | Owner (Google Cloud) | — |
| 8 | GitHub Actions minutes this month leave room for the release run (I-031) | Owner (GitHub billing) | — |
| 9 | Production answers: `GET /api/health` 200, the manifest as `application/manifest+json`, HTTPS only, the service worker registered, the security headers sent | Claude (public addresses) | Claude, 2026-11-14, before the release: `/api/health` 200 in 0.4 s, `http://` redirects to `https://` (301), HSTS sent; no security headers yet (findings #4, fixed on this branch). The manifest, service worker and headers come with the release: checked again after it |
| 10 | Production data: no test accounts or test data left on production that shouldn't be there (People page) | Owner | — |

## User guide (README outline)

A short section, written for the family, not for developers:

1. **Getting in** — an invite link from the owner; create an account with email and password or Google.
2. **Install it** — the existing "Install it on your phone" section, moved here.
3. **First steps** — add your accounts with today's balance (card, cash, each currency); that is the starting point
   instead of the spreadsheet.
4. **Every day** — the + button: expense, income, transfer, exchange; the phone keys work as a calculator.
5. **Looking back** — Transactions (month, calendar, categories), Reports (month and year, in your report currency).
6. **Family** — invite someone, what they see, and how to hide an account or transactions (privacy).
7. **Good to know** — at night the server sleeps and the first page can take up to a minute; the app says "A new
   version is ready." after a release; offline you can look but not save.

## Production smoke check (after the owner merges the release)

- Claude: `/api/health` 200, the app and the manifest load, the new version reaches an open page (update toast).
- Owner: sign in (email and Google), add and delete one transaction, open Reports, install the app on Android and the
  iPhone, open it at night while the server sleeps (F-025's leftover check).

## Tasks

- [x] Review pass, [`findings.md`](findings.md) written, screenshots sent in chat (2026-11-14)
- [x] Owner approves the findings list (2026-11-14: fix #1 – #6, leave #7)
- [x] Fixes made: #1 – #6 on this branch, each with a test; none needed a change of its own (2026-11-14)
- [ ] Launch checklist done (Claude's rows 2026-11-14; the owner's rows are left to the owner)
- [x] User guide in README, status line updated (2026-11-14)
- [x] Full checks: lint, typecheck, unit, E2E against the production build, `--repeat-each=3` on changed tests
- [x] PR into `develop`
- [x] Release PR `develop` → `main` (#107), merged by the owner 2026-11-14
- [ ] Production smoke check after the owner's merge: Claude's part done 2026-11-14 (health, security headers,
      manifest, service worker; the update notice waits for the next release); the owner's part is left

## Tests

- Unit: one for each fix that changes logic or markup (e.g. an `aria-label` found by role).
- E2E (Playwright): the full suite green against the production build, phone and desktop; a new test only where a
  fix changes a flow.
- Screens checked in Playwright screenshots (phone / tablet / desktop, light / dark): every page in the review list.

## Open points

- **Owner's own data on production:** is there anything from earlier trying-out on production you want gone before
  you start for real? (Claude doesn't touch your account; you delete it yourself, or tell Claude what.)
- **Backups beyond Neon's restore window:** for the MVP, Neon's restore window only (proposal); a regular export comes
  with M11 (Excel export). Say if you want a monthly manual backup step in the guide instead.
- **Web address:** stays `pup-budget-planner.onrender.com` for the MVP (proposal); a custom domain is post-MVP.
- **Google app published:** stays in Testing (needs a privacy policy page to publish, F-012) — fine for a family of
  test users (proposal).
