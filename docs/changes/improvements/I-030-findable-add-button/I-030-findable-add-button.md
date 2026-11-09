# I-030 · An Add button people find on the phone

| | |
|---|---|
| Type | Improvement |
| Milestone | M6 — MVP release (polish) |
| Priority | High (proposed: people testing the app couldn't find how to add an expense or income on the phone, the app's main action) |
| Status | Todo (design done and approved; to be built on its branch) |
| Branch | `improvement/I-030-findable-add-button` (planned on `plan/phone-feedback`; the prototype stories are on it) |
| Design | 🎨 3 rounds of prototype stories, then the final prototype; screenshots in [prototypes/](prototypes/) |
| Approved | 2026-11-09, the owner in chat ("I approve the prototype"): the final prototype, variant 8 with the menu's pill gone |

## Goal

Someone opening the app on the phone for the first time sees at once how to add an expense or an income. Feedback the
owner got from a person using the app: they couldn't find how to add one on the phone (owner, 2026-11-09).

## Today

- The phone's bottom bar ends with a round black **+** (`PhoneBars.tsx`), with no word next to it, set apart from the
  tabs on the right.
- The Transactions page's totals slip shows another round **+** once the page is scrolled (`TotalsSlip.tsx`).
- The empty Transactions page ("Nothing on this day") says nothing about adding.

## Acceptance criteria

As approved in the final prototype (2026-11-09):

- [ ] On every page of the phone app a charcoal + floats 16 px above the menu at the thumb's end, in sight without
      scrolling; the pages have room under their last row, so it covers no row at the end, nor the toast (B-013).
- [ ] A tap on the + dims the page and opens ⇄ Transfer, + Income and − Expense above it (Expense nearest), round
      buttons in the types' colours with no names; the + turns into ×. Screen readers read "Add transfer / income /
      expense".
- [ ] Each opens the same quick-add form as now **on its type**, on the picked day (I-025). A type, ×, a tap on the
      dimmed page or Escape folds the three. Back leaves the page as now (no history step for the three; owner,
      2026-11-09).
- [ ] The bottom bar has no + of its own; its four places (Transactions, Accounts, Reports, More) share the width,
      each named under its icon; the open one in the accent, its name in medium weight, with no pill behind it.
- [ ] An empty day or month tells how to add the first transaction (with the +).
- [ ] The desktop is unchanged: the sidebar's Add transaction (I-019). The slip's round + stays.
- [ ] Light and dark, 360 px to tablet; reduced motion: the three show and go without moving.

## Tasks

- [x] References (see "Design"): Material 3's extended FAB, Monefy's − and + buttons, a centre FAB in a tab bar, two
      finance apps' user feedback on where Add sits.
- [x] 3 prototype stories in `frontend/src/prototypes/I-030-findable-add-button/` (*Prototypes / I-030 Findable add
      button*), the real Transactions page with the app's shell, one story per variant.
- [x] The owner picks one; final prototype; approval (I-003) before any code (2026-11-09).
- [x] DESIGN_RULES "Screen decisions" row (2026-11-09).
- [ ] The quick-add form opens on a given type: `TransactionFormApi.add({ type })` (now only Expense, then switched).
- [ ] The phone's bottom in the shell (`PhoneBars.tsx`, `AppLayout.tsx`): the + and its three (a component of its own,
      with Escape and the dimmed page), the four named places without the pill, the pages' room under their last row.
- [ ] The empty day's and month's text on how to add; i18n keys for every new text.
- [ ] Storybook: the shell's phone stories (the three open; each page), the prototype stories deleted.

## Design

### References (2026-11-09)

