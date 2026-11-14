# 0036. Deleting one's own account: confirmed at once, Google by a short-lived cookie

- Status: Accepted
- Date: 2026-11-15

## Context

F-027 lets a person delete their account and everything in it from Settings. The owner agreed (Q-010): deleted right
away, no grace period; confirmed with the password, or for someone with only Google by signing in with Google once
more, plus a typed word; a family's owner with others picks who looks after the family next; coming back needs a new
invite like anyone new. The admin can delete people (F-028), and the database already removes an account's data with
it (ADR 0016).

Google is a page navigation away from the dialog and back, so the proof that the person at the screen just signed in
with *their own* Google account has to survive that trip, for a few minutes, without signing anyone in.

## Decision

- **`POST /api/me/delete`** checks, in order: not the admin (403: an app with no admin can't invite anyone), the word
  `DELETE` in any letter case, then the password through `CheckPasswordSignInAsync` with the sign-in's lockout (so the
  dialog can't be used to guess passwords; 429 when locked out), or the Google confirmation. Then, in one transaction,
  `Family.Leave` with the picked owner (as "Leave family"; an emptied family is deleted) and `UserManager.DeleteAsync`,
  whose cascade removes accounts, transactions, categories and logins. The request signs out; the other devices lose
  their cookie at the next security-stamp check, within a minute, because the user row is gone. It shares the sign-in's
  rate limit.
- **"Confirm with Google"** is `GET /api/me/delete/google` → Google → `/api/me/delete/google/complete`, which compares
  the external login with the signed-in person's own Google login, clears Identity's external cookie (nobody is signed
  in by it) and sets **`pup.delete-confirmed`**: the person's id protected with ASP.NET Core Data Protection's
  time-limited protector (10 minutes), HttpOnly, SameSite=Lax, path `/api/me`. Back on `/settings?delete=google` the
  dialog opens again confirmed (`?delete=google-failed` says it didn't work; a cancel at Google lands on
  `?delete=open`). The Google handler takes a challenge's own landing pages from its properties for that.
- **Nothing is kept** about a deleted person: their email is free and, while sign-up is invite-only, needs a new invite
  link like anyone new's.

## Consequences

- No database change: the confirmation lives in the cookie, protected with the keys the app already keeps in the
  database for its cookies; a key change or 10 minutes end it, and it is useless to anyone else (another id).
- The deletion can't be undone in the app. Neon's restore window keeps the data for a few hours more (the privacy
  policy says so, F-031).
- The checks before the database are unit-tested; the deletion itself (the family, the cascade) is covered by the E2E
  test against a real database, as there are no database tests before M7 (ADR 0005).
