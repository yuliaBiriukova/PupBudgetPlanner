# F-021 · Report engine

| | |
|---|---|
| Type | Feature |
| Milestone | M4 — Reports |
| Status | Todo |
| Branch | `feature/F-021-report-engine` |
| Design | not needed |

## Goal

Calculate the spreadsheet-like report automatically.

## Acceptance criteria

- [ ] Yearly report: category groups → categories as rows, months as columns, Total and Avg
- [ ] Avg = total ÷ number of months passed in that year
- [ ] Summary: Total income, Total expenses, NET, balance at month end
- [ ] Conversion with the NBU rate on each transaction's date; month-end balances with the month-end rate
- [ ] Monthly report: the same numbers for one month
- [ ] API: yearly and monthly reports in the requested currency

## Tasks

- [ ] `ReportBuilder` (pure logic)
- [ ] Data loading service
- [ ] API endpoints

## Tests

- Unit: Extensive `ReportBuilder` tests, including a fixture based on real spreadsheet numbers.
- E2E (Playwright): Covered by F-022.

## Notes

- —
