# I-010 · Run every Storybook story in CI

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | High (proposed: it stops UI gaps reaching the owner) |
| Status | Dropped (2026-10-30, owner) |
| Branch | `improvement/I-010-storybook-tests-in-ci` |
| Design | not needed |
| Approved | — (dropped before approval) |

## Dropped (2026-10-30)
The owner dropped I-010 before it was built: running the stories takes too long (all ~112 stories headless took
~10 minutes while building I-012), so stories are no longer run as tests, neither during development nor in CI.
Stories are still written for every component and screen (CLAUDE.md), play functions included; CI keeps
`build-storybook`. The plan below is kept for the record.

## Goal
CI runs every Storybook story — its play function and an axe accessibility scan — and a story that fails or has
accessibility violations fails the build. Today CI only runs `build-storybook`, which proves the stories compile,
not that they work.

Why now: in F-014 (Accounts page, PR #29) the change was called ready after only building Storybook. Running every
story afterwards (a one-off headless Playwright script over Storybook's `index.json`, then axe) found a real UI gap:
the account form's mistakes were too quiet. The owner asked why every tool in the workflow had not been used before
saying it was ready. A CI check can't be skipped.

## Acceptance criteria
- [ ] CI runs every story on every pull request and push to `develop` / `main`: it renders, its play function (if
      any) runs to the end, and axe scans the result.
- [ ] A failing play step (a thrown error or a failed `expect`) fails CI, and the log names the story.
- [ ] An axe violation fails CI (`parameters.a11y.test: 'error'`), and the log names the story and the rule.
- [ ] Every existing story passes, in light and dark. Real violations found on the way are fixed in the app's
      components, not hidden; a rule is turned off only where this description says so.
- [ ] Component stories (a piece of a page) are not failed by the page-level rules `landmark-one-main` and
      `page-has-heading-one`; stories of whole screens still get them.
- [ ] One local command runs the same check: `npm run test:stories` in `frontend/`.
- [ ] `npm test` stays the fast jsdom unit tests only (no browser needed).
- [ ] The Frontend job's run time grows by at most ~2 minutes; the time is noted in the PROGRESS entry.

## Tasks
- [ ] `npx storybook add @storybook/addon-vitest` in `frontend/` (adds `@storybook/addon-vitest`, `@vitest/browser`,
      `@vitest/browser-playwright`; all MIT). Check what it writes against the plan below.
- [ ] `vite.config.ts`: split `test` into two Vitest projects — `unit` (today's jsdom settings) and `storybook`
      (the `storybookTest` plugin, browser mode with `playwright({})`, Chromium, headless, setup file
      `.storybook/vitest.setup.ts`).
- [ ] `.storybook/vitest.setup.ts`: `setProjectAnnotations([a11yAddonAnnotations, projectAnnotations])`.
- [ ] `.storybook/preview.tsx`: `a11y.test: 'todo'` → `'error'`, and the component / page rule split (see Notes).
- [ ] Dark: run every story a second time with `colorScheme: 'dark'` (a second Vitest project whose setup file
      adds `initialGlobals: { colorScheme: 'dark' }`), so contrast is checked in both schemes.
- [ ] `package.json`: `test` → `vitest run --project=unit`, `test:watch` → `vitest --project=unit`, new
      `test:stories` → `vitest run --project=storybook --project=storybook-dark`.
- [ ] `.github/workflows/ci.yml`, Frontend job: "Install Playwright browser" and "Storybook tests" steps after
      "Unit tests" (see Notes). Keep "Build Storybook".
- [ ] Run all stories; fix what fails (story or component), each fix named in the PROGRESS entry.
- [ ] Prove it fails: on the branch, break one play step and add one axe violation, see CI go red with clear
      messages, then remove both (noted in the PR, not merged).
- [ ] Docs: `CLAUDE.md` "Definition of done" and "Before every push" name `npm run test:stories`;
      `docs/ARCHITECTURE.md` / F-005 notes (stories are tests now); an ADR for the choice below.

## Tests
- Unit: none new; the existing ones keep passing under the `unit` project.
- Stories: every story, light and dark, via `npm run test:stories`, locally and in CI.
- E2E (Playwright): unchanged.
- Screens: no UI change planned. If a fix changes a component's look, its screens get the usual Playwright
  screenshots (phone and desktop, light and dark).

## Notes

### Options compared
| | Vitest addon (`@storybook/addon-vitest`) — **recommended** | Test runner (`@storybook/test-runner`) |
|---|---|---|
| How it runs | Turns each story into a Vitest test, run in a real Chromium through Vitest browser mode + Playwright | Jest + Playwright visit every story of a running or built Storybook |
| Needs a running Storybook | No | Yes: `build-storybook`, serve `storybook-static` (`http-server`), `wait-on`, then `test-storybook` |
| Fit with this repo | Vitest 5 and Vite 8 already here; addon 10.6 accepts Vitest `^4 \|\| ^5` and `@vitest/browser-playwright` `^4 \|\| ^5` (checked on npm, 2026-10-30) | Adds Jest and its config next to Vitest; extra packages to serve and wait |
| A11y | `a11y.test: 'error'` fails the test; violations listed per story | Runs the a11y addon's checks too (same parameter) |
| Storybook's advice | "For Vite-powered frameworks, we recommend using the Vitest addon" | Called superseded by the Vitest addon |
| Local use | Also in Storybook's sidebar (test widget, with an Accessibility checkbox) and `vitest --project=storybook` | CLI only, Storybook must be up |

References:
- Vitest addon: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon — install, `storybookTest`
  plugin, `playwright({})` provider for Vitest 4+, no running Storybook needed, `--shard` if CI gets slow.
- Accessibility tests: https://storybook.js.org/docs/writing-tests/accessibility-testing — `a11y.test`
  (`'off'` / `'todo'` / `'error'`), `a11y.config.rules`, `a11y.context`, the addon turning `region` off by default.
- Test runner: https://storybook.js.org/docs/writing-tests/integrations/test-runner — CI recipe and "superseded".

### `a11y.test`: 'todo' → 'error'
Today `.storybook/preview.tsx` has `a11y: { test: 'todo' }`: checks run in the Storybook panel, but nothing fails
and CI shows nothing. With `'error'` a violation fails the story's test in the Storybook UI and in CI. A story may
set `'todo'` only for a known, recorded problem (with an ID in the backlog), never to make CI green silently.

### Component stories and page-level rules
axe has rules about a whole page that a component on its own can't meet. The a11y addon already turns `region` off
by default. Two remain:
- `landmark-one-main` — the page has a `<main>`;
- `page-has-heading-one` — the page has an `<h1>`.

F-014's one-off run found exactly these on the 5 `AccountCard` stories, and they would also hit `Logo`, `WakePill`,
`ColorSchemeToggle`, `BottomSheet`, `ResponsiveDialog` and the page stories rendered without the shell (People:
`PeoplePage` has an `h1` but its `<main>` comes from `AppLayout`).

Plan: in `preview.tsx` turn the two rules off for every story
(`a11y.config.rules: [{ id: 'landmark-one-main', enabled: false }, { id: 'page-has-heading-one', enabled: false }]`)
and turn them back on, with a shared `pageA11y` parameter from `.storybook/`, for whole-screen stories that render
both a `<main>` and an `<h1>` (candidates: `AppLayout`, and the auth and invite screens, whose `<main>` comes from
`AuthLayout`; the build checks which really have both). Arrays in parameters
are replaced, not merged, so the shared parameter keeps the list in one place. All other rules stay on everywhere.

Rejected: turning the two rules off only on component stories (every new component story would have to remember
it; forgetting fails CI for no real problem), or putting `<main>` / `<h1>` wrappers in a decorator (hides a missing
`<main>` on real screens).

### Where it runs in CI, and the cost
In the existing **Frontend** job, after "Unit tests":
```yaml
      - name: Install Playwright browser
        run: npx playwright install --with-deps chromium

      - name: Storybook tests
        run: npm run test:stories
```
Measured on the last `develop` run (2026-10-29): Frontend 1.5 min, E2E 2.2 min (the longest), Docker 2.0, Backend
0.9. The E2E job installs Chromium in 20 s. Estimate for 81 stories today (19 with play functions; F-014 adds 25),
twice for light and dark: about 1 min, so Frontend grows to ~3 min and the whole run's wall clock by ~1 min. The
repository is private, so this is ~1–2 more billed Actions minutes per run (GitHub Free: 2,000 a month).

A separate parallel job would keep the wall clock as it is but pay another `npm ci` and set-up (~2 billed minutes
more per run); worth it only if the Frontend job becomes the slowest by far. If the run gets slow, Vitest's
`--shard` splits it.

### Open points to check while building
- The `viewport` global (mobile 375 px by default): whether Vitest browser mode applies it per story, or the
  browser's own size is used. Either way the stories must pass; note which size was tested.
- The dark pass as a second Vitest project with its own setup file. If it can't be done this way, stop and ask
  before changing the plan (dark-only stories already exist for the main screens).
- Stories mock the API with `MockFetch` (patches `fetch`), which also works in a real browser; nothing to change.
