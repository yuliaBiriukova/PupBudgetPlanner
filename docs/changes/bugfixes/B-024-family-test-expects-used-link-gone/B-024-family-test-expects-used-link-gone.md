# B-024 · A Family E2E test expects a used invite link to be gone, but I-032 lists it

| | |
|---|---|
| Type | Bugfix |
| Priority | High (it turns the release PR #98 red; the app itself is right, only the test is out of date) |
| Status | Done |
| Branch | none: committed on `develop` at the owner's request, in the scope of the release PR (#98), as B-019 |
| Found in | CI, `E2E (Playwright)` job, release PR #98 (`develop` → `main`) on 2026-11-13: run 43403802444 |
| Approved | 2026-11-13: the owner approved the root cause and the planned fix in chat ("Approved, on develop") |

## Steps to reproduce
1. Run `npx playwright test e2e/family.spec.ts` against `develop` (3ef8ad2).
2. "the owner invites someone new, who joins with the link, then removes them" fails at line 80, on the phone and on
   the desktop, whenever the invite links load before the check (on the release PR one project failed all three
   tries, the other passed only on a retry).

## Expected
The test passes every time.

## Actual
`expect(getByText('E2E Andriy', { exact: true })).toHaveCount(0)` gets 1. The page dump shows the owner's Family page
with Andriy in Members and the link in the one list: "E2E Andriy · Used · by Andriy on 13 Nov". That is what I-032
asks for.

## Root cause
- Before I-032 the Family page grouped its links and folded every group but Waiting, so a used link's note wasn't on
  the page, and the test checked that with `toHaveCount(0)`.
- I-032's review commit (d4cedd9, "The Family page lists invite links in one list too") made the Family page show
  links of every status in one list, with nothing folded. The used link's note is now on the page, as it should be.
  The test wasn't updated.
- The test still passed on #97's CI because of a race: after `page.reload()` the family loads first, and while the
  invite links are still loading the page has no "E2E Andriy". `toHaveCount(0)` passes the moment it sees 0, so it
  passed whenever the links came back after the family. On the release PR's run they came back first.

## Fix
Only the test changes. In `frontend/e2e/family.spec.ts`, replace the check at line 80 with one that waits for the
link's row and checks it reads Used, by Andriy (`inviteLinks.status.Used`, `inviteLinks.afterTag.usedBy`). A positive
check like that waits for the list to load, so it can't pass by luck.

## Tests
- [x] `npx playwright test e2e/family.spec.ts --repeat-each=3`: 12 runs on the phone and the desktop, all passed.
- [x] ESLint, Prettier and the typecheck on the frontend.
- [x] Test data: the run's `e2e-family-…@example.com` people and `E2E…` invite links were removed by the clean-up
      teardown.
- [ ] The release PR's CI runs the E2E job again.
