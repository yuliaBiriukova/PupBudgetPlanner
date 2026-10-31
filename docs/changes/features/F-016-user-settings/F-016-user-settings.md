# F-016 · User settings

| | |
|---|---|
| Type | Feature |
| Milestone | M2 — Accounts & categories |
| Status | Done |
| Branch | `feature/F-016-user-settings` |
| Design | 3 HTML prototypes required |
| Approved | 2026-10-31, by the owner in chat ("Approved, build it"): [variant 4 (final)](prototypes/variant-4.html), with the shared currency list and the open points 1, 2 and 4 as proposed |

## Goal

Personal preferences.

## Acceptance criteria

- [x] Change display name
- [x] Choose report currency: UAH (default), USD, EUR or any other NBU currency (changed in round 2, owner)
- [x] Choose light/dark/system theme
- [x] (Round 2, owner) Every currency field — the report currency's "Another currency" and the account form's
      Currency — opens the same list: a dropdown on the desktop, a sheet on the phone; the person's currencies
      first, then the other NBU currencies, with a search

## Tasks

- [x] References
- [x] 3 HTML prototypes
- [x] Owner picks a variant; final prototype approved (2026-10-31)
- [x] API: `GET /api/settings`, `PUT /api/settings/name`, `PUT /api/settings/report-currency`; the report currency
      on the account (migration `AddReportCurrency`, UAH for everyone before); the total in it
- [x] Shared `CurrencyPicker` (dropdown on the desktop, sheet on the phone) for Settings and the account form
- [x] UI: the Settings page
- [x] Storybook stories (Settings page, currency picker)
- [x] Tests: backend unit tests, frontend unit tests, E2E (desktop and phone)
- [x] ADR 0020, ARCHITECTURE "Exchange rates"

## Design

### Brief

- **Who and when:** each of the couple, rarely: once after signing up to check the name and the currency, again when
  they want totals in dollars or a darker screen at night. On the phone as often as on the desktop.
- **The one job:** see and change what is yours — your name, the currency your totals are in, the theme. What must be
  seen first: the three current values, with no tapping.
- **The subject's world:** the report currency is the column the family sheet adds everything up in; hryvnia, dollar
  and euro are the three currencies the family keeps money in.
- **One feeling:** "settled": a short page, each change takes effect at once and says so.

### References

Mobbin needs a sign-in, so only open pages were used.

