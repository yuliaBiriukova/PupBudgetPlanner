# B-020 · Changing the theme scrolls the More page to the middle on the phone

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: a visible jump on a side screen; the theme still changes) |
| Status | Done |
| Branch | `bugfix/B-020-B-022-I-032-ui-fixes` (one PR with B-021, B-022 and I-032, as the owner asked) |
| Found in | Production, 2026-11-12, the owner's Android phone (Chrome), dark theme |
| Approved | 2026-11-12 (root cause and planned fix, "Approved, build them") |

## Steps to reproduce

1. On the phone, open More (the settings) and scroll down to Theme.
2. Tap Light, Dark or System.

## Expected

The theme changes; the page stays where it was.

## Actual

The page jumps: the Theme switch and the bottom of the page end up in the middle of the screen, with an empty space
under them (owner's screenshot, kept out of the repo as it shows a balance).

## Root cause

Confirmed on 2026-11-12 in the Browser pane (Chrome, 375 × 812 px), on the app's layout rebuilt in a page.

The theme switch (`Choice` in `SettingsPage.tsx`) is three labels, each with a native radio hidden inside it
(`.radio`: `position: absolute`, 1 × 1 px, for the keyboard and screen readers). The label isn't positioned, so the
radio is placed against the nearest positioned box: the app's column (`.column` in `AppLayout.module.css`), which is
*outside* the page's scrolling area (`.main`). The radio therefore stays where the Theme row would be with the page
not scrolled: below the bottom of the screen. A tap on a label focuses its radio and the browser scrolls it into
sight; the only box that can move it there is the app's frame (`.shell`, `overflow: hidden`, as tall as the
screen), so the frame scrolls: the whole app slides up, the bottom menu lands mid-screen with an empty space under
it, as on the owner's screenshot. In the rebuilt layout the frame scrolled 392 px.

Only the phone shows it: on the desktop the More page is short enough that the Theme row is in sight unscrolled.
The same `Choice` is the report currency's switch, so it jumped too.

## Fix

Approved by the owner on 2026-11-12:

- [x] `.option` (the label) gets `position: relative`, so the hidden radio sits inside it and scrolls with the page.
  Checked in the rebuilt layout: the frame stays at 0.
- [x] Nothing else changes: the arrow keys, the focus ring and screen readers work as before.

## Tests

- [x] E2E on the phone (`settings.spec.ts`, 412 × 560 px, short enough that Theme is below the screen): scroll to
  Theme, pick Dark; the bottom menu is still at the screen's foot and nothing but the page's own scroll area has
  scrolled. Fails before the fix (the menu moved up), passes after it. (A unit test can't see it: jsdom has no layout.)
- [x] Screenshots of the More page at 375 px after picking a theme: [dark](fixed-375-dark.png),
  [light](fixed-375-light.png); the menu stays at the foot.
