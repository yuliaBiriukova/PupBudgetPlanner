# F-014 · Accounts and balances

| | |
|---|---|
| Type | Feature |
| Milestone | M2 — Accounts & categories |
| Status | In progress |
| Branch | `feature/F-014-accounts` |
| Design | 3 HTML prototypes required |
| Approved | 2026-10-30, the description and the final prototype (variant 10), without the total in the report currency (moved to F-017) |

## Goal

See where the money is: every bank account and cash, in its own currency.

## Acceptance criteria

- [ ] Create, edit and archive accounts: name, source (and the bank, when the source is Bank), currency, opening
      balance, opening date
- [ ] **Sources are personal** (owner, 2026-10-29): everyone starts with **Cash** and **Bank** and can add their own
      (e.g. "Deposit", "Crypto wallet") in the account form. Only Bank has sub-sources, the banks.
- [ ] **Banks are personal:** in the account form you pick one of your banks or type a new name, which is kept for
      your next account; common Ukrainian banks are suggested while typing. One person's banks are not another's.
- [ ] **Any currency NBU publishes a rate for**, plus UAH: a searchable picker with your own currencies first
      (owner, 2026-10-29)
- [ ] The list groups accounts **by currency or by source**, with a switch; the choice is remembered. Every group
      has its own add button that opens the form with that currency or source already picked.
- [ ] Each account's current balance and a total per currency
- [ ] "In total" on top of the list shows the total of each currency. The total of all accounts in the report
      currency at NBU rates (the "In total, in UAH" line of the final prototype) is built in F-017 (owner, 2026-10-30)
- [ ] Each account has a **card style**: Solid (charcoal in light mode, light grey in dark mode), Tinted, Envelope or
      Plain, picked in the form under a preview of the card. The names fit both themes. A new account takes its
      source's style (Bank solid, Cash envelope, own sources plain) until one is picked (owner, 2026-10-30)
- [ ] Archived accounts are hidden from selection and the totals but keep their history, and can be restored. The
      Archived list shows the balance, muted, only when it is not zero (owner, 2026-10-29)

## Tasks

- [x] 3 HTML prototypes (three rounds; final prototype `variant-10.html`, approved 2026-10-30)
- [ ] Domain + API
- [ ] Balance calculation
- [ ] UI
- [ ] Storybook stories

## Design

### References

Mobbin answered 403 from here; open pages only, no sign-in:

