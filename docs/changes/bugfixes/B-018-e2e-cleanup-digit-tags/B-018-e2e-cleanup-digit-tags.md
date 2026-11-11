# B-018 · The E2E clean-up leaves test accounts whose tag has digits (`e2e-i024-shots-…`)

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (test accounts pile up in the shared `dev` database against the working agreement; they can be deleted by hand on the People page, and nothing in the app is affected) |
| Status | Done |
| Branch | `bugfix/B-018-e2e-cleanup-digit-tags` |
| Found in | The `dev` database on Neon, 2026-11-11: a check after the full E2E run while building F-023 (first seen during I-029) |
| Approved | 2026-11-11: the owner approved the root cause and the fix ("Approved, build it") |

## Steps to reproduce
1. Make a test person with a tag that has a digit, as the screenshot scripts of earlier changes did:
   `newPerson('i024-shots')` → `e2e-i024-shots-1731300000000-k3x9qa@example.com`.
2. Run the E2E tests (the `cleanup` teardown runs at the end).
3. Open the People page (or `GET /api/admin/people`) as the tests' admin.

## Expected
Every `e2e-<tag>-<ms>-<rand>@example.com` account is gone; only the tests' admin `e2e-admin@example.com` is left
of the `e2e-…` accounts.

## Actual
The person from step 1 is still there. On 2026-11-11 the `dev` database still had 51 such accounts from earlier
changes' screenshots and debugging: `e2e-i022-shots-…`, `e2e-i024-shots-…`, `e2e-i028-shots-…`, `e2e-i030-shots-…`,
`e2e-b004-shots-…`, `e2e-b004-debug-…`, `e2e-b009-shots-…`. The invite links made for them (`For e2e-i024-shots-…`)
stay waiting too.

## Root cause
The clean-up (`frontend/e2e/cleanup.teardown.ts`) deletes only the people whose email matches `TEST_PERSON_EMAIL` in
`frontend/e2e/auth.ts`:

```ts
/^e2e-[a-z-]+-\d+-[a-z0-9]{1,6}@example\.com$/
```

The tag part `[a-z-]+` allows letters and hyphens only, but `newPerson(tag)` takes any tag. The specs' own tags
(`accounts`, `list-gap` …) have no digits, so the E2E runs clean up after themselves; the throwaway screenshot
scripts named their people after the change (`i024-shots`), and those never match. The two sides of one rule ("the
emails newPerson makes, and only those") were written apart, with nothing checking that they agree.

## Fix
1. Allow digits in the tag: `/^e2e-[a-z0-9-]+-\d+-[a-z0-9]{1,6}@example\.com$/`. It still needs the
   `-<ms>-<rand>@example.com` end, so `e2e-admin@example.com` (and any address not on `example.com`) never matches.
2. `newPerson` refuses a tag whose email the pattern would not match (throws "the clean-up would not find …"), so a
   tag the clean-up misses can't be made again (e.g. one with capitals or an underscore).
3. The next E2E run's clean-up deletes the 51 leftovers and cancels their waiting invite links; checked through
   `GET /api/admin/people` as the tests' admin.
4. CLAUDE.md "Clean up test data": the test emails are `e2e-<tag>-…@example.com` with a tag of lowercase letters,
   digits and hyphens, made with `newPerson` (also by hand-run scripts).

## Tests
- Regression test (`frontend/e2e/test-people.spec.ts`, no browser, desktop project only): the pattern matches
  `newPerson('i024-shots')` and the specs' tags, and the 7 leftover tag shapes; it doesn't match
  `e2e-admin@example.com`, an `e2e-…` address on another domain, or one without the `-<ms>-<rand>` end; `newPerson`
  throws for `I024_Shots`. Fails before the fix (the `i024-shots` case), passes after it.
- The full E2E run, then `GET /api/admin/people` as the tests' admin: no `e2e-…` account but the admin.

## Result
- The regression test failed on the old pattern (`e2e-i022-shots-…` not matched, `newPerson('I024_Shots')` didn't
  throw) and passes with the fix.
- `dev` database, 2026-11-12, before the run: 52 `e2e-…` accounts (24 `b004-shots`, 12 `b004-debug`, 4 each of
  `i022-shots`, `i028-shots` and `b009-shots`, 2 `i024-shots`, 1 `i030-shots`, and the admin). The full E2E run
  against this branch's API and web app (89 passed, 19 skipped); after its clean-up `GET /api/admin/people` lists the
  admin as the only `e2e-…` account, and `GET /api/admin/invitations` has no waiting link.
