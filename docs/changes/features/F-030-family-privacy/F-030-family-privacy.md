# F-030 · Privacy in the family

| | |
|---|---|
| Type | Feature |
| Milestone | M5 — Categories & family (before the MVP launch; owner, 2026-11-12) |
| Priority | Medium |
| Status | Done |
| Branch | `feature/F-030-family-privacy` |
| Design | 3 prototype stories required |
| Approved | 2026-11-12 by the owner ("F-030 final prototype is approved, build it": the final prototype, with the three small points as built) |

## Goal

Each person decides what the other members of their family can see of their money, so joining a family doesn't
mean showing everything. Added by the owner on 2026-11-12, while F-024 (family views) was in its design round.

Today (F-023, F-024) a family member sees everything of the others: accounts and balances, every transaction with
its note, the reports. PRODUCT listed "Private accounts / transactions hidden from the family" after the MVP; the
owner moved it before the launch (2026-11-12), so nobody shares more than they want once the family uses the app.

## Acceptance criteria

Settled with the owner on 2026-11-12 (see "Open points"):

- [x] Everything is set in one place, the **Family page**: a section "What the family sees of your money".
- [x] **Accounts:** each of your accounts has one of three levels: *Everything* (as now), *Balance only* (the others
      see the account and its balance, not its transactions), *Hidden* (the others don't see the account, its balance
      or its transactions). A new account is *Everything*.
- [x] **Transactions:** one switch for all your transactions: the family sees *your transactions* (as now) or *only
      your totals by category*. With totals only, the others' Transactions page shows none of your lines (so none of
      your notes either); their Reports still show your totals by category.
- [x] **Categories:** any of your categories can be private (e.g. Gifts). The others see nothing of it: not the
      category, its transactions or its total.
- [x] The same settings for every member of the family (not per member).
- [x] What is private is **left out completely** of the others' views (F-024's lens: someone's money and Family),
      everywhere: Transactions, Accounts, Reports, the filters, the calendar, "Where it went", "In total", the
      family's totals. The family views say that some money is private.
- [x] The person themselves sees all their own data as now, with a mark on what is private.
- [x] A change takes effect at once for everyone; nothing is deleted or moved by it.
- [x] The rules are enforced by the API (the data never reaches someone who may not see it), not only hidden in the
      UI.
- [x] F-023's "you see each other's money" texts (the join page, Start a family) say that each person decides what
      the others see.

## Tasks

- [x] Answer the open points with the owner (2026-11-12)
- [x] References, 3 prototype stories (design round), final prototype, the owner's approval (2026-11-12)
- [x] Domain: who may see what (`KeptFromFamily` next to the `Family` aggregate), [ADR 0032](../../../decisions/0032-family-privacy.md)
- [x] API: the settings (`PUT /api/family/privacy/…`, migration `AddFamilyPrivacy`); F-024's scoped queries filtered by them
- [x] UI: the Family page's section, the private mark on your own accounts and lines, the other members' views
      without them
- [x] Storybook stories, i18n texts
- [x] Unit tests (backend, frontend), E2E, screens checked; the prototype stories removed

## Design

### References (2026-11-12)

Mobbin needs a sign-in, so only open pages were used.

