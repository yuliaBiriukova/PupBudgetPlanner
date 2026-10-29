# F-028 · Invite-only access

| | |
|---|---|
| Type | Feature |
| Milestone | M1 — Authentication & app shell |
| Priority | High |
| Status | Done |
| Branch | `feature/F-028-invite-only-access` |
| Design | 7 HTML prototypes over 4 rounds; chosen: variant 7 |

## Goal

While Pup is for family and friends, only people the owner lets in can create an account. The owner sees who
has access and can take it away. Later the app can open to everyone by changing one setting. Added by the owner
on 2026-10-29.

Why now: F-011 and F-012 are on `main`, so anyone who finds the site can create an account today (email and
password, or the first "Continue with Google").

## Acceptance criteria

- [x] **Invite-only by default.** Without an invitation nobody can create an account: not on the Create account
      form, not through the API (`POST /api/auth/register`), not with the first "Continue with Google". The page
      says Pup is invite-only for now and what to do (ask the person who told you about it for a link).
- [x] **Existing accounts keep working.** People who already have an account sign in as before, with a password
      or Google (incl. linking Google to an account with the same email, ADR 0014).
- [x] **The admin.** The owner is the admin; who the admin is comes from configuration, not from the UI.
      Only the admin sees the People page and its API.
- [x] **Invite link.** The admin creates a link in a dialog (with an optional note for whom it is), copies or
      shares it from the same dialog and sends it in any messenger (no email until M8). A link works once and for
      7 days; the admin can cancel a waiting link. The link is shown only when it is made (only its hash is
      stored); a lost link is cancelled and made again.
- [x] **Signing up with a link.** The link opens a "You're invited" page with Create account and Continue with
      Google. Either way the account is created and the invitation is used up in the same transaction as the
      account (two people can't use one link). A used, expired, cancelled or made-up link gets one neutral message.
- [x] **People page.** One admin page, People, with two tabs: **People** (everyone with access: name, email,
      joined, invited with which link, blocked; not how they sign in, see decision 7) and **Invite links** (waiting, used by whom,
      expired, cancelled). The tabs are in the URL, so a reload or the Back button keeps the open tab.
- [x] **Search people.** A search field on the People tab filters the list by name or email as you type (not
      case-sensitive, Cyrillic too), shows how many match, and says so when nobody matches, with a way to clear
      the search.
- [x] **Only waiting links by default.** The Invite links tab shows the waiting links; used links and expired or
      cancelled ones are hidden until the admin shows them (each kind on its own). The choice is remembered in the
      browser.
- [x] **Taking access away.** The admin can block a person: they are signed out on every device and can't sign
      in, with a password or Google; their data stays. The admin can unblock them. The admin can't block
      themselves.
- [x] **Deleting a person.** The admin can also delete a person's account with all their data, after a
      confirmation that can't be done by accident (type the person's email or a shown word). They are signed out
      everywhere; their email or Google account could sign up again only with a new invitation. The admin can't
      delete themselves.
- [x] **Opening up later.** A setting (`Access:SignUp` = `InviteOnly` | `Open`) switches back to open sign-up
      without code changes; invitations keep working in both modes.

## Screens and behavior

What is decided so far (rounds 1–3 of the design, see "Design"):

- **Invite page** `/invite/:token` (variant 1): the sign-in layout (F-011) with "Yulia invited you to Pup Budget"
  and the date the link works until above the form, the Create account form (name, email, password, confirm),
  "or", Continue with Google, and "Already have an account? Sign in". The inviter's display name comes from the
  invitation.
- **A link that doesn't work** (used, expired, cancelled or made up): "This invite link doesn't work any more",
  ask the person who sent it for a new one, and Sign in. It never says who made the link or when.
- **Create account without a link:** the Create account tab shows "Pup Budget is invite-only for now", how to get
  a link, and Go to sign in.
- **Google without an account:** back on Sign in with a banner: no account for this Google account, new accounts
  need an invite link.
