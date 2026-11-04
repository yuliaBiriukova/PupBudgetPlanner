# B-006 · The currency sign overlaps the amount in the calculator display

| | |
|---|---|
| Type | Bugfix |
| Priority | High (a visible defect on the main form: the amount being saved is hard to read) |
| Status | Todo |
| Branch | `bugfix/B-006-currency-sign-overlaps-amount` (planned on `plan/prod-testing-fixes`) |
| Found in | 2026-11-04, production, owner's testing (quick-add form) |
| Approved | — (date the owner approved the root cause and the planned fix) |

## Steps to reproduce

1. Add transaction, a hryvnia account; type `135`.
2. Pick a dollar account; type `414`.

## Expected

The sign has a small gap from the number: `135 ₴`, `$414`, neither touching the digits.

## Actual

The sign runs into the number: the `₴` overlaps the `5` of `135`, the `$` touches or overlaps the `4` of `414`.

## Root cause

Not confirmed yet (to reproduce on production's build and locally). Suspected, in `TransactionForm.module.css`
(`.sign`, `.big`): the number is set in the display font with a negative letter-spacing and the sign is placed right
next to it (a negative margin, or no gap), so with wider digits or the `₴` / `$` glyphs of the fallback font they meet.
It may show only with some fonts or digits, which is why F-018's screenshots didn't catch it. To check: the exchange's
second amount (`data-secondary`) and the phone's sizes (the `@media` rules at the end of `.sign`).

## Fix

Planned: a fixed gap between the number and the sign that doesn't depend on the font (a `gap` in the display's row
instead of margins), for a sign after (`₴`, `€`) and before (`$`, `£`) the number, in both the big and the secondary
display.

## Tests

- Screens checked in Playwright screenshots (375 and 1440 px, light and dark): `135 ₴`, `$414`, `1 250 000 ₴`, `€0`, a
  sum, an exchange's two amounts; zoomed in on the sign.
- A Storybook story with these amounts, so the design check covers them.

## Notes

- The screenshots were shared in chat; not stored in the repo.
