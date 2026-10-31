# 0019. Exchange rates: one NBU call per day, kept per date, fallback never kept

- Status: Accepted
- Date: 2026-10-31

## Context

F-017 brings the NBU's official rates (ADR 0004) and their first use: "In total, in UAH" on the Accounts page.
Accounts can be in any of about 40 currencies (F-014). The API runs on Render's free plan, which sleeps, so there is
no background job: rates are fetched when a request needs them. The NBU's API, checked on 2026-10-31:

- `GET bank.gov.ua/NBUStatService/v1/statdirectory/exchange?date=yyyyMMdd&json` returns every currency of the day
  in one list (45 entries with SDR and metals), each rate in hryvnias for one unit, up to six decimals;
- weekends and holidays have rates too, and the next business day's are out the afternoon before;
- a day not published yet returns `[]`.

## Decision

- **One call per day for all currencies.** The first request that needs a day asks the NBU for its whole list and
  keeps the currencies an account can be in (`Currencies.All`) in `exchange_rates` (key: date, currency;
  `numeric(18,6)`). Later requests for that day read the database only.
- **Only the day's own rates are kept.** When the NBU hasn't published the day or can't be reached, the latest
  earlier day kept is used and marked (`NotPublished` / `Unavailable`), but nothing is stored under the asked date,
  so the real rates are fetched as soon as they are there. With nothing earlier kept, there are no rates
  (`Missing`), and the total isn't shown rather than shown short.
- **One NBU call at a time, and a 5-minute pause after a failure** (`NbuGate`, a singleton): two requests for the
  same missing day make one call, and a dead NBU doesn't add its 10-second timeout to every page.
- **"Today" is Kyiv's date** (`Europe/Kyiv`), not the server's UTC date: the NBU sets rates per Kyiv day.
- **The total has its own endpoint** (`GET /api/accounts/total`), so the Accounts page shows the accounts without
  waiting for the NBU.
- **E2E in CI asks a stub** with fixed rates (`frontend/e2e/nbu.ts`, `Nbu__BaseAddress`), so the tests don't depend
  on the NBU or its rates. Locally the E2E run asks the real NBU: a stub's rates would be kept in the shared `dev`
  database as real ones.

## Consequences

- Rates are stable and reproducible: a day's rates never change once kept.
- The first request of a day waits for the NBU once (well under a second normally, at most 10 s).
- Each instance has its own gate; with one API instance (ADR 0002) that is enough. Two instances could both fetch a
  day, and the second save would fail on the key; revisit if the API ever scales out.
- Reports (F-021) and the exchange form (F-019) use the same service for any date.
