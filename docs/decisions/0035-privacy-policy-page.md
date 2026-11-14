# 0035. The privacy policy is part of the app; its contact address is a build setting

- Status: Accepted
- Date: 2026-11-14

## Context

Google publishes the app's sign-in (out of Testing, where only listed test users get in) only with a public privacy
policy link (F-031). The policy has to open for anyone, also from Google's consent screen while the free server sleeps,
and it names an address people write to about their data: the owner's, which stays out of the repository (like the
admin's email, ADR 0016).

## Decision

- **The text is part of the frontend** (`privacyPolicy` in `en.json`, rendered by `/privacy`), not a page the API
  serves: the route sits outside the sign-in guards and makes no API request, and the service worker opens it from its
  cache like any page (ADR 0034). The same text is kept in
  `docs/changes/features/F-031-privacy-policy/privacy-policy.md`; a change that alters what the app keeps or who sees
  it updates both and moves `POLICY_UPDATED`.
- **The contact address is the `VITE_CONTACT_EMAIL` build setting.** Render passes a service's environment variables
  to its Docker build as build args; the Dockerfile declares `ARG VITE_CONTACT_EMAIL` in the frontend stage, and Vite
  puts it into the build. Locally it can go in `frontend/.env.local`. Without it (CI, local builds) the page names "the
  person who runs Pup Budget" instead.

## Consequences

- No backend change and no request, so the page can't fail or wait on the API.
- Changing the address needs a new deploy (Render: *Manual Deploy* after changing the variable), not a restart.
- The address is in the built JavaScript, as it is on the page: fine for an address meant to be public, not for a
  secret (Render's own advice is not to pass secrets as build args).
