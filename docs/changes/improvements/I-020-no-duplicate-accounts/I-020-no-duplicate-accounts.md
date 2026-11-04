# I-020 · No two accounts exactly alike

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Medium |
| Status | Done |
| Branch | `improvement/I-020-no-duplicate-accounts` (planned on `plan/i020-no-duplicate-accounts`) |
| Design | not needed: an error under the name field and a notification, both as the app already shows them |
| Approved | 2026-11-04, by the owner in chat ("approved build"), after reviewing the plan PR #53 |

## Goal

A person can't have two accounts in use that look exactly the same: the same name, currency and source (and the
same bank or own source). In the pickers, the list and the transfer form they couldn't tell them apart, so
transactions would end up on the wrong one. Asked by the owner, 2026-11-04.

Today nothing stops it: `SaveAccountRequestValidator` checks each field alone, and only own sources and banks have
unique names (ADR 0017).

## Acceptance criteria

- [x] Adding an account is refused when an account in use has the same name, currency, source and bank (for a bank
      account) or own source (for an own one). The form stays open, with an error under the name field:
      "You already have this account. Give it another name."
- [x] The same rule applies when editing: an account can't be changed into a copy of another one in use. Saving an
      account with its own unchanged values is fine.
- [x] Names are compared ignoring letter case and spaces around them: "monobank " counts as "Monobank". Currency,
      source and bank are compared as they are stored (banks and own sources are already one row per name).
- [x] Still allowed: the same name in another currency ("Monobank" in UAH and in USD), at another bank or with
      another source ("Main card" at Monobank and at PrivatBank, "Savings" in cash and in an own source).
- [x] Archived accounts don't count: a closed card can be replaced by a new one with the same name.
- [x] Restoring an archived account that is a copy of one in use is refused with a notification naming that
      account: "You already have “Monobank” in use. Rename it first, then restore this one."
- [x] The backend checks it too (the API answers with a `ProblemDetails` error on the name), so two saves at the
      same moment, or a request from outside the form, can't make a copy. (Two saves at the same moment are caught by
      the unique index where the migration could make it; see Notes.)
- [x] Accounts that are already copies of each other (made before this change) keep working; the rule only stops
      new copies. Editing one of them asks for another name only if its values would still be a copy.

## Tasks

- [x] Application: the duplicate check in `AccountService` (create, update, restore), comparing the trimmed name
      case-insensitively among the person's accounts in use.
- [x] Database: a unique index on (user, lower(trimmed name), currency, source, bank, own source) for accounts in
      use (filtered on `archived_at is null`), so parallel saves can't both get through; a migration. Check the
      `dev` and production data for existing copies first (see Notes).
- [x] API: the error as `ProblemDetails` with the error on `name`; restore's error with the other account's name.
- [x] Frontend: show the API's error under the name field in `AccountDialog`; the restore notification on the
      Accounts page. i18n keys for both messages.
- [x] Tests (below); docs: ARCHITECTURE (accounts) and [ADR 0025](../../../decisions/0025-no-copies-of-accounts.md)
      instead of a note in ADR 0017 (the index and the migration are a decision of their own).

## Design

No new screen: the name field's error and the restore notification look like the app's existing ones. If the owner
wants another wording or place for the messages, that is decided in review of this file.

## Tests

- Unit (xUnit): duplicate refused on create and update; allowed with another currency, bank, source or own source;
  case and spaces ignored; saving an account unchanged is fine; archived accounts don't count; restore refused when
  a copy is in use; someone else's account with the same values doesn't count.
- Unit (Vitest + RTL): the API's name error shows under the name field; the restore notification.
- E2E (Playwright): add an account, try to add the same one again → error under the name; change the currency →
  saved. Archive one, add the same one again → saved; restore the archived one → refused with the notification.
- Screens checked in Playwright screenshots (phone / desktop, light / dark): the account dialog with the error, the
  Accounts page with the restore notification.

## Notes

- **As built (2026-11-04).** The rule is `Account.LooksLike` / `Account.CopyIn` in the Domain; `AccountService`
  checks it on create, update (accounts in use only) and restore, and turns the index's unique violation into the
  same answer. The API answers a copy with 400 and the error on `name`, a refused restore with 409. The form finds a
  copy itself before sending (`copyOf`) and shows the API's answer the same way. The index
  `ix_accounts_no_copies_in_use` is made by SQL in the `NoCopiesOfAccounts` migration (EF Core can't model an
  expression index), `NULLS NOT DISTINCT` so cash accounts count too. See ADR 0025.
- **Existing copies, as decided while building.** Copies made before I-020 aren't changed. The migration makes the
  index only when there are none, and otherwise logs a warning and skips it, so a deploy never fails on old data; the
  Domain check stops new copies either way. The `dev` and production data couldn't be read from here: the owner checks
  them with the query in the PR (whether the index exists, and any copies).

- **Existing copies.** Before the unique index, check the `dev` and production databases for accounts in use that
  are already copies. If there are any, the migration can't add the index as it is; ask the owner what to do (rename
  one, or let the index skip them) rather than changing anyone's data.
- **A warning instead of a block** ("You already have an account like this. Create anyway?") was considered and not
  chosen: it needs an extra dialog and doesn't help telling the two accounts apart later.
- **Cards at the same bank in the same currency** are normal and stay possible with different names
  ("Mono Black", "Mono White").
