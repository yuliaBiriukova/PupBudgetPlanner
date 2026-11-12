# B-019 · A Family privacy unit test fails on CI's release run: it looks inside a fold that is still opening

| | |
|---|---|
| Type | Bugfix |
| Priority | High (it turned the release PR red; the app itself is fine, only the test races) |
| Status | Done |
| Branch | none: committed on `develop` at the owner's request, in the scope of the release PR (#96) |
| Found in | CI, `Frontend` job, release PR #96 (`develop` → `main`) on 2026-11-12: run 43292755373 |
| Approved | 2026-11-12: the owner asked for the fix in chat ("fix in the scope of this pr") after the root cause and the planned fix |

## Steps to reproduce
1. Run the frontend unit tests on a busy machine, as CI's 4-core runner is with 4 test workers.
2. `src/features/family/FamilyPrivacy.test.tsx` › "keeps a category private and shares it again" fails now and then.

## Expected
The test passes every time, as it did on F-030's (#93) and I-006's (#95) PRs.

## Actual
`TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Choose
categories"`. In the failure's dump the "Private categories" fold is already open (`aria-expanded="true"`). The other
386 tests passed.

## Root cause
The three rows of "What the family sees" (`Fold` in `PrivacySection.tsx`, F-030) open with Mantine's `Collapse` and a
160 ms transition. Until it ends, the fold's body is still `aria-hidden`, `inert` and `display: none`, so Testing
Library can't find anything in it. The test taps the fold and then looks for "Choose categories" at once with
`getByRole`, which doesn't wait. On a quiet machine the transition usually ends in time; on a busy runner it doesn't.
Four places do this: the two "Choose categories" taps and the two "Only totals by category" taps after opening "Your
transactions". Nothing else in the app uses `Collapse`.

## Fix
In the four places, wait for the element with `findByRole(…, LOADED)` (the busy-runner wait from B-017) instead of
`getByRole`. Only the test file changes; the app keeps its transition.

## Tests
- `npx vitest run src/features/family`, ESLint, Prettier and the typecheck pass.
- The release PR's CI runs the Frontend job again.
