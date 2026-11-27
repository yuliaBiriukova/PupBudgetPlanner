# I-035 · A field's placeholder stays grey when the field has an error

| | |
|---|---|
| Type | Improvement |
| Milestone | M7 — Budgets |
| Priority | Low |
| Status | Todo |
| Branch | `improvement/I-035-calm-error-placeholders` |
| Design | not needed (one style in the theme; screenshots of the fixed fields shown before the build) |
| Approved | — |

## Goal

When a required field is left empty and the form shows its error, the field's placeholder (e.g. "0", "Name") turns
red with the border and reads as a typed value. The person may think something is filled in when it isn't. Found in
Claude's UX review of the F-034 prototypes (2026-11-17); the owner agreed (2026-11-27) to fix it app-wide in its own
change, not inside F-034.

## Acceptance criteria
- [ ] In every form, a field with an error keeps its placeholder in the usual grey; the border and the error text
      under it stay red.
- [ ] Light and dark both: the placeholder stays readable and is told apart from a typed value.

## Tasks
- [ ] Find where the red comes from (Mantine sets the input's placeholder colour to the error colour in its error
      state) and override it once in `theme.ts` / the shared input styles, not per form.
- [ ] Check the forms with required fields (sign in / sign up, the quick-add form, accounts, categories, the budget's
      amounts, jars once F-034 is built).
- [ ] A unit or E2E check if the fix is more than a theme token.

## Design
References: — (a style fix).
Prototype stories: none needed.

## Tests
- Unit:
- E2E (Playwright):
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
Seen in the F-034 prototype's jar form and move dialog, but it comes from the theme, so every form has it.
