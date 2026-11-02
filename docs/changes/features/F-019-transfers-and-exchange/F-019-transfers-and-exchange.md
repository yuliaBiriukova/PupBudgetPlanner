# F-019 · Transfers and currency exchange

| | |
|---|---|
| Type | Feature |
| Milestone | M3 — Transactions |
| Status | Done |
| Branch | `feature/F-019-transfers-and-exchange` |
| Design | 3 HTML prototypes required: shared with F-018 (its variants 1–7 all had Transfer and Exchange screens) |
| Approved | 2026-11-02, by the owner in chat ("Approved, build F-019"): the [final prototype](prototypes/variant-1.html), this plan, and the four open points as proposed |

## Goal

Move money between own accounts, including buying and selling currency.

## Acceptance criteria

- [x] Transfer between two own accounts in the same currency: one amount, no category, an optional note
- [x] Between different currencies (an exchange), both amounts are entered; the effective rate is shown next to the
      NBU's
- [x] The second amount is suggested from the NBU rate of the transaction's day and can be changed; with no rate of
      that day yet the latest earlier one is suggested and said so, with no rate at all it must be typed
- [x] Transfer is the third type of the quick-add form (Expense, Income, Transfer); the last transfer's From and To come
      picked; from an account card's + that account is the From
- [x] From and To can be swapped; the To list leaves out the From account
- [x] Both balances update at once: the notification counts both, and on the Accounts page both cards light up
- [x] A transfer is listed on the Transactions page ("Transfer", or "Exchange" between currencies) and can be changed
      or deleted; Delete says what both balances go back to
- [x] An account a transfer uses (as From or To) counts as used: it can't be deleted or change its currency
- [x] Transfers do not count as income or expense in reports (F-021 builds on this)

## Tasks

- [x] Design: F-018's variants had Transfer and Exchange screens; final prototype built from variant 7 as built
- [x] Owner's approval of the final prototype and this plan (2026-11-02)
- [x] Domain + API (incl. migration and the rate for the form)
- [x] UI
- [x] Storybook stories
- [x] Unit tests (backend, frontend) and the E2E test
- [x] Docs: ADR 0023, DESIGN_RULES screen decision, ARCHITECTURE, PROGRESS

## Design

### References (2026-11-02)

Mobbin needs a sign-in, so the references are open help pages and reviews.