- Material 3 extended FAB (Material Components for Android docs,
  [ExtendedFloatingActionButton.md](https://gitea.com/784622644/material-components-android/src/branch/master/docs/components/ExtendedFloatingActionButton.md);
  [a Compose guide](https://itnext.io/floating-action-button-in-jetpack-compose-with-material-3-10ba8bff415a)): a
  button with a word for the screen's main action on long, scrolling pages, folding to its icon when room is short →
  variant 1, folding while the page goes down.
- Monefy ([The Edge Markets' review](https://www.theedgemarkets.com/article/back-basics-expense-tracking),
  [screensdesign showcase](https://screensdesign.com/showcase/monefy-money-tracker)): the app the couple is replacing
  has a − and a + button at the bottom of the main screen, one for an expense and one for an income → variant 3.
- A design system's spec of a FAB in the middle of a tab bar
  ([Settld, floating FAB](https://settld-design-system.pages.dev/components/floating-fab.html)): the centre slot of the
  bar taken by the raised button, lifted above the bar's edge → variant 2.
- A finance app's user feedback ([Kualia board](https://kualia.userjot.com/board/p/add-a-add-transaction-in-the-bottom-menu-and-remove-de-from-transactions-page.))
  and another's ([BudgetFlow board](https://budgetflow.featurebase.app/p/move-the-add-transaction-floating-button)):
  people ask for Add to be in the same place on every tab, and for a floating one not to cover the list → all three
  keep Add on every page, and variants 1 and 3 leave room under the last rows.
- Mobbin itself didn't come up without signing in; nothing was opened that needs the owner's account.

### Round 1: three variants (2026-11-09)

All three are the real app in Storybook: the shell with its pages (Transactions, Accounts and Reports work with fake
data, the tabs move between them), the real quick-add form, and only the phone's Add changed. The desktop is the app's
own sidebar, unchanged. The slip's own round + on the Transactions page stays in all three.

| Story | Thesis and trade-offs | Link |
|-------|-----------------------|------|
| Variant 1: Add transaction pill | **Say it in words.** The bar's + becomes a charcoal 56 px pill "+ Add transaction" floating 16 px above the bar at the thumb's end, on every page; it folds to its + while the page goes down and opens out again on the way up. The tabs spread over the whole bar. Clearest words; covers a little of the list's corner (the page gets 72 px of room under its last row). The words are a control: "Add transaction" or "Add" | [open](http://localhost:6006/?path=/story/prototypes-i-030-findable-add-button--variant-1&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 2: Add in the middle of the bar | **Add is a place in the bar.** Every tab is named under its icon (the open one on the accent's pill), and a raised 56 px charcoal + with "Add" under it sits in the middle, standing above the bar's edge. Covers nothing, the same spot on every page, as many money apps do; but the bar is taller (every name shown) and it changes the F-010 bar the most | [open](http://localhost:6006/?path=/story/prototypes-i-030-findable-add-button--variant-2&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 3: Expense and Income buttons | **As in Monefy (the risk).** Two named buttons on one floating dock above the bar: "− Expense" in the expense red's tint and "+ Income" in the income green's, each opening the form already on its type (Transfer stays in the form's switch). The two most used actions one tap away and named the way the person thinks of them; but two buttons take more of the list's corner than one, and Transfer gets no button | [open](http://localhost:6006/?path=/story/prototypes-i-030-findable-add-button--variant-3&nav=false&panel=false&globals=viewport.value:!undefined) |

The owner's answer (2026-11-09): not variant 2; variant 1 as a full-width button on the phone; variant 3 with round
buttons only, no names, and one for Transfer too. Round 1's stories were replaced by round 2's.

### Round 2: two variants (2026-11-09)

| Story | Thesis and trade-offs | Link |
|-------|-----------------------|------|
| Variant 4: Full-width Add transaction | Variant 1 across the phone: a 52 px charcoal "+ Add transaction" pill, 16 px from both edges, in a row of its own at the top of the bottom bar, the tabs under it spread over the bar. It never covers the page and never folds; the bottom takes 60 px more of the screen | [open](http://localhost:6006/?path=/story/prototypes-i-030-findable-add-button--variant-4&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 5: Round Expense, Income and Transfer | Variant 3 without names: three 56 px circles on one floating dock above the bar, ⇄ Transfer (blue), + Income (green), − Expense (red) with Expense at the thumb's end; each opens the form on its type. Screen readers read "Add transfer / income / expense"; with no words, the person goes by the signs and colours alone. Covers a corner of the list (the page has 80 px of room under its last row) | [open](http://localhost:6006/?path=/story/prototypes-i-030-findable-add-button--variant-5&nav=false&panel=false&globals=viewport.value:!undefined) |

The owner's answer (2026-11-09): more variants of the three buttons; and the phone's menu rearranged, since the bar
loses its +.

### Round 3: four more ways for the three buttons, and the menu rearranged (2026-11-09)

**The menu** (variants 6, 8 and 9): without the + the bar has four places, so they share the phone's width equally,
each icon with its name under it (12 px), the open one's icon on the accent's pill and its name in the accent. Every
place is named, not only the open one as now; the bar keeps its height. Variant 7 keeps the places as icons, as the
three buttons take half the bar. Variants 4 and 5 still show round 2's bar (the app's, spread out) for comparison.

| Story | Thesis and trade-offs | Link |
|-------|-----------------------|------|
| Variant 6: Big Expense, small Income and Transfer | **The most used, the biggest.** Expense a 64 px circle filled in its red at the thumb's end; Income and Transfer 56 px in their tints beside it, on one floating dock. The eye goes to − first; covers a corner of the list | [open](http://localhost:6006/?path=/story/prototypes-i-030-findable-add-button--variant-6&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 7: The three in the bar | **One bar for everything.** The four places as icons on the left, a thin rule, ⇄ + − (44 px) on the right. Nothing floats and the bottom is no taller than now; but the places lose their names and the buttons are smaller | [open](http://localhost:6006/?path=/story/prototypes-i-030-findable-add-button--variant-7&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 8: One + that opens the three | **Clear page, one tap more.** A single charcoal + floats at the thumb's end; a tap dims the page and opens ⇄ + − above it, the + turning into ×. The page is covered least; every add costs two taps, and the + alone says nothing of the three | [open](http://localhost:6006/?path=/story/prototypes-i-030-findable-add-button--variant-8&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 9: The three in a row over the tabs | **Docked, in the middle.** ⇄ + − (56 px) centred in a row of their own between the page and the named tabs, like variant 4's row. Never covers the page, the same place on every page; the bottom takes about 64 px more | [open](http://localhost:6006/?path=/story/prototypes-i-030-findable-add-button--variant-9&nav=false&panel=false&globals=viewport.value:!undefined) |

The owner's choice (2026-11-09): variant 8, without the pill behind the open place in the menu. (A first final
prototype was built from variant 9 by mistake; the owner pointed to variant 8 with screenshots, and it was rebuilt.)
The round stories were replaced by the final prototype's.

### The final prototype (2026-11-09)

[Final prototype](http://localhost:6006/?path=/story/prototypes-i-030-findable-add-button--final&nav=false&panel=false&globals=viewport.value:!undefined):
on the phone one + floats over the page and opens the three:

- **The +:** a 56 px charcoal circle floating 16 px above the menu at the thumb's end (right), on every page; the page
  has 72 px of room under its last row so the + covers no row at the end.
- **⇄ + −** (Add transfer, Add income, Add expense): a tap on the + dims the page and opens three 56 px circles above
  it, 12 px apart, rising 16 px as they come (160 ms; none with reduced motion), Expense nearest to the +; the + turns
  into × (Close). Each is in its type's tint with the sign in its colour (transfer blue, income green, expense red)
  and opens the form on its type. A type, ×, a tap on the dimmed page or Escape folds them. No names on them; screen
  readers read "Add transfer / income / expense".
- **The menu:** the bar's + is gone; the four places (Transactions, Accounts, Reports, More) share the width equally,
  each icon with its name under it (12 px). The open one is in the accent, its name in medium weight, with **no pill**
  behind it.
- The desktop is unchanged: the sidebar's Add transaction (it opens an expense, as now).
- The slip's own round + on the Transactions page stays as it is.

Not in the prototype: a line on the empty day ("Nothing on this day") telling how to add (acceptance criterion); it
comes with the build, as the empty state belongs to the page.

Screenshots of the final prototype (the three folded):

| | Light | Dark |
|---|---|---|
| Phone, 375 px | [final-375-light.png](prototypes/final-375-light.png) | [final-375-dark.png](prototypes/final-375-dark.png) |
| Desktop, 1440 px (unchanged) | [final-1440-light.png](prototypes/final-1440-light.png) | [final-1440-dark.png](prototypes/final-1440-dark.png) |

Prototype stories: *Prototypes / I-030 Findable add button* (`frontend/src/prototypes/I-030-findable-add-button/`, on
`improvement/I-030-findable-add-button` only: a planning branch carries no prototypes). Each round's stories replaced
the last one's, so only the final prototype's link opens now; the rounds are in that branch's history. ·
Chosen variant: 8, with the menu's pill gone · Final prototype approved: 2026-11-09 (screenshots in
[prototypes/](prototypes/))

## Tests

- Unit: the + opens and folds the three (×, Escape, the dimmed page); each opens the form on its type, on the picked
  day; the menu marks the open place.
- E2E (Playwright, phone): from Transactions, Accounts and Reports the + is in sight, opens the three, and each opens
  the form on its type; the last row of a long list can scroll clear of the +.
- Screens checked in Playwright screenshots at 375 and 768 px (the three folded and open) and 1440 px (unchanged),
  light and dark.

## Open points

- ~~Did the person look for it on the Transactions page or elsewhere?~~ No longer needed: the + is on every page.
- ~~Back while the three are open: fold them first, as Back closes a pop-up before it leaves the page (I-015)?~~
  Answered by the owner on 2026-11-09: **no**, Back leaves the page as it does now; the three are not a pop-up and add
  no step to the history.
