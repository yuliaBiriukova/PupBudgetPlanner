# B-026 · One more Family privacy unit test looks inside a fold that is still opening (missed by B-019)

| | |
|---|---|
| Type | Bugfix |
| Priority | High (proposed: the same race turned release PR #96 red, B-019) |
| Status | Done |
| Branch | `bugfix/B-026-family-privacy-test-fold-leftover` |
| Found in | I-033's audit of the unit tests, 2026-11-13 (not failed yet) |
| Approved | 2026-11-14, the owner in chat ("Approved, build both") |

## Steps to reproduce
1. Run `src/features/family/FamilyPrivacy.test.tsx` on a busy machine, as CI's runner is.
2. The test around line 148 can fail now and then: it taps "Your accounts" and at once looks for "Mono black: the
   family sees everything" with `getByRole`.

## Expected
The test passes every time.

## Actual
Not seen failing yet; the same pattern failed on CI in B-019.

## Root cause
"Your accounts" opens a Mantine `Collapse` (160 ms). Until it ends, the fold's body is `display: none`, so
`getByRole`, which doesn't wait, may not find the button. B-019 fixed the four places that did this with "Choose
categories" and "Only totals by category"; this one, with an account, was missed.

## Fix
`await part.findByRole(…, LOADED)` instead of `getByRole`, as B-019 does for "Only totals by category" and "Choose
categories". Only the test file changes. The file's other clicks without a wait are on the folds' headers, on screen
from the start, or inside a dialog, which opens at once in unit tests (Mantine `env="test"`).

## Tests
- [x] `npx vitest run src/features/family/FamilyPrivacy.test.tsx --repeats=2`: all 12 tests passed, 3 runs each.
- [x] ESLint, Prettier.