- **Wise** ([sending exact amounts](https://www.wise.com/help/articles/2448314/can-i-send-exact-amounts)) — one screen
  with two linked amounts, "you send" and "recipient gets", either one typed. Taken: both amounts in one form, the
  second worked out from the rate until you type it yourself.
- **Wallet by BudgetBakers** ([an expat's review](https://theportablewife.com/living-abroad/best-budgeting-app-for-expats-wallet/))
  — transfers between currencies at automatic rates; the review's one complaint is that the bank's rate differs, so the
  amount received is wrong. Taken: the NBU amount is only a suggestion, and the line under it asks for what the bank
  gave.
- **CoinKeeper** ([working with currencies](https://enhelp.coinkeeper.me/How-to-work-with-different-currencies-c0f022ebb4f547f09f11eac486173484))
  — loads the day's rates by itself. Taken: no rate to type unless you want your own; ours is the NBU's of the
  transaction's day (business rule 1).
- **F-018's own rounds** — Transfer was the third type in every variant; variant 7 (approved for expense and income)
  has From and To with select arrows where the account is, and the second amount as a smaller display with the rate.

### Brief

- **Who and when:** one of the couple after a trip to the exchange office or the bank app: dollars sold for hryvnias,
  cash taken from a card, money moved to savings. On the phone, right after it happened; on the desktop, catching up.
- **The one job:** say where the money went from and to, and how much each side changed. The amounts are seen first,
  the rate is a check.
- **The subject's world:** the exchange office's board (buy / sell, $1 = …), the bank app's "you get", two cards.
- **One feeling:** both sides add up; the balances on the Accounts page are what the banks say.

### Final prototype (2026-11-02)

[Final prototype](prototypes/variant-1.html) (open from disk; the bar on top picks the view, screen and theme; "About
this direction" lists the decisions). It is F-018's variant 7 with the changes the owner made to it and the build
(the week strip, the split edge on the cards) and Transfer finished. Screens: Transfer, To list, Exchange at the NBU
rate, Exchange at your rate, Buying dollars, Earlier rate, No rate, Nothing in To, Accounts page, From an account,
Saved, Transactions, Edit exchange, Delete.

- **Type:** Expense, Income, Transfer in the switch. Changing the type keeps the day, the amount and the note.
- **From and To** where the account field is, side by side, with select arrows and their balance now; the same account
  list (dropdown on the desktop, sheet on the phone); the To list leaves out the From account. The last transfer's From
  and To come picked; from an account card's + that account is the From.
- **Swap (new):** a button between From and To swaps them, with the two amounts of an exchange (100 USD → 4 490 ₴
  becomes 4 490 ₴ → 100 USD). Picking the To account as From swaps them too.
- **Same currency:** one amount in the transfer's blue, no sign, no category.
- **Exchange:** the amount From (big), then the amount To (smaller), suggested at the NBU rate of the picked day; the
  line under it: "At the NBU rate of 29 Oct 2026: $1 = 45.53 ₴. Change it to what the bank gave you." Typed your own:
  "Your rate: $1 = 44.90 ₴. NBU: $1 = 45.53 ₴." and "Use the NBU rate" to go back.
- **The rate** as the app writes rates (Accounts, F-017): one unit of the currency worth more, so selling and buying
  dollars both read $1 = … ₴; two decimals. Amounts stay whole (ADR 0018).
- **Phone keys** type into the display with the ring; a tap on the other display moves them. The first key on a
  suggested amount replaces it. **Desktop:** clicking the suggested amount selects it, so typing replaces it.
- **No rate:** the day's rate not out yet → the latest earlier one is suggested and the line says so (F-017's
  fallback). No rate at all → the To amount is empty and the line asks for it; Save without it turns it red (its
  message read out only, as the amount's).
- **Saved:** "Transfer saved." (or "Exchange saved.") with both accounts counting to their new balances; on the
  Accounts page both cards light up.
- **Transactions page:** "Transfer" / "Exchange", the accounts with an arrow and the note, the amount in blue without
  a sign: `2 000 ₴`, `$100 → 4 490 ₴`. A row opens "Edit transfer" / "Edit exchange" (no type switch, as built).
- **Delete** asks and says what both balances go back to.

Checked: every screen opens without errors; screens tried in the Browser pane on the phone; the design check (see
PROGRESS) and screenshots at 375 and 1440 px, light and dark, looked at.

### Open points (answered 2026-11-02: as proposed, with the approval)

1. **Swap button** between From and To: new, not in F-018's rounds. *Proposed: yes.*
2. **"Exchange"** as the name of a transfer between currencies in the list, the titles and the notification, while the
   switch says Transfer. *Proposed: yes.*
3. **Transfer fees** stay out (PRODUCT: a commission is a separate expense in "Bank commission"). *Proposed: as is.*
4. **Below zero:** a transfer may take an account below zero, as an expense can. *Proposed: allowed, no warning.*

## Plan (for approval)

### Backend

- **Domain:** `TransactionType.Transfer`; `Transaction` gets the To account and the To amount (whole, above zero). A
  transfer has no category; From and To differ; between accounts in one currency the To amount equals the amount.
  One row per transfer (not two linked rows), so it is saved, changed and deleted as one.
- **Infrastructure:** migration with two nullable columns (`to_account_id` with no action on delete, `to_amount`) and a
  check that a transfer has both and the others have neither; queries sum transfers into both accounts' movements
  (`BalanceSheet`: From − amount, To + To amount); an account counts as used when it is a transfer's To too.
- **API:** `/api/transactions` takes and returns the To account and amount (list rows also the To account's name and
  currency); saving or deleting a transfer answers with both accounts' balances before and after. The suggestions
  give the last transfer's From and To. `GET /api/rates?date=…` returns the NBU rates of a day (with the date they are
  of and why when earlier), from F-017's `ExchangeRateService`, for the form's suggestion. Validation: both accounts
  the person's own and not archived (an existing transfer keeps an archived one), To ≠ From, the To amount required
  between currencies.
- **ADR:** transfers as one row with two accounts; the form's rate from the API, the amounts from the person.

### Frontend

- The switch with Transfer; From / To fields (the account field's look) and the swap button; the second amount display
  with the rate line (`formatRate`), the keys' target; the rate query by the picked day; list rows, edit and delete for
  transfers; the notification with two balances; both cards lit on the Accounts page. i18n keys for every text.
- Storybook stories for the new states (transfer, exchange at the NBU and own rate, no rate, list rows).

### Tests

- Unit (backend): transfer validation, balances of both accounts, used accounts, suggestions with From and To.
- Unit (frontend): the suggested amount and rate text, swap, the form's transfer flow, list rows.
- E2E (Playwright): exchange 100 USD to UAH; both balances change (desktop and phone).

## Build notes (2026-11-02)

- **Backend:** `TransactionType.Transfer`; `Transaction` got `ToAccountId` and `ToAmount`, `CategoryId` became
  nullable (migration `AddTransfers`, with the check constraint `ck_transactions_transfer_shape` and a no-action
  foreign key for To). Between accounts in one currency the API sets To's amount to the amount; between currencies the
  request must carry it (400 on `toAmount`). Balances, "used" accounts, save and delete count both sides; the
  suggestions give `lastTransfer`. `GET /api/rates?date=…` returns the day's NBU rates (or the latest earlier, marked),
  400 after Kyiv's today. [ADR 0023](../../../decisions/0023-transfers-one-row.md).
- **Frontend:** Transfer in the switch; `TransferAccounts` (From / swap / To, the To list without From), `RateLine`,
  `exchange.ts` (NBU rate, suggestion, the rate's text); `AmountDisplay` takes a label, the smaller second display, the
  phone keys' ring and a rate line, and scrolls the display the keys type into above the keys. List rows, the delete
  question with both balances, the notification counting both, both cards lit on Accounts.
- **Found while checking:** the amount display left a gap between the dollar sign and the number (the input kept its
  own 20-character width; F-018's display): fixed in CSS. On the phone the To display and its rate line were under the
  keys: now scrolled into sight, clear of the scroll area's faded edge.
- **Not in the prototype:** while the rates load the line says "Getting the NBU rate…"; on the phone "Use the NBU
  rate" wraps under the rate.

## Notes

- Reports (F-021) leave transfers out: business rule 2.
