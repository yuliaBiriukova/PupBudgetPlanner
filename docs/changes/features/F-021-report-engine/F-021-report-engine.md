# F-021 · Report engine

| | |
|---|---|
| Type | Feature |
| Milestone | M4 — Reports |
| Status | Done |
| Branch | `feature/F-021-report-engine` |
| Design | not needed (the screen is F-022) |
| Approved | 2026-11-04: the plan with the owner's answers to the seven open points ("Approved, build it") |

## Goal

Calculate the spreadsheet-like report automatically: the yearly table of category groups → categories by month, with
Total and Avg, and the summary rows under it (PRODUCT.md, MVP feature 5). F-021 is the numbers and the API only; F-022
shows them.

## Acceptance criteria

- [x] **Yearly report** for one year: the person's category groups → categories as rows, in the order of the
      Categories page (Income first); twelve month columns, then Total and Avg. Each group also has its own total row
      (F-022 decides whether to show it).
- [x] Every category in use is a row, also with nothing in the year (as in the spreadsheet); an archived category is
      a row only when the year has amounts on it.
- [x] **Avg** = Total ÷ months passed (business rule 7, Q-004), counted from the person's first month with data (the
      first account's opening date or the first transaction, whichever is earlier; open point 1) and up to and
      including this month (open point 2). A past year with data from January: 12. This year from January: November →
      11. Starting in November 2026: 2026 → 2. A year before the first data has no Avg.
- [x] **Summary rows:** Total income, Total expenses, NET (income − expenses), each by month with Total and Avg; and
      the balance at each month's end (no Total or Avg: it is a balance, not a sum).
- [x] **The balance is what is really on the accounts** at the month's end, not "start + NET" as the spreadsheet
      worked it out. **Other changes (rates, exchanges, new accounts)** is a summary row of its own: the month's change
      in balance less its NET, with Total (no Avg), so start balance + NET + other changes = end balance in every
      month. With a balance missing (no rate), its other changes are `null` too.
- [x] **Conversion** into the report currency at the NBU rate of each transaction's date (business rule 1). An amount
      already in the report currency isn't converted.
- [x] **Balance at month end** = every account's balance on the month's last day, converted at that day's NBU rate
      (business rule 4). This month's is the balance now at today's rate, so it equals "In total" on the Accounts
      page. Months after this one have no numbers (`null`), not zeros.
- [x] **Transfers** are neither income nor expense (business rule 2); they only move balances. An exchange's real
      amounts move the month-end balance as they happened.
- [x] **Missing rates:** an amount in another currency with no rate at all is left out and its month is marked
      (`ratesMissing`), as on the Transactions page; a month-end balance with a currency without a rate is `null`,
      as the Accounts total — never a number quietly short.
- [x] **Monthly report:** the same rows and summary for one month (no Avg), plus the balance at the month's start
      (the previous month's end), so the month's change can be shown.
- [x] **API:** `GET /api/reports/year?year=2026` and `GET /api/reports/month?month=2026-10`, each with an optional
      `currency` (any `Currencies.All` code); without it, the person's report currency from Settings. A year or month
      after Kyiv's today, or before 2000, is 400. The rates the report used are given in hryvnias (ADR 0020).
- [x] Only the signed-in person's own data (family views come with F-024).
- [x] Amounts are kept as calculated and rounded when shown (ADR 0018): a Total is the rounded sum, not the sum of
      rounded cells.

## Tasks

- [x] `ReportBuilder` (Application, pure): rows from the database + rates + the person's categories and accounts →
      the report (`Report`, one shape for a year and a month). Reuses `Conversion`; the rows are `ReportAmount` (date,
      type, account currency, category, amount), like `TransactionSummary`'s.
- [x] Month-end balances, in `ReportBuilder` too (built: Application rather than next to `BalanceSheet`, as the
      archive date is a Kyiv day): opening balances and each account's movement per month (both sides of transfers,
      `MonthMovement`), cumulated to each month's end. `RateDaysOf` names the days whose rates are needed.
- [x] `ReportService` (Infrastructure): two grouped queries (income / expense rows of the period; every account's
      movements per month up to the period's end), the rates through `IExchangeRateService.RatesOnAsync` for the days
      that need them (days with income or expense in another currency, month ends with accounts in another currency).
- [x] `ReportsController` with the two endpoints, validators (FluentValidation), ProblemDetails on errors.
- [x] Regenerate the frontend's API types (`schema.ts`), so F-022 can start from them; no frontend code otherwise.
- [x] ADR 0027: the report's rules (Avg's months, month-end balances of new and archived accounts, missing rates).
- [x] ARCHITECTURE.md (Reports), PRODUCT.md if an open point changes a business rule.

## Tests

