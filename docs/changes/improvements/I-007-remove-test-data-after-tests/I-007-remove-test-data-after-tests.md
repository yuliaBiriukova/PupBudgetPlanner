# I-007 · Remove test data after tests

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | High |
| Status | Done |
| Branch | `improvement/I-007-remove-test-data-after-tests` |
| Design | not needed |
| Approved | 2026-10-29, the owner asked for it in so many words (docs only) |

## Goal
Accounts, invite links and other data created for testing are removed when the tests are done, so the shared
`dev` database does not fill up with test data. Found by the owner after F-028, 2026-10-29: the owner had to
clean the dev database by hand through the People page.

## Acceptance criteria
- [x] `CLAUDE.md` says: any account or data Claude creates for testing (by hand in the browser, through the API or
      by E2E tests against a shared database) is removed when the tests are done; the change's PROGRESS entry says
      it was cleaned up.
- [x] The rule names how to remove it (the People page / admin API, or the test's own clean-up), and that the
      owner's own account and data are never touched.
- [x] The rule is also in the "Definition of done" list and the PR template.

## Tasks
- [x] `CLAUDE.md`: the rule in "How we work" and a definition-of-done item.
- [x] `.github/pull_request_template.md`: a checklist item.
- [ ] Later, in code (separate approval): E2E tests delete the accounts they create. Not part of this change: the
      owner approved the docs only; it gets its own improvement if the owner wants it.

## Tests
- Docs only.

## Notes
- Where test data lands: local E2E runs and checks by hand use the shared `dev` database on Neon. CI's E2E job has
  its own throwaway Postgres, so nothing needs removing there.
- How to remove it: the admin's People page or `POST /api/admin/people/delete` (at most 200 at a time). Deleting
  an account deletes its categories too; invite links it made or used stay, with the person cleared. Invite links
  can only be cancelled until I-006 adds deleting them.
- How to find it: test accounts have `@example.com` emails (`e2e-…` from E2E tests, `e2e-admin@example.com` for
  the tests' admin); E2E invite links have the note `E2E`.
