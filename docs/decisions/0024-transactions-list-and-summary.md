# 0024. Transactions list: filters in the address, pages by offset, a separate summary at each day's rate

- Status: Accepted
- Date: 2026-11-03

## Context

F-020 replaces F-018's stand-in Transactions page (the latest 50) with the approved variant 8: the period's totals on
top, a calendar coloured by what each day cost, "Where it went" (each category's amount and share), and every day as a
receipt with its total at the foot, loading more on scroll. Filters: the period (a month, a year, everything, a range),
one account, one category, one type, a day tapped in the calendar. The approved open points: totals in the report
currency at the NBU rate of each transaction's day (business rule 1), in the account's own currency with one account
picked; a transfer seen from the picked account as money out of it or into it; the filters in the page's address; the
calendar's open or closed remembered on the device.

## Decision

- **Two endpoints with the same filters** (`from`, `to`, `accountId`, `categoryId`, `type`, as camelCase query
  values): `GET /api/transactions` gives a page of rows, `GET /api/transactions/summary` what they come to. The list
  shows while the summary may still be asking the NBU for a day's rates (as F-017's total, ADR 0019).
- **Pages by offset** (`offset`, `limit` 30, at most 100), newest day first, then the last added, then the id, so two
  pages never share or skip a row while nothing changes. A save or a delete fetches every loaded page again (TanStack
  Query's infinite query), so a row added or removed meanwhile can't leave a gap. A keyset cursor isn't needed at a
  couple's size, and the rows' order (date, created at) has no single column to seek on.
- **One account** matches its own transactions and the transfers it is the To of.
- **The summary** is worked out in memory (`TransactionSummary.Of`, pure and unit-tested) from rows the database groups
  by day, type, the account's currency and category: spent, received and a count per day (transfers counted, never
  spent or received, business rule 2), and the period's categories largest first. The categories leave the picked
  category out of their own filter, so another one can be picked from the bars; they are income categories with Income
  picked and none with Transfers. Only days with an expense or an income in another currency ask for rates
  (`IExchangeRateService.RatesOnAsync`, the latest earlier rates when the day's aren't out); an amount with no rate at
  all is left out and `ratesMissing` says so, rather than a total quietly short.
- **The filters are the page's address** (`/transactions?month=2026-10&account=…&category=…&type=expense&day=…`); this
  month is left out, as the page opens on it. A change replaces the address, so Back leaves the page. While a phone sheet
  is open its history step is the current entry (I-015, ADR 0021): the picks wait in the page and go into the address
  once the sheet's step is gone (`afterPopupsClose`), so neither Back nor closing the sheet loses them.
- **The calendar's open or closed** is kept in `localStorage` (`pup.transactions.calendarOpen`); at first it is open on
  the desktop and closed on the phone.

## Consequences

- The Reports screen (F-022) can link a cell to its transactions by the address alone.
- "All time" with many days in other currencies asks the NBU once per day not kept yet, one call at a time (ADR 0019):
  slow the first time only, and only for the summary.
- The service's queries (filters, paging, grouping) are covered by the E2E test (pick a category, change and delete on
  its receipt) until the integration tests (ADR 0005).
