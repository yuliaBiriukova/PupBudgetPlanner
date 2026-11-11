# 0029. Families: one per person, family links are invite links, the owner hands the family over

- Status: Accepted
- Date: 2026-11-11

## Context

F-023 lets people form a family to see each other's money (final prototype "Sections" and its six open points,
approved 2026-11-11). The first data model draft had a `FAMILY_INVITATION` table of its own and a `FamilyRole` on each
member. F-028 had meanwhile built invite links (`invitations`: a token's hash, a note, 7 days, used once, cancelled) and
the invite page, and the owner had decided that a family owner's link also lets someone new create an account while
sign-up is invite-only (2026-10-29). Left to the build: where the family's rules live, how one link serves both someone
new and someone who already has an account, and what happens to a family when an account is deleted.

## Decision

- **A `Family` aggregate in the Domain** (`families`, `family_members`): its name (40 characters), one owner
  (`OwnerId`) and its members with the day they joined. It holds every rule within a family: only the owner renames
  and removes, the owner can't remove themselves, an owner who leaves others behind names the next owner, the last one
  to leave empties it. **One family per person** is the database's: a unique index on `family_members.user_id`, so two
  joins at the same moment can't both win; the service turns its violation into "already in a family". No role
  column: the owner is `families.owner_id` (a foreign key that refuses deleting the owner's account until the family
  is handed over).
- **A family's link is an F-028 invitation with a `FamilyId`.** The same token, hash, note, 7 days, "used once" and
  cancelling; the admin's *Invite links* tab lists them with the family's name and can cancel them (open point 5).
  It is used in one conditional UPDATE, as F-028's: by sign-up (`AccountCreator`, Google too), which then adds the new
  account to the family in the same transaction; or by `POST /api/family/join` for someone signed in, which only
  accepts a family's link. A new `CreatedAccount` column tells the two uses apart: the People page's "Invited" and
  the unique index on `used_by_id` (one account per link) now count only links that created an account, since one
  person may later use family links too. The migration marks every link used until now as having created its account.
- **The invite page serves both.** `/invite/:token` is no longer guest-only: signed out it is F-028's sign-up with the
  family named (Continue with Google and Sign in come back to the link); signed in, a family's link asks to join (or
  says to leave the current family first) and the admin's link goes on into the app as before. Someone who creates
  their account on the page goes on to Family (a family's link) or Transactions.
- **Deleting a family or an account deletes nobody's money.** The last one to leave deletes the family after
  cancelling its waiting links (the links' `FamilyId` is set to null on delete, so a waiting one must not survive as a
  working admin link). The admin's Delete takes the deleted people out of their families first, in the same
  transaction: an owner's family goes to whoever has been in it longest, an emptied one is deleted.

## Consequences

- One table and one page for every invite link; the invite page's states grew (family named, join, already in a
  family, the same family) and its route checks who is signed in.
- The family rules have unit tests in the Domain; the EF glue (`FamilyService`, `FamilyCleanup`) is covered by the
  E2E tests until integration tests come (ADR 0005).
- F-024 (family views) reads who is in the person's family from `family_members`; F-027 (deleting your own account)
  can reuse the hand-over the admin's Delete does.
