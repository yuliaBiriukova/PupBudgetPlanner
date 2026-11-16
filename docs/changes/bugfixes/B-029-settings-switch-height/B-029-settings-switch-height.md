# B-029 · Settings: the Theme switch is taller than the app's pill switch

| | |
|---|---|
| Type | Bugfix |
| Priority | Low (a look on one page; everything works) |
| Status | Done (fixed in F-033, 2026-11-16) |
| Branch | Built on `feature/F-033-category-budgets` (planned for `bugfix/B-029-settings-switch-height`) |
| Found in | The owner, reviewing F-033's final prototype (its Settings copy), 2026-11-16; the same on the app's Settings page since F-016 |
| Approved | 2026-11-16, with F-033's final prototype ("the final prototype for f-033 is approved, build it"), whose Settings has this fix for Theme and the new Budget reminder |

## Steps to reproduce
1. Open Settings on a screen 1024 px or wider (or the Storybook story *Settings / Settings page / Desktop*).
2. Compare the Theme switch (Light / Dark / System) with Report currency's (Hryvnia / US dollar / Euro).

## Expected
Every pill switch is the app's one size (DESIGN_RULES §3, I-019): 44 px options on a 4 px track, 52 px in all, as Report
currency's.

## Actual
Theme's switch is 71 px tall, its options 63 px. F-033's new *Budget reminder* switch (On / Off) in the prototype had the
same height.

## Root cause
From 1024 px a setting is two columns in one grid row: its title and line on the left, its control on the right
(`Settings.module.css`, `.section`). The row is as tall as the taller column, and the control column (`.control`, a
grid) stretches its only row to that height, so a switch alone in it (Theme) grows to the left column's height: a title
and two lines of text. Report currency's column has more under its switch (the list and the total), so its switch keeps
its own height.

## Fix
`.control` packs its rows at the top (`align-content: start`), so a control is only as tall as its content whatever the
left column holds. One line of CSS in `Settings.module.css`; Theme and every later setting (F-033's Budget reminder)
keep the standard height.

## Tests
- A unit or E2E check can't see a height reliably in jsdom: the Settings page is checked with the design check and
  screenshots at 1024 and 1440 px, light and dark (the switches 52 px, as Report currency's).
- F-033's prototype already uses the fix in its copy of Settings (`frontend/src/prototypes/F-033-category-budgets/`).

## Done (2026-11-16)
Fixed in F-033, whose approved final prototype has the 52 px switch for Theme and its new *Budget reminder*:
`.control` in `Settings.module.css` has `align-content: start`. Checked in screenshots at 1440 px (desktop
breakpoint from 1024), light and dark: Theme and Budget reminder are as tall as Report currency's switch.
