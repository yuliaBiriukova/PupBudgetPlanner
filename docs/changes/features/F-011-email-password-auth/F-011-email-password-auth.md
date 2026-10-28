# F-011 · Sign up and sign in with email and password

| | |
|---|---|
| Type | Feature |
| Milestone | M1 — Authentication & app shell |
| Status | In progress |
| Branch | `feature/F-011-email-password-auth` |
| Design | 3 HTML prototypes required |

## Goal

Anyone can create an account and sign in.

## Acceptance criteria

- [ ] Sign up with display name, email, password and password confirmation; sign in; sign out
- [ ] Session kept in an HTTP-only secure cookie; antiforgery protection on state-changing requests
- [ ] Pages other than sign in / sign up require authentication
- [ ] Clear validation and error messages that don't reveal whether an email has an account (ADR 0012)
- [ ] Sign-in and sign-up rate-limited per IP; sign-in takes the same time for unknown and known emails
- [ ] No email confirmation and no password reset yet (post-MVP, Resend)

## Tasks

- [x] 3 HTML prototypes for sign in / sign up; round 2: variant 4, a mix of 1 and 2 (chosen)
- [ ] Identity setup and `/api/auth` endpoints (register, login, logout, me)
- [ ] Antiforgery
- [ ] Rate limiting on the auth endpoints; neutral error for a taken email (ADR 0012)
- [ ] Frontend forms and protected routes
- [ ] Storybook stories

## Design

References (open without signing in; Mobbin's screens need an account, so it wasn't used):

- [YNAB sign-in](https://app.ynab.com/users/sign_in) — split layout on desktop: what the app gives you on one side,
  the form on the other (variant 1); a show-password control in the field.
- [Stripe Dashboard sign-in](https://dashboard.stripe.com/login) — one centred card; social sign-in under an "or"
  rule; the switch to "Create account" kept inside the card (variants 2 and 3).
- [Lunch Money sign-in](https://my.lunchmoney.app/login) — a quiet single card with a warm, friendly heading
  ("Welcome back") and nothing else competing with the fields.
- [Eleken: login page examples](https://eleken.co/blog-posts/login-page-examples) — split layouts with a value
  statement beside a short form are the common pattern for finance products.
- General practice: don't say which of email or password was wrong; labels above fields; `autocomplete`
  (`email`, `current-password`, `new-password`, `name`) so password managers fill the form.

Prototypes in [`prototypes/`](prototypes/). Each file opens from disk; the dark bar on top switches phone / tablet /
desktop, the screen (sign in, create account, and each with errors) and light / dark, and simulates a cold start.

| Variant | Thesis | Bold element |
|---|---|---|
| [1 — Ledger page](prototypes/variant-1.html) | Show what you get: on a desktop the form sits beside a page of the yearly report, set like the family spreadsheet; on the phone it's just the form | A sample of the yearly report on the sidebar tint: fine rules, a double rule above NET |
| [2 — Pocket](prototypes/variant-2.html) | Thumb first: the name on the charcoal page, the form docked at the bottom like the app's sheets | A big "Pup Budget" on charcoal and a pill switch between Sign in and Create account; 52 px fields and button |
| [3 — Receipt](prototypes/variant-3.html) | A till receipt: the form printed on a paper strip, the paper trail every budget starts from | A paper strip with a torn zigzag edge, today's date, dashed rules; on Create account, dotted-leader lines saying what you get |

All three use the F-010 theme as it is (charcoal and sky, Unbounded 300 + Manrope 400/500, 12 / 24 px corners,
the coin-stack logo), plus an error red (`#b3261e` light, `#f2958c` dark) and input borders that pass 3:1.
The same states in each:

- Sign in: email, password with a show / hide button. A wrong email or password is one banner above the
  fields that doesn't say which was wrong.
- Create account: your name ("Your family sees this name"), email, password ("At least 8 characters").
  Errors under the field: "This email already has an account" with a "Sign in instead" link, and "Use at
  least 8 characters".
- The button shows a spinner and "Signing in…" / "Creating your account…" while the request runs.
- Waking up: at night the sign-in is often the first request. A note right above the button says
  "Waking up the server… N s". The shell's floating pill would cover the logo row on these screens.
- "Continue with Google" is drawn so the layout leaves room for it; it is built in F-012. There is no
  "Forgot password?" link: password reset needs email (after the MVP).

Design check (`npm run design:check`): 0 issues on all three at 360–1440 px, light and dark. It first caught a
44 px touch target on "Sign in instead" and inputs without a focus outline; both fixed. Screenshots of every
screen at 375 and 1440 px, light and dark, looked at.

### Round 2: a mix of variants 1 and 2 (2026-10-28)

Owner feedback: variant 1's layout is good, but the report table on the left isn't needed; variant 2's colors and
form are good; variant 3 is out. Variants 1–3 stay in the folder as they were shown.

[Variant 4 — Ledger layout, Pocket look](prototypes/variant-4.html):

- **Desktop (from 900 px):** variant 1's two halves. Left, variant 2's charcoal (near-black in dark mode) with the
  logo, a big "Pup Budget" (Unbounded 300, 48 px) and, under a hairline, what the app does: "Income, expenses and
  transfers across all your accounts and currencies. Monthly and yearly reports build themselves, for you and
  your family." (owner's pick of 8 options). Right, the form on the light surface. The tagline "Every hryvnia in
  its place." was dropped at the owner's request. The earlier line said expenses are added on the phone, but they
  can be added on any device, and the app does more than expenses.
- **Phone:** variant 1's order (name first, then the form) on variant 2's charcoal band. The form card overlaps
  the band with 24 px rounded top corners, like the app's sheets. It follows the band instead of being pushed
  to the bottom of the screen.
- **Form:** variant 2's: the Sign in / Create account pill switch (the heading is for screen readers), 52 px
  fields, pill buttons. States as above, except a taken email (below).
- **No account enumeration** ([ADR 0012](../../../decisions/0012-account-enumeration.md), owner's choice): a
  taken email on Create account no longer says "This email already has an account". It shows a neutral banner,
  "We couldn't create an account with this email", with a "Sign in with this email" link. Format errors stay
  under their fields ("Enter an email like name@example.com.", "Use at least 8 characters."), on their own
  screen in the prototype. Sign-in and sign-up are rate-limited per IP.
- **Confirm password** on Create account, with its own show / hide button. With no password reset until email
  exists (after the MVP), a typo in the password would lock the person out. Error: "The passwords don't match."
  It can go once password reset exists.

Design check: 0 issues at 360–1440 px, light and dark. Screenshots of every screen at 375 and 1440 px, light and
dark, and the waking-up note, looked at.

Chosen variant: **variant 4** (owner, 2026-10-28).

## Tests

- Unit: Validators, auth service.
- E2E (Playwright): Sign up, sign out, sign in, wrong password.

## Notes

- —
