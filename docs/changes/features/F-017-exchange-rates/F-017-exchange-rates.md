# F-017 · NBU exchange rates

| | |
|---|---|
| Type | Feature |
| Milestone | M3 — Transactions |
| Status | Done |
| Branch | `feature/F-017-exchange-rates` |
| Design | not needed: the "In total, in UAH" line is F-014's approved final prototype |
| Approved | 2026-10-31, the description file as planned ("Approved, build it") |

## Goal

Correct, historical exchange rates for conversions, and the first place that uses them: the total of all accounts
in UAH on the Accounts page.

## Acceptance criteria

- [x] The NBU's official rate to UAH of **every currency an account can be in** (`Currencies.All`, about 40) comes
      from the NBU API for any date it has published
- [x] Fetched on demand: the first time a date is needed, one NBU call brings that day's rates of all currencies,
      and they are cached in the database; later requests for that date don't call the NBU
- [x] If the NBU hasn't published the date's rates yet, or can't be reached, the latest earlier cached rates are
      used and marked as such (with their date and the reason)
- [x] **"In total, in UAH" on the Accounts page** (owner, 2026-10-30): the total of all accounts in the report
      currency at today's NBU rates, above the totals per currency, with the rates and their date under it; when
      today's rates aren't published yet, the latest earlier ones are used and the line says so. The design is F-014's
      approved final prototype (`../F-014-accounts/prototypes/variant-10.html`, screens "By currency" and "Total:
      earlier rates"); it also counts up after an account is added
- [x] The Accounts page doesn't wait for the NBU: the accounts show at once, and the "In total, in UAH" line shows
      a placeholder until its rates are in
- [x] With no rates at all (the NBU can't be reached and nothing earlier is cached), the line says the rates aren't
      available right now; the totals per currency still show

## Plan (approved 2026-10-31)

### What the NBU gives

Checked on 2026-10-31: `GET bank.gov.ua/NBUStatService/v1/statdirectory/exchange?date=YYYYMMDD&json` returns every
currency of that day in one list (45 entries, including SDR and metals), each with `cc` (code), `rate` (hryvnias
for **one** unit, up to 6 decimals) and `exchangedate`. Weekends and holidays have rates too (the last business
day's), and the next business day's rates are out the afternoon before. A date not published yet returns `[]`.

### Backend

- **Domain:** `ExchangeRate` (date, currency, rate to UAH, `RateSource.Nbu`) and a pure `Conversion` helper:
  `amount × rate(from) ÷ rate(to)`, with UAH = 1, so any report currency works once F-016 lets people choose one.
- **Infrastructure:**
  - `NbuClient` (typed `HttpClient`, 10 s timeout): asks for one date, parses the list, keeps only the currencies in
    `Currencies.All`. The base address is in configuration, so tests and the E2E run can point it elsewhere.
    Reused by I-013 (banks from the NBU).
  - Table `ExchangeRates`, key (date, currency), rate `numeric(18,6)`, migration added. Only rates the NBU gave for
    that date are stored; an earlier day's rate used as a fallback is never stored under a later date.
  - `ExchangeRateService.RatesOn(date)`: the cache first; if the date is missing, the NBU; if the NBU returns
    nothing or fails, the latest earlier cached date, marked with the reason (`NotPublished` / `Unavailable`).
    After a failed call it doesn't ask the NBU again for 5 minutes, so a dead NBU doesn't slow every page.
    Two requests for the same missing date at once make one NBU call.
- **"Today"** is the date in Kyiv (`Europe/Kyiv`), not the server's UTC date.
- **API:** `GET /api/accounts/total` → the total in the report currency (UAH until F-016), the rates of the person's
  currencies used for it, their date, and whether they are earlier ones and why. Archived accounts are left out, as
  in the per-currency totals. A separate endpoint, not a field of `GET /api/accounts`, so the page doesn't wait for
  the NBU.

### Frontend

- `useAccountsTotal` (TanStack Query), refetched together with the accounts after adding, editing, archiving,
  restoring or deleting one.
- The "In total, in UAH" line as in the final prototype: the amount (red when below zero), then "At NBU rates of
  2 Nov 2026: $1 = ₴41.35, €1 = ₴48.10, 1 PLN = ₴11.30" for the currencies the person has besides UAH. With only
  UAH accounts there are no rates and no per-currency totals under it (as in the prototype).
- Earlier rates, with the info icon:
  - not published yet: "NBU hasn't published today's rates yet. At the rates of 29 Oct 2026:" (the prototype's
    text);
  - the NBU can't be reached: "Can't reach the NBU right now. At the rates of 29 Oct 2026:".
- No rates at all: "In total, in UAH" with "NBU rates aren't available right now. Try again later." instead of the
  amount.
- The count-up after adding an account, from the old total to the new one.
- All text through i18n keys; Storybook stories for the line (today's rates, earlier rates, NBU unavailable, no
  rates, loading, only UAH).

## Tasks

- [x] NBU HTTP client
- [x] Rate cache table, migration and service
- [x] Fallback logic (not published / unavailable / nothing cached), retry pause after a failure
- [x] `GET /api/accounts/total` and the regenerated API types
- [x] "In total, in UAH" line on the Accounts page, with stories
- [x] ADR: rates cached per date for all currencies, fallback never cached, Kyiv date
- [x] ARCHITECTURE "Exchange rates" updated

## Build (2026-10-31)

- **Domain:** `ExchangeRate` (date, currency, rate to UAH, `RateSource.Nbu`) and `Conversion` (pure: a rate between
  any two currencies through the hryvnia, and the totals together in one currency; no total when a currency has no
  rate).
- **Application:** `IExchangeRateService` with `DayRates` and `RatesStatus` (`Current`, `NotPublished`,
  `Unavailable`, `Missing`); `Kyiv.Today`; `ReportCurrency.Default` (UAH until F-016); `TotalInReportCurrency` (pure:
  whether rates are needed, and the total with the rates of the other currencies); `AccountsTotal` and `RateItem`.
- **Infrastructure:** `NbuClient` (typed `HttpClient`, 10 s timeout, `Nbu:BaseAddress`), table `exchange_rates`
  (migration `AddExchangeRates`), `ExchangeRateStore`, `ExchangeRateService` with `NbuGate` (one call at a time, a
  5-minute pause after a failure). `AccountService.TotalAsync` asks for rates only when there are other currencies.
- **API:** `GET /api/accounts/total`.
- **Frontend:** `accountsTotalQuery` (key `['accounts', 'total']`, so every change to an account fetches it again);
  the "In total, in UAH" line in `AccountsPage`'s totals, the rates with `formatRate` (`$1 = 41.35 ₴`,
  `1 PLN = 11.30 ₴`, three significant digits below one), the earlier-rates note with the info icon, the no-rates
  note, a skeleton while loading, and the count up or down after adding, restoring or deleting an account.
- **One detail beyond the prototype:** when the earlier-rates note wraps on the phone, its icon stays on the first
  line (the prototype centred it between the two lines).
- **E2E stub only in CI:** the plan had the E2E API ask a stub with fixed rates. The stub runs in CI only
  (`NBU_STUB` in `frontend/e2e/nbu.ts`), where the database is thrown away: locally the API keeps whatever rates it
  gets in the shared `dev` database, so a stub's rates would stay there as real ones. Locally the test checks the
  line with the real NBU's rates (the format, not the numbers).
- Decisions: [ADR 0019](../../../decisions/0019-exchange-rate-cache.md).

## Tests

- Unit (backend, xUnit):
  - `ConversionTests`: rates through the hryvnia, a debt in the total, no total without a rate;
  - `TotalInReportCurrencyTests`: when rates are needed, hryvnias only, earlier rates keep their date and reason,
    a negative total, no rates, a currency without a rate;
  - `KyivTests`: today in Kyiv in winter and summer, around midnight;
  - `NbuClientTests`: the address asked, only `Currencies.All` kept (SDR and gold dropped), `[]`, another day's
    list, an error status, HTML instead of JSON;
  - `ExchangeRateServiceTests` (NBU and database faked): kept rates without a call, a missing day fetched once and
    kept, not published → earlier rates not kept under the day, unreachable and timeout → `Unavailable`, a request
    the person left stays cancelled, nothing kept → `Missing`, the 5-minute pause, two requests at once make one
    call;
  - `AppDbContextTests`: the table, its key and six decimals; `AccountsControllerTests`: the total is the person's.
- Unit (frontend, Vitest): `formatRate`; the page with today's rates, earlier rates (not published, unreachable),
  no rates, hryvnias only, and the count up after adding a dollar account.
- Storybook: `TotalEarlierRates` (and desktop dark), `TotalNbuUnavailable`, `TotalNoRates` (and desktop dark),
  `TotalLoading`, `TotalHryvniasOnly`; `ByCurrencyPhone` checks the grand total.
- E2E (Playwright, `accounts.spec.ts`): after a hryvnia and a dollar account, "In total, in UAH" shows
  `42 176 ₴` and `$1 = 41.35 ₴` with the CI stub, or the real NBU's rates locally. Conversions in transactions
  are covered by F-019.
- Screens checked in Playwright screenshots (Storybook, 375 and 1440 px, light and dark): today's rates, earlier
  rates, NBU unreachable, no rates, loading, hryvnias only. Then in the Browser pane on the real app with the real
  NBU: a hryvnia and a dollar account gave 34 765 ₴ at $1 = 45.53 ₴ (the NBU's 45.5293 for 31 Oct 2026), light and
  dark, and the total counted down when an account was deleted.
- Test data: the E2E runs made `e2e-…` accounts on the `dev` database, removed by the cleanup teardown. The
  Browser-pane check signed in as the tests' admin (`e2e-admin@example.com`) and added two accounts, both deleted
  in the same session. The `dev` database now keeps the real NBU rates of the days asked for; they are a cache,
  not test data.

## Notes

- The NBU client is reused by I-013 (suggested banks from the NBU's list).
- The report currency is UAH until F-016 adds the setting; the code takes it as a parameter already.
- Rates for weekends and holidays come from the NBU itself, so the fallback is rare: mostly when the NBU is down.
