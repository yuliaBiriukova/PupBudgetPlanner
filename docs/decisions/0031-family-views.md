# 0031. A family's money is read through `who`; only your own is ever changed

- Status: Accepted
- Date: 2026-11-12

## Context

F-024 lets each member of a family look at another member's money and at the family's together, on Transactions,
Accounts and Reports, but change only their own. Every read and write endpoint so far worked on the signed-in person
alone (`UserId == userId` in every query). The family's report has to put everyone's categories together: each person
has categories of their own (F-029), so "Groceries" is a different row for each of them.

## Decision

- **One query value, `who`**, on the read endpoints of the three pages: `GET /api/accounts`, `/api/accounts/total`,
  `/api/transactions`, `/api/transactions/summary`, `/api/reports/year` and `/month`. It is `me` (or missing: as
  before), `family`, or a family member's id. Anything else is a 400; someone who isn't in your family (or no family)
  is a 404, as for someone else's account id.
- **The rule lives in the `Family` aggregate** (`SeenBy`): a member may see any member's money, or everyone's with
  their own first and the others in the order they joined. `IFamilyService.ScopeAsync` turns `who` into a
  `MoneyScope` (the viewer and the people), and the read services take that scope instead of a user id. F-030 will
  narrow what the scope shows.
- **Writes don't change**: every endpoint that saves, archives or deletes still takes the signed-in person only, so
  someone else's id stays "not found". Read-only isn't a flag the client could get wrong.
- **Whose an item is** comes with it: `AccountItem.OwnerId` and `TransactionItem.OwnerId`. The app decides by it which
  lines and cards open (yours) and which only show (theirs).
- **Amounts are in the viewer's report currency**, whoever's money it is, at each transaction's NBU rate, as for your
  own.
- **Merging categories** (`FamilyCategories`, pure, in Application): with more than one person, groups of the same
  kind and name and, in them, categories of the same name are one, ignoring case and spaces at the ends. The merged
  one keeps the first person's (the viewer's) id and name, so a category the viewer picks keeps working; the
  transactions list expands a picked category to every one it stands for, and the summary and the report map each
  category to its merged one before summing. Nothing is stored: the merge is worked out on each read.

## Consequences

- The pages ask for whose money with one value and get the same shapes as before; caches keep separate keys per
  `who`, and your own requests are unchanged (no `who` sent).
- A category renamed by one person stops merging with the others' until the names match again. A category only
  someone else has shows at its group's end; a group only someone else has, after the viewer's groups.
- Money one member gives another counts as an expense for one and an income for the other in the family's totals
  (F-024, open point 4): a transfer only moves money between one person's accounts.
- The merge loads the people's categories on each family read: a few hundred rows at most for a family.
