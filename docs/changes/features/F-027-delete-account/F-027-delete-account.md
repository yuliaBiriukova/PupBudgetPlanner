# F-027 · Delete my account

| | |
|---|---|
| Type | Feature |
| Milestone | M9 — Privacy & categories (after the MVP) |
| Priority | Low |
| Status | Todo |
| Branch | `feature/F-027-delete-account` |
| Design | 3 HTML prototypes required |

## Goal

A person can delete their account and everything in it themselves, without asking us. Added by the owner on
2026-10-28, for after the MVP.

## Acceptance criteria

- [ ] Settings (F-016) has "Delete account", apart from the other settings, with what will be deleted.
- [ ] Deleting asks for a confirmation that can't be done by accident (see "Open points").
- [ ] Afterwards the person's accounts, transactions, categories, settings and sign-in methods (password,
      Google) are gone, and they are signed out on every device.
- [ ] They can't sign in to the deleted account any more; the same email or Google account can create a new,
      empty one.
- [ ] In a family: they leave it, and their data no longer shows in the family views.

## Tasks

- [ ] Answer the open points with the owner
- [ ] 3 HTML prototypes (the setting and the confirmation)
- [ ] API endpoint: delete the account and its data in one transaction
- [ ] UI in settings, with i18n texts
- [ ] Storybook stories (confirmation, in progress, error)

## Design

References (Mobbin, other apps, the internet): — (when the work starts)
Prototypes: `prototypes/` (not created yet). Chosen variant: —

## Tests

- Unit: deletion removes every piece of the person's data and nobody else's; the confirmation rules.
- E2E (Playwright): create an account with data, delete it, can't sign in, the email can sign up again.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Open points

To agree before the work starts (also [Q-010](../../../OPEN_QUESTIONS.md)):

1. **Right away or after a grace period?** Proposal: right away, after the confirmation. A period like 30 days
   with "undo" would need email (M8) to tell the person.
2. **How to confirm?** Proposal: with a password, enter it again; with only Google, sign in with Google once
   more. In both cases also type the word shown on the screen.
3. **The owner of a family with other members.** Proposal: they hand the family over to another member, or
   remove the others first. F-023 has no hand-over yet.
4. **Data export first?** Proposal: offer it once the Excel export (M11) exists.

## Notes

- Neon keeps a short history of the database for restores, so deleted data stays there until that window
  passes. The privacy policy, when we write one, should say so.
- Depends on F-016 (settings) and F-023 (family).