- [Honeydue: how to change what my partner can see](https://support.honeydue.com/en/articles/3283211-how-to-change-what-my-partner-can-see)
  and [will my partner see my balances and transactions](https://support.honeydue.com/en/articles/3179542-will-my-partner-see-my-bank-account-balances-and-transactions):
  per account "Partner can see": balances and transactions, balances only, or nothing; single transactions can be
  hidden too. Taken: the three levels with these meanings (all variants). Not taken: setting it inside each account
  (the owner wants one place, the Family page).
- [Reviewed: Honeydue review](https://reviewed.com/money/features/honeydue-app-review): hiding an account and "balance
  only" sit side by side as one choice per account. Taken: the three as one control on each account's row (variants 1,
  2) or under its card (variant 3).
- [Google Photos: partner sharing](https://support.google.com/photos/answer/7378858): one settings screen says what
  the partner gets (all photos, or only some people), changeable later, applying to what is there already. Taken: one
  place for everything, a change counts at once for what is there (all variants); the setting written as what the other
  person gets (variant 3's sentence).
- [Monarch for couples](https://help.monarch.com/hc/en-us/articles/20926382202004-Monarch-for-Couples) (F-024's
  reference): every account has an owner and households see everything. Taken: nothing more is hidden than you choose;
  a new account is shared.
- F-024's own band and the Transactions slip: what the others see shown in the app's charcoal (variant 2's mirror).

### Brief

- **Who and when:** the Kyiv couple, once when the family starts and now and then after (a new account, a present to
  buy). On the desktop as often as the phone: it is a settings page, not a daily one.
- **The one job:** decide, in one place, what the other members see of your money, and be sure of it; first see what
  they see now.
- **The subject's world:** a household ledger kept by two people, each with their own pocket money and a box of
  dollars; presents bought in secret (Gifts).
- **One feeling:** "calm and in control": nothing is hidden by accident, nothing shown by accident.

### Plan (round 1)

- **Reused:** the Family page as built (F-023 sections, Settings' layout), the app's pill switch, pills, the filter
  pill with a menu, account cards and their style drawings (F-014), category tags and the dashed + tag (F-029),
  `ResponsiveDialog`, the slip's charcoal (F-020), the app shell and F-024's lens. No new token.
- **New:** a section "What the family sees" after Members, in three directions. Olena's settings change in the story
  and are kept while it is shown.
- **The bold element:** variant 1 none (the quiet settings way); variant 2 the mirror on the slip's charcoal; variant 3
  the sentence in the display face.
- **The other side:** Andriy's own settings are fixed in the stories (his "Dollars in the box" hidden, "Pocket" balance
  only, Gifts private): with the lens on Andriy's money or the family's, his hidden account and his lines on "Pocket"
  or in Gifts are gone from Accounts and Transactions. The reports aren't filtered in this round, and the band's "some
  money is private" line, the private mark on your own cards and lines, and the Transactions page with "only totals"
  come in the final prototype, once the direction is picked.

### Prototype stories (round 1)

*Prototypes / F-030 Family privacy*, each opening on the Family page as Olena, with Olena's start (some kept private /
nothing private) and the family (couple / three people) as controls:

- [Variant 1: Rows](http://localhost:6006/?path=/story/prototypes-f-030-family-privacy--rows&nav=false&panel=false&globals=viewport.value:!undefined):
  Settings' way. Your transactions as two rows to pick from; every account a row with its style, name and bank, its
  level a pill on the right that opens the three (Everything quiet, the others in the accent); the private categories
  as dashed tags with ×, + Choose categories opening every category as pills.
- [Variant 2: Mirror](http://localhost:6006/?path=/story/prototypes-f-030-family-privacy--mirror&nav=false&panel=false&globals=viewport.value:!undefined):
  what you set beside what Andriy sees, changing as you set it: his view on the slip's charcoal with your cards as he
  gets them, your latest lines (or your month by category) and what isn't there. Each account's level is the app's pill
  switch under its name. On the phone a switch "You set / Andriy sees" between the two.
- [Variant 3: Sentence](http://localhost:6006/?path=/story/prototypes-f-030-family-privacy--sentence&nav=false&panel=false&globals=viewport.value:!undefined):
  one sentence says it all ("Andriy sees every transaction, on 8 of your 9 accounts, in every category but 1"); each
  underlined part opens a dialog (the two choices; your accounts as their cards with the three levels as pills under
  each; the categories), and "Kept from Andriy" lists what isn't shared, each row opening its dialog.

Chosen variant: **variant 1 "Rows", made to fold** (owner, 2026-11-12). Variants 2 and 3 were removed.

### Final prototype (2026-11-12)

[Final prototype](http://localhost:6006/?path=/story/prototypes-f-030-family-privacy--final&nav=false&panel=false&globals=viewport.value:!undefined)
in *Prototypes / F-030 Family privacy*, with the controls Olena's start (some kept private / nothing private), what
Andriy shares of his transactions (every transaction / only totals) and the family (couple / three people):

- **Family page, "What the family sees":** variant 1's parts as three rows that fold, all folded when the page opens,
  each with what is set now: *Your transactions* ("Every transaction"), *Your accounts* ("7 shared, 1 balance only, 1
  hidden"), *Private categories* ("Gifts"). A tap unfolds a row (several can be open): the two choices with a round
  mark; every account with its style, name and bank and its level as a pill opening Everything / Balance only /
  Hidden (Everything quiet, the others in the accent); the private categories as dashed tags with ×, + Choose
  categories opening every category as pills. The Members section's line now says each sees the others' money as
  they set it.
- **Your own pages:** a hidden account's card has an eye-off before its name, a balance-only one coins (named for
  screen readers); a line on such an account or in a private category has a lock after its category.
- **Andriy's money (the lens):** his hidden account is gone (and its balance from In total); his balance-only card
  has the coins mark; his lines on it or in Gifts aren't listed. The band adds "Andriy keeps some of it private"; in
  the family's money "Some of Andriy's money is private".
- **Andriy shares only totals:** his Transactions page keeps the slip's totals and Where it went, the calendar's days
  stay blank, and in place of the receipts "Only totals by category: Andriy shares how much went on each category,
  not the transactions"; the band says so too.
- The three small points are built as proposed: a balance-only account's lines count in the totals by category; a
  transfer with a hidden account shows "A private account" on the shared side; the stricter setting wins.
- Not in the prototype: the reports are F-024's fake numbers (not recalculated without private money), and the
  Categories page has no mark on a private category (the Family page lists them).

Checked: the design check on the story (0 issues), typecheck, ESLint, Prettier; every state clicked through in the
Browser pane; screenshots at 375 and 1440 px, light and dark, of the section unfolded, your Accounts with the marks,
Andriy's accounts and Andriy's totals-only Transactions, looked at and kept in [prototypes/](prototypes/).

## Tests

- Unit: the visibility rules (Domain); each scoped query leaves out what is private.
- E2E (Playwright): a member makes an account hidden, a category private and their transactions totals only; the
  other member no longer sees the account, the category or the lines, and the family's numbers leave them out; the
  owner of the data still sees everything.
- Screens checked in Playwright screenshots (phone / desktop, light / dark).

## Notes

### Open points (answered by the owner, 2026-11-12)

1. **What can be private:** accounts, transactions and categories (owner). Transactions privacy means the others see
   only your totals by each category instead of the transactions.
2. **How private an account can be:** the three levels *Everything* · *Balance only* · *Hidden* (proposal accepted).
3. **The default:** a new account is shared, *Everything* (proposal accepted).
4. **Family totals:** private money is left out completely, and the family views say that some money is private
   (proposal accepted).
5. **Per member or for the whole family:** the same for the whole family (proposal accepted).
6. **Notes:** no setting of their own. They go with the transactions: shown while your transactions are shared,
   hidden with "only totals by category" (follows from point 1's transactions switch).
7. **Where it is set:** the **Family page only**, one place with all the switches (owner; the proposal to set an
   account's level in its form was not taken).
8. **Milestone:** before the MVP launch, in M5 after F-024 (owner, 2026-11-12).

Transactions privacy: one switch for all your transactions (owner, 2026-11-12; not a checkbox per transaction).
A private category: the others see nothing of it (owner, 2026-11-12; not only its total).

### Settled in the design round (built as proposed, approved 2026-11-12)

- **A *Balance only* account in the reports:** its transactions are left out of the others' Transactions page but
  counted in their reports' category totals, as with "only totals by category" (the balance shows how much went
  anyway). The alternative: left out of the reports too.
- **Transfers with a hidden account:** a transfer between a shared and a hidden account shows on the shared side as
  "To / From a private account".
- **When the settings collide,** the stricter wins: a transaction on a hidden account or in a private category is
  left out even when your transactions are shared.

### Built (2026-11-12)

- **Where the settings live:** on the money itself: `accounts.family_sees`, `categories.is_private`,
  `users.family_sees_transactions`; everything that existed is shared, as before. They stay when you leave a family.
- **Your own marks** (the eye-off and coins on your cards, the lock on your lines) show only while you are in a family
  with someone else in it: without one, nobody is kept from.
- **The accounts row** lists your accounts in use, as the prototype; an archived account keeps the share it had.
- **A hidden transfer side** comes from the API as an empty id with no name; the app says "A private account", and the
  line shows what left (or came into) the shown account, in its currency.
- **Stories:** the prototype stories were removed; *Family / Family privacy* (the app as Olena: the Family page, her
  marked accounts and lines, Andriy's money, his totals only, the family's) and *Family / Family page → What the family
  sees* replace them, with *Accounts / Account card → Kept from the family*.
- A balance-only account of someone else shows without its count of transactions; the others' banks and own sources are
  sent only as far as the accounts shown name them.

### Related

- [F-023 Family and invitations](../F-023-family-and-invitations/F-023-family-and-invitations.md): what joining
  means is said before joining ("you see each other's money"); that text changes with this feature.
- [F-024 Family views](../F-024-family-views/F-024-family-views.md): the lens and the other members' views this
  feature filters; F-024's open point 1 shows everything until then.
