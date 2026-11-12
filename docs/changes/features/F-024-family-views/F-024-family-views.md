# F-024 · Family views

| | |
|---|---|
| Type | Feature |
| Milestone | M5 — Categories & family |
| Status | Done |
| Branch | `feature/F-024-family-views` |
| Design | 3 prototype stories (round 1), final prototype: variant 1 "One lens" |
| Approved | 2026-11-12, by the owner ("F-024 final prototype is approved, build it"): the final prototype and the open points' proposals |

## Goal

See a family member's and the combined family numbers.

## Acceptance criteria

- [x] Switcher "Me / <member> / Family" in transactions, accounts and reports
- [x] Members see each other's data read-only; each person edits only their own
- [x] Family report merges categories with the same group and name

## Tasks

- [x] References, 3 prototype stories (design round), final prototype, the owner's approval
- [x] Authorization rules
- [x] API parameters for scope
- [x] Switcher UI
- [x] Combined report

## Design

### References (2026-11-12)

Mobbin needs a sign-in, so only open pages were used.

- [Monarch: Shared Views](https://www.monarch.com/blog/shared-views) and
  [Monarch for couples](https://help.monarch.com/hc/en-us/articles/20926382202004-Monarch-for-Couples): every account
  and transaction has an owner ("mine, theirs or ours"); an **Owners filter** on Accounts, Reports, Cash Flow and
  Transactions moves between the personal, the partner's and the household view. Taken: who as one more filter on
  each page, Family as everyone together, whose a row is shown on it (variant 2). Not taken: a "shared" owner (the app
  has no joint accounts; each account is one person's).
- [Honeydue review (Reviewed)](https://reviewed.com/money/features/honeydue-app-review) and
  [getoutofdebt.org](https://getoutofdebt.org/106687/review-honeydue-a-personal-finance-app-for-couple-2): a couple's
  app with a view of all accounts, only "mine" or only the joint ones, and per account what the partner may see.
  Taken: one choice of whose money, kept while moving between pages (variant 1). Not taken: hiding single accounts
  (private ones are after the MVP).
- [Apple: Screen Time for a family member](https://support.apple.com/guide/iphone/set-up-screen-time-for-a-family-member-iph7f15d92dd/ios):
  pick a family member, then the same screens show that person's data. Taken: someone else's money on the same pages,
  not on pages of its own (all variants).
- [Lunch Money: collaboration](https://lunchmoney.app/features/collaboration): each person signs in with their own
  account and sees the shared budget. Taken: each person still signs in as themselves and adds only their own.
- The spreadsheet the app replaces: **one sheet per person per year** with tabs at the bottom, and a sum of both.
  Taken: the people as tabs on the page's main figure, Family as the last tab (variant 3).

### Brief

- **Who and when:** the Kyiv couple. Daily on the phone: a glance at what the other spent this week ("did you pay the
  rent?"). Monthly on the desktop: the family's year in the spreadsheet's shape, the job the summed sheet did.
- **The one job:** switch between my money, the other's and the family's on the page you are on, and always know
  whose money you are looking at, and that you can only look at theirs.
- **The subject's world:** the spreadsheet with a sheet per person; a household ledger both write in; the receipts
  and the dark slip of the Transactions page.
- **The feeling:** "our money in one place", calm; no fear of changing the other's numbers by mistake.

### Plan from the design system

- **Reused:** the shell (sidebar, the phone's top bar and tab bar, the +), the Transactions, Accounts and Reports
  pages as they are (slip, receipts, filters, cards, "In total", the year table, the months), the theme's pill switch
  (`SegmentedControl`), the filter buttons and chips, the shared `ResponsiveDialog` / `BottomSheet`, the People and
  Family pages' initials.
- **New:** the switcher of whose money (a different one in each variant); "whose" on lines and cards in the family
  view (the person's initial); how someone else's page says it is theirs and can't be changed. No new token: a
  member's initial uses the neutral `choice` tint, and you are never marked.
- **Motion:** none; the page's numbers change in place, as when the month changes.
- **The bold element:** variant 1 the lens in the shell; variant 2 none (it is a filter like the others); variant 3
  the tabs on the slip.
- **Slop check:** no colour per person (colour already means income, expense and transfer); no avatars with photos
  or icons in tinted circles beyond the one initial; no "Viewing mode" banners in caps; the words say whose money it
  is ("Andriy's money"), not "Read-only mode".

### Round 1 (2026-11-12)

Each story is the app opened on Transactions as Olena (the other pages work too, from the menu), in the Kovalenko
family with Andriy. The **family** is chosen in Storybook's Controls or the link (`&args=family:…`): *Couple* (the
default: Olena and Andriy), *Three people* (Iryna too), *No family* (no switcher anywhere). Every change is kept in
the story only. Common to all three:

- **Someone else's money** is the same page with their accounts, transactions and report. Nothing of it opens or
  changes: their lines and cards aren't buttons, the page's own Add buttons are gone; the shell's Add still adds
  your own.
- **Family** is everyone together: one "In total", every account (theirs with their name on the card), every line
  (each marked with whose initial; your own open as now), the report with categories of the same group and name
  merged. Amounts in your report currency, as now.

1. **[Variant 1: One lens](http://localhost:6006/?path=/story/prototypes-f-024-family-views--variant-1&nav=false&panel=false&globals=viewport.value:!undefined)**
   — *one choice of whose money for the whole app.* On the desktop a "Whose money" row under Add transaction in the
   sidebar (in the rail only the initial), on the phone a pill in the top bar (the theme switch moves to More, where
   it already is); both open the list: Me, Andriy, Family, each with a line on what it is. The pick holds on
   Transactions, Accounts and Reports alike, and the page says "Andriy's money. Only Andriy changes it." in a
   tinted band with **Back to mine**. Proposal: kept on the device, like the sidebar's width.
   Trade-off: one switch for everything and always in sight; the band is needed because the switch is away from the
   page, and Categories, Family and Settings don't change with it.
2. **[Variant 2: A filter](http://localhost:6006/?path=/story/prototypes-f-024-family-views--variant-2&nav=false&panel=false&globals=viewport.value:!undefined)**
   — *whose money is one more filter* (Monarch's Owners). A filter pill **Mine ▾** on each page, opening the same
   list: on Transactions over the account and type filters, on Accounts over Group by, on Reports beside the
   currency's pill. It is in the page's address like the other filters, so each page has its own (Reports can show
   the family while Transactions shows yours), and a link keeps it. A quiet line under it says whose money it is.
   Trade-off: the most familiar and the quietest; three separate choices, and it is easy to miss that a page shows
   someone else's money.
3. **[Variant 3: Ledger tabs](http://localhost:6006/?path=/story/prototypes-f-024-family-views--variant-3&nav=false&panel=false&globals=viewport.value:!undefined)**
   — *the spreadsheet's sheets* (the risk). Tabs **Me · Andriy · Family** sit right on the Transactions slip (the
   picked one is the slip's own colour, so the slip is that person's sheet), and on a dark rule under the title on
   Accounts and over the report on Reports. One choice for the three pages while the app is open; it starts on Me.
   Trade-off: whose money it is can't be missed and is one tap away; the tabs take a row on every page, and with
   more people they scroll sideways.

Each story opens on Transactions; Accounts and Reports are in the menu, or open on them with `&args=start:Accounts` /
`&args=start:Reports`. The family: `&args=family:Three+people` (Andriy and Iryna), `&args=family:No+family`.
For example [variant 1 with three people](http://localhost:6006/?path=/story/prototypes-f-024-family-views--variant-1&nav=false&panel=false&globals=viewport.value:!undefined&args=family:Three+people)
· [variant 3 on Reports](http://localhost:6006/?path=/story/prototypes-f-024-family-views--variant-3&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Reports).

In all three, someone else's account cards have no + edge and don't open; in Family their cards say whose
("Andriy's, Monobank") and their lines on the receipts carry the initial before the category; yours look as now.
Not in the prototype, for the build: the pages' own words that say "your" ("On your accounts now", the empty states)
say whose money it is.

Checked: the design check on the three stories (0 issues after two fixes: the phone's pill was 40 px, the lens's
spoken name didn't match its text); typecheck, ESLint, Prettier on the prototype folder; every page as Andriy's and as
the family's money, the open lists, three people, no family and the tablet's rail, clicked through in Playwright at
375 and 1440 px, light and dark, screenshots looked at.

### Final prototype (2026-11-12)

The owner picked variant 1, "One lens", with no changes. Variants 2 and 3 were removed (their links above no longer
open); the story is now
**[Final prototype](http://localhost:6006/?path=/story/prototypes-f-024-family-views--final&nav=false&panel=false&globals=viewport.value:!undefined)**,
with the same controls:
[three people](http://localhost:6006/?path=/story/prototypes-f-024-family-views--final&nav=false&panel=false&globals=viewport.value:!undefined&args=family:Three+people)
· [no family](http://localhost:6006/?path=/story/prototypes-f-024-family-views--final&nav=false&panel=false&globals=viewport.value:!undefined&args=family:No+family)
· [opens on Accounts](http://localhost:6006/?path=/story/prototypes-f-024-family-views--final&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Accounts)
· [opens on Reports](http://localhost:6006/?path=/story/prototypes-f-024-family-views--final&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Reports).

- **The lens:** on the desktop a "Whose money" row under Add transaction in the sidebar (your name's initial and
  "Mine", the person's initial and name, or the family's initials and "Family"), in the accent's tint when it isn't
  yours; in the collapsed sidebar only the initial. On the phone a pill in the top bar in the theme switch's place
  (the theme stays in More). Both open the same list (a dropdown, a sheet on the phone): Me "Your own money", each
  member "Only to look at", Family "Everyone together", the picked one ticked.
- **One choice for the whole app:** it holds on Transactions, Accounts and Reports and is kept on the device; the app
  starts on yours when there is nothing kept. Categories, Family and Settings don't change with it.
- **The band:** on the three pages, when it isn't yours, a tinted band over the page: "Andriy's money. Only Andriy
  changes it." or "The family's money. You change only your own." (on Reports also "Categories of the same group and
  name count as one."), with **Back to mine**.
- **Someone else's money:** the same pages with their numbers; their lines and cards open nothing, the cards have no
  + edge, the slip's Add transaction, Add account and the ghost cards are gone. The sidebar's Add and the phone's +
  still add your own.
- **Family:** everyone's accounts (theirs say "Andriy's, Monobank"), every line (theirs with the initial before the
  category), one "In total", the merged report; yours open as now.
- **No family:** no lens and no band; the shell as now.
- Fixed since round 1: in the list, the family's three initials ran into "Family"; the initials now sit in a column as
  wide as the family's.

Checked: the design check on the story as it opens, with three people on Accounts and on Reports (0 issues);
typecheck, ESLint, Prettier on the prototype folder; in Playwright, the lens picked on Transactions holds on Accounts
(no Add account, no + edges) and Back to mine brings them back; every page as yours, Andriy's and the family's money,
the open list (two and three people) and no family at 375 and 1440 px, light and dark, looked at and kept in
[`prototypes/`](prototypes/).

### Open points (proposals)

1. **What another member sees:** everything of theirs, as you see your own: accounts and balances, every transaction
   with its note, the reports, archived accounts. What each person keeps private is planned as
   [F-030](../F-030-family-privacy/F-030-family-privacy.md), right after this change, before the MVP launch.
2. **Read-only:** someone else's lines and cards open nothing (they are not buttons); the page's own Add buttons are
   gone there. The shell's Add (the sidebar's, the phone's +) still adds your own transaction, with your accounts.
3. **Currency:** someone else's and the family's numbers are in **your** report currency, at the NBU rate of each
   transaction's day, as your own.
4. **Money between you:** a transfer only moves money between one person's accounts, so money one of you gives the
   other is an expense for one and an income for the other. In Family both count (spent and received grow by it, NET
   doesn't change), as when the two sheets were summed. Proposal: as it is for the MVP; a later change can mark such
   pairs.
5. **Merging categories** in Family: same group (same kind and name) and same name, ignoring case and spaces at the
   ends. Your own groups and categories come first in your order; ones only someone else has follow at their group's
   end. A hidden category still counts (F-029). A renamed one no longer merges.
6. **Filters on someone else's page:** the account filter lists their accounts; in Family every account, with whose
   it is. A category picked in Family is the merged category.
7. **With no family** there is no switcher anywhere; leaving a family takes you back to your own.
8. **Where it starts:** the app opens on your own money the first time; after that on the last choice, kept on the
   device (the lens, final prototype).

## Built (2026-11-12)

The final prototype as approved, with the open points' proposals ([ADR 0031](../../../decisions/0031-family-views.md)).

- **API:** `who` (`me`, `family` or a member's id) on `GET /api/accounts`, `/api/accounts/total`,
  `/api/transactions`, `/api/transactions/summary`, `/api/reports/year` and `/month`; a `who` that is none of
  them is a 400, someone outside your family (or no family) a 404. `Family.SeenBy` is the rule; the read services take
  a `MoneyScope` (the viewer and the people, the viewer first). Accounts and transactions carry `ownerId`. The
  saving endpoints are unchanged: they take the signed-in person only, so someone else's money can't be changed.
- **Merging** (`FamilyCategories`): groups of the same kind and name, and in them categories of the same name, are
  one, ignoring case and spaces at the ends; the viewer's first in their order, someone else's only ones after. A merged
  one keeps the viewer's id, so a category picked in the family's money (or opened from its report) finds everyone's.
  Hidden only when every part is hidden. Used by the report, the Transactions page's "Where it went" and its category
  filter.
- **App:** the lens (`WhoseLens`) in the sidebar under Add and in the phone's top bar in the theme switch's place;
  `WhoseProvider` keeps the choice on the device (`pup.whose`) and forgets one that isn't in the family any more; the
  band over the three pages with Back to mine; someone else's lines and cards are plain (no button, no + edge), their
  page has no Add transaction on the slip, no Add account and no ghost cards; in the family's money their cards say
  "Andriy's, Monobank", their lines carry the initial, their archived accounts have no Restore / Delete. The pages'
  words that say "your" name whose money it is (empty states, "On Andriy's accounts now", "before the first entry").
  The account filter lists whose each account is in the family's money.
- **Decided while building** (small, within the approved behaviour): picking another lens on the Transactions page
  clears its account and category filters (they were someone else's) and keeps the period and type; the Add account
  form always works on your own accounts, sources and banks; in the family's money the ghost card of an own source of
  someone else's is left out.
- The prototype stories were removed; *Family / Family views* replaces them (the real shell and pages on a fake API
  that answers per `who`).

## Tests

- Backend unit: `Family.SeenBy` (who sees whose money, someone who left), `Who` and `MoneyScope`, `FamilyCategories`
  (merging, order, kinds apart, hidden parts, a member's expense counted in the merged category of the family's
  report), the three controllers with `who` (a member's, the family's, 404 outside the family, 400 for a made-up
  `who`).
- Frontend unit: `whose.ts`; `FamilyViews.test.tsx` (no lens without a family, a member's money only to look at on
  every page and kept on the device, the family's accounts with whose they are, the family's report's line, a kept
  choice of someone who left is forgotten).
- E2E (`e2e/family-views.spec.ts`): through the API, the family's report merges two members' Groceries, a member's
  report is theirs, someone outside the family gets a 404 and a member can't delete another's expense; in the app
  (phone and desktop), a member's expense appears in the family's report, a member's lines open nothing, Back to mine.

## Notes

- —
