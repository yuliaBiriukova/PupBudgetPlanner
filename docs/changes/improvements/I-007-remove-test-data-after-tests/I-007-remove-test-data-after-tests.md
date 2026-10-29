# I-007 · Remove test data after tests

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | High |
| Status | Todo |
| Branch | `improvement/I-007-remove-test-data-after-tests` (planned on `plan/f028-follow-ups`) |
| Design | not needed |
| Approved | 2026-10-29, the owner asked for it in so many words (docs only) |

## Goal
Accounts, invite links and other data created for testing are removed when the tests are done, so the shared
`dev` database does not fill up with test data. Found by the owner after F-028, 2026-10-29: the owner had to
clean the dev database by hand through the People page.

## Acceptance criteria
- [ ] `CLAUDE.md` says: any account or data Claude creates for testing (by hand in the browser, through the API or
      by E2E tests against a shared database) is removed when the tests are done; the change's PROGRESS entry says
      it was cleaned up.
- [ ] The rule names how to remove it (the People page / admin API, or the test's own clean-up), and that the
      owner's own account and data are never touched.
- [ ] The rule is also in the "Definition of done" list and the PR template.

## Tasks
- [ ] `CLAUDE.md`: the rule in "How we work" and a definition-of-done item.
- [ ] `.github/pull_request_template.md`: a checklist item.
- [ ] Later, in code (separate approval): E2E tests delete the accounts they create. Proposed as part of this
      change only if the owner wants it now.

## Tests
- Docs only.

## Notes
