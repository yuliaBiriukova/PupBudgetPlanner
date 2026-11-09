# I-030 · An Add button people find on the phone

| | |
|---|---|
| Type | Improvement |
| Milestone | M6 — MVP release (polish) |
| Priority | High (proposed: people testing the app couldn't find how to add an expense or income on the phone, the app's main action) |
| Status | In progress (design round 1) |
| Branch | `improvement/I-030-findable-add-button` (planned on `plan/phone-feedback`) |
| Design | 🎨 3 prototype stories, then the final prototype |
| Approved | — (date the owner approved the description and the final prototype) |

## Goal

Someone opening the app on the phone for the first time sees at once how to add an expense or an income. Feedback the
owner got from a person using the app: they couldn't find how to add one on the phone (owner, 2026-11-09).

## Today

- The phone's bottom bar ends with a round black **+** (`PhoneBars.tsx`), with no word next to it, set apart from the
  tabs on the right.
- The Transactions page's totals slip shows another round **+** once the page is scrolled (`TotalsSlip.tsx`).
- The empty Transactions page ("Nothing on this day") says nothing about adding.

## Acceptance criteria

- [ ] On every page of the phone app the way to add a transaction is visible without scrolling and reads as "add a
      transaction" without guessing (a word, not only a +).
- [ ] It doesn't cover the list's last rows or the toast (B-013), and works one-handed (in the thumb's reach).
- [ ] It opens the same quick-add form as now, on the picked day (I-025).
- [ ] An empty day or month tells how to add the first transaction.
- [ ] The desktop sidebar's Add transaction stays as it is (I-019), unless a variant needs it to change.
- [ ] Light and dark, 375 px to tablet.

## Tasks

- [x] References (see "Design"): Material 3's extended FAB, Monefy's − and + buttons, a centre FAB in a tab bar, two
      finance apps' user feedback on where Add sits.
- [x] 3 prototype stories in `frontend/src/prototypes/I-030-findable-add-button/` (*Prototypes / I-030 Findable add
      button*), the real Transactions page with the app's shell, one story per variant.
- [ ] The owner picks one; final prototype; approval (I-003) before any code.
- [ ] Build it in the shell (`PhoneBars.tsx`) and the totals slip; the empty states' text; DESIGN_RULES "Screen
      decisions".

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

Not in the prototypes: a line on the empty day ("Nothing on this day") telling how to add (acceptance criterion); it
comes with whichever variant is chosen, as the empty state belongs to the page.

Prototype stories: *Prototypes / I-030 Findable add button* (`frontend/src/prototypes/I-030-findable-add-button/`) ·
Chosen variant: — · Final prototype approved: — (screenshots in `prototypes/`)

## Tests

- Unit: the button opens the form (expense by default), on the picked day.
- E2E (Playwright, phone): from Transactions, Accounts and Reports the add button is in sight and opens the form.
- Screens checked in Playwright screenshots at 375 and 768 px (and 1440 px if the desktop changes), light and dark.

## Open points

- Did the person look for it on the Transactions page or elsewhere (Accounts, Reports)? It tells whether the button
  must be on every page or the page's own buttons are enough.
