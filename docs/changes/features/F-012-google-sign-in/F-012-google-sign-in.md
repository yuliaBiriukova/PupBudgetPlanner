# F-012 · Sign in with Google

| | |
|---|---|
| Type | Feature |
| Milestone | M1 — Authentication & app shell |
| Status | Done (production check after the release: see below) |
| Branch | `feature/F-012-google-sign-in` |
| Design | not needed (the button is in the chosen F-011 variant 4) |

## Goal

One-click sign-in with a Google account.

## Acceptance criteria

- [x] "Continue with Google" on sign in and sign up pages
- [x] First Google sign-in creates an account (name and email from Google)
- [x] If an account with the same email exists, the Google login is linked to it. A password set before that is
      removed and the account's other sessions are signed out (owner's choice, 2026-10-28; see below)
- [x] A cancelled or failed Google sign-in comes back to sign in with a clear message
- [ ] Works in production on the Render URL — after the release, once the owner has set the Google client on Render

## Tasks

- [ ] Owner creates a Google OAuth client (Google Cloud Console → Credentials; steps below)
- [x] Configure `AddGoogle` and callback path
- [x] External login endpoint and account linking
- [x] Button in the UI
- [ ] Verify in production (owner, after the release)

## Linking to an existing account

Email-and-password accounts never prove that the email belongs to whoever signed up: there is no email sending
until after the MVP. So someone could create an account with another person's email and a password they chose.
If a later Google sign-in linked to that account and kept the password, they could still sign in.

Owner's choice (2026-10-28), out of three:

- **Link, drop the password (chosen):** Google has checked the email, so the Google login is linked. If the
  email wasn't confirmed before, the password is removed and the other sessions are signed out. From then on
  that person signs in with Google; a password can come back with password reset after the MVP.
- Link and keep the password: simplest, but leaves the risk above.
- Don't link, ask to sign in with the password first and link from Settings later: safe, but no Google for
  that person until F-016.

## Google OAuth client (owner)

In [Google Cloud Console](https://console.cloud.google.com/) (free):

1. Create a project, e.g. `Pup Budget Planner`.
2. **Google Auth Platform → Branding** (the OAuth consent screen): app name `Pup Budget`, your support email,
   developer contact email. **Audience:** External. Scopes: only the basic `openid`, `email`, `profile` (they
   need no Google review). Publish the app (**Audience → Publish app**): in "Testing" only the listed test users
   can sign in.
3. **Clients → Create client → Web application**, name `Pup Budget`. Authorized redirect URIs:
   - `https://pup-budget-planner.onrender.com/api/auth/google/callback`
   - `http://localhost:5173/api/auth/google/callback` (local development, through the Vite proxy)
4. Copy the client ID and the client secret. Locally, in `backend/src/PupBudgetPlanner.Api`:
   `dotnet user-secrets set "Authentication:Google:ClientId" "<id>"` and the same for `ClientSecret`.
   On Render, the environment variables `Authentication__Google__ClientId` and `Authentication__Google__ClientSecret`.

Without the client ID and secret the app still starts; "Continue with Google" then comes back to sign in with the
"didn't work" message.

## Implementation (2026-10-28)

Details and reasons in [ADR 0014](../../../decisions/0014-google-sign-in.md).

**Backend**

- `Microsoft.AspNetCore.Authentication.Google`, added only when the client ID and secret are set
  (`Api/Auth/GoogleSignIn.cs`):
  - callback `/api/auth/google/callback`;
  - Identity's external cookie holds the Google login;
  - Google's `email_verified` is kept as a claim;
  - a cancel at Google goes back to `/sign-in`, other failures to `/sign-in?error=google`.
- `AuthController`:
  - `GET /api/auth/google?returnUrl=` challenges Google, with the auth rate limit;
  - `GET /api/auth/google/complete` signs in and goes on to the return path. Only a path in the app is
    accepted; anything else becomes `/`. Without a client, or when it fails, it goes to `/sign-in?error=google`.
- `AuthService.SignInWithExternalLoginAsync`:
  - a known login signs in;
  - otherwise a verified email is required;
  - no account with that email: a new one with the email confirmed, no password and the Google name;
  - an account whose email was never confirmed: password removed, lockout reset, email confirmed, new
    security stamp;
  - then the login is linked, the person is signed in for 30 days, and the external cookie is dropped.

**Frontend**

- `ContinueWithGoogle`: under the form's button on sign in and create account, as in variant 4:
  - an "or" rule, then a 52 px pill link with Google's "G";
  - it carries the page the person was going to;
  - after a click it says "Opening Google…".
- `?error=google` on sign in shows the banner "Google sign-in didn't work. Try again, or use your email and
  password." until the next attempt.
- The Vite proxy keeps the browser's `Host`, so Google comes back to the app (`localhost:5173`), not to the
  API's port.
- `render.yaml` lists `Authentication__Google__ClientId` / `ClientSecret` (set in the dashboard); README has the
  user-secrets commands.

## Tests

- **Backend unit** (88 in total, 30 new):
  - `ExternalSignInTests`: a known login, a new account (confirmed email, no password, the name and its limit,
    the email fallback), no verified email, linking with and without a password, a confirmed account left as
    it is, and failures to create, remove the password or link;
  - `AuthControllerTests`: the challenge and its return path, foreign return URLs (`https://…`, `//…`, `/\…`),
    no client, complete's redirects, rate limit.
- **Frontend unit** (43 in total, 3 new): the link carries the page the person wanted on both pages; without one
  it has no return URL; the Google banner gives way to the next attempt's message.
- **E2E** (27 passed, 2 skipped; 4 new):
  - the button leads to the API, whose redirect goes to `accounts.google.com` with our callback,
    `response_type=code`, the `openid profile email` scopes and a state. The test stops there; it doesn't
    contact Google;
  - a callback with a state that isn't ours comes back to sign in with the message.
  - The E2E API gets a dummy Google client (`playwright.config.ts`). The full Google flow is checked by hand
    (Google blocks automated sign-ins).
- **Storybook:** `SignInGoogleFailed`; every auth story now shows the button.
- **Checked in the running app:**
  - screenshots at 375 and 1440 px, light and dark: sign in, create account, the Google error, "Opening
    Google…", all looked at;
  - axe on sign in, create account and the Google error in all four: 0 issues, no horizontal scroll.
  - It caught the "or" label at Mantine's 12 px instead of the prototype's 13 px.

## After the release (owner)

1. Create the Google OAuth client (steps above) and set it on Render and in user-secrets.
2. On https://pup-budget-planner.onrender.com: "Continue with Google" with a new Google account → you land in the
   app with your Google name. Sign out, then sign in with Google again → the same account.
3. Optional, linking: create an account with email and password using your Gmail address, then sign out and
   use "Continue with Google". You land in the same account, and the password no longer works.

## Notes

- Google's sign-in branding asks for its "G" in its own colors, so `GoogleLogo` has them in the SVG and not as
  theme tokens.
