# F-027 · Delete my account

| | |
|---|---|
| Type | Feature |
| Milestone | M9 — Privacy & categories (after the MVP) |
| Priority | Low |
| Status | In progress (planning and design round) |
| Branch | `feature/F-027-delete-account` |
| Design | 3 prototype stories required: the setting on Settings and the confirmation (I-021) |
| Approved | — (not yet: the final prototype first) |

## Goal

A person can delete their account and everything in it themselves, without asking us. Added by the owner on
2026-10-28, for after the MVP.

## Acceptance criteria

- [ ] Settings (F-016) has "Delete account", apart from the other settings, with what will be deleted.
- [ ] Deleting asks for a confirmation that can't be done by accident: the password again (or Google once more for
      someone with only Google) and a typed word (see "Agreed").
- [ ] The account is deleted right away after the confirmation; there is no grace period or undo.
- [ ] Afterwards the person's accounts, transactions, categories, settings and sign-in methods (password,
      Google) are gone, and they are signed out on every device.
- [ ] They can't sign in to the deleted account any more. The email or Google account is free again, but like
      anyone new it needs an invite link to create a new, empty account (F-028); the confirmation says so.
- [ ] In a family: they leave it, and their data no longer shows in the family views. The family's owner with
      other members picks who looks after the family next, as "Leave family" does (F-023).

## Tasks

- [x] Answer the open points with the owner (2026-11-14)
- [ ] References and 3 prototype stories (the setting and the confirmation); the owner picks; final prototype
- [ ] The owner approves the final prototype and this description
- [ ] API endpoint: confirm (password, or a fresh Google sign-in), then delete the account and its data in one
      transaction, reusing F-028's deletion and F-023's hand-over
- [ ] UI in settings, with i18n texts
- [ ] Storybook stories (confirmation, in progress, error)

## Design

### References

Mobbin was not used (its screens need a sign-in). Open examples on the internet:

