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