- **People page** (admin only): under a line at the bottom of the sidebar's sections; under More on the phone.
  Title "People" with **New invite link** on the right (full width on the phone), then **underline tabs**
  (text tabs with the accent bar, like the sidebar marker) with counts: People · Invite links (waiting).
  - **People tab:** a short line on who can sign up, the search field, then the people as card rows: initials,
    name and email, joined, invited with which link ("Before invites" for accounts made while sign-up was open,
    "Admin" for the admin). Blocked people stay in the list with a Blocked tag and the date.
  - **Sorting:** on the desktop the column headers (Person, Joined, Invited with) sort the list; a second click
    turns the order around, and an arrow shows the current one. Names and links start A to Z, Joined starts with
    the newest. The phone has a "Sort: …" menu above the list with the same six orders. The list starts by name.
  - **One person:** a ⋯ button on the row opens a menu: Block or Unblock, and Delete account (no "…" at the end,
    though they open a dialog).
  - **Several people:** a check box on each row (and "Pick all shown" in the header) picks people. The check box
    has its own column left of the initials. With a mouse it shows on hover (and on keyboard focus), and on
    every row once anyone is picked; the column stays, so nothing moves. The phone has no hover, so there the
    check boxes are always shown. The box sits 16 px from the card's edge, like the ⋯ on the right. A bar then
    shows how many are picked with Block, Unblock (when a picked person is blocked) and Delete, and a button to
    clear the picks. Searching keeps only the picks that are still shown. The admin's own row has no check box
    and no menu.
  - **Invite links tab:** a line on how links work, then **Waiting** links as card rows (note, until when, when
    made, the days left and a visible Cancel link), then **Used** (note, who used it, when) and **Expired and
    cancelled** (note, which, when) as folded groups, closed by default; each opens with a click and stays as
    left (remembered in the browser).
- **New invite link dialog** (a sheet on the phone): "Who is it for? (optional, only you see it)", Create link;
  then the same dialog shows the link with Copy link and Share (the phone's share sheet), until when it works,
  and that it can't be shown again; Done opens the Invite links tab.
- **Block** asks first and says what happens (signed out everywhere, data stays, can be unblocked). **Delete**
  asks first, lists what is deleted and needs the person's email typed in before the button works. In bulk the
  dialogs list the picked people; bulk delete needs the word "delete" typed in.

## Tasks

- [x] Agree the open points below with the owner (2026-10-29)
- [x] References (see "Design")
- [x] 3 HTML prototypes: the "You're invited" page, the invite-only message on Create account and after Google,
      the People page with an invitation created and copied (phone and desktop, light and dark)
- [x] Domain: `Invitation` (hashed token, note, created by, expires, used by / at, cancelled at) and its rules
- [x] Database: `invitations` table, migration; an admin role; a blocked flag (or a permanent lockout) on the
      account
- [x] API: register and the Google flow accept an invitation token; `/api/admin/invitations` (create, list,
      cancel) and `/api/admin/people` (list, block, unblock, delete), admin only; `me` says whether the person is the
  admin
- [x] Deleting an account removes all of its data in one transaction (today: categories by cascade; the same
      code is reused by F-027 "Delete my account")
- [x] Google: the invitation token travels through the Google round trip in the authentication properties; an
      unknown Google account without one is not created and comes back with the invite-only message
- [x] Frontend: `/invite/:token` page, the invite-only state of Create account, the People page with its tabs
      (`/people`, `/people/links`), search, showing and hiding used and old links, its nav item (admin only), i18n texts
- [x] Storybook stories (loading, empty, error; link created; blocked person)
- [x] ADR: invite-only sign-up (token format and storage, admin from configuration, blocking, the open switch)
- [x] Render: the new environment variables; README

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

### Round 1: three directions (2026-10-29)

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

### Round 3: views, search and hiding old links (2026-10-29)

Owner's feedback on round 2: underline tabs; no grid of person cards; search for people, as there will be many;
a way to hide expired links; the description should hold the feature's specifics (now in "Screens and
behavior").

[Variant 5 · Round 3](prototypes/variant-5.html), with nine people and eight links so search and the lists can be
judged. The preview bar switches:

- **People:** *Card rows* (each person a light card with the table's columns), *Table* (variant 1's ruled
  table), *Compact* (one line per person, 48 px, light stripes like a spreadsheet: the most people per screen;
  on the phone two lines).
- **Links:** *Grouped* (waiting links as cards with the days left and ⋯ Cancel link, then Used and Expired and
  cancelled as plain lists), *Card rows* and *Table* (one list, like people).

Search: a "Search people" label with the count ("9 people", "2 of 9"), the field with a clear button, the match
highlighted, and "No one matches “…”" with Clear search. The "Hide expired and cancelled" switch sits next to the
line about links; when it hides links, a line says how many are hidden.

Design check 0 issues, every option at 360–1440 px in light and dark; screenshots looked at.

### Round 4: corners, privacy, no ⋯ menus (2026-10-29)

Owner's feedback on round 3: card rows for people and grouped links; corners alike across the whole app (the
"New invite link" pill is the model, "Add transaction" must match it); seeing how someone signs in is more than
the admin needs; used links can be hidden too; the ⋯ menu on every row is not liked.

