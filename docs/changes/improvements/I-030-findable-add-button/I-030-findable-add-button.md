# I-030 · An Add button people find on the phone

| | |
|---|---|
| Type | Improvement |
| Milestone | M6 — MVP release (polish) |
| Priority | High (proposed: people testing the app couldn't find how to add an expense or income on the phone, the app's main action) |
| Status | Todo |
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
- [ ] It doesn't cover the list's last rows or the toast (B-012), and works one-handed (in the thumb's reach).
- [ ] It opens the same quick-add form as now, on the picked day (I-025).
- [ ] An empty day or month tells how to add the first transaction.
- [ ] The desktop sidebar's Add transaction stays as it is (I-019), unless a variant needs it to change.
- [ ] Light and dark, 375 px to tablet.

## Tasks

- [ ] References: Mobbin "floating action button", "add transaction", "tab bar" (money apps: Monefy, Spendee, 1Money,
      Wallet, YNAB, Monobank), Material 3 extended FAB and navigation bar guidance, iOS tab bars with a centre action.
- [ ] 3 prototype stories in `frontend/src/prototypes/I-030-findable-add-button/` (*Prototypes / I-030 Findable add
      button*), the real Transactions page with the app's shell, one story per variant.
- [ ] The owner picks one; final prototype; approval (I-003) before any code.
- [ ] Build it in the shell (`PhoneBars.tsx`) and the totals slip; the empty states' text; DESIGN_RULES "Screen
      decisions".

## Design

Ideas for the 3 variants, to be shaped by the references:

1. **A labelled button:** the round + grows into a pill "**+ Add**" (Material's extended FAB), floating above the bottom
   bar on the right, shrinking back to + while the list scrolls down.
2. **The + in the middle of the bar:** a raised centre tab between the tabs, with a word under it ("Add"), as many money
   apps have it; the bar's tabs split two and two around it.
3. **Add on the page:** "+ Expense" and "+ Income" buttons right under the totals slip (and on the empty day), with the
   bar's + kept; the two most used actions one tap away and named.

Prototype stories: — · Chosen variant: — · Final prototype approved: — (screenshots in `prototypes/`)

## Tests

- Unit: the button opens the form (expense by default), on the picked day.
- E2E (Playwright, phone): from Transactions, Accounts and Reports the add button is in sight and opens the form.
- Screens checked in Playwright screenshots at 375 and 768 px (and 1440 px if the desktop changes), light and dark.

## Open points

- Did the person look for it on the Transactions page or elsewhere (Accounts, Reports)? It tells whether the button
  must be on every page or the page's own buttons are enough.
