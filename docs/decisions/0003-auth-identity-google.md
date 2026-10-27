# 0003. ASP.NET Core Identity with cookies and Google sign-in

- Status: Accepted
- Date: 2026-10-27

## Context

Anyone must be able to sign up. Google sign-in is required in the MVP; more providers may come later.
Email sending (confirmation, password reset) is postponed until after the MVP.

## Decision

- **ASP.NET Core Identity** stores users and passwords (hashed) in our PostgreSQL database.
- The SPA authenticates with an **HTTP-only, Secure, SameSite=Lax cookie** (the SPA and API are served
  from the same origin by one service, see ADR 0002) — no tokens in browser storage.
- **Google** via Identity external logins (`AddGoogle`). Identity's `UserLogins` table links external
  logins to a user, so Microsoft / Apple can be added later with configuration only.
- Hosted identity services (Auth0, Clerk, Firebase Auth) were rejected: vendor lock-in and free-tier
  limits without real benefit for this app.
- Until email is available, password reset is not offered (users can use Google sign-in).

## Consequences

- The owner creates a Google OAuth client (Google Cloud Console → Credentials; free, no Cloud Run needed).
- CSRF protection is required for cookie auth: SameSite + antiforgery header.
