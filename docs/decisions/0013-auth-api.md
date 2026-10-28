# 0013. Auth API: endpoints, antiforgery, password rules and limits

- Status: Accepted
- Date: 2026-10-28

## Context

F-011 builds email-and-password accounts on ASP.NET Core Identity with a cookie (ADR 0003) and without
revealing which emails have an account (ADR 0012). The SPA and the API share one origin. A few details weren't
decided by those ADRs.

## Decision

- **Endpoints:** `GET /api/auth/me` (200 with the person or 204), `POST /api/auth/register`, `POST /api/auth/login`,
  `POST /api/auth/logout`. Asking `me` also issues the antiforgery token. Signing in or out changes who the token
  belongs to, so the app asks `me` again afterwards.
- **Signed in by default:** an authorization fallback policy requires a signed-in person on every endpoint.
  Health, auth, the SPA fallback and the OpenAPI document say `[AllowAnonymous]`. The cookie handler answers
  401 / 403 instead of redirecting.
- **Cookie:** HTTP-only, `SameSite=Lax`, HTTPS-only outside Development (locally the API runs on http behind the
  Vite proxy), 30 days with sliding expiration: a family app on their own phones.
- **Antiforgery:** the token goes out in a readable `XSRF-TOKEN` cookie (`SameSite=Strict`) and comes back in the
  `X-XSRF-TOKEN` header on every POST / PUT / PATCH / DELETE. MVC's `AutoValidateAntiforgeryToken` needs the view
  services, so a small `AntiforgeryFilter` does the check.
- **Passwords:** at least 8 characters, at most 128, no required digits or symbols (NIST SP 800-63B). Lockout
  after 5 wrong passwords for 15 minutes.
- **Validation:** FluentValidation validators in Application, run by an MVC filter that answers RFC 7807
  ValidationProblemDetails with camelCase field names. The frontend checks the same rules first with zod.
- **Rate limit:** 10 sign-in or sign-up attempts per minute per IP (`RateLimiting:Auth`), 1000 in Development
  so the E2E tests don't trip it.
- **Tables:** Identity's tables and indexes renamed to snake_case (`users`, `user_logins`, …), as ADR 0009 asks.

## Consequences

- New endpoints are protected without any attribute; an open one has to say so.
- The SPA's API client must add the header to every request that changes something (it does, in one place).
- A locked-out account answers "Too many attempts", so lockout itself shows that an account exists. It needs
  5 wrong passwords inside the rate limit first, which makes it slow to use for checking emails.
