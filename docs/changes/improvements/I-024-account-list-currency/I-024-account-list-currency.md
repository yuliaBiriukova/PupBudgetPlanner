# I-024 · The account list in the quick-add form tells the accounts apart

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | Medium (with several accounts of one name, picking the right one is guesswork) |
| Status | Done |
| Branch | `improvement/I-024-account-list-currency` (planned on `plan/prod-testing-fixes`) |
| Design | 🎨 3 prototype stories, then the final prototype (round 2); screenshots in [prototypes/](prototypes/) |
| Approved | 2026-11-05, the final prototype (round 2), by the owner in chat ("Approved, build it") |

## Goal

The quick-add form's Account list shows one line per account: its name and balance. With an account per currency in one
bank (three "Mono", two "ФОП", three "Privat") the rows look alike; only the sign of the balance hints at the currency,
and a balance of `0 ₴` or a sign like `₴` and `₸` is easy to miss. The owner wants the currency shown (2026-11-04,
production). The bank or cash, shown under the name in the closed field, is missing from the rows too.

## Acceptance criteria

- [x] Each row of the Account list (desktop dropdown and phone sheet) shows the account's currency code (`UAH`, `USD`,
      `EUR`) besides its name and balance.
- [x] The rows also show where the account is (the bank, Cash, or the own source), as the closed field does, if the
      chosen variant has it.
- [x] Two accounts with the same name can be told apart at a glance in the list (I-020 already stops exact copies).
- [x] The list is one list (no groups), the account whose latest transaction was added most recently first; accounts
      with no transactions last, oldest first (owner, 2026-11-05).
- [x] The Transfer's From and To lists (F-019) show the same rows.
- [x] Rows stay one tap high enough on the phone; the list's height rule (as tall as its rows up to 344 px) stays.

## Tasks

- [x] References (Mobbin "select account", "choose wallet"; Monobank's and Revolut's account switchers, open sites) and
      3 prototype stories in `frontend/src/prototypes/I-024-account-list-currency/` (*Prototypes / I-024 Account list*),
      in the real quick-add form. Candidates: the code as a small tag after the name (`Mono  USD`); a second line under
      the name like the closed field (`Monobank · USD`); the rows grouped by currency with a heading per currency, as the
      Accounts page groups them.
- [x] Owner's approval of the final prototype (I-003): 2026-11-05.
- [x] Backend: `lastUsedAt` on each account in the accounts API (the latest transaction's `CreatedAt`, a transfer's
      for both accounts); xUnit tests.
