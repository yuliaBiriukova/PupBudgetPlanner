# F-011 · Sign up and sign in with email and password

| | |
|---|---|
| Type | Feature |
| Milestone | M1 — Authentication & app shell |
| Status | Todo |
| Branch | `feature/F-011-email-password-auth` |
| Design | 3 HTML prototypes required |

## Goal

Anyone can create an account and sign in.

## Acceptance criteria

- [ ] Sign up with display name, email and password; sign in; sign out
- [ ] Session kept in an HTTP-only secure cookie; antiforgery protection on state-changing requests
- [ ] Pages other than sign in / sign up require authentication
- [ ] Clear validation and error messages (e.g. email already used, wrong password)
- [ ] No email confirmation and no password reset yet (post-MVP, Resend)

## Tasks

- [ ] 3 HTML prototypes for sign in / sign up
- [ ] Identity setup and `/api/auth` endpoints (register, login, logout, me)
- [ ] Antiforgery
- [ ] Frontend forms and protected routes
- [ ] Storybook stories

## Design

Prototypes: `prototypes/` (not created yet). Chosen variant: —

## Tests

- Unit: Validators, auth service.
- E2E (Playwright): Sign up, sign out, sign in, wrong password.

## Notes

- —
