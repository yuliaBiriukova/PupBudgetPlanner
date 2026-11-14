# F-026 · Review findings

The review pass of [F-026](F-026-mvp-launch.md), 2026-11-14, on the local app (`develop` with F-025) against the `dev`
database. The owner approved the list on 2026-11-14 ("Fix 1–6, leave 7"): #1 – #6 are fixed on the F-026 branch,
#7 is left (see the Outcome column).

## How it was checked

- **Design check** (`npm run design:check`, Playwright + axe) on every page of the running app at 360, 375, 768, 1024
  and 1440 px, light and dark: signed in with accounts, transactions and a family (Transactions, Accounts, Reports,
  Categories, Family, Settings, 404); a new person with nothing yet (Transactions, Accounts, Reports, Family); the
  family member's view (Family, Transactions); the admin (People, Invite links); signed out (Sign in, Create account,
  an invite link that doesn't exist).
- **Screenshots looked at** for every page at 375 and 1440 px, light and dark, and for: the add form (expense, its
  phone keys, the empty-amount check, a save that fails, transfer, the exchange's To list), the phone's + menu and
  More, the account form and its errors, adding a category, the start screen with the server refused, hanging or
  answering 503, a failed load on Transactions and Reports, NBU rates missing, offline, an expired session, and every
  main page at 320 px.
- **Keyboard:** 40 Tab stops on each page on the desktop (visible focus, nothing focused out of sight); the add
  dialog opens with Enter, puts focus in the form and closes with Escape.
- **200% zoom:** a 1440 px window at 200% is a 720 px page; the 768, 375, 360 and 320 px checks cover it. No page
  scrolls sideways at 320 px.

## Findings

| # | What | Where | Proposed priority | Proposal | Outcome |
|---|------|-------|-------------------|----------|---|
| 1 | The month title on the Transactions slip is cut: "November 20…" (at 320 px "Novemb…") | Transactions, phones up to 390 px (most iPhones are 390 – 393 px; fits from 412 px), both schemes | Medium | Fix here: let the title shrink before it's cut (smaller size on the phone, or "Nov 2026" when there isn't room). Small CSS change, checked at 320 – 430 px | **Fixed** (2026-11-14): a slip too narrow for the longest month, "September 2026" (phones below about 420 px), shows the short name, "Nov 2026"; screen readers still hear "November 2026". E2E: the title isn't cut at 320 – 412 px |
| 2 | Settings says your name is shown "to your family once families come", but families are here (F-023) | Settings › Name and email, every size | Medium | Fix here: "Your name is shown in the menu and to your family." | **Fixed** (2026-11-14): the new line; unit test on the Settings page |
| 3 | A long password runs under the show/hide (eye) button: the field keeps 16 px on the right next to a 52 px button | Sign in, Create account (both password fields), every size | Medium | Fix here: give a password field room for its button (right padding = the button's width) | **Fixed** (2026-11-14): the field keeps 52 px on the right; E2E: a long password ends before the button |
| 4 | Production sends no `X-Content-Type-Options`, `X-Frame-Options` / `frame-ancestors` or `Referrer-Policy` headers: the app could be shown inside another site's frame | Production (`pup-budget-planner.onrender.com`) | Medium | Fix here: a small middleware in the API that adds `nosniff`, `DENY`, `strict-origin-when-cross-origin`, with a unit test. A full Content-Security-Policy is left for after the MVP (it needs care with Google sign-in and the service worker) | **Fixed** (2026-11-14): `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'`, `nosniff`, `strict-origin-when-cross-origin` on every response, error pages too; unit tests and an E2E check. Production gets them with the release |
| 5 | The current month's green numbers in the Reports table are just under AA contrast: 4.46 – 4.47 : 1 (needs 4.5) | Reports (year), the highlighted month column, 768 – 1024 px light, 1024 – 1440 px dark | Low | Fix here: one shade darker green on the highlighted column | **Fixed** (2026-11-14): the highlighted month's green is a shade nearer the text; axe finds nothing on Reports at 768 – 1440 px, light and dark |
| 6 | At 320 px the Spent and Received amounts on the slip touch each other, and "Whose money" shows only "M." | Transactions, 320 px (small phones, or 400% zoom) | Low | Fix here together with #1 if it's the same rule; otherwise leave (no phone of the family is that narrow) | **Fixed** (2026-11-14): at 320 px the figures are 20 px, and below 360 px the "Whose money" pill shows only the initial (the name is still read out), as in the rail; in the same E2E test as #1 |
| 7 | On the phone the floating + sits on top of an account card's own + while the page scrolls | Accounts, phone | Low | Leave: the + floats over every page by design (I-030), and the page leaves room at the end so nothing stays hidden | **Left** (owner, 2026-11-14) |

## Looked at and kept as decided

- **The amount's mistake has no text under it**, only the red field (the text is there for screen readers): decided
  in F-018 and written in DESIGN_RULES §6. Colour alone doesn't meet WCAG 1.4.1 for sighted people who can't tell red;
  say if you want a short line under it (that would be a 🎨 improvement).
- **An invite link that doesn't exist** logs a 404 in the browser console (the page itself says the link isn't valid).
- **The start screen with the server down** says "Waking up the server…" with the seconds, and after about a minute
  "Couldn't reach the server." with Try again.

## Checked and fine

Empty states (new person: Transactions, Accounts, Reports, Family); a failed load on Transactions and Reports
("Couldn't load …" with Try again); NBU rates missing on Accounts ("NBU rates aren't available right now. Try again
later.", balances still shown); a failed save in the add form ("Couldn't save. Check the connection and try again:
nothing you typed is lost."); offline ("No connection: you can look, not save"); an expired session (back to Sign
in); the account form's errors; the family member's view; People and Invite links (0 axe issues); the sidebar's
resize handle shows a 2 px accent line on keyboard focus.

## Not covered in this pass

- Google sign-in's own error page and a blocked account's sign-in: covered by `auth.spec.ts` and `people.spec.ts`,
  not looked at again.
- The install card, install sheet and update toast: checked on F-025 the same day.
- Real phones: the owner's check after the release (F-026 smoke check).
