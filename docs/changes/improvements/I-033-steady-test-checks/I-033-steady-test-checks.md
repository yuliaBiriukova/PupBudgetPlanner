# I-033 · Tests that can't pass by luck: rules for "nothing there" checks, and an audit of the existing ones

| | |
|---|---|
| Type | Improvement |
| Milestone | M6 — MVP release (development) |
| Priority | High (proposed: two releases in a row went red on CI because of a test that had passed by luck, B-019 and B-024) |
| Status | Todo |
| Branch | `improvement/I-033-steady-test-checks` |
| Design | not needed (tests and the working agreement only) |
| Approved | — |

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

- [ ] The working agreement (`CLAUDE.md`) has three rules, each with a "Why" naming B-019 and B-024:
  - A "nothing there" check (`toHaveCount(0)`, `not.toBeVisible()`, `toBeHidden()`, `queryBy…` → `null`,
    `not.toBeInTheDocument()`) comes only after a check that the same part of the page has loaded or that the action
    before it has finished. Where it can, a test checks what *is* there instead (the row reads "Used", not "the
    note is gone").
  - When a change or a review fix changes what a screen shows or hides, the unit and E2E tests are searched for
    the old behaviour (its texts and states) and updated in the same change.
  - Before a push, the changed test files run 3 times in a row: `npx playwright test e2e/<name>.spec.ts
    --repeat-each=3` and the unit test files 3 times.
- [ ] The PR template's checklist has a line for the last two rules.
- [ ] Every "nothing there" check in `frontend/e2e/` (43 today, in 10 files) is anchored as the first rule says, or
      replaced by a check of what is there. Each one changed is listed in the Notes with why.
- [ ] The same for the unit tests in `frontend/src/` (about 104 checks in 19 files): a check after a `findBy…`,
      `waitFor` or an awaited `user` event counts as anchored.
- [ ] No app code changes. If the audit finds a test that is wrong rather than racy (it checks behaviour the app no
      longer has), it is fixed here and noted; a real app bug found on the way gets its own B-… item.

## Tasks

- [ ] Add the three rules to `CLAUDE.md` ("How we work" or "Git workflow"), and the checklist line to
      `.github/pull_request_template.md`.
- [ ] Audit the E2E checks. Start with the two that come straight after a page load:
      `accounts.spec.ts` (around line 243) and `auth.spec.ts` (around line 131).
- [ ] Audit the unit test checks, file by file.
- [ ] Run every changed E2E spec and unit test file 3 times; then the whole E2E suite with `--repeat-each=3` once
      (about 10 minutes, in the background, said up front) to look for other races.
- [ ] PROGRESS entry; this file and the backlog row `Done`.

## Tests

- [ ] Every changed spec and unit test file passes 3 runs in a row, phone and desktop for E2E.
- [ ] The whole E2E suite with `--repeat-each=3`, and the whole unit suite 3 times: all pass.
- [ ] ESLint, Prettier, typecheck.
- [ ] Test data: the E2E runs' `e2e-…@example.com` people and `E2E…` links are removed by the clean-up teardown.

## Notes

- Found 2026-11-13, after B-024 turned release PR #98 red; the owner asked why CI fails on release a second time and
  why it wasn't caught before the change's PR.
- Counts above are from `grep` on `develop` at 532e3cc; the audit recounts.
- Not planned: a custom ESLint rule for unanchored checks (hard to tell "anchored" from the code alone). An idea for
  later if the rules aren't enough.
