# I-007 · Remove test data after tests

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | High |
| Status | In progress |
| Branch | `improvement/I-007-remove-test-data-after-tests` |
| Design | not needed |
| Approved | Docs: 2026-10-29, the owner asked for it in so many words. E2E clean-up (added 2026-10-29 at the owner's request): — |

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
- [ ] After an E2E run (passed, failed or stopped part-way through its tests), the database has no accounts the
      tests created, and no invite link the tests made is still waiting to be used.
- [ ] The clean-up deletes only test accounts: emails like `e2e-<tag>-<time>-<random>@example.com`. The owner's
      account, any other account and the tests' admin `e2e-admin@example.com` stay. The admin stays because an
      admin can't delete themselves, and it is one account reused by every run.
- [ ] Accounts left over by an earlier run that broke off are removed too.

## Tasks
- [x] `CLAUDE.md`: the rule in "How we work" and a definition-of-done item.
- [x] `.github/pull_request_template.md`: a checklist item.
- [ ] `frontend/e2e/cleanup.teardown.ts`: signed in as the tests' admin, it
      - lists people (`GET /api/admin/people`), picks the test accounts by the email pattern above, and deletes them
        through `POST /api/admin/people/delete` in batches of at most 200;
      - lists invite links (`GET /api/admin/invitations`) and cancels the waiting ones the tests made (note `E2E` or
        `For e2e-…@example.com`).
- [ ] `playwright.config.ts`: a `cleanup` teardown project for the `setup` project. Playwright runs it after the
      desktop and phone projects finish, whether the tests passed or failed.
- [ ] `CLAUDE.md` rule: say the E2E tests clean up after themselves, so a manual clean-up is only needed for what
      was made by hand.

## Tests
- The rule: docs only.
- E2E clean-up: run the E2E tests locally against the `dev` database and compare the People list and the invite
  links before and after the run. Check that only the owner's account and the tests' admin are left, and that the
  test links are no longer waiting. Then run the tests once more with one test made to fail on purpose, and check
  the clean-up still ran. CI runs the clean-up on its throwaway database.

## Notes
- Where test data lands: local E2E runs and checks by hand use the shared `dev` database on Neon. CI's E2E job has
  its own throwaway Postgres, so nothing needs removing there.
- How to remove it: the admin's People page or `POST /api/admin/people/delete` (at most 200 at a time). Deleting
  an account deletes its categories too; invite links it made or used stay, with the person cleared. Invite links
  can only be cancelled until I-006 adds deleting them.
- How to find it: test accounts have `@example.com` emails (`e2e-…` from E2E tests, `e2e-admin@example.com` for
  the tests' admin); E2E invite links have the note `E2E` or `For e2e-…@example.com`.
- What the E2E clean-up can't do yet: used, cancelled and expired invite links can't be deleted until I-006. After
  I-006, its 30-day job removes them, or the clean-up can delete them right away.
- Local runs share the `dev` database. If two E2E runs ran at the same time, one run's clean-up would delete the
  other run's accounts. Only one person runs them, so this is acceptable.
