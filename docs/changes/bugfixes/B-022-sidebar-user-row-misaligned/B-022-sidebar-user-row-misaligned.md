# B-022 · The name and the icon buttons are not aligned in the sidebar

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: visible on every desktop page, but nothing is broken) |
| Status | Done |
| Branch | `bugfix/B-020-B-022-I-032-ui-fixes` (one PR with B-020, B-021 and I-032, as the owner asked) |
| Found in | Production, 2026-11-12, desktop |
| Approved | 2026-11-12 (root cause and planned fix, "Approved, build them") |

## Steps to reproduce

1. On the desktop, look at the bottom of the sidebar: the person's initial and name, the theme button and Sign out.

## Expected

The initial, the name and the two icon buttons sit on one line, their middles level.

## Actual

They are not level: the initial and the name sit apart from the icons (owner's screenshot).

## Root cause

Confirmed on 2026-11-12 in Storybook (*Shell / AppLayout / Desktop*, 1024 px): the initial and the name have their
middles at y 736, the theme button and Sign out at y 740: the buttons sit 4 px lower.

The sidebar's foot (`.foot` in `Sidebar.module.css`) is a row at least 40 px tall with its items centred, so the
initial (32 px) and the name sit 20 px down. The two buttons are in a box of their own (`.footTools`) placed
`top: 2px`, and each button is 44 px tall, so their middles are 2 + 22 = 24 px down.

## Fix

Approved by the owner on 2026-11-12:

- [x] `.footTools` is centred on the row (top and bottom 0, its buttons centred) instead of `top: 2px`: all four
  middles level, whatever the buttons' size.
- [x] The collapsed rail (where the buttons hide) and the phone (no sidebar) don't change.

## Tests

- [x] E2E on the desktop (`shell.spec.ts`): the middles of the initial, the name, the theme button and Sign out are
  within 1 px of each other. Fails before the fix (4 px), passes after it.
- [x] Screenshots of the sidebar's foot at 1440 px: [light](fixed-1440-light.png), [dark](fixed-1440-dark.png); in
  Storybook all four middles at the same y (736 px). The collapsed rail hides the buttons as before.
