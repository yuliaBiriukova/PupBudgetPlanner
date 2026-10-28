# 0014. Google sign-in: endpoints and linking to existing accounts

- Status: Accepted
- Date: 2026-10-28

## Context

F-012 adds "Continue with Google" on top of the Identity accounts of F-011 (ADR 0003, ADR 0013). Two things
weren't decided yet: how the SPA starts and finishes the Google flow, and what happens when a Google email
already has an email-and-password account. Those accounts never prove that the email belongs to whoever signed
up: email sending comes after the MVP. Linking to such an account while keeping its password would let whoever
set that password keep signing in to the real owner's account.

## Decision

- **Flow:** "Continue with Google" is a plain link to `GET /api/auth/google?returnUrl=/path`. It challenges the
  Google handler, whose callback is `/api/auth/google/callback`. The handler keeps the Google login in Identity's
  short-lived external cookie and redirects to `GET /api/auth/google/complete`, which signs the person in and
  redirects to the return path. Only a path in the app is accepted (`/x`, not `//x` or `/\x`); anything else
  goes to `/`.
- **Failures** come back to `/sign-in?error=google` and the page shows one message. Cancelling at Google comes
  back to `/sign-in` without one. Without a configured client the app still starts and the link comes back
  with the error, so tests and the CI container check need no Google secrets.
- **Matching:** an existing Google login signs that person in. Otherwise the email must be one Google has
  verified (`email_verified`):
  - no account with that email: a new account with the email confirmed, no password, and the Google name
    (cut to 50 characters; the start of the email when Google gives none);
  - an account whose email was never confirmed (every email-and-password account until email exists): the
    login is linked, the **password is removed**, lockout is reset, the email becomes confirmed and the new
    security stamp signs out the other sessions. Owner's choice; that person signs in with Google from then on;
  - an account with a confirmed email: the login is linked and nothing else changes.
- **Lockout** counts wrong passwords only; a login Google has just confirmed is not blocked by it, so wrong
  passwords typed on someone's email can't lock them out of Google sign-in.
- **Local development:** the Vite proxy keeps the browser's `Host`, so the API's redirect URI is the app's own
  `http://localhost:5173/api/auth/google/callback`.
- The client ID and secret are `Authentication:Google:ClientId` / `ClientSecret`: user-secrets locally, Render
  environment variables in production.

## Consequences

- The Google client must list both redirect URIs (Render and `localhost:5173`).
- Someone who created an account with a password and later uses Google loses the password. A password can come
  back with password reset (after the MVP).
- Other sessions of a linked account end at Identity's next security stamp check (every 30 minutes by default),
  not at once.
- The start endpoint shares the auth rate limit (10 per minute per IP).
- Adding Microsoft or Apple later reuses the same complete endpoint and matching rules.
