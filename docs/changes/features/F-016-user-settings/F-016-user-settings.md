# F-016 · User settings

| | |
|---|---|
| Type | Feature |
| Milestone | M2 — Accounts & categories |
| Status | In progress |
| Branch | `feature/F-016-user-settings` |
| Design | 3 HTML prototypes required |
| Approved | — (design round 1 shown 2026-10-31) |

## Goal

Personal preferences.

## Acceptance criteria

- [ ] Change display name
- [ ] Choose report currency (UAH default, USD, EUR)
- [ ] Choose light/dark/system theme

## Tasks

- [x] References
- [x] 3 HTML prototypes
- [ ] Owner picks a variant; final prototype approved
- [ ] API endpoint
- [ ] UI
- [ ] Storybook stories

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

### Open points (Claude's proposals)

1. **Where the theme is kept:** on the device, as today (not on the account). A phone can be dark while the laptop is
   light, the sign-in page follows it too, and the page never flashes the wrong theme while the account loads.
   Name and report currency are kept on the account.
2. **The sun / moon button** in the sidebar and the phone's top bar stays: it sets Light or Dark; Settings is where
   "Same as the system" is picked again.
3. **Report currency:** only UAH, USD and EUR (the acceptance criteria), not every NBU currency. It changes "In
   total" on Accounts now and the reports later (M4).
4. **Email** is shown but can't be changed; changing the password and deleting the account (F-027) come later and
   aren't shown yet.

Chosen variant: —

## Tests

- Unit: Validators.
- E2E (Playwright): Change report currency and see totals in it.

## Notes

- Sign out stays where it is (the sidebar's foot, the phone's More sheet).
