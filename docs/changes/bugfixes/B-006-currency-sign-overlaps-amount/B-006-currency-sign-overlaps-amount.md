# B-006 · The currency sign overlaps the amount in the calculator display

| | |
|---|---|
| Type | Bugfix |
| Priority | High (a visible defect on the main form: the amount being saved is hard to read) |
| Status | Done |
| Branch | `bugfix/B-006-currency-sign-overlaps-amount` (planned on `plan/prod-testing-fixes`) |
| Found in | 2026-11-04, production, owner's testing (quick-add form) |
| Approved | 2026-11-05, the root cause and the planned fix ("Approved, build it") |

## Steps to reproduce

1. Add transaction, a hryvnia account; type `135`.
2. Pick a dollar account; type `414`.

## Expected

The sign has a small gap from the number: `135 ₴`, `$414`, neither touching the digits.

## Actual

The sign runs into the number: the `₴` overlaps the `5` of `135`, the `$` touches or overlaps the `4` of `414`.

## Root cause

Confirmed 2026-11-05, reproduced locally in the quick-add stories (desktop 40 px and phone 34 px). The suspected cause
(no gap, a negative margin) was wrong: the row already has a 4 px `gap` between the number and the sign.

The amount is an `<input>` that grows with what it holds: an invisible copy of the text (`.sizer::after`, content
`attr(data-value) ' '`) sets its width (`TransactionForm.module.css`). The input draws its digits with
`font-variant-numeric: tabular-nums`; the copy doesn't, so it measures Unbounded's proportional digits. In Unbounded
the `1` and `4` are much narrower proportional than tabular, so for numbers made of them the box comes out too narrow:

| Amount | Box (copy, proportional + a space) | Text the input draws (tabular) |
|---|---|---|
| `135`, 40 px | 87 px | 91 px |
| `414`, 40 px | 86 px | 91 px |
| `135`, 34 px (phone) | 74 px | 78 px |

The input then scrolls its text to keep the caret in sight, and the number fills the box to the edge next to the sign:

- **Sign after** (`₴`, `€`): the `5` runs to the box's right edge, so only the 4 px gap is left and the `₴` meets it.
- **Sign before** (`$`, `£`): the text is scrolled 5 px, so the first `4` is cut at its left edge right next to the `$`.

Numbers with wide digits (`1 250 000`, `18 849`) are as wide or narrower tabular, and the copy's trailing space covers
the difference, which is why F-018's and F-019's screenshots (`2 000`, `$100` in the stories) didn't show it.

## Fix

Planned: the copy measures what the input draws.

- `.sizer::after` gets `font-variant-numeric: tabular-nums`, like the input.
- The copy's trailing space goes: with a sign before the number it ended up between the sign and the number (the text
  is right-aligned, so the extra room is on its left). In its place the copy and the input get the same 2 px of room at
  the end for the caret (`padding-inline-end`).
- The 4 px gap stays: once the box fits the number, the gap shows (`135 ₴`, `$414`).

Applies to the big and the secondary (an exchange's To) display, phone and desktop sizes, as they share these rules.
Tried live in the stories: `135` and `414` fit their boxes exactly (no scrolling), the `₴` and the `$` clear of the
digits.

Built as planned (`TransactionForm.module.css`, `.sizer::after` and `.amountInput`).

## Tests

- [x] Screens checked in Playwright screenshots (375 and 1440 px, light and dark): the quick-add form with `135 ₴`, the
      exchange with `$414`, and the new story (`135 ₴`, `$414`, `1 250 000 ₴`, `€0`, a sum, an exchange's two
      amounts); zoomed in on the sign. Every amount fits its box exactly.
- [x] A Storybook story with these amounts, so the design check covers them: `Transactions/Amount display`, its play
      function checks that no amount is wider than its box.
- [x] E2E (jsdom doesn't lay out text, so not a unit test): `transactions.spec.ts` checks the amount's text doesn't
      overflow its box (`scrollWidth` ≤ `clientWidth`) for `135 ₴` and `$414`, desktop and phone. With the old CSS it
      fails by 4 px and 5 px.

## Notes

- The screenshots were shared in chat; not stored in the repo.
- Seen while reproducing, not part of this bug: in the Browser pane the exchange stories' typing (`userEvent.type`)
  sometimes leaves `100` in the From field while the form holds nothing (`$10` shown, To `0`). Typing by hand works.
  A story quirk to look at if it shows up in the design check.
- The design check reports the amount input as under 44 px wide while empty, and without a focus ring of its own. Both
  were there before (38 px wide then, 28 px now): the whole display is the tap target (a tap anywhere on it focuses
  the input) and draws the focus ring (`:focus-within`).
