# F-028 · Invite-only access

| | |
|---|---|
| Type | Feature |
| Milestone | M1 — Authentication & app shell |
| Priority | High |
| Status | In progress |
| Branch | `feature/F-028-invite-only-access` |
| Design | 3 HTML prototypes required |

## Goal

While Pup is for family and friends, only people the owner lets in can create an account. The owner sees who
has access and can take it away. Later the app can open to everyone by changing one setting. Added by the owner
on 2026-10-29.

Why now: F-011 and F-012 are on `main`, so anyone who finds the site can create an account today (email and
password, or the first "Continue with Google").

## Acceptance criteria

- [ ] **Invite-only by default.** Without an invitation nobody can create an account: not on the Create account
      form, not through the API (`POST /api/auth/register`), not with the first "Continue with Google". The page
      says Pup is invite-only for now and what to do (ask the person who told you about it for a link).
- [ ] **Existing accounts keep working.** People who already have an account sign in as before, with a password
      or Google (incl. linking Google to an account with the same email, ADR 0014).
- [ ] **The admin.** The owner is the admin; who the admin is comes from configuration, not from the UI.
      Only the admin sees the People page and its API.
- [ ] **Invite link.** The admin creates a link (with an optional note for whom it is), copies it and sends it in
      any messenger (no email until M8). A link works once and for 7 days; the admin can cancel it earlier.
- [ ] **Signing up with a link.** The link opens a "You're invited" page with Create account and Continue with
      Google. Either way the account is created and the invitation is used up in the same transaction as the
      account (two people can't use one link). A used, expired, cancelled or made-up link gets one neutral message.
- [ ] **People page.** The admin sees everyone with access (name, email, sign-in methods, joined, invited by
      which link) and the invitations (waiting, used by whom, expired, cancelled).
- [ ] **Taking access away.** The admin can block a person: they are signed out on every device and can't sign
      in, with a password or Google; their data stays. The admin can unblock them. The admin can't block
      themselves.
- [ ] **Deleting a person.** The admin can also delete a person's account with all their data, after a
      confirmation that can't be done by accident (type the person's email or a shown word). They are signed out
      everywhere; their email or Google account could sign up again only with a new invitation. The admin can't
      delete themselves.
- [ ] **Opening up later.** A setting (`Access:SignUp` = `InviteOnly` | `Open`) switches back to open sign-up
      without code changes; invitations keep working in both modes.

## Tasks

- [x] Agree the open points below with the owner (2026-10-29)
- [x] References (see "Design")
- [x] 3 HTML prototypes: the "You're invited" page, the invite-only message on Create account and after Google,
      the People page with an invitation created and copied (phone and desktop, light and dark)
- [ ] Domain: `Invitation` (hashed token, note, created by, expires, used by / at, cancelled at) and its rules
- [ ] Database: `invitations` table, migration; an admin role; a blocked flag (or a permanent lockout) on the
      account
- [ ] API: register and the Google flow accept an invitation token; `/api/admin/invitations` (create, list,
      cancel) and `/api/admin/people` (list, block, unblock, delete), admin only; `me` says whether the person is the
  admin
- [ ] Deleting an account removes all of its data in one transaction (today: categories by cascade; the same
      code is reused by F-027 "Delete my account")
- [ ] Google: the invitation token travels through the Google round trip in the authentication properties; an
      unknown Google account without one is not created and comes back with the invite-only message
- [ ] Frontend: `/invite/:token` page, the invite-only state of Create account, the People page and its nav item
      (admin only), i18n texts
- [ ] Storybook stories (loading, empty, error; link created; blocked person)
- [ ] ADR: invite-only sign-up (token format and storage, admin from configuration, blocking, the open switch)
- [ ] Render: the new environment variables; README

## Design

References (open pages only, no sign-in):

