# 0037. The monthly budget's data model, and the reminder on the 1st as web push without a library

- Status: Accepted
- Date: 2026-11-16

## Context

F-033 lets each person plan a month on three levels, each optional: a total, a budget per expense group and per
expense category, each level within the one above it (a group's own budget holds its categories', the groups hold
within the total). A new month starts as a copy of the last planned one; nothing carries over. "Left" shows on a
Budget page, in the quick-add form and on Transactions. A reminder on the 1st comes as an in-app banner and, for the
devices that turned it on, as a phone notification at 09:00 Kyiv. The app had no push notifications and no scheduled
job besides the keep-awake ping and the morning clean-up (ADR 0033).

## Decision

**Data model.**

- `budget_months` — one row a person a month (`user_id`, `month` as its first day, unique together), with the
  month's `total` (none allowed). The row itself says the month is planned, also when it was started empty.
- `group_budgets` and `category_budgets` — the month's amounts by expense group and category (key: month row + group
  or category). Deleting a group or category (only an empty or unused one can be, F-029) deletes its budgets; deleting
  the account deletes everything.
- Only budgets are stored. **Spent** is worked out on each read from the month's expenses, in the report currency at
  the NBU rate of each transaction's day (as the monthly report), so editing or deleting a transaction changes "left"
  at once and nothing can go stale.
- The rule lives in `BudgetPlan` (Domain, pure): a group without a budget of its own counts in the total with its
  categories' sum. A change is refused (400, "what goes over and by how much") only where it makes a level **worse**
  than it was, so a plan already over (a category moved into another group) can be put right one line at a time.
  The page checks the same rule before saving and says it in its own words.
- API (personal, no `who`): `GET /api/budget?month=yyyy-MM` (a month not planned answers `planned: false` and
  `startFrom`, the last planned month before it), `POST /api/budget/start` (`copyLast`), `PUT /api/budget/total`,
  `PUT /api/budget/groups/{id}`, `PUT /api/budget/categories/{id}` (no amount removes), `DELETE /api/budget?month=` (the whole plan; the month is then not planned). Setting a budget in a month not
  planned plans it. From 2000 to next month.

**The reminder.**

- **Banner**: over every page but Budget while this month isn't planned, for someone who has planned a month before
  (`startFrom`); closed for the month on the device. *Start from October* starts the month as a copy.
- **Push**: standard web push. The browser subscribes with the app's VAPID public key; `PUT /api/push/subscription`
  keeps the device (`push_subscriptions`, one row an endpoint, moved to whoever signs in on it), `POST
  /api/push/subscription/remove` forgets it. Only the browsers' own push services (FCM, Mozilla, WNS, Apple) over https
  are accepted, so a subscription can't point the server anywhere else.
- **No library**: the message is encrypted for the device (RFC 8291, `aes128gcm`) and the request signed (VAPID,
  RFC 8292, ES256) with .NET's own ECDH, HKDF, AES-GCM and ECDsa, about 100 lines (`WebPush`). The RFC's own example is
  a unit test, byte for byte. The .NET web-push packages are small, little maintained, and pull in a JWT or crypto
  library for what .NET already has (ADR 0006).
- **The job**: cron-job.org calls `POST /api/reminders/budget` at 09:00 Kyiv on the 1st with the secret in
  `X-Reminders-Secret`, like the clean-up (ADR 0033); the call also wakes the sleeping free service. It sends to every
  device whose person hasn't planned the month and that wasn't reminded this month (`reminded_for`), so a second run
  sends nothing; a device the push service says is gone (404/410) is deleted. Answer: `{ sent, removed, failed }`.
- **The service worker**: the app's generated one (ADR 0034) loads `push-sw.js` (`workbox.importScripts`), which shows
  the notification and opens the Budget page on a tap.
- **Settings**: `Push__PublicKey`, `Push__PrivateKey` and `Push__RemindersSecret` on Render and in user-secrets, never
  in the repository. Without the keys the app says notifications aren't available and the job sends nothing.

## Consequences

- One more cron-job.org job and three Render settings, set up by the owner (README, "Budget reminder").
- On an iPhone notifications come only to the app on the home screen (iOS 16.4+); the card and Settings say so and
  show how to install it. In Safari on a Mac and in other browsers it works from the browser.
- Push can't be checked by Playwright (no push service in a headless browser): the encryption and signature are unit
  tests, the server's whole path was checked against FCM with a made-up device, and the notification itself is checked
  by hand on a phone.
- F-034 (saving jars) adds jars to the month's plan inside the total; the tables leave room for one more kind of line.