[Variant 6 · Round 4](prototypes/variant-6.html): card rows and grouped links, the corner system of decision 8, no
sign-in method, a visible "Cancel link" on waiting links. The preview bar switches:

- **Actions** (how a person's Block / Unblock and Delete are reached): *Open the row* (a click on the row opens it
  with labelled Block and Delete account buttons and one line on what each does), *Buttons* (Block and Delete
  always on the row: quiet text buttons on the desktop, icon circles on the phone), *Select* (a check box per
  row; a bar with Block and Delete for everyone picked).
- **Old links** (used, expired and cancelled, hidden by default): *Folded groups* (Used and Expired and cancelled
  open with a click), *Filter chips* (Waiting · Used · Expired and cancelled; each chip shows its kind).

Design check 0 issues, every option at 360–1440 px in light and dark; screenshots looked at, phone lists scrolled
too.

### Chosen (2026-10-29)

Owner's choice after round 4: card rows with **Select** for bulk Block / Delete plus the **⋯ menu** on each row
for one person; **Folded groups** for used and old links; underline tabs; variant 1's sign-in screens; variant
2's dialog for a new link; the corner system of decision 8. The final prototype is
[variant 7 · Chosen](prototypes/variant-7.html).

## Tests

- Unit: invitation rules (once, 7 days, cancelled); register and Google refuse without a valid invitation in
  invite-only mode and accept in open mode; two sign-ups racing for one link create one account; a blocked person
  can't sign in and their cookie stops working; only the admin reaches the admin endpoints; the admin can't block
  themselves.
- Frontend unit: search filters by name and email (case, Cyrillic) and shows the empty state; used and expired
  links are hidden by default, can be shown one kind at a time, and the choice is remembered; the Delete button works only with the typed email.
- E2E (Playwright): the admin creates a link, a new person signs up with it, the same link fails the second time;
  Create account without a link shows the invite-only message; the admin blocks the person, who is signed out and
  can't sign in, then unblocks them; the admin deletes a person, who can't sign in and whose email can't sign up
  without a new link.
- Screens checked in Playwright screenshots (phone / desktop, light / dark): the invite page, a link that doesn't
  work, Create account without a link, sign in after Google without an account and when blocked, People (list, two
  picked, the row menu, no match, delete), Invite links (folded and open), New invite link and the link created.
  Fixed on the way: the link card's buttons were 36 px, the disabled Delete button was unreadable in dark mode,
  long notes wrapped, an open empty group said nothing, a blocked person's phone line read "Joined Blocked …".

Results: backend 161 tests (65 new); frontend unit 60 (17 new); E2E 35 passed, 2 skipped (5 new or changed:
signing up with a link, a link used twice, Create account without a link, the admin invites → blocks → unblocks,
no People page for others); Storybook stories for the People page (loading, error, no match, picked, menu,
delete, links, none waiting, all open, new link) and the invite screens.

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
6. **Design (rounds 1–3):** variant 1's sign-in screens, variant 2's dialog for a new link, variant 3's two tabs
   as underline tabs; search for people (there will be many); a switch to hide expired links. No grid of person
   cards.
7. **Privacy (round 4):** the admin doesn't see how a person signs in (password or Google): it isn't needed to
   manage access, so the People page and the admin API leave it out. Used links are hidden by default as well:
   who joined with which link is already on the People tab ("Invited with").
8. **Corners (round 4):** one radius system for the whole app (I-002): buttons with text, tabs, chips and nav
   items are pills; icon-only buttons are circles; fields, rows, cards in lists, menus and banners 12 px;
   dialogs, sheets and big panels 24 px; an element inside a padded box gets the box radius minus the padding.
   "Add transaction" in the sidebar becomes a pill like "New invite link".

## Open points

1. **Accounts that already exist on production** (Q-012). Confirmed by the owner (2026-10-29): they keep access
   and show "Before invites"; after the release the admin looks through the People page and blocks or deletes
   anyone unknown.

## Notes

- After the release: set `Access__AdminEmails__0` on Render to the owner's email (the dashboard), otherwise nobody
  is the admin and nobody can be invited.
- One run of the frontend unit tests failed once and passed the next 8 times; which test it was isn't known. Watch
  for it in CI.

- The token is long and random (32 bytes, URL-safe), only its hash is stored, like a password reset token; the
  invitation endpoints are rate-limited like sign-in.
- Messages don't tell whether an email has an account (ADR 0012). The invite-only message after Google is safe:
  it only appears for a Google account that has no account here.
- Related: F-023 (family invitations reuse the same links), F-027 (deleting your own account shares the
  deletion code), M8 (invitations by email).
