# B-010 · The I-020 E2E test takes two "added" toasts for one

| | |
|---|---|
| Type | Bugfix |
| Priority | High |
| Status | Done |
| Branch | `plan/manage-categories` (fixed on the planning PR whose CI it failed, as the owner asked) |
| Found in | CI on PR #75 (`plan/manage-categories`), 2026-11-06, E2E job, desktop |
| Approved | 2026-11-06, by the owner's request in chat ("Find out why, fix it, and push") |

## Steps to reproduce
1. Run `e2e/accounts.spec.ts` → "a person can't have two accounts in use exactly alike (I-020)" when the steps
   between the two added accounts take less than the toast's 4 s (as on a quick CI runner).

## Expected
The test passes: the second account's toast "Mono black added" is on the screen.

## Actual
`strict mode violation: getByText('Mono black added') resolved to 2 elements`: the toasts "mono black added" (the
dollar account added earlier in the test) and "Mono black added". It failed all three tries on PR #75; on `develop` the
same test had passed 40 minutes before, with the same app code.

## Root cause
The test, not the app. Playwright's `getByText` with a string matches any text that contains it, ignoring case, so
"Mono black added" also matches the earlier "mono black added" while that toast is still shown (Mantine closes it after
4 s). Whether it is still there depends on how quickly the archive steps in between run.

## Fix
Both toast checks in that test match the whole text exactly (`{ exact: true }`).

## Tests
- `e2e/accounts.spec.ts` against this checkout's API and app: 8 / 8 passed (desktop and phone).
- Not shown failing locally first: it depends on timing, and locally the earlier toast had closed in time.