- [Primer, "Delete" pattern](https://primer.style/product/scenario-patterns/delete) — friction matched to the damage:
  a typed confirmation only for the biggest deletions; the button names the action, not "Confirm" or "OK".
- [Smashing Magazine, "How to manage dangerous actions in user interfaces"](https://www.smashingmagazine.com/2024/09/how-manage-dangerous-actions-user-interfaces)
  — say exactly what goes before asking; a danger section kept apart at the end of the settings.
- [SaaS UI, destructive actions](https://www.saasui.design/blog/saas-destructive-actions-confirmation-ux-patterns)
  — high-impact deletions in their own block of the settings, never a generic "Are you sure?".
- [User-friendly ways to handle account deletion](https://medium.com/userflow/user-friendly-ways-to-handle-account-deletion-3290133169c9)
  and [Discord's help on deleting an account](https://support.discord.com/hc/articles/212500837) — the password asked
  again before the last button; some services also ask for a typed word (both, as agreed in point 2).

Taken: the section apart at the end of Settings; the counts of what goes before anything is asked; the button
"Delete for good" instead of "Confirm"; the password (or Google) and the typed word together. Not taken: a grace
period (point 1), guilt copy or a survey on why they leave.

### Brief

- **Who and when:** someone in the family (or a guest) who wants out of Pup, once; most likely on the phone in
  Settings. Rare and serious, unlike the quick daily entry.
- **The one job:** delete everything, knowing exactly what goes, without a chance of doing it by accident. First
  seen: what will be deleted, in figures.
- **The subject's world:** the household book and its last page; the money is in the banks, Pup only keeps the
  record of it ("The money itself stays in your banks: only Pup's record of it goes").
- **The feeling:** calm and clear. Serious, not scary; no dark patterns, no "Are you sure you want to leave us?".

### Plan

- **Reused:** the Settings page and its section layout (F-016); `ResponsiveDialog` / `BottomSheet`; the buttons
  `danger-quiet` (the red word that starts it), `danger` (the red pill that confirms) and `quiet` ("Keep my
  account"); the sign-in forms' `PasswordField` / `TextField` with their errors; the family's pills to pick the next
  owner (as "Leave family", F-023); the "Continue with Google" button's look; the sign-in frame for the screen after.
- **New:** only the "Delete account" section at the end of Settings, a short ledger of what goes (labels left,
  figures right in tabular numerals, thin rules), and the confirmation's parts. No new tokens.
- **Motion:** none besides the pop-up's own; the red button shows its loader while deleting.
- **The bold element:** the ledger of what goes, in figures (variant 3: the money itself).
- **Slop check:** dropped a red-bordered "danger zone" box (a reflexive card) for the app's own section with a rule;
  no warning icon in a tinted circle; copy says what happens ("Delete for good", "Keep my account"), never "Submit".

### Prototypes (round 1, 2026-11-14)

Storybook `Prototypes/F-027 Delete my account`, one story per variant, built on the real Settings page in the app's
shell. Controls: **who** (password / Google / admin) and **family** (owner with others / member / none). In the
prototype the password is `pup-budget`; Google "comes back" confirmed after a moment; after deleting, the signed-out
screen has "Back to the prototype".

1. **One dialog** — [open](http://localhost:6006/?path=/story/prototypes-f-027-delete-my-account--variant-1-dialog&nav=false&panel=false&globals=viewport.value:!undefined):
   a red word button "Delete account" in the section; everything is asked in one pop-up (a sheet on the phone): what
   goes, the family, the password or Google, the word, "Keep my account" / "Delete for good". The usual pattern,
   short on the page; the pop-up scrolls on a small phone.
2. **In place** — [open](http://localhost:6006/?path=/story/prototypes-f-027-delete-my-account--variant-2-in-place&nav=false&panel=false&globals=viewport.value:!undefined):
   nothing pops up. What goes is on Settings from the start; "Delete account" unfolds numbered steps in the section
   with the red button at their end. Nothing hidden, but Settings carries the ledger for everyone, every time.
3. **The last page** — [open](http://localhost:6006/?path=/story/prototypes-f-027-delete-my-account--variant-3-last-page&nav=false&panel=false&globals=viewport.value:!undefined):
   a row on Settings opens a page of its own, "Delete your account", with Back to Settings: the money by currency and
   the counts on top (the household book's last page), then "Confirm" with the family, the proof and the word, and
   "Delete my account for good". The most room and the clearest stakes; one more page to build.

In every variant: the admin sees a line instead of the button (point 6); after deleting, the sign-in frame says
"Your account is deleted", that they are signed out on every device, and that coming back needs a new invite link.

Chosen variant: **variant 1 "One dialog"**, with what goes as grey text instead of the table (owner, 2026-11-14).
Variants 2 and 3 are deleted; variant 1 stays next to the final prototype for comparison.

### Final prototype (2026-11-14)

[Open](http://localhost:6006/?path=/story/prototypes-f-027-delete-my-account--final&nav=false&panel=false&globals=viewport.value:!undefined)
(`Prototypes/F-027 Delete my account` → *Final prototype*; the same controls as round 1).

- **On Settings:** a last section "Delete account", a wider gap above its rule: "Deletes your accounts, transactions
  and categories for good." and a red word button "Delete account" with a bin. The admin sees, instead of the button,
  "You look after Pup Budget, so your account can't be deleted here: without you nobody could be invited."
- **The pop-up** (a dialog on the desktop, a sheet on the phone), "Delete your account?":
  - "This deletes everything you keep in Pup:" and under it, in grey text, what goes: "9 accounts, 1 284
    transactions and 46 categories, your settings and the ways you sign in. The money itself stays in your banks:
    only Pup's record of it goes." The counts are the person's own.
  - The family: a member reads "You leave the … family" and that the others won't see their money any more; the
    owner with others picks who looks after the family next from pills (the "Leave family" pills); in no family,
    nothing.
  - "Confirm it's you": the password field, or for someone with only Google "Confirm with Google", which goes to
    Google and back and then reads "Confirmed with Google as …".
  - "Type DELETE to confirm": any letter case counts.
  - "It can't be undone. To use Pup Budget again later, you'd need a new invite link."
  - Buttons "Keep my account" (grey word) and "Delete for good" (red pill, with a loader while deleting). A missing
    or wrong answer shows its message under its part with the error icon (sign-in forms' style).
- **After:** the sign-in frame, "Your account is deleted", "Everything in it is gone, and you're signed out on every
  device.", and in grey that coming back needs a new invite link. In the app a link to Sign in replaces the
  prototype's "Back to the prototype".

## Tests

- Unit: deletion removes every piece of the person's data and nobody else's; the confirmation rules (wrong
  password, wrong word, no fresh Google sign-in); the family owner's hand-over.
- E2E (Playwright): create an account with data, delete it, can't sign in, the email needs an invite to sign up
  again; a family owner hands the family over while deleting.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Agreed

The open points, answered by the owner on 2026-11-14 (also [Q-010](../../../OPEN_QUESTIONS.md)):

1. **Right away, no grace period.** The account is deleted as soon as it is confirmed. A period with "undo" would
   need email (M8) to remind the person.
2. **Confirm with the password or Google, plus a typed word.** With a password: type it again. With only Google:
   sign in with Google once more (the app sends them to Google and back to Settings; the server remembers the fresh
   sign-in for a few minutes). In both cases also type the word shown on the screen.
3. **A family's owner with other members picks the next owner** before deleting, with the same choice "Leave
   family" already has (F-023). A member just leaves; the last one in the family empties it.
4. **Sign-up again needs a new invite.** Nothing about the deleted person is kept, so their email is like anyone
   new's: invite-only (F-028).

Proposals of Claude's, taken unless the owner says otherwise:

5. **Data export first:** not now; offered once the Excel export (M11) exists.
6. **The admin can't delete their own account** from Settings (the People page already refuses them, F-028):
   the admin is set by email on the server, and an app with no admin can't invite anyone. Settings shows a line
   saying why instead of the button.

## Notes

- Neon keeps a short history of the database for restores, so deleted data stays there until that window
  passes. The privacy policy, when we write one, should say so.
- Depends on F-016 (settings) and F-023 (family).
- F-028 lets the admin delete a person's account (`PeopleService.DeleteAsync`, with
  `FamilyCleanup.LoseAsync` handing an owner's family to its longest member); here the person picks the next owner
  instead, and the rest of the deletion is reused.
