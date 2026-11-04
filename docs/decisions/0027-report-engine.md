# 0027. Reports: summed by the database, built in memory, real month-end balances with "Other changes"

- Status: Accepted
- Date: 2026-11-04

## Context

F-021 brings the spreadsheet-like report: category groups → categories by month with Total and Avg, and the summary
rows Total income, Total expenses, NET and the balance at month end (PRODUCT.md, MVP feature 5). The spreadsheet it
replaces converted dollars at today's rate, divided Avg by 12, and worked its "Spending Balance" out as the beginning
balance plus each month's NET. The owner answered the plan's open points on 2026-11-04 (F-021's description file).

## Decision

- **One shape for both reports:** `Report` is a period of months (`ReportPeriod`: January–December, or one month).
  `GET /api/reports/year?year=2026` and `GET /api/reports/month?month=2026-10`, each with an optional `currency`
  (else the person's report currency, ADR 0020). A year or month after Kyiv's today, or before 2000, is 400.
- **The database sums, `ReportBuilder` (Application, pure) builds.** Two grouped queries: the period's incomes and
  expenses per day, type, account currency and category (`ReportAmount`; transfers left out, business rule 2), and each
  account's movement per month up to the period's end, on both sides of a transfer (`MonthMovement`). With the
  accounts, the person's category groups and the first day with data, that is all the builder needs, so every rule is
  unit tested without a database (ADR 0005).
- **Conversion at each amount's own day** (business rule 1). `ReportBuilder.RateDaysOf` names the days that need rates
  (amounts in another currency; month ends whose accounts are in another one, the month before the period included),
  and the service asks `IExchangeRateService` for each (ADR 0019: kept once fetched, so only new days ask the NBU).
  An amount with no rate at all is left out and its month marked `ratesMissing`; a balance with a currency without a
  rate is `null`. Never a number quietly short.
- **The balance is what was really on the accounts** at the month's end (this month: now, at today's rate, so it equals
  the Accounts page's total). An account counts from its opening date's month (transactions dated before it too), and an
  archived one until the month before it was archived, as the Accounts total leaves archived accounts out.
- **"Other changes (rates, exchanges, new accounts)"** is a summary row: the month's change in balance less its NET,
  so start balance + NET + other changes = end balance. `null` when either balance is, or the month has amounts left out.
- **Avg = Total ÷ months counted** (business rule 7): from the person's first month with data (the earliest opening
  date or transaction) up to and including this month. A monthly report has no Avg.
- **Months still to come have no numbers** (`null`), not zeros. Every category in use is a row; an archived one only
  when the period has amounts on it. Group totals are rows of their own.
- **Amounts are kept as worked out** and rounded when shown (ADR 0018).

## Consequences

- The report's balance and NET don't add up the way the spreadsheet's did; "Other changes" shows why.
- A year with many days in other currencies asks the NBU once per day not kept yet, one call at a time: slow the first
  time only (owner, 2026-11-04). The NBU's range endpoint per currency can come later if it is.
- Family views (F-024) can feed the same builder with several people's rows; merging categories by group and name is
  theirs to add.
- The queries are covered by the API E2E test (`e2e/reports.spec.ts`) until the integration tests (ADR 0005).
