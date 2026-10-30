# I-013 · Suggest banks from the NBU's list

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | Low |
| Status | Todo |
| Branch | `improvement/I-013-banks-from-nbu` (planned on `plan/f014-follow-ups`) |
| Design | not needed (the account form's suggestions stay as they look in F-014) |
| Approved | — |

## Goal

The banks suggested in the account form come from the NBU, which keeps the list of banks working in Ukraine, so
the suggestions stay right when banks open, merge, rename or close. Until then F-014 suggests a fixed list in the
app (the owner's, 2026-10-30). Asked by the owner while reviewing F-014, 2026-10-30.

## Acceptance criteria

- [ ] The suggestions while typing a bank's name come from the NBU's list of banks, not from a list in the code.
- [ ] They show the names people know the banks by (Monobank, PrivatBank, PUMB), not only the legal names.
- [ ] The list is fetched now and then and kept in the database, not fetched on every keystroke; if the NBU can't be
      reached, the last kept list is used, and the app still works without one.
- [ ] Banks the person already has are still left out, and a bank that isn't in the list can still be typed in.
- [ ] Banks people have already saved are not changed.

## Tasks

- [ ] Find the NBU's open data on banks (a list or API): what it gives (legal name, brand name, code, whether the
      bank works), its language, and how often it changes. Record it in the description.
- [ ] Decide how names are shown: legal names in the registry are like «АТ КБ «ПриватБанк»», and some brands are not
      banks of their own (Monobank is a brand of Universal Bank). Proposal: a short list of brand names kept with
      the NBU code (`Monobank` → Universal Bank), the rest shown by their short name.
- [ ] Use the NBU client and the fetch-and-keep pattern from F-017 (rates).
- [ ] API: the suggestions come with the accounts page (as the currencies do) or from their own endpoint.
- [ ] Replace `SUGGESTED_BANKS` in `frontend/src/features/accounts/accountForm.ts`.

## Tests

- Unit (backend): reading the NBU's data (HTTP mocked), keeping the list, using the last kept list when the NBU is
  down; brand names.
- Unit (frontend): suggestions from the API, the person's own banks left out.
- E2E (Playwright): the bank suggestions in the account form (with the NBU mocked or the kept list).
- Screens: the form's suggestions, phone and desktop, light and dark (no new screen).

## Notes

- **After F-017**, which brings the NBU client.
- Priority Low (Claude's proposal): the fixed list works; this keeps it right over time.
- The language of the names (the NBU's are Ukrainian) matters once the app is translated (Ukrainian later).
