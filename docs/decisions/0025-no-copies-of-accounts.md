# 0025. No two accounts in use alike: checked in the Domain, backed by a partial unique index

- Status: Accepted
- Date: 2026-11-04

## Context

Until I-020 nothing stopped a person from having two accounts with the same name, currency, source and bank. In the
pickers, the list and the transfer form they can't be told apart, so money would be recorded on the wrong one. The
owner approved refusing an exact copy of an account in use (2026-11-04): the name compared ignoring case and the
spaces around it, archived accounts left out, restoring an archived copy refused.

## Decision

- **The rule lives in the Domain:** `Account.LooksLike(details)` and `Account.CopyIn(accounts, details, except)`.
  The service loads the person's accounts in use (a handful, like their banks, ADR 0017) and checks before it saves,
  when an account is added, changed or restored. Names are compared with `OrdinalIgnoreCase`, like the banks' and
  own sources' names, so Cyrillic names match too. An archived account is never checked: it can't be a copy until it
  is restored.
- **The API answers a copy as a mistake in the name** (400 `ValidationProblemDetails`, like the validators), and
  restoring a copy with 409. The frontend finds a copy itself before sending (`copyOf`, from the page's accounts) and
  shows the API's answer the same way, for a copy saved meanwhile elsewhere.
- **A partial unique index backs it up** (`ix_accounts_no_copies_in_use`): on `user_id, lower(name), currency,
  source, source_id, bank_id`, `NULLS NOT DISTINCT` (cash has neither id), `WHERE archived_at IS NULL`. EF Core
  can't describe an expression index in the model, so the migration (`NoCopiesOfAccounts`) makes it with SQL; a test
  checks the migration and the constant agree. It only catches two saves at the same moment: the service turns its
  unique violation into the same "copy" answer instead of a 500.
- **Copies made before I-020 are left alone.** The migration makes the index only when there are none; otherwise it
  logs a warning and skips it, rather than failing the deploy or changing anyone's accounts. The Domain check still
  stops new copies.

## Consequences

- `lower()` follows the database's locale. With a C locale it folds only Latin letters, so two saves at the same
  moment of Cyrillic names differing only in case could both get through; the Domain check, used on every save,
  doesn't have this gap.
- If a database had copies when the migration ran, the index is missing there until the copies are gone and the
  index is made by hand (the SQL is in the migration).
- Changing an account's name to one that differs only in case from another account in use is refused, as intended.
