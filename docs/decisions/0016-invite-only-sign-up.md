# 0016. Invite-only sign-up: hashed invite links, the admin from configuration, blocking

- Status: Accepted
- Date: 2026-10-29

## Context

F-011 and F-012 let anyone who found the site create an account. While Pup Budget is for family and friends the
owner wants to decide who gets in, see everyone with access and take access away (F-028), and later open sign-up
to everyone. Links are sent in messengers: there is no email until M8.

## Decision

- **Mode:** `Access:SignUp` is `InviteOnly` (default) or `Open`. While invite-only, `POST /api/auth/register` and
  the first "Continue with Google" need a working invite link; existing accounts sign in as before. In open mode a
  link is used when given and ignored when it doesn't work. `GET /api/auth/sign-up` tells the page which mode it is.
- **Invite links:** a token of 32 random bytes, base64url (43 characters), in `/invite/{token}`. Only its SHA-256
  is stored, like a password reset token: the link is shown once, when made, and a lost link is cancelled and made
  again. A link works once, for 7 days (`Invitation.Lifetime`), unless the admin cancels it. Status (waiting, used,
  expired, cancelled) is worked out from the dates, never stored.
- **Using a link** happens in the account's transaction (`AccountCreator`) with one conditional `UPDATE … WHERE
  token_hash = … AND used_at IS NULL AND cancelled_at IS NULL AND expires_at > now`. Two sign-ups racing for one
  link: the second waits for the first one's row lock, then matches nothing, and its account is rolled back. A
  unique index on `used_by_id` backs this up.
- **Neutral answers:** a used, expired, cancelled or made-up link gets the same 404 / 410 and the same page, which
  never shows who made the link (it may be a guess). The preview endpoint is rate-limited like sign-in.
- **Google:** the invite page sends the token as `invite=` to `/api/auth/google`; it travels through Google in the
  authentication properties (`ExternalClaims.InviteTokenItem`) and comes back with the login.
- **The admin** is named by email in `Access:AdminEmails` (a list): locally in user-secrets, on Render in
  `Access__AdminEmails__0`, never in the repository. The `Admin` policy compares the email claim in the cookie.
  Nothing in the app makes someone an admin. The admin's first Google sign-in needs no link (Google has verified
  the email); a password sign-up with the admin email needs no link only in Development (E2E tests), so nobody can
  claim an admin email that has no account yet.
- **Blocking** sets `users.blocked_at` and a new security stamp. The stamp is checked every minute
  (`SecurityStampValidatorOptions.ValidationInterval`), so the person's cookies stop working within a minute on
  every device; `/api/auth/me` treats them as signed out at once. Signing in checks the password first
  (`CheckPasswordSignInAsync`) and only then says "blocked", so the message doesn't reveal blocked accounts.
- **Deleting** a person uses `UserManager.DeleteAsync`; the database removes what belongs to the account
  (categories, logins, claims). Invitations keep their row with `used_by_id` / `created_by_id` set to null. Bulk
  actions run in one transaction: all picked people or none. The admin can't block or delete themselves.
- **Privacy:** the People page and the admin API don't show how a person signs in (password or Google); the admin
  doesn't need it.
- **Join date:** `users.created_at`; accounts made before F-028 got it from their UUIDv7 id in the migration.

## Consequences

- Opening sign-up later is a configuration change (`Access__SignUp=Open`), no code.
- Losing a link before sending it means cancelling it and making a new one; the app can't show it again.
- Blocked people may keep working for up to a minute; checking the stamp on every request would cost a database
  read per request.
- F-023 (family invitations) will reuse `Invitation` with a family attached, so a family owner's link also lets a
  new person sign up. F-027 (delete my account) reuses the deletion.
- No unit test runs the conditional update or the migration SQL (ADR 0005); the E2E tests use a real database and
  cover signing up with a link, the second use failing, blocking and unblocking.
