# F-012 · Sign in with Google

| | |
|---|---|
| Type | Feature |
| Milestone | M1 — Authentication & app shell |
| Status | Todo |
| Branch | `feature/F-012-google-sign-in` |
| Design | not needed |

## Goal

One-click sign-in with a Google account.

## Acceptance criteria

- [ ] "Continue with Google" on sign in and sign up pages
- [ ] First Google sign-in creates an account (name and email from Google)
- [ ] If an account with the same email exists, the Google login is linked to it
- [ ] Works in production on the Render URL

## Tasks

- [ ] Owner creates a Google OAuth client (Google Cloud Console → Credentials)
- [ ] Configure `AddGoogle` and callback path
- [ ] External login endpoint and account linking
- [ ] Button in the UI
- [ ] Verify in production

## Tests

- Unit: Account creation / linking logic.
- E2E (Playwright): Button starts the Google redirect. The full Google flow is checked manually (Google blocks automated logins).

## Notes

- —
