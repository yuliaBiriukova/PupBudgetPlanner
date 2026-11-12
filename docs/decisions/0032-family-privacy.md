# 0032. What a member keeps from the family is left out by the database, from settings on the money itself

- Status: Accepted
- Date: 2026-11-12

## Context

F-030 lets each person decide what the other members of their family see of their money (final prototype "Rows",
approved 2026-11-12): all their transactions or only the totals by category; each account at *Everything*, *Balance
only* or *Hidden*; any category private. The same for every member; set on the Family page only; what is kept is left
out completely, family totals too, and the family views say that some money is private. A balance-only account's
lines count in the totals by category; a transfer with a hidden account stays on the shown side as "A private
account"; when settings collide the stricter wins. The rules must hold in the API, not only in the page. F-024's reads
take a `MoneyScope` (ADR 0031), which that ADR said F-030 would narrow.

## Decision

- **The settings live on what they are about**, not in a table of their own: `accounts.family_sees` (`AccountShare`:
  Everything, BalanceOnly, Hidden), `categories.is_private`, `users.family_sees_transactions` (`TransactionShare`:
  Every, Totals), and `category_groups.is_private` for a whole group, its categories added later too (owner,
  2026-11-12, on the PR). They don't depend on being in a family: leaving one and joining another keeps them. The
  migrations give everything that exists the shared values, so nothing changes for anyone until they choose.
- **The rules are a pure Domain type, `KeptFromFamily`** (next to `Family`): built for one viewer from the others'
  settings (the viewer's own never count; a private group's categories are given as private ones). It answers which
  accounts the viewer sees, which of them only by their balance, which categories and groups, and who shares only
  totals, and gives two `Expression`s on `Transaction`: `Counted` (in
  any total: not in a private category, not on a hidden account, a transfer unless both its accounts are hidden) and
  `Listed` / `Unlisted` (a line, or only in the totals: its owner shares only totals, or it touches a balance-only
  account). Being expressions, they are applied in the queries, so what is kept never leaves the database; they are
  unit-tested by compiling them against transactions in memory.
- **`MoneyScope.Kept`** carries it: `IFamilyService.ScopeAsync` loads the others' settings when the scope has someone
  else in it; your own money is `KeptFromFamily.Nothing` and every query stays as it was.
- **Each read applies it:** Accounts leave out hidden accounts (and their balances from In total; a balance-only one
  shows without its transaction count); Transactions lists the `Listed` lines, a hidden transfer side sent as the
  empty id with no name (`PrivateSides`, "A private account" in the app) and the amount on the shown side; the summary
  counts `Counted` rows in the totals and Where it went, but only `Listed` ones on the calendar's days and in the
  count (`SummaryRow.Listed`); Reports count `Counted` amounts by category, the balances of the accounts shown with
  all their transactions, and leave out the others' private categories (`KeptFromFamily.Shown`), also before
  F-024's merge. A filter on a hidden account finds nothing.
- **The settings are changed by `PUT /api/family/privacy/transactions`, `…/accounts/{id}`, `…/categories/{id}` and
  `…/groups/{id}`** (`IFamilyPrivacyService`), each person on their own only (someone else's id is a 404). The page
  reads them from what it has already: `AccountItem.FamilySees`, `CategoryItem.IsPrivate`,
  `CategoryGroupItem.IsPrivate`, and on the family's members `Transactions` and `KeepsPrivate` (what the band says
  about the others).

## Consequences

- The privacy shows up wherever F-024's scope is read; a new read endpoint for someone else's money must apply
  `scope.Kept` too.
- A balance stays true: the balance of an account shown includes transactions the viewer doesn't see (in a private
  category, to a hidden account). Only a hidden account's balance is gone, from the totals too.
- The others learn that someone keeps something private (`KeepsPrivate`), never what.
- The rules on real SQL are covered by the E2E tests (`family-privacy.spec.ts`) until integration tests come
  (ADR 0005).
