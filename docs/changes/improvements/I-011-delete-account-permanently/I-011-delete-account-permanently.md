# I-011 · Delete an account (card, cash) permanently

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Medium |
| Status | Todo |
| Branch | `improvement/I-011-delete-account-permanently` (planned on `plan/f014-follow-ups`) |
| Design | 3 HTML prototypes required (where Delete sits, and its confirmation) |
| Approved | — |

## Goal

A person can remove an account they added (a bank card, cash, their own source) for good, not only archive it:
for example one added by mistake or to try the app. Asked by the owner while testing F-014, 2026-10-30.

Not to be confused with F-027 "Delete my account", which deletes the person's Pup Budget account.

## Acceptance criteria

- [ ] An account can be deleted permanently; it is removed from the database, not hidden.
- [ ] Deleting asks for confirmation, says it can't be undone, and names the account (and its balance when it isn't
      zero).
- [ ] After deleting, the account is gone from the list, the totals, Archived and the pickers; a short notification
      says so.
- [ ] Someone else's account can't be deleted (the API answers "not found", as for edit and archive).
- [ ] The person's own sources and banks stay, even when no account uses them any more (removing them is a
      separate change).
- [ ] What happens to the account's transactions is decided before the build (see the open points) and the
      confirmation says it.

## Tasks

- [ ] References: delete vs close in YNAB, Actual Budget, Monefy, Spendee (open pages only).
- [ ] 3 prototypes (where Delete sits, the confirmation); the owner picks and approves one.
- [ ] API: `DELETE /api/accounts/{id}` for the person's own account.
- [ ] UI: Delete where the approved prototype puts it, with its confirmation.
- [ ] Storybook stories: the confirmation, with and without money on the account.

## Design

References: —
Prototypes: `prototypes/`. Chosen variant: —

## Tests

- Unit (backend): delete removes the row; someone else's account is not found; sources and banks stay.
- Unit (frontend): the confirmation and what happens after it.
- E2E (Playwright): add an account, delete it, it is gone from the list and the totals.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes

Open points, Claude's proposals for the owner to confirm with the prototype:

- **Where Delete sits.** Proposal: on an archived account, next to Restore, so deleting is always a second,
  deliberate step and the edit form keeps one way out (Archive), as in Actual Budget, where a closed account can
  be deleted. Alternative: in the edit form next to Archive.
- **Transactions (F-018).** Until F-018 accounts have no transactions, so deleting removes only the account. Once
  they exist, proposal: an account with transactions can be deleted together with them, and the confirmation says
  how many go and asks for the account's name to be typed. A transfer touches two accounts; deleting one side would
  change the other account's balance, so the proposal is to delete the whole transfer and say so. Alternative (as
  YNAB does): only an account without transactions can be deleted; the others can only be archived.
- **Built after F-014 is merged** (the accounts come with it).