- [GitHub — Managing your theme settings](https://docs.github.com/en/enterprise-cloud@latest/get-started/accessibility/managing-your-theme-settings):
  a theme mode with "sync with system" as a choice of its own, and theme previews you pick by seeing them (variant 3).
- [Actual Budget — Settings](https://actualbudget.org/docs/settings/): one plain page of sections for everything,
  theme as a choice of Light, Dark and Auto (variant 1).
- [Lunch Money — Multicurrency](https://support.lunchmoney.app/settings/multicurrency): one "primary currency" all
  totals and summaries are shown in, changeable any time from Settings — the same idea as our report currency; the
  page says what the choice changes (all variants: a line on what it affects).
- [Apple HIG — Settings](https://developer.apple.com/design/human-interface-guidelines/settings) and iOS Settings:
  a list of rows with the current value on the right, a tap opens the choice (variant 2).

### Token plan

The app's theme as it is (F-010, DESIGN_RULES §3): no new colors or fonts.

- **Palette:** page `#f5f6f7` / `#121315`, surface `#fcfcfd` / `#1b1c1e`, text `#1c1e21` / `#e9eaec`, primary
  charcoal `#26292e` / `#e9eaec`, accent `#2a62a3` / `#8ec1ec` (the picked choice, links), muted `#57585b` /
  `#a4a5a7`. No income or expense colors: nothing here is a transaction.
- **Type:** Unbounded 300 for the title and amounts, Manrope 400/500 for everything else; amounts with tabular
  figures and the currency where DESIGN_RULES §5 puts it (`34 765 ₴`, `$764`, `€715`).
- **Shape:** radius 12 px (rows, fields, cards) and pill (buttons, segmented choices); no shadows on the page; the
  spacing scale 4 · 8 · 12 · 16 · 20 · 24 · 32.
- **Motion:** one moment — after the report currency changes, the total in it counts to the new amount (F-017's
  count). Nothing else moves.
- **The bold element:** your money in the report currency, shown right next to the choice.
- **Mantine mapping:** `SegmentedControl`, `Radio.Card`, `TextInput`, `ResponsiveDialog` / `BottomSheet`
  (I-012), the existing count-up; all styled through `theme.ts` and CSS modules.

Slop check of the plan: the first draft had an icon in a circle on every row and a "Profile" card with a big avatar
on top; both dropped (icons only where they help find a row, in variant 2, plain and muted; the name is text).

### Variants (round 1, 2026-10-31)

| Variant | Thesis |
|---------|--------|
| [1 · One page, everything in place](prototypes/variant-1.html) | A form you change in place: label on the left, the control on the right on the desktop; currency and theme as segmented choices that save at once; the name saves with its own button. Quiet and fast. |
| [2 · Rows that open](prototypes/variant-2.html) | The iOS pattern: one row per setting with its value; a tap opens a sheet (phone) or a dialog (desktop) with the choices and Save. The page is a summary, the pop-up does the work. |
| [3 · Pick by seeing](prototypes/variant-3.html) | The risk: you pick the report currency by seeing your own total in each one (three cards with the amount set big), and the theme by its preview, like GitHub. More room, more obvious. |

The owner chose variant 1 (2026-10-31).

### Open points (Claude's proposals)

1. **Where the theme is kept:** on the device, as today (not on the account). A phone can be dark while the laptop is
   light, the sign-in page follows it too, and the page never flashes the wrong theme while the account loads.
   Name and report currency are kept on the account.
2. **The sun / moon button** in the sidebar and the phone's top bar stays: it sets Light or Dark; Settings is where
   "Same as the system" is picked again.
3. **Report currency:** ~~only UAH, USD and EUR~~ — changed in round 2: any NBU currency (see below). It changes "In
   total" on Accounts now and the reports later (M4).
4. **Email** is shown but can't be changed; changing the password and deleting the account (F-027) come later and
   aren't shown yet.

### Round 2: final prototype (2026-10-31)

The owner liked variant 1 and asked what happens when someone keeps money in other currencies than UAH, USD and EUR.
Accounts can be in any NBU currency already (F-014), and the total converts through the hryvnia (F-017), so any NBU
currency works as the report currency without new rates.

[Variant 4 (final)](prototypes/variant-4.html) is variant 1 with one change:

- Hryvnia, US dollar and Euro stay one tap away. Under them, **Another currency** opens the account form's list
  (F-014's `CurrencyField`): the person's own account currencies first ("Yours"), then every NBU currency, with a
  search by code or name.
- A currency picked from the list is marked like a picked choice (the accent and a check) and none of the three is;
  picking one of the three again clears it.
- Either way it saves at once with a notification, the total under it comes in in the new currency, and the rates
  line lists the rates the total uses (the accounts' currencies and the report currency).
- Everything else as variant 1.
- Owner's review (same day): the list opened inside the page, pushing the total and Theme down, and scrolled with
  the browser's bar. Now it doesn't move the page: on the desktop it is a dropdown floating under the field (a click
  outside or Escape closes it); on the phone a sheet titled "Report currency", so the search and the keyboard have
  room. It scrolls with I-004's fading scroll bar. The account form keeps its list inside the form (F-014).
- Owner's review: the dropdown is as tall as its rows, up to 344 px, and only then scrolls (a search with two
  matches makes it short). The phone's sheet keeps its height, so it doesn't jump while typing.
- Owner's review: **every currency field uses the same list**, the person's own currencies first, then the other NBU
  currencies. Today that is also the account form's Currency (F-014's `CurrencyField`, which opens its list inside
  the form): it becomes the same dropdown, over the dialog and not cut by its edge (Mantine's dropdown in a portal),
  and on the phone a "Currency" sheet over the form's sheet. Built in F-016 as one shared component, so both fields
  stay the same. See "Account form: currency" in the prototype.

If approved, the acceptance criterion becomes "Choose report currency: UAH (default), USD, EUR or any other NBU
currency".

The design check passes; the list open, a search, PLN picked and Couldn't save were looked at in screenshots at 375
and 1440 px, light and dark, and tried in the Browser pane.

Chosen variant: 1, with any NBU currency and the shared currency list: **variant 4 (final), approved 2026-10-31**.

## Implementation (2026-10-31)

- **Backend:** `AppUser.ReportCurrency` (`users.report_currency`, three letters, default `UAH`); `ISettingsService`
  saves through Identity's `UserManager`; `SettingsController`; validators: a name of 1–50 characters (trimmed), any
  currency of `Currencies.All`. `AccountService.TotalAsync` totals in the person's report currency.
- **Rates in hryvnias** ([ADR 0020](../../../decisions/0020-user-settings.md)): a total gives the rates it used as the NBU
  publishes them ("$1 = 45.53 ₴"), the report currency's own included when it isn't the hryvnia, as the prototype
  shows. For the hryvnia nothing changes on Accounts; the frontend converts a fresh account's count-up through the
  hryvnia.
- **Frontend:** `SettingsPage` (sections; segmented choices as native radios; the total with the rates under it,
  the amount coming in from below when the currency changes); `CurrencyPicker` in `src/shared/ui` replaces F-014's
  `CurrencyField`; `BottomSheet` takes a pinned `top` and a `tall` (80 %) height; the currency names moved to
  `src/shared/i18n/currencyNames.ts`; the rates line moved to `TotalRates`. The theme is Mantine's color scheme
  (`auto` for System), kept on the device.
- **Found while checking, fixed:** on the desktop the account form's dropdown flipped above the field when there was
  little room below; it now stays under it and gets shorter. In dark mode the choice's track was the page's colour;
  the choice has its own tokens (`--pup-color-choice`, `--pup-color-choice-active`).

## Tests

- Backend (xUnit): the validators; the controller; the settings service (trimmed name, currency saved, a gone
  account, a failed save); the total in another report currency and its rates in hryvnias.
- Frontend (Vitest): the Settings page (shows, saves the name, refuses an empty one, saves a currency at once, picks
  another from the list with your own first, a failed save and Try again, the theme, Couldn't load); the account
  form's list and Escape (existing tests).
- E2E (Playwright, desktop and phone): `settings.spec.ts` picks US dollars and the zloty, sees the total in them in
  Settings and on Accounts, and changes the name; `accounts.spec.ts` picks a currency from the new list.

## Notes

- Sign out stays where it is (the sidebar's foot, the phone's More sheet).
- The rates line lists the accounts' currencies in the totals' order, as on Accounts (F-017), then the report
  currency.