- [Root — invite members](https://support.rootapp.com/docs/leader/members-and-invites/invite-members): the link
  shown at the top with one Copy / Share action, a share sheet on the phone, and a list of links with who made
  each, when it expires and how often it was used. We take the copy-first slip and the link list.
- [Linear — invite members](https://linear.app/docs/invite-members): only admins invite by default, pending
  invitations sit on the members page, and people are *suspended* rather than removed. We take one People page
  for both lists and "block" as the gentle default.
- [Growth Dives — how Notion nails invites](https://growth-dives.kit.com/posts/how-notion-nails-invites): a
  simple decision with the consequence stated up front. We take this for the block and delete confirmations
  (say exactly what happens, in one sentence).
- [Notion activation wireframe](https://notion-wireframe.netlify.app/): a joining person who lands "cold" needs
  a welcome that says who invited them and what to do next. We take "Yulia invited you" as the first line of
  the invite page.
- Discord and Slack invite pages (public `discord.gg` / `join.slack.com` links): who invited you plus one clear
  action, and a plain message when a link has expired. We take the single neutral "this link doesn't work"
  state.

Brief:

- **Who and when:** the owner, on a desktop or phone, a few times a year: makes a link for a relative or friend
  and sends it in Telegram or Viber. The invitee opens it once, usually on the phone.
- **The one job:** for the owner, *make a link and copy it* (first thing on the People page); for the invitee,
  *see who invited them and create the account*.
- **The subject's world:** a guest list and a receipt or a pass: something handed to one person, valid once and
  until a date.
- **Feeling:** "private and in control": calm, no alarm, even when blocking someone.

Token plan: the F-010 / F-011 theme as built (charcoal and sky, Unbounded 300 for headings, Manrope 400/500),
radius 12 / 24 and pill buttons, one float shadow. New tokens: a danger button (light `#b3261e` with
`#fcfcfd` text, dark `#f2958c` with `#121315` text), and the sky tint `#e7ecf1` / `#262f37` for the new-link
slip. No green for statuses: green means income. Motion: only the new link appearing. All of it fits the
Mantine theme (`theme.ts` tokens plus `--pup-color-danger`).
Prototypes in `prototypes/` (2026-10-29). Each one has the same screens: the invite page, a link that doesn't
work, Create account without a link, Google without an account, the People page, a new link, the link
created, block and delete. A preview bar switches screen, phone / tablet / desktop and light / dark.

| Variant | Thesis |
|---------|--------|
| [1 · Guest list](prototypes/variant-1.html) | One quiet page with two ruled lists like the spreadsheet (people, invite links), table columns on the desktop. The new link appears as a sky slip at the top with Copy and Share. Invite page: a "Yulia invited you" line above the form. |
| [2 · Receipt](prototypes/variant-2.html) | An invitation drawn as a paper receipt with a torn edge: on the charcoal half of the invite page, as a row of receipts on the People page, "printed" out of a slot when created. A broken link shows the receipt with a "Not valid" stamp and no details. The risky one. |
| [3 · Pocket](prototypes/variant-3.html) | Phone-first: "Yulia invited you" big in the charcoal band, Continue with Google first. People page with a People / Invite links pill switch, big rows, one person in a sheet (phone) or a side panel (desktop) with Block and Delete as full buttons; Share link first for a new link. |

Common to all three: the link is shown only once (only its hash is stored); a broken link never says who made
it; block and delete ask first, delete needs the person's email typed in; People sits under a line in the
sidebar and under More on the phone. Design check (Playwright + axe, 360–1440 px, light and dark, every screen):
0 issues; screenshots at 375 and 1440 px looked at.

### Round 2: a mix (2026-10-29)

Owner's feedback on round 1: from variant 1, the sign-in and create-account screens and the people table; from
variant 2, the new invite link as a pop-up rather than an inline block; from variant 3, separate tabs for people
and invite links, and cards for people. Cards look better, but a table is easier to scan without a click per
person, so the mix lets you compare the two.

[Variant 4 · Mix](prototypes/variant-4.html): variant 1's sign-in screens, variant 2's dialog for a new link
(the link with Copy link and Share in the same dialog), variant 3's two tabs. The preview bar switches:

- **Tabs:** *Pill* (the Sign in / Create account switch), *Underline* (text tabs with the sidebar's accent bar),
  *Title* (the two tab names are the page heading).
- **People** (and invite links, which follow the same choice): *Card rows* (each person a light card in a list,
  with the table's columns inside: a card's looks, a table's scanning), *Table* (variant 1), *Cards* (a grid,
  everything on the card: how they sign in, joined, invited with, no click needed).

Design check 0 issues, every option at 360–1440 px in light and dark; screenshots looked at.

Chosen variant: — (waiting for the owner)

## Tests

- Unit: invitation rules (once, 7 days, cancelled); register and Google refuse without a valid invitation in
  invite-only mode and accept in open mode; two sign-ups racing for one link create one account; a blocked person
  can't sign in and their cookie stops working; only the admin reaches the admin endpoints; the admin can't block
  themselves.
- E2E (Playwright): the admin creates a link, a new person signs up with it, the same link fails the second time;
  Create account without a link shows the invite-only message; the admin blocks the person, who is signed out and
  can't sign in, then unblocks them; the admin deletes a person, who can't sign in and whose email can't sign up
  without a new link.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Decisions (owner, 2026-10-29)

1. **Priority and place:** `High`, in M1, done next before F-014 — before real money data goes in and while
   there are only a few accounts.
2. **What kind of link:** one link per person, works once, valid 7 days, can be cancelled. Not chosen: one
   shared link that works many times (easy to leak), a list of allowed emails (needs the exact email in advance).
3. **Who can invite:** only the admin in F-028. In F-023 a family owner's invitation into the family also lets a
   new person create an account (one invitation mechanism with an optional family).
4. **Taking access away:** both — block (data kept, can be undone) and delete (the account and all its data).
   The deletion code is shared with F-027.
5. **Who is the admin:** the owner, by the email of their production account (a Google account). It comes from the
   setting `Access:AdminEmails` (a list, so a second admin can be added later; on Render `Access__AdminEmails__0`).
   The email itself lives only in Render and local user-secrets, not in the repository. Signing in with that
   email makes the person the admin; creating an account with it needs no invitation, so the admin can't be
   locked out. Nothing in the UI makes someone an admin.

## Open points

1. **Accounts that already exist on production.** Proposal: they keep access; the admin looks through the People
   page after the release and blocks or deletes anyone unknown.

## Notes

- The token is long and random (32 bytes, URL-safe), only its hash is stored, like a password reset token; the
  invitation endpoints are rate-limited like sign-in.
- Messages don't tell whether an email has an account (ADR 0012). The invite-only message after Google is safe:
  it only appears for a Google account that has no account here.
- Related: F-023 (family invitations reuse the same links), F-027 (deleting your own account shares the
  deletion code), M8 (invitations by email).
