# I-011 · Delete an account (card, cash) permanently

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Medium |
| Status | Done |
| Branch | `improvement/I-011-delete-account-permanently` (planned on `plan/f014-follow-ups`) |
| Design | 3 HTML prototypes required (where Delete sits, and its confirmation) |
| Approved | 2026-10-30, by the owner in chat ("Approved, build it"): the final prototype (variant 3) with only accounts without transactions deletable |

## Goal

A person can remove an account they added (a bank card, cash, their own source) for good, not only archive it:
for example one added by mistake or to try the app. Asked by the owner while testing F-014, 2026-10-30.

Not to be confused with F-027 "Delete my account", which deletes the person's Pup Budget account.

## Acceptance criteria

- [x] An account can be deleted permanently; it is removed from the database, not hidden.
- [x] Deleting asks for confirmation, says it can't be undone, and names the account (and its balance when it isn't
      zero).
- [x] After deleting, the account is gone from the list, the totals, Archived and the pickers; a short notification
      says so.
- [x] Someone else's account can't be deleted (the API answers "not found", as for edit and archive).
- [x] The person's own sources and banks stay, even when no account uses them any more (removing them is a
      separate change).
- [x] What happens to the account's transactions is decided before the build: only an account without transactions
      can be deleted; one with transactions can only be archived, and the form says why (owner, 2026-10-30). Until
      F-018 no account has transactions; F-018 adds the check to the API and the form.

## Tasks

- [x] References: delete vs close in YNAB, Actual Budget, BudgetBakers Wallet; GitHub and NN/g for the confirmation
      (open pages only; Monefy and Spendee have no open page on it).
- [x] 3 prototypes (where Delete sits, the confirmation); the owner picks and approves one (variant 3, 2026-10-30).
- [x] API: `DELETE /api/accounts/{id}` for the person's own account.
- [x] UI: Delete where the approved prototype puts it, with its confirmation.
- [x] Storybook stories: the confirmation, with and without money on the account.

## Design

### References

Open pages only, no sign-in (Mobbin needs one):

