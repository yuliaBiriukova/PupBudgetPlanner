# I-024 · The account list in the quick-add form tells the accounts apart

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | Medium (with several accounts of one name, picking the right one is guesswork) |
| Status | Todo |
| Branch | `improvement/I-024-account-list-currency` (planned on `plan/prod-testing-fixes`) |
| Design | 🎨 3 prototype stories (what each row shows) |
| Approved | — |

## Goal

The quick-add form's Account list shows one line per account: its name and balance. With an account per currency in one
bank (three "Mono", two "ФОП", three "Privat") the rows look alike; only the sign of the balance hints at the currency,
and a balance of `0 ₴` or a sign like `₴` and `₸` is easy to miss. The owner wants the currency shown (2026-11-04,
production). The bank or cash, shown under the name in the closed field, is missing from the rows too.

## Acceptance criteria

- [ ] Each row of the Account list (desktop dropdown and phone sheet) shows the account's currency code (`UAH`, `USD`,
      `EUR`) besides its name and balance.
- [ ] The rows also show where the account is (the bank, Cash, or the own source), as the closed field does, if the
      chosen variant has it.
- [ ] Two accounts with the same name can be told apart at a glance in the list (I-020 already stops exact copies).
- [ ] The Transfer's From and To lists (F-019) show the same rows.
- [ ] Rows stay one tap high enough on the phone; the list's height rule (as tall as its rows up to 344 px) stays.

## Tasks

- [ ] References (Mobbin "select account", "choose wallet"; Monobank's and Revolut's account switchers, open sites) and
      3 prototype stories in `frontend/src/prototypes/I-024-account-list-currency/` (*Prototypes / I-024 Account list*),
      in the real quick-add form. Candidates: the code as a small tag after the name (`Mono  USD`); a second line under
      the name like the closed field (`Monobank · USD`); the rows grouped by currency with a heading per currency, as the
      Accounts page groups them.
- [ ] Owner's approval of the final prototype (I-003).
- [ ] `AccountField.tsx` (`AccountList`) and the transfer's account fields.
- [ ] Storybook stories: a long list with same-named accounts in several currencies.

## Tests

- Unit: each row has the currency (and the source, if chosen).
- E2E (Playwright): pick the dollar "Mono" by its row → the form's amount shows `$`.
- Screens checked in Playwright screenshots (375 and 1440 px, light and dark).

## Notes

- B-005 (the scroll bar over the balances) is in the same list; whichever is built second checks the other's screens.
- The screenshot was shared in chat; not stored in the repo (it shows real balances).
