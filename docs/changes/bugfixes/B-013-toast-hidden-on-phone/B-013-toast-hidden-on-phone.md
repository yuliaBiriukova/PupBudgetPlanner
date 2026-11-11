# B-013 · The "saved" toast can't be seen on the phone

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: the toast is the only word that a transaction was saved and what is left on the account; the list shows the new transaction, so nothing is lost) |
| Status | Done |
| Branch | `bugfix/B-013-toast-hidden-on-phone` (planned on `plan/phone-feedback`) |
| Found in | Production, 2026-11-09, the owner's Android phone (Chrome), light theme |
| Approved | 2026-11-11 (the root cause and the fix: "Approved, build it") |

## Steps to reproduce

1. On the phone, add an expense and tap Save.

## Expected

The toast ("Expense saved." with the account's new balance) shows where it is seen at once and covers nothing you need next.

## Actual

The toast shows at the very bottom of the screen, over the bottom bar and the + button, where it is easily missed;
the owner reports it as not visible at all on the phone (owner's screenshot, kept out of the repo as it shows a
balance).

## Root cause

Reproduced on 2026-11-11 in the local app at 412 × 800 px (phone emulation, light theme): an expense of 125 saved
from the quick-add form ([screenshot](screenshots/before-phone-412-light.jpg), a test person's data).

`<Notifications />` in `AppProviders.tsx` used Mantine's default place, **bottom right, 16 px from the bottom**, on
every screen size. On the phone it is as wide as the screen less the 16 px gutters, so it lay **exactly over the
bottom bar** (the toast 736–784 px, the bar 732–800 px): it hid the bar's icons and names, and in the light theme
it was a white card on the white bar, set apart only by a soft shadow. It comes up as the sheet slides down, while the
eye follows the sheet and the list, so it was easily taken for part of the bar and missed.

It was not drawn under anything: the toasts' layer (z-index 400) is above the sheets and their overlay (200) and the
bar. So "not visible at all" was the toast blending into the bar, not being covered.

The same held for **every** toast in the app, not only the saved transaction: they all go through the one
`<Notifications />` (accounts archived / deleted, settings saved, people and invite links, "Connected" after the
server wakes).

## Fix

Approved 2026-11-11, applies to **all toasts** (the owner: "apply to all toasters"):

- **On the phone** (below 768 px, the same switch as the bottom bar): the toasts at the **top**, full width with the
  16 px gutters, 8 px under the 56 px header, so they cover neither the header nor the bottom bar and the +; they
  slide down from the top. Several at once stack downwards.
- **On the desktop**: unchanged, bottom right.
- One place in the code: `AppNotifications` (used by `AppProviders`) gives `<Notifications />` its position by the
  screen size; no call site changes.

Rejected: just above the bottom bar. The + sits 16 px above the bar at the right, so the toast would have to go above
the + too, floating in the lower middle of the screen over the list.

While it shows (about 4 s), the phone's toast covers the top of the month card (the month's name and its +); the
totals under it stay in sight.

## Tests

- [x] Unit: `AppNotifications.test.tsx` — the toasts' container is `top-center` on a phone, `bottom-right` on the
  desktop; the phone test fails without the fix.
- [x] E2E: `transactions.spec.ts` "the saved toast is in sight… (B-013)" — after Save the toast is in sight; on the
  phone 8 px under the header, 16 px from both edges, above the bottom bar (without the fix it rested at 775 px, over
  the bar); on the desktop 16 px from the bottom right.
- [x] Screens checked in Playwright screenshots (375 and 1440 px, light and dark): the toast after saving an expense,
  an income and a transfer, in [`screenshots/`](screenshots/).
