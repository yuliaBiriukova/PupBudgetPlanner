# F-030 · Privacy in the family

| | |
|---|---|
| Type | Feature |
| Milestone | M5 — Categories & family (before the MVP launch; owner, 2026-11-12) |
| Priority | Medium |
| Status | Todo |
| Branch | `feature/F-030-family-privacy` |
| Design | 3 prototype stories required |
| Approved | — |

## Goal

Each person decides what the other members of their family can see of their money, so joining a family doesn't
mean showing everything. Added by the owner on 2026-11-12, while F-024 (family views) was in its design round.

Today (F-023, F-024) a family member sees everything of the others: accounts and balances, every transaction with
its note, the reports. PRODUCT listed "Private accounts / transactions hidden from the family" after the MVP; the
owner moved it before the launch (2026-11-12), so nobody shares more than they want once the family uses the app.

## Acceptance criteria

Draft, to be settled with the open points below:

- [ ] A person can set what the family sees of their money, in one place (Settings or the Family page).
- [ ] A person can keep a single account private: the others don't see it, its balance or its transactions.
- [ ] Optionally less than "everything" for what stays shared (see open point 2): e.g. totals only, without the
      transactions' notes.
- [ ] The other members' views (F-024's lens: someone's money, Family) leave out what is private, everywhere:
      Transactions, Accounts, Reports, the filters, the calendar, "Where it went", "In total".
- [ ] The person themselves sees all their own data as now, with a mark on what is private.
- [ ] A change takes effect at once for everyone; nothing is deleted or moved by it.
- [ ] The rules are enforced by the API (the data never reaches someone who may not see it), not only hidden in the
      UI.

## Tasks

- [ ] Answer the open points with the owner (scope, defaults, what Family totals do with private money)
- [ ] References, 3 prototype stories (design round), final prototype, the owner's approval
- [ ] Domain: who may see what (visibility rules next to the `Family` aggregate), ADR
- [ ] API: the visibility settings; F-024's scoped queries filtered by them
- [ ] UI: the settings, the private mark on your own accounts and lines, the other members' views without them
- [ ] Storybook stories, i18n texts

## Design

References (Mobbin, other apps, the internet): — (when the work starts). Starting points: Honeydue (per account: the
partner sees balance and transactions, only the balance, or nothing), Monarch (households see everything; no
private accounts), YNAB Together, Spendee shared wallets.
Prototype stories: *Prototypes / F-030 Family privacy* (not created yet). Chosen variant: —

## Tests

- Unit: the visibility rules (Domain); each scoped query leaves out what is private.
- E2E (Playwright): a member makes an account private; the other member no longer sees it, its transactions or its
  share of the family's numbers (as decided in open point 4); the owner of the data still sees everything.
- Screens checked in Playwright screenshots (phone / desktop, light / dark).

## Notes

### Open points (for the owner, before the design round)

1. **What can be private:** whole accounts (the simplest and what Honeydue does); single transactions; categories
   (e.g. Gifts, so presents stay a surprise); or a mix. Proposal: accounts first, and single transactions as a
   checkbox in the quick-add form only if the owner wants them.
2. **How private:** per account three levels like Honeydue: *everything* (as now), *balance only* (the account and
   its balance, no transactions), *hidden*. Or only shared / hidden. Proposal: the three levels.
3. **The default:** new accounts shared (as now, so nothing changes for people who don't care) or private until
   shared. Proposal: shared, with the setting in the account form.
4. **Family totals:** does private money still count in the family's numbers (Family's "In total", the family
   report's rows and balance) without its details, or is it left out completely? Counting it keeps the family's
   totals true; leaving it out hides even that it exists. Proposal: left out completely (private means not there for
   the others), said in the family views ("Some money is private").
5. **Per member or for the whole family:** the same privacy for every member, or different for each (show my
   parents less than my partner). Proposal: the same for the whole family while families are a couple.
6. **Notes:** hide the transactions' notes while sharing the amounts ("Pizza with …")? Proposal: part of the levels
   in point 2 only if the owner wants it.
7. **Where it is set:** the account form (per account), Settings or the Family page (the overview). Proposal: per
   account in its form, and a summary on the Family page ("What the family sees of your money").
8. **Milestone:** answered 2026-11-12: before the MVP launch, in M5 after F-024 (owner).

### Related

- [F-023 Family and invitations](../F-023-family-and-invitations/F-023-family-and-invitations.md): what joining
  means is said before joining ("you see each other's money"); that text changes with this feature.
- [F-024 Family views](../F-024-family-views/F-024-family-views.md): the lens and the other members' views this
  feature filters; F-024's open point 1 shows everything until then.
