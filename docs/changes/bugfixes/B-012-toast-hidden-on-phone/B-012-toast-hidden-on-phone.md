# B-012 · The "saved" toast can't be seen on the phone

| | |
|---|---|
| Type | Bugfix |
| Priority | Medium (proposed: the toast is the only word that a transaction was saved and what is left on the account; the list shows the new transaction, so nothing is lost) |
| Status | Todo |
| Branch | `bugfix/B-012-toast-hidden-on-phone` (planned on `plan/phone-feedback`) |
| Found in | Production, 2026-11-09, the owner's Android phone (Chrome), light theme |
| Approved | — (date the owner approved the root cause and the planned fix) |

## Steps to reproduce

1. On the phone, add an expense and tap Save.

## Expected

The toast ("Expense saved." with the account's new balance) shows where it is seen at once and covers nothing you need next.

## Actual

The toast shows at the very bottom of the screen, over the bottom bar and the + button, where it is easily missed;
the owner reports it as not visible at all on the phone (owner's screenshot, kept out of the repo as it shows a
balance).

## Root cause

Suspected from reading the code, to be confirmed by reproducing it: `<Notifications />` in `AppProviders.tsx` uses
Mantine's default place, bottom right, on every screen size. On the phone that is where the bottom bar and the sheet
are; the toast comes up while the sheet slides down and lies over the bar.

To check on the branch: whether the toast is also drawn **under** something (the closing sheet, its overlay, the
bottom bar) while it appears, which would make it truly invisible rather than only out of the way.

## Fix

To be proposed after reproducing. Likely: on the phone, the toast at the **top**, under the app's header, full width
with the 16 px gutters; the desktop keeps it at the bottom right. Open point for the owner: top on the phone, or just
above the bottom bar.

## Tests

- Regression test that fails before the fix and passes after it (E2E on the phone: after Save the toast is in sight and
  doesn't overlap the bottom bar).
- Screens checked in Playwright screenshots (phone / desktop, light / dark): the toast after saving an expense, an
  income and a transfer.