- [Actual Budget: accounts](https://actualbudget.org/docs/accounts/): a local account needs only a name and a
  starting balance; closed accounts sit in their own "Closed accounts" group and can be reopened. Taken: a short
  form, and archived accounts folded under the list with Restore.
- [YNAB: close or delete an account](https://support.ynab.com/en_us/how-to-close-or-delete-an-account-in-ynab-ry_409Gko.md):
  closing keeps the history and moves the account to a closed section; Close sits in the corner of the Edit
  account window. Taken: Archive inside the edit dialog, not on the row.
- [Copilot Money](https://www.copilot.money/): each account row shows its name and current balance, and accounts
  are grouped by kind. Taken: grouping (by currency in variants 1 and 3, by bank in variant 2).
- [Spendee](https://www.spendee.com/support): the opening balance can be set when the wallet is created or later
  on its edit screen. Taken: the opening balance and date stay editable.
- [Monefy](https://monefy.com/), the app Pup replaces: one balance up front. Taken: the totals come first.

### Brief

- **Who and when:** the couple set up their 4–8 accounts once, then glance here to see how much is on Mono,
  Privat and in cash; on the desktop at month end.
- **The one job:** see where the money is. The totals per currency come first.
- **The subject's world:** bank cards (a black Mono card), cash in a wallet, an envelope of dollars at home, and
  the spreadsheet's double-ruled total rows.
- **Feeling:** calm, everything is accounted for.
- **Tokens:** the app's own (charcoal and sky, Unbounded 300 for headings and amounts, Manrope 400/500, radius
  12 and 24). A debt is red (expense) with a true minus. One motion: after you add an account, its row is tinted
  for a moment and its currency's total counts up.

### Round 1 (2026-10-29)

Prototypes in `prototypes/`. Each has the list, the first visit, loading, couldn't load, New account (and with
mistakes), the moment after adding, Edit, Archive with money still on the account, and Archived open.

| Variant | Thesis |
|---------|--------|
| [1 · Ledger](prototypes/variant-1.html) | The spreadsheet: one table grouped by currency (Account, Where, Opened, Opening balance, Balance); each currency's total row closed with a double rule. On the phone the totals come first. |
| [2 · Wallet](prototypes/variant-2.html) | Every account is a card with a bank card's proportions, grouped by bank (Monobank charcoal, PrivatBank sky, cash a dashed envelope); totals on the charcoal band; the dialog shows the card as you type. |
| [3 · Currency columns](prototypes/variant-3.html) | One column per currency with its total set large on top and its accounts under it; every currency always shown; "Add dollar account" under each column; the form asks for the currency first. |

Checked: the design check (0 issues), screenshots of every state at 375 and 1440 px, light and dark.

**Owner's feedback (2026-10-29):**

- Not only hryvnia, dollars and euro: any currency NBU has. Sources are personal too: Cash and Bank by default,
  Bank with sub-sources (Monobank, PrivatBank…), and each person has their own set. Own sources can be added; banks
  are typed in the form and remembered.
- A switch to group by currency or by source.
- Variant 1's table looks too technical: dropped.
- The cards of variant 2 are liked, their colors not sure: propose other ways. Black cards stay black in dark mode:
  should they turn around? Why are Monobank's cards black and the others styled differently? Check the cards on the
  phone and tablet so no text overlaps.
- Variant 3's add button for one currency is liked: bring it to the cards, in different ways.
- The balance of an archived account: shown muted, only when it is not zero.

Answers in round 2: Monobank's cards were black after Monobank's own black card, and PrivatBank's sky after nothing
in particular; colors by bank don't work once banks are personal (any name, any number), so round 2 colors cards by
something every account has, or not at all. A card that is dark in light mode turns light in dark mode wherever a
variant keeps one.

### Round 2 (2026-10-29)

Three card variants, all with the new scope:

- a Currency / Source switch above the cards;
- any number of currencies;
- a searchable list of NBU currencies in the form, with yours first;
- sources: Cash, Bank and your own (via "New source");
- banks: yours, or "Another bank" typed with suggestions;
- an add button for each group that opens the form with that currency or source already picked;
- archived balances shown, muted, only when not zero.

By currency, each group shows its total. By source, the totals per currency sit on top, because a source mixes
currencies.

| Variant | Card colors | Add to a group |
|---------|-------------|----------------|
| [4 · Paper cards](prototypes/variant-4.html) | Every card the same: light in light mode, dark in dark mode | A dashed ghost card at the end of the group |
| [5 · Your colors](prototypes/variant-5.html) | You pick each account's color (charcoal, sky, sage, sand, rose, plain), shown on a card preview in the form; each has a dark-mode version, charcoal turns light | "+ Add" in the group heading, next to the total |
| [6 · Charcoal columns](prototypes/variant-6.html) | All cards charcoal in light mode, turned to light grey in dark mode; columns per group with the total on top (variant 3's layout) | "Add UAH account" link under each column |

Cards never overlap: long names end in "…", and the balance (and variant 6's column total) gets smaller with
the card instead of wrapping. Phone: one card per row. Tablet (834 px): two per row. Laptop: four.

Checked: the design check (0 issues, 0 console errors), screenshots at 375, 834 (tablet) and 1440 px, light and
dark, of every state: by currency, by source, the form with the currency list, another bank, a new source,
mistakes, adding from a group, the moment after adding, edit, archive, and archived. Overview images are in
`screenshots/round-2-*.png`.

**Owner's feedback (2026-10-30):**

- Every pop-up gets an X (close) button.
- Variant 6 is out.
- Variant 2's card styles are liked, and so are the black cards in the light theme. Variant 4's cards are too
  simple, but its add buttons (ghost card) and the group switch are liked. Choosing a card style (variant 5) is
  liked, but with variant 2's styles, and with other ways of choosing than variant 5's color dots.
- Bug: the currency search field draws a second outline inside the field when focused.
- Why no "In total" when grouped by currency? (The group headings carried the totals. Round 3 shows "In total"
  in both groupings and keeps each currency heading's total too.)

### Round 3 (2026-10-30)

All three variants use variant 4's layout: the Currency / Source switch and a ghost card at the end of each group.
The ghost card's dashes are now accent blue, so it isn't taken for an envelope card.

Cards take variant 2's styles, chosen per account:

- **Black:** turns light grey in dark mode;
- **Sky;**
- **Envelope:** grey dashes;
- **Plain.**

A new account starts with its source's style: Bank black, Cash envelope, own sources plain. It follows the source
until you pick a style yourself.

Also in every variant: "In total" on top in both groupings, an X on every pop-up (and next to the currency
search), and a single focus border on the currency search.

The variants differ only in how the style is picked:

| Variant | Picking the card style |
|---------|------------------------|
| [7 · Style thumbnails](prototypes/variant-7.html) | Four small cards side by side in the form, each with its name; tap one. No big preview. |
| [8 · Flip the card](prototypes/variant-8.html) | The account's card on top of the form, as it will look; arrows on both sides flip through the styles, with the style's name and dots under it. |
| [9 · Preview and named styles](prototypes/variant-9.html) | The card on top of the form, and the styles as named pills (each with a small drawing), like Source and Bank. |

Checked: the design check (0 issues, 0 console errors), screenshots at 375, 834 and 1440 px, light and dark, of
the list (by currency and by source), the form with the style picker, edit, the currency list, archive, and the
moment after adding. Overview images are in `screenshots/round-3-*.png`.

**Owner's feedback (2026-10-30):** variant 9 with the preview is liked, but its style pills were far from the
preview, so you had to scroll up to see the change. Also wanted: the total of all accounts in the main currency at
the NBU rate.

### Final prototype (2026-10-30)

[Variant 10 · Final](prototypes/variant-10.html), built from variant 9:

- **The card style sits under the card it changes,** at the top of the form: the preview card, and right under it
  four equal tiles (a small drawing over the name: Solid, Tinted, Envelope, Plain).
  - On the phone the card is a little smaller, so the card and all four styles fit on screen together.
  - The edit form drops its "Balance now" line, because the card shows the balance.
  - On the phone, the edit form's buttons are Save on its own row, then Archive and Cancel side by side.
- **"In total"** starts with everything in UAH (the report currency) at today's NBU rates, with the rates and
  their date under it. Then come the totals of each currency. When today's rates aren't published yet, the
  latest earlier ones are used and the line says so (screen "Total: earlier rates").
- **Everything else is round 3's:**
  - variant 4's layout: the Currency / Source switch and a ghost card to add to a group;
  - variant 2's card styles, per account, defaulting to the source's style;
  - an X on every pop-up;
  - any NBU currency;
  - your own sources and banks;
  - archived balances shown only when not zero.

Checked: the design check (0 issues, 0 console errors), screenshots at 375, 834 and 1440 px, light and dark, of
every screen. Images are in `screenshots/final-*.png`.

**Owner's feedback (2026-10-30):** the style names must fit both themes (the black card is white in dark mode).
Renamed: Black → **Solid**, Sky → **Tinted** (also a color name, and dark blue-grey in dark mode); Envelope and
Plain describe the shape and stay.

<a id="approved-2026-10-30"></a>**Approved (2026-10-30):** the owner approved the design and the build ("design is approved, you can start
build"). F-014 is built first and without the "In total, in UAH" line and its NBU rates; that line comes with F-017.

Chosen variant: 10 (final prototype)

## Tests

- Unit: Balance calculation, validators.
- E2E (Playwright): Create accounts and see balances and total.

## Notes

- **Total:** the total of all accounts in the report currency needs NBU rates. On 2026-10-30 the owner asked for
  it, then chose to build F-014 first and the total with F-017. F-014 shows the totals per currency.

## Decisions (approved with the design, 2026-10-30)


- An archived account leaves the totals, even with money still on it (the dialog warns). Its transactions stay in
  the lists and reports.
- An account's currency can't change once it has transactions (the edit form says so).
- No delete in F-014, only archive (like YNAB, where delete is only for an account without history).
- Renaming or removing your own sources and banks: not in F-014 (a source or bank stays while an account uses it).
- The currency list: NBU's list of currencies with official rates (about 40), kept in the app, so F-014 doesn't
  wait for F-017.
- Amounts in other currencies: `$`, `€`, `£` before the number, `₴` after it, and the code after the number for
  the rest (`640.00 PLN`).
