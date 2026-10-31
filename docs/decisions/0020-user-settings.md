# 0020. User settings: report currency on the account, theme on the device, rates in hryvnias

- Status: Accepted
- Date: 2026-10-31

## Context

F-016 brings Settings: the display name, the report currency and the theme (light, dark or the system's). The owner
approved the final prototype on 2026-10-31 with three of its points as Claude proposed them: the theme is kept on
the device, the sun / moon button in the menu stays, and the email can't be changed yet. In the design round the
owner also asked for any NBU currency as the report currency, not only UAH, USD and EUR.

Until now "In total" on Accounts was always in hryvnias (F-017), and its rates were "units of the report currency
for one unit of each other currency", which for the hryvnia is the NBU's own form ("$1 = 45.53 ₴").

## Decision

- **The report currency is kept on the account** (`users.report_currency`, three letters, `UAH` for everyone who
  had an account before), so it follows the person to every device. It can be any currency an account can be in
  (`Currencies.All`): the NBU publishes a rate for each, and `Conversion` already converts through the hryvnia.
- **The theme is kept on the device**, in Mantine's own color scheme storage (`localStorage`), as before F-016;
  Settings adds "System" (`auto`). A phone can be dark while the laptop is light, the sign-in page follows the
  device's choice too, and the page never shows the wrong theme while the account loads.
- **The name and the report currency each have their own endpoint** (`PUT /api/settings/name`,
  `PUT /api/settings/report-currency`; `GET /api/settings` reads them with the email), because the page saves each
  on its own: the currency the moment it is picked, the name with its button. They are saved through Identity's
  `UserManager`, like the rest of the account.
- **Rates are given in hryvnias, as the NBU publishes them**, for every currency the total used: the accounts' other
  currencies, then the report currency when it isn't the hryvnia (`RateItem.Rate` is hryvnias for one unit). A
  total in dollars shows "$1 = 45.53 ₴, 1 PLN = 11.20 ₴", which is how people in Kyiv read rates, and not
  "1 ₴ = $0.022". For the hryvnia as the report currency nothing changes.

## Consequences

- Changing the report currency on one device changes the totals on every device; the theme has to be picked on each
  device.
- The frontend converts a fresh account's amount for the count-up through the hryvnia (`from ÷ to`), as the API
  does.
- The reports (M4) take the same report currency from the account.
