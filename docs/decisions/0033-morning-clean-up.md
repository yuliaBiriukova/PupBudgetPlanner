# 0033. A morning clean-up job, started by cron-job.org with a secret

- Status: Accepted
- Date: 2026-11-12

## Context

I-006 lets the admin and family owners delete invite links, and the owner asked (2026-10-29) that links that can no
longer be used go by themselves 30 days later, in a job that runs every morning; other outdated data may join it
later. The API is one free Render service that sleeps at night and wakes on a request (ADR 0002): a timer inside the
app would miss its time while asleep. Used links also carried the "Invited" tag of the People page (F-028), so
deleting them would have dropped it.

## Decision

- **cron-job.org calls `POST /api/cleanup` every morning at 07:05 Kyiv time**: the service that already runs the
  keep-awake ping, five minutes after the ping's first call wakes the API. The call carries the secret in the
  `X-Cleanup-Secret` header.
- **The secret** is `Cleanup__Secret` on Render (and in user-secrets locally), never in the repository. Without it
  every call gets 401: the clean-up is off. It is compared in constant time, the endpoint shares the sign-in rate
  limit, and a refused call is logged as a warning. Nobody signs in there, so it opts out of the antiforgery check
  (`[RequireAntiforgeryToken(false)]`, which the app's `AntiforgeryFilter` honours).
- **Each kind of outdated data is one DELETE by its date.** For now invite links: used, cancelled or expired before
  `now − Cleanup:InvitationsKeptFor` (30 days by default), by `COALESCE(used_at, cancelled_at, expires_at)`
  (`Invitation.StoppedBefore`). A second run deletes nothing more; a missed morning is caught up by the next one, and
  links already older than 30 days go on the first run. Waiting links never match.
- **Each run logs what it deleted** and answers with the counts (`{ "invitationsDeleted": 3 }`); a failure is a 500 in
  the logs and in cron-job.org's history.
- **"Invited" and its note are kept on the account** (`users.invited`, `users.invitation_note`, copied once by the
  migration), so any link can be deleted.
- Rejected: a scheduled GitHub Actions workflow (costs Actions minutes, which ran short, ADR 0030); a hosted
  background service in the API (misses its time while the free service sleeps).

## Consequences

- One more cron-job.org job and one more Render setting, set up by the owner (steps in the I-006 description).
- New outdated data (e.g. old exchange rates) is added as one more DELETE in `CleanupService` and one more count in
  `CleanupReport`.
- If the service moves to a paid plan that doesn't sleep, the same endpoint keeps working; an in-app timer could
  replace cron-job.org then.
