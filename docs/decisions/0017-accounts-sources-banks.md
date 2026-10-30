# 0017. Accounts: built-in Cash and Bank, personal sources and banks, currency codes kept in the app

- Status: Accepted
- Date: 2026-10-30

## Context

F-014 replaced the first draft's fixed `Institution` (Monobank, PrivatBank, Cash, Other) and `Currency` (UAH, USD,
EUR) enums. The approved design asks for:

- sources that are personal: everyone starts with **Cash** and **Bank** and can add their own (Deposit, Crypto
  wallet); only Bank has sub-sources, the banks;
- banks that are personal too: picked from your own or typed (a typed one is kept for your next account);
- any currency the NBU publishes an official rate for, plus the hryvnia, before F-017 brings the rates.

The app will be translated into Ukrainian later, and Cash and Bank are words, while own sources and banks are names.

## Decision

- **`Account.Source` is a `SourceKind`: `Cash`, `Bank` or `Own`.** Cash and Bank are not rows: the app names them
  in the person's language, nobody has to be given a copy, and no migration has to backfill them (unlike the
  categories, ADR 0015).
- **Own sources and banks are rows of the person's own** (`account_sources`, `banks`; a name unique per person).
  An account points to one with `SourceId` (for `Own` only) or `BankId` (for `Bank` only); `Account` refuses any
  other combination.
- **The form sends names, not ids** (`SourceName`, `BankName`). The API finds the person's source or bank by name,
  ignoring case, or adds it. One request both picks an existing bank and types a new one, and "monobank" and
  "Monobank" stay one bank. A person has a handful of them, so they are matched in memory.
- **A source or bank stays while an account uses it** (`ON DELETE NO ACTION` from the account). Renaming or removing
  them is not in F-014. Deleting the person removes their accounts, sources and banks together (cascade).
- **The currency is an ISO 4217 code in `char(3)`**, checked against `Currencies.All` in the Domain: the hryvnia
  and the NBU's list of about 40 currencies with official rates. The API sends the list with the accounts, so the
  frontend has no copy of it; the frontend only has the names, as translations.
- **Balances are worked out, never stored:** `BalanceSheet` (Domain, pure) adds each account's net movement to its
  opening balance and totals the currencies over the accounts in use. Until F-018 there are no movements.
- **Card style** (`Solid`, `Tinted`, `Envelope`, `Plain`) is stored per account; a new account's form starts with
  its source's style (`CardStyles.DefaultFor`).
- **Archiving** sets `ArchivedAt` (shown as "archived 3 Oct 2026") instead of a flag; restoring clears it.

## Consequences

- Translating Cash and Bank later is a translation only; own sources and banks keep the names people gave them.
- A currency the NBU adds later is one more code in `Currencies.All` (and its name in the translations).
- F-018 passes each account's net movement to `BalanceSheet`; the API and the page stay as they are.
- F-018 also has to stop an account's currency from changing once it has transactions (the form already says so).
