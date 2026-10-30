# 0018. Whole amounts: no cents, rounded half away from zero

- Status: Accepted
- Date: 2026-10-30

## Context

The approved F-014 design showed amounts with cents (`48 210.50 ₴`). While testing it, the owner decided that cents
aren't needed: amounts are rounded to whole units everywhere in the app. Asked, the owner chose:

- typed cents are rounded when saved, so the field takes whole amounts;
- the rule is for the whole app (accounts now, transactions, transfers and reports later);
- .50 rounds up, away from zero.

## Decision

- **Amounts are whole units of their currency.** They are shown as `1 250 ₴`, `$1 240`, `€300`, `640 PLN`, and a
  debt as `−4 312 ₴`.
- **Rounding is half away from zero**, the same in the API and the app:
  - 1240.50 → 1241 and −4312.50 → −4313;
  - `Money.Whole` (Domain) uses `MidpointRounding.AwayFromZero`;
  - `wholeAmount` (frontend) rounds the absolute value;
  - PostgreSQL's `round` on `numeric` does the same.
- **Typed amounts may have cents**, written with `.` or `,`. They are rounded: the field shows the whole amount once
  it loses the focus, and the API rounds whatever it is sent before saving. So what is kept is what is shown, and
  the totals always add up to the cards.
- **The columns stay `numeric(18,2)`.** Amounts worked out from exchange rates (F-017, F-021) can be fractions.
  Kept as they are, they are rounded only when shown, so a report's total is the rounded sum, not the sum of
  rounded rows.
- The `RoundOpeningBalances` migration rounds opening balances saved with cents before this. Only test databases
  had any: F-014 wasn't released.

## Consequences

- DESIGN_RULES §5 shows whole amounts; it is a custom rule (2026-10-30).
- Transactions (F-018) and transfers (F-019) take whole amounts the same way, through the same helpers.
- A currency exchange at a rate (F-019) records whole amounts on both sides, and the rate is worked out from them.
