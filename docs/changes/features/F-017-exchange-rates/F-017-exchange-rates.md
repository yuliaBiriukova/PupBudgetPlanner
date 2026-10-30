# F-017 · NBU exchange rates

| | |
|---|---|
| Type | Feature |
| Milestone | M3 — Transactions |
| Status | Todo |
| Branch | `feature/F-017-exchange-rates` |
| Design | not needed |

## Goal

Correct, historical exchange rates for conversions.

## Acceptance criteria

- [ ] Rates for USD and EUR to UAH come from the NBU API for any date
- [ ] Fetched on demand and cached in the database
- [ ] If NBU is unavailable, the latest earlier rate is used and marked as such
- [ ] **"In total, in UAH" on the Accounts page** (owner, 2026-10-30): the total of all accounts in the report
      currency at today's NBU rates, above the totals per currency, with the rates and their date under it; when
      today's rates aren't published yet, the latest earlier ones are used and the line says so. The design is F-014's
      approved final prototype (`../F-014-accounts/prototypes/variant-10.html`, screens "By currency" and "Total:
      earlier rates"); it also counts up after an account is added

## Tasks

- [ ] NBU HTTP client
- [ ] Rate cache table and service
- [ ] Fallback logic
- [ ] Endpoint for the UI

## Tests

- Unit: Client parsing, cache and fallback (HTTP mocked).
- E2E (Playwright): Covered by F-019.

## Notes

- —