- [YNAB: close or delete an account](https://support.ynab.com/en_us/how-to-close-or-delete-an-account-in-ynab-ry_409Gko.md):
  Close is the default and keeps the history; Delete appears only for an account without transactions, or once it is
  closed, at the bottom of Edit account. Taken: delete as a second step after archiving (variant 1), and Delete at
  the end of the edit form (variant 3).
- [Actual Budget: accounts](https://actualbudget.org/docs/accounts/): Close Account opens one pop-up, and "force
  close" at its bottom removes the account even with money on it. Taken: one question with both ways out (variant 2).
- [BudgetBakers Wallet: deleting an account](https://support.budgetbakers.com/hc/en-us/articles/7151291934866-Deletion-of-a-manual-or-bank-connected-account):
  deleting is blocked while something still uses the account. Taken: say what goes with the account before it goes.
- [GitHub: deleting a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository):
  a "Danger zone" at the end of the settings page, and the name typed to confirm. Taken: the end of the form
  (variant 3) and the typed name (always in variant 3; with transactions in all of them).
- [NN/g: confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/): name what is affected, buttons
  that say the outcome instead of Yes / No, a typed word only for rare, severe actions. Taken: "Delete Mono dollars?",
  "Keep it" / "Delete for good", the money on it in the text.

### Brief

- **Who and when:** rarely, right after setting up: an account added by mistake or to try the app, or an old one
  that is in the way. On the phone as often as on the desktop.
- **The one job:** remove the right account for good, knowing what goes with it, without deleting by a slip.
- **The subject's world:** throwing away a cut-up card versus putting it in a drawer (Archive).
- **Feeling:** sure. Nothing is lost by accident.
- **Tokens:** the app's own (F-014's final prototype, I-012's pop-up spacing, whole amounts). New: a red filled
  button for "Delete for good" (`#b3261e` with light text; `#f2958c` with dark text in dark mode), red text for a
  quiet Delete. The one motion is F-014's: after deleting, its currency's total counts down to the new one.

### Round 1 (2026-10-30)

Prototypes in `prototypes/`, built on F-014's final prototype. All three share the confirmation's content: it names
the account, says it can't be undone and how much money is still on it; "Keep it" / "Delete for good" (red). The
screen "Later (F-018)" shows Claude's proposal for transactions: they go with the account, transfers leave the other
account too, and the name has to be typed. After deleting: "… deleted" and the totals count down.

| Variant | Where Delete sits | The confirmation |
|---------|-------------------|------------------|
| [1 · Archive first](prototypes/variant-1.html) | Only on an archived account, next to Restore. The edit form is unchanged; the Archive question adds "Added by mistake? Once it's archived, you can delete it for good from Archived." | A short question; the name is typed only when there are transactions (F-018). |
| [2 · One question](prototypes/variant-2.html) | The edit form's Archive becomes "Archive or delete", which asks one question with two answers: Archive (picked first) and Delete for good (red). Archived rows get Delete too. | The button follows the answer; picking Delete shows what goes with it. |
| [3 · At the end of the form](prototypes/variant-3.html) | The end of the edit form: "Archive or delete", two rows, each with a line on what it does. The buttons at the bottom are only Cancel and Save. Archived rows get Delete too. | The name is always typed; the red button stays off until it matches. |

Checked: the design check (0 issues, 0 console errors; it found a planted contrast fault on the new screens first),
screenshots of every screen at 375 and 1440 px, light and dark. Phone overviews in `screenshots/round-1-*.png`.

Claude's recommendation: variant 1. It needs the fewest new parts, keeps one way out of the edit form, and a
mistaken delete takes two deliberate steps; its cost is an extra step for an account added by mistake.

**Owner's feedback (2026-10-30):** variant 3. Transactions: **only an account without transactions can be deleted**;
one with transactions can only be archived (the YNAB way, not Claude's proposal).

### Final prototype (2026-10-30)

[Variant 3](prototypes/variant-3.html), updated with the owner's answer on transactions:

- Once F-018 brings transactions, an account with any has Delete off at the end of its edit form, with the reason:
  "It has 37 transactions, so it can only be archived. Only an account without transactions can be deleted."
  (screen "Later (F-018): has transactions").
- An archived account with transactions keeps only Restore (screen "Later (F-018): archived").
- An account without transactions is deleted as before: the name typed, "Keep it" / "Delete for good".

Checked: the design check (0 issues, 0 console errors), screenshots of every screen at 375 and 1440 px, light and
dark. Phone overview in `screenshots/final-variant-3.png`.

Prototypes: `prototypes/`. Chosen variant: 3 (final prototype), approved 2026-10-30.

## Build (2026-10-30)

- **Backend:** `DELETE /api/accounts/{id}` (`AccountsController.Delete`, `IAccountService.DeleteAsync`) removes the
  person's own account and answers 204, or 404 for someone else's or a made-up one, as edit and archive do. Only the
  account row goes: its own source and bank stay (their keys point from the account to them). No migration.
- **Frontend:**
  - The edit form ends with "Archive or delete" (two rows: Archive, Delete for good), set apart by a rule. The
    form's buttons are only Cancel and Save, on the phone too.
  - Delete turns the same dialog into the question (`useDeleteQuestion`), as Archive does: "Delete Mono dollars?",
    the money still on it, the name typed (any case, spaces around it ignored), "Keep it" back to the form,
    "Delete for good" in the danger red (People's style, F-028).
  - Archived rows have Delete next to Restore (`DeleteAccountDialog`, the same question). On the phone the two
    buttons sit under the name.
  - After deleting: a "… deleted" notification, and the currency's total counts down (F-014's moment).
- **Small choices made while building** (within the approved design):
  - The confirmation field takes the focus when the question opens. The form turns into it without opening a new
    dialog, so Mantine's own autofocus doesn't run; without this, typing went nowhere (found in the Browser pane).
  - Enter in the field deletes once the name matches.
  - Delete's red comes from the theme's error color through the button's `color`. A class lost to Mantine's own
    button colors, and the first screenshots showed a charcoal Delete.
- **F-018 (transactions):** the rule "only an account without transactions can be deleted" is in
  [F-018's notes](../../features/F-018-quick-add-income-expense/F-018-quick-add-income-expense.md#notes). Until then
  no account has transactions.

## Tests

- Unit (backend): the controller deletes the signed-in person's account (204) and answers 404 for someone else's or
  a made-up one. The service itself needs a database; integration tests come after the MVP (ADR 0005), so the E2E
  test covers the row really going and the bank staying.
- Unit (frontend): delete from the end of the edit form (the money line, Keep it back to the form, the focus in the
  field, the button off until the name matches in any case, the request, the card gone); delete from Archived.
- E2E (Playwright, desktop and phone): a new person deletes one account from the edit form (name typed in another
  case, the total drops to what is left) and one from Archived; after a reload only the third is left and its bank
  is still offered in the form. The F-014 test now archives from the end of the form.
- Storybook: the end of the form (light, dark), Delete with money (desktop, phone dark), the name typed, Delete from
  Archived (desktop, phone dark).
- Screens checked in Playwright screenshots at 375 and 1440 px, light and dark: the end of the form (and Delete under
  the mouse), the question before and after the name is typed, the list after deleting, Archived with Restore and
  Delete, and Delete from Archived. The flow was also clicked through in the Browser pane (Storybook).

## Notes

- **Where Delete sits** and **transactions:** decided by the owner with the prototype (see "Owner's feedback").
- **Test data:** the E2E and screenshot runs made `e2e-…@example.com` people with accounts on the `dev` database;
  the cleanup teardown removed them after every run. Nothing was made by hand.