- Unit (xUnit): `ReportBuilderTests` — the rows' order, archived categories, Avg for a past year, this year, the first
  year and a year before it; conversion at each day's rate and in another report currency; exchanges; an account
  opened mid-year; an archived account; missing rates; months still to come; the monthly report's start balance;
  start + NET + other changes = end; the rate days. `SpreadsheetYearTests` — a test year in the spreadsheet's shape
  (open point 6): every hryvnia category, group and month total as in the spreadsheet; income, Avg, balances and other
  changes worked out by hand from fixed rates. `ReportValidatorTests`, `ReportsControllerTests`.
- API E2E (Playwright, `e2e/reports.spec.ts`, through the API, no screen, desktop project only): a new person adds an
  expense, a dollar income and an exchange, and reads the yearly and the monthly report (also in dollars); this month's
  balance equals the Accounts total. It covers the queries until the integration tests (ADR 0005), as ADR 0022 does for
  transactions. In CI against the NBU stub, locally against the real NBU. The screen's E2E comes with F-022.
- Screens checked in Playwright screenshots: none (no UI).

## Notes

### How the spreadsheet works it out

Read from the spreadsheet's formulas (one sheet per person per year):

- **Income in dollars at today's rate.** Salary is typed in dollars; `Total INCOME` multiplies it by
  `GOOGLEFINANCE("CURRENCY:USDUAH")`, today's rate, so January's income changes whenever the dollar does (ADR 0004).
- **Avg = Total ÷ 12**, also in a year with only ten months filled in.
- **"Spending Balance" is worked out, not read from the accounts:** the beginning balances (UAH, USD, EUR, the dollars
  and euros at today's rate) plus each month's NET, added up. So it always moves exactly by NET, and the months not
  filled in yet repeat the last one.
- Group totals (`Total HOME EXPENSES`, …) are rows of their own; Total Expenses is the sum of the group totals.
- Meter rows (electricity, water, heating) are left out of the app (PRODUCT.md, default categories).

### Open points

All answered by the owner on 2026-11-04: 1, 2, 3, 4 and 7 as proposed; 5 with the real balance and an "Other changes"
row; 6 with a test year in the spreadsheet's shape.

1. **Avg in the first year.** If the family starts using the app in, say, November 2026, dividing 2026 by 11 makes
   every Avg tiny while only November and December have data (the spreadsheet's history comes with M10). Proposal: count months from the person's first month with data (the first
   account's opening date or the first transaction, whichever is earlier) — 2026 then divides by 2. A full past year
   still divides by 12, this year by the months up to now.
2. **This month in Avg.** Proposal: counted (November is "passed" in November), so Avg moves during the month. The
   other way: count only finished months, and show this month without it in Avg.
3. **An account opened mid-year** counts in the month-end balances from its opening date's month on: its opening
   balance plus its transactions up to that month's end. Transactions dated before the opening date count from then
   too, so this month's balance always equals the Accounts page.
4. **An archived account** counts in the month ends before the month it was archived, and not after — so this month
   matches the Accounts total, which leaves archived accounts out, and archiving doesn't change the past months.
   Restoring it brings it back into every month. An edge case: an account is usually archived once it is empty, and
   then both ways give the same numbers.
5. **NET vs the balance's change.** NET is income − expenses. The month-end balance also moves with the rates (a
   dollar account is worth more hryvnias when the dollar rises) and with an exchange's difference from the NBU rate,
   and a new account's opening balance raises it without being income, so NET and the balance's change won't match.
   Answered: the balance shows what is really on the accounts at the month's end, and the "Other changes (rates,
   exchanges, new accounts)" row explains the gap (acceptance criteria).
6. **The test fixture.** Answered: a year in the spreadsheet's shape (January–October
   filled in). The fixture types each month's category amounts as that month's transactions (expenses in hryvnias, the salary in dollars,
   the beginning balances as opening balances on 1 January). Expected: every expense category's, group's and month's
   total exactly as in the sheet. Income, Avg and the balances differ from the sheet on purpose (each day's rate, not
   today's; Avg ÷ months passed, not 12; real balances), so their expected numbers are worked out by hand in the test
   from fixed NBU rates.
7. **Many rates at once.** A year with income or expenses in other currencies asks the NBU once per day not kept yet
   (ADR 0019, one call at a time), so the first opening of such a year can take a while (most days may already be
   kept from the Transactions page). For example, a salary in dollars twice a month and accounts in dollars and euros
   need about 30 days for ten months: about 15 seconds the first time, then instant for everyone, as the rates are
   kept. Answered: fine for the MVP; NBU's range endpoint per currency is an improvement for later if it is slow.

### Not in F-021

- Family views and merging categories with the same group and name (F-024).
- The screen, picking the year, month and currency (F-022).
- Linking a cell to its transactions: F-022, by the Transactions page's address (ADR 0024).
