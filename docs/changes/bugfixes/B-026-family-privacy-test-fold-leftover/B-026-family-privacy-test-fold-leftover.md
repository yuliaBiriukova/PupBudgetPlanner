# B-026 · One more Family privacy unit test looks inside a fold that is still opening (missed by B-019)

| | |
|---|---|
| Type | Bugfix |
| Priority | High (proposed: the same race turned release PR #96 red, B-019) |
| Status | Todo |
| Branch | `bugfix/B-026-family-privacy-test-fold-leftover`, or in I-033's PR if the owner says so |
| Found in | I-033's audit of the unit tests, 2026-11-13 (not failed yet) |
| Approved | — |

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

## Fix (proposed)
`await part.findByRole(…, LOADED)` instead of `getByRole`, as B-019 does at lines 170 and 192. Only the test file
changes.

## Tests
- `npx vitest run src/features/family/FamilyPrivacy.test.tsx --repeats=2`.