- [x] `AccountField.tsx` (`AccountList`, used by the Account field and Transfer's From and To lists); the closed
      fields unchanged.
- [x] Storybook stories: a long list with same-named accounts in several currencies (*Transactions / Account list*,
      phone and desktop, light and dark). The prototype stories are deleted.

## Tests

- Unit: each row has the currency and the source; the list's order is by the latest transaction, unused accounts
  last; backend: an account's `lastUsedAt` is its latest transaction's, a transfer's for both sides.
- E2E (Playwright): pick the dollar "Mono" by its row → the form's amount shows `$`.
- Screens checked in Playwright screenshots (375 and 1440 px, light and dark).

## Design

### References

Mobbin needs a sign-in for most screens, so it wasn't used; only pages that open without one.

- [screensdesign.com, currency screens](https://screensdesign.com/explore/screens/currency/): Calculator₊ lists each
  currency as its code and then its name; HBX puts the code on the right of each row and groups the rows under
  headings. Taken: the code is the quickest thing to scan (variants 1 and 3), and headings per group (variant 3).
- Klook's currency setting on the same page shows the code and the sign together (`PHP | ₱`). Taken: the sign alone
  isn't enough, so every variant shows the code next to it.
- [Wise help, the new account layout](https://wise.com/help/articles/645Ve1Ah1Psi0srHGfKYmm/your-wise-account-has-a-new-look):
  the home screen lists balances per currency, with groups and jars in the same view. Taken: an account's currency
  is how people think of it (variant 3).
- The app's own Accounts page (F-014) groups accounts by currency with the currency's name as the heading, and its
  currency list (F-016) shows the code and then the name. Variant 3's headings are that row.

### Brief

- **Who and when:** on the phone in a few seconds, often with one hand; on the desktop at the month's end.
- **The job:** pick the right account when several have the same name; what must be seen first is the name and its
  currency.
- **Their world:** an account per currency in each bank: Mono in hryvnias, dollars and euros; the same on the
  Accounts page, grouped by currency.
- **The feeling:** sure it's the right one, without reading the balance's sign.

### Plan

- **Reused:** the quick-add form as built (copied into the prototype folder, imports only changed), its `Picker`
  (dropdown with B-005's scroll bar gutter; sheet on the phone), the list's rows (`.listItem`, 44 px), the picked row
  in the accent, `formatMoney`, the currency names (`useCurrencyName`), the currency list's heading style.
- **New:** only what each row shows. No new tokens.
- **The bold element:** the currency's code. The rest stays as it is.
- **Motion:** none.
- Slop check: no tinted circle or flag per row; the code is data, not a tracked label; no middle-dot meta strings
  (variant 2 puts the bank and the code each on their own line, variant 3 sets the bank apart by its colour and size).

### Round 1: three variants (2026-11-05)

Stories in `frontend/src/prototypes/I-024-account-list-currency/` (*Prototypes / I-024 Account list*): the
Transactions page with the quick-add form open; tap the Account field (or Transfer → From / To). Fake data: 11
accounts, three "Mono" (UAH, USD, EUR), two "ФОП", three "Privat", cash, a deposit.

| Story | Thesis | Link |
|---|---|---|
| Variant 1: Code tag | The code as a small outlined tag right after the name; one line a row, as today. Densest: 7½ rows in the dropdown | [open](http://localhost:6006/?path=/story/prototypes-i-024-account-list--variant-1&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 2: Like the field | Two lines, like the closed field: the name over the bank, the balance over the code. The closed field also gets the code under its balance. Rows 56 px, 5½ in the dropdown | [open](http://localhost:6006/?path=/story/prototypes-i-024-account-list--variant-2&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 3: By currency | Grouped by currency (hryvnia first, then the most used), each under the currency list's row as a heading (`USD  US dollar`) that stays on top while the group scrolls; the bank after the name in grey. The rows change order: by currency, not oldest first | [open](http://localhost:6006/?path=/story/prototypes-i-024-account-list--variant-3&nav=false&panel=false&globals=viewport.value:!undefined) |

Checked: the design check on the three stories (the form open; its findings are the same in all three and none is in
the account rows: the form over the page, the amount on the phone, the page's bars); the list opened, scrolled,
"Mono" in dollars picked (the amount shows `$`), and Transfer's To list, at 375 and 1440 px, light and dark, in
Playwright screenshots, looked at. Found and fixed: in variants 1 and 3 a long name made the phone sheet's list
wider than the screen and cut off the balances.

### Round 2: the final prototype (2026-11-05)

The owner first chose variant 3, grouped by currency, with three changes; then asked to remove the groups and to list
the accounts by when they were last used rather than by how many transactions they have (same day). The final
prototype:

- **One list, the account used last first:** no currency groups or headings. The account whose latest transaction
  was added most recently comes first, then the next, whatever their currency; an account with no transactions comes
  after them, in the accounts' order (oldest first). "Added" is when the transaction was saved (its `CreatedAt`), not
  its date, so an expense entered today for last week still moves its account up; editing a transaction doesn't. A
  transfer counts for both its accounts. The list is the same for an expense, an income and a transfer.
- **Backend:** the accounts API returns, for each account, when its latest transaction was added (`lastUsedAt`, none
  for an account without transactions), counted by the database like the transaction count.
- **The name and the bank in one line:** the bank (Cash, the own source) follows the name in grey as one line of
  text; when the row is too narrow it wraps and the row grows a line (`Deposit for the new / apartment Deposit` on
  the phone), nothing is cut off.
- **The balance and the code in one line** on the right: `$640 USD`, `18 420 ₴ UAH`, the code in grey.

| Story | Link |
|---|---|
| Final | [open](http://localhost:6006/?path=/story/prototypes-i-024-account-list--final&nav=false&panel=false&globals=viewport.value:!undefined) |

Fake data: each account has the time of its latest transaction, so the list reads Mono in dollars (the latest, a
transfer), Wallet, Mono, ФОП, Privat, Dollars at home, ФОП in dollars, Privat in euros, the Deposit, and the two
never-used accounts last (Mono in euros, Privat in dollars). The form still opens on the account last used for the
type (F-018), here Mono in hryvnias for an expense, so the picked row isn't always the first.

Checked: the design check (22 findings, the same as each round-1 story's, none in the rows); the list opened,
scrolled to the end, the dollar "Mono" picked (the amount shows `$`), and Transfer's To list, at 375 and 1440 px,
light and dark, in Playwright screenshots, looked at; the phone sheet and the desktop dropdown clicked through in the
Browser pane.

The prototype stories were deleted when the change was built, so the story links above no longer open; the real
list is *Transactions / Account list* in Storybook.

Approved by the owner on 2026-11-05 ("Approved, build it"). Transfer's From and To fields (closed) stay as they are,
the name and the balance; only their lists get the new rows. Screenshots of the final prototype (the list open, 375
and 1440 px, light and dark) are in [prototypes/](prototypes/).

## Notes

- B-005 (the scroll bar over the balances) is in the same list; whichever is built second checks the other's screens.
- The screenshot was shared in chat; not stored in the repo (it shows real balances).
