# I-033 · Tests that can't pass by luck: rules for "nothing there" checks, and an audit of the existing ones

| | |
|---|---|
| Type | Improvement |
| Milestone | M6 — MVP release (development) |
| Priority | High (proposed: two releases in a row went red on CI because of a test that had passed by luck, B-019 and B-024) |
| Status | Done |
| Branch | `improvement/I-033-steady-test-checks` |
| Design | not needed (tests and the working agreement only) |
| Approved | 2026-11-13, the owner in chat ("Approved, build it") |

## Goal

A test that passes on a change's PR passes on the release PR too. Two releases went red on CI with the app itself
working: the test was out of date or raced the page, and still passed on its change's PR and in the local full run.

- **B-019** (release #96): a unit test opened a fold and looked inside it at once; the fold takes 160 ms to open.
- **B-024** (release #98): an E2E test checked a used invite link was gone right after a reload. The check passed
  while the links were still loading, so it kept passing after I-032's review fix made the link stay on the page.

Behind both: a check that something is *not* there passes as soon as it sees nothing, also before the page has drawn
it. And when a change (or a review fix) changes what a page shows, nothing makes us look for the tests that checked
the old behaviour.

## Acceptance criteria

- [x] The working agreement (`CLAUDE.md`) has three rules, each with a "Why" naming B-019 and B-024:
  - A "nothing there" check (`toHaveCount(0)`, `not.toBeVisible()`, `toBeHidden()`, `queryBy…` → `null`,
    `not.toBeInTheDocument()`) comes only after a check that the same part of the page has loaded or that the action
    before it has finished. Where it can, a test checks what *is* there instead (the row reads "Used", not "the
    note is gone").
  - When a change or a review fix changes what a screen shows or hides, the unit and E2E tests are searched for
    the old behaviour (its texts and states) and updated in the same change.
  - Before a push, the changed test files run 3 times in a row: `npx playwright test e2e/<name>.spec.ts
    --repeat-each=3` and the unit test files 3 times.
- [x] The PR template's checklist has a line for the last two rules.
- [x] Every "nothing there" check in `frontend/e2e/` (43 today, in 10 files) is anchored as the first rule says, or
      replaced by a check of what is there. Each one changed is listed in the Notes with why.
- [x] The same for the unit tests in `frontend/src/` (about 104 checks in 19 files): a check after a `findBy…`,
      `waitFor` or an awaited `user` event counts as anchored.
- [x] No app code changes. If the audit finds a test that is wrong rather than racy (it checks behaviour the app no
      longer has), it is fixed here and noted; a real app bug found on the way gets its own B-… item.

## Tasks

- [x] Add the three rules to `CLAUDE.md` ("How we work" or "Git workflow"), and the checklist line to
      `.github/pull_request_template.md`.
- [x] Audit the E2E checks. Start with the two that come straight after a page load:
      `accounts.spec.ts` (around line 243) and `auth.spec.ts` (around line 131).
- [x] Audit the unit test checks, file by file.
- [x] Run every changed E2E spec and unit test file 3 times; then the whole E2E suite with `--repeat-each=3` once
      (about 10 minutes, in the background, said up front) to look for other races.
- [x] PROGRESS entry; this file and the backlog row `Done`.

## Tests

- [x] Every changed spec and unit test file passes 3 runs in a row, phone and desktop for E2E.
- [x] The whole E2E suite with `--repeat-each=3`, and the whole unit suite 3 times: all pass.
- [x] ESLint, Prettier, typecheck.
- [x] Test data: the E2E runs' `e2e-…@example.com` people and `E2E…` links are removed by the clean-up teardown.

## Notes

- Found 2026-11-13, after B-024 turned release PR #98 red; the owner asked why CI fails on release a second time and
  why it wasn't caught before the change's PR.
- Counts above are from `grep` on `develop` at 532e3cc; the audit recounts.
- **E2E audit (2026-11-13):** 43 "nothing there" checks (`toHaveCount(0)`, `toBeHidden()`) and 9 `not.…` checks on
  the page. All but four come after a toast, a positive check on the same part, or a check that the thing was there a
  moment before (then the check waits for it to go, which can't pass early). The two found by `grep` straight after a
  page load (`accounts.spec.ts` › after the reload, `auth.spec.ts` › the used link) both follow a positive check on the
  same page, so they stay. Changed:
  - `shell.spec.ts` › the phone's +: tapped and closed with Escape (and with a tap on the dimmed page) without seeing
    it open; if the menu opened late, "closed" was seen before it opened. Now it checks Expense is shown first.
  - `transactions.spec.ts` › picking Eating out: "no Groceries" right after the URL changed could be seen while the
    list was drawn again. Now an Eating out line is seen first.
  - `transactions.spec.ts` › a note never used before: "no suggestions" after a fixed 600 ms wait. Now it waits for
    the API's answer for the typed text.
  - `accounts.spec.ts` › the currency search: "no EUR" after typing "dollar". Now USD is seen in the filtered list
    first.
- **Unit test audit (2026-11-13):** 101 "nothing there" checks on the screen in 17 files (the `grep` count of about
  104 also had 29 `toBeNull()` on plain function results, a few positive checks and 2 `localStorage` reads, left
  out). 94 are anchored, 2 are about a dialog drawn from props with nothing fetched (`FadingScrollArea.test.tsx`), 5
  changed. Unit tests render Mantine with `env="test"`, so its transitions draw and remove at once; what stays
  async is data through the fake API (TanStack Query tells the components on the next `setTimeout`), the Note
  field's 200 ms pause, and `Collapse` (Family privacy only). Changed:
  - `TransactionsPage.test.tsx` › "shows only a category picked in Where it went": "no Groceries" was waited for
    without waiting for the list. Now one wait needs Eating out lines there and no Groceries at the same moment.
  - `TransactionsPage.test.tsx` › "asks for the notes of the form's type only" and "on the phone makes room … only
    while earlier notes are listed" (two checks): "no list" after a fixed 400 ms sleep, shorter than the pause plus
    the request on a slow runner. Now they wait for the API's answer for the typed text (`notesAnswered`).
  - `FamilyViews.test.tsx` › "has no lens without a family": "no lens" was checked once the transactions loaded, but
    the lens waits for the family, a request of its own. Now it waits for the family's answer first.
  - New helper `src/test/queries.ts` › `queryAnswered`: waits for a query's answer and the next tick in which the
    components get it, for "nothing there" checks after an answer that draws nothing.
- **Found on the way, not in this change** (each has its own item, `Todo`):
  - [B-025](../../bugfixes/B-025-cleanup-timeout-after-big-runs/B-025-cleanup-timeout-after-big-runs.md): the E2E
    clean-up timed out after the 3× run (30 s); run again on its own it deleted everything.
  - [B-026](../../bugfixes/B-026-family-privacy-test-fold-leftover/B-026-family-privacy-test-fold-leftover.md):
    `FamilyPrivacy.test.tsx` › "hides an account from the family" looks inside a fold still opening, as B-019 did.
  - `CategoriesPage.test.tsx` checks a text that is no longer in `en.json` is absent: it can't fail, but only guards
    against the text coming back, so it stays.
- Not planned: a custom ESLint rule for unanchored checks (hard to tell "anchored" from the code alone). An idea for
  later if the rules aren't enough.
