# F-023 · Family and invitations

| | |
|---|---|
| Type | Feature |
| Milestone | M5 — Categories & family |
| Status | Done |
| Branch | `feature/F-023-family-and-invitations` |
| Design | 3 prototype stories required |
| Approved | 2026-11-11 (the description, the final prototype and the six open points' proposals; owner: "approved f-023, build it") |

## Goal

Form a family to see each other's finances.

## Acceptance criteria

- [x] Create a family with a name
- [x] Invite with a link (valid 7 days) that can be sent in any messenger
- [x] Accept an invitation (only if not already in a family)
- [x] Leave a family; the owner can remove members

## Tasks

- [x] 3 prototype stories (design round), final prototype, the owner's approval
- [x] Domain + API (`Family` aggregate, family links on F-028's invitations, `/api/family`; ADR 0029)
- [x] UI (the Family page, the join page, the family on the admin's Invite links)
- [x] Storybook stories (owner, member, no family, loading, error, the three join pages)
- [x] Unit and E2E tests
- [x] DESIGN_RULES "Screen decisions" row; ARCHITECTURE's data model

## Design

Prototype stories: *Prototypes / F-023 Family and invitations* in Storybook
(`frontend/src/prototypes/F-023-family-and-invitations/`), removed when the page was built: the real stories are
*Family / Family page*. The story links below no longer open.
Chosen variant: variant 1, "Sections" (2026-11-11) · Final prototype approved: 2026-11-11 (screenshots in `prototypes/`;
the built page's in `screenshots/`)

### References (2026-11-11)

Mobbin needs a sign-in, so only open help pages were used.

- [Spotify: invite or remove Family plan members](https://support.spotify.com/uk/article/invite-remove-family-member/):
  the manager copies an invitation link and sends it in any app; the invitee signs in or creates an account, then
  confirms; someone who already manages a plan can't join another. Taken: a link sent in any messenger that also works
  for someone new (all variants); "you're already in one" said before joining (the join page).
- [Google: manage your family](https://support.google.com/families/answer/6286986) and
  [join or leave a family](https://support.google.com/googleplay/answer/6317858): only the manager invites and removes
  people; a member leaves from the family's page; a manager can't leave, only delete the group. Taken: the owner
  invites and removes; a member leaves themselves. Not taken: the owner stuck in the family (see open point 2).
- [Apple: leave or remove a member from Family Sharing](https://support.apple.com/102652): the organiser removes
  members from each member's row; to hand the family over they must disband it and someone else starts a new one.
  Taken: Remove in a member's own menu. Not taken: disbanding to change the owner.
- [Monarch: couples and households](https://help.monarch.com/hc/en-us/articles/20926382202004-Monarch-for-Couples):
  a household member sees all accounts and transactions, nothing can be hidden, and the owner or the member
  themselves can remove a member. Taken: say plainly before anyone joins what the others will see (all variants).
- [YNAB Together](https://support.ynab.com/en_us/ynab-together-B1nS78Cki.md): a group manager invites up to five
  people, new or existing users, from Settings. Taken: the family as a section of the app, invites from its page.

### Brief

- **Who and when:** the Kyiv couple, once: one starts the family and sends the other a link in Telegram; later
  maybe a parent. Then almost never: the page is opened to see who is in it, cancel a link or leave. Mostly on the
  phone; the person invited opens the link on their phone too.
- **The one job:** get the other person in with one link, and make it plain what joining means (you see each
  other's money; each changes only their own; leaving deletes nothing).
- **The subject's world:** the spreadsheet they kept with one sheet per person; a household with one ledger; a
  ticket you hand someone.
- **The feeling:** "we're in this together", and safe: nothing happens to my money by joining or leaving.

### Plan from the design system

- **Reused:** the app shell and the Family menu item (already there, a placeholder page); Settings' sections
  (variant 1); F-028's invite page frame (the charcoal half, the "invited" line, the sign-up form) for opening a link;
  the People page's rows, initials, tags, waiting-link row and the new link's card with Copy / Share; Accounts'
  ghost card (variant 2); the Transactions page's dark slip with its torn edge and its paper receipts with dotted
  leaders (variant 3); `ResponsiveDialog` (a sheet on the phone), the theme's buttons (primary, `quiet`, `danger`,
  `danger-quiet`), fields, pick pills, ⋯ menus with Delete in the app's red, toasts.
- **New:** a member card (variant 2); a ticket with a notched stub counting the days left (variant 3); the join page
  (who invites you to which family, its members, what joining means, Join family / Not now). No new token.
- **Motion:** none beyond the sheets' own.
- **The bold element:** variant 1 none (it is Settings); variant 2 the seats with an empty one that invites;
  variant 3 the ticket.
- **Slop check:** no icon in a tinted circle per row beyond the initials the People page already has; no cards in
  variant 1 and 3 (rows, a receipt); no "Submit": the buttons say what happens (Start a family, Create link, Join
  family, Leave family, Remove); the joining text says what is shared, not a clever line.

### Round 1 (2026-11-11)

Each story is the app opened on Family (the other pages work too), as Olena; every change is kept in the story only.
The **start** is chosen in the link (`&args=start:…`) or in Storybook's Controls: *Family owner* (the default: she
started Kovalenko with Andriy and Iryna, a link for Mom is waiting), *No family yet*, *Family member*, and three ways
of opening Andriy's link: *Opens an invite link* (signed in, no family), *Opens a link while in a family*,
*Opens a link as someone new*. Inside the page: start a family, rename it, create a link (Copy / Share), cancel a
waiting link, remove a member, leave (an owner names who looks after the family next; an owner alone deletes it),
join from the link and land on the family.

Common to all three:
- **Opening a link** (signed in): Andriy's line and the date the link works until, "Join the Kovalenko family?", its
  members, the three lines on what joining means, **Join family** / Not now, "Signed in as …". Already in a family:
  "You're already in a family", leave it first, Go to Family. Someone new: F-028's invite page with the family named
  and a line on what they will see; Create account joins the family too.
- **A link** is for one person, 7 days, with an optional "Who is it for?" only the owner sees; it is shown once
  (F-028), so a waiting link can be cancelled, not copied again.
- **Remove** and **Leave** ask first and say that nothing is deleted and that coming back needs a new link.

1. **[Variant 1: Sections](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-1&nav=false&panel=false&globals=viewport.value:!undefined)**
   — *the family as Settings is.* One page of sections: Name (a field, Save name once changed), Members (rows with
   You / Owner tags and a ⋯ with Remove from family), Invite someone (Create invite link, the waiting links with
   the days left and Cancel), Leave the family. From 1024 px the title and a line on what it does on the left.
   With no family: Start a family (the name and the three lines) and Join a family (ask for a link).
   Trade-off: the most familiar and the quietest, the same pattern as Settings and People; nothing on it says
   "family" more than any other settings page.
   Starts: [No family yet](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-1&nav=false&panel=false&globals=viewport.value:!undefined&args=start:No+family+yet)
   · [Family member](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-1&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Family+member)
   · [Opens an invite link](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-1&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Opens+an+invite+link)
   · [Opens a link while in a family](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-1&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Opens+a+link+while+in+a+family)
   · [Opens a link as someone new](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-1&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Opens+a+link+as+someone+new)
2. **[Variant 2: Seats](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-2&nav=false&panel=false&globals=viewport.value:!undefined)**
   — *seats at the table.* The family's name big (a pencil renames it) with "3 people, since …", then everyone as a
   card (initials, name, Owner / Member, a ⋯ on the others for the owner), a waiting link as a dashed seat ("Link
   sent, 6 days left", Cancel link) and an empty seat, **+ Invite someone**, like the Accounts page's ghost card.
   Two seats a row on the phone, four on the desktop. With no family: your own seat and an empty one, **Start a
   family**, which opens a sheet. Trade-off: who is in the family reads at a glance and inviting is where the next
   person would sit; the cards take room for little text.
   Starts: [No family yet](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-2&nav=false&panel=false&globals=viewport.value:!undefined&args=start:No+family+yet)
   · [Family member](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-2&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Family+member)
   (opening a link looks as in variant 1)
3. **[Variant 3: Tickets](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-3&nav=false&panel=false&globals=viewport.value:!undefined)**
   — *an invite is a ticket you hand over* (the risk). The family's name on the Transactions page's dark slip with
   the members' initials and **Invite someone** on it; the members on a paper receipt with dotted leaders (owner,
   since …) and the three lines at its foot; every link a ticket: "Invite to a family", the family, From, For, Valid
   until, and a torn-off stub with the days left. The new link's dialog shows the ticket over Copy / Share, the
   waiting ones are small tickets with Cancel, and the person invited sees the same ticket on the join page.
   Trade-off: the most "ours" (the slip and receipts of the Transactions page) and the invite is unmistakable; more
   decoration on a page that is opened rarely.
   Starts: [No family yet](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-3&nav=false&panel=false&globals=viewport.value:!undefined&args=start:No+family+yet)
   · [Family member](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-3&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Family+member)
   · [Opens an invite link](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--variant-3&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Opens+an+invite+link)

Checked: the design check on the three stories and on six of their starts (no family, opening a link, someone new):
no issues but one the app's own invite page has too (the password field's eye button counted as an overlap);
typecheck, ESLint, Prettier. Every state above clicked through in Playwright and its screenshots at 375 px (light,
dark) and 1440 px looked at.

### Final prototype (2026-11-11)

The owner picked variant 1, "Sections", with no changes. Variants 2 and 3 were removed; the story is now
**[Final prototype](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--final&nav=false&panel=false&globals=viewport.value:!undefined)**
with the same starts:
[No family yet](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--final&nav=false&panel=false&globals=viewport.value:!undefined&args=start:No+family+yet)
· [Family member](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--final&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Family+member)
· [Opens an invite link](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--final&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Opens+an+invite+link)
· [Opens a link while in a family](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--final&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Opens+a+link+while+in+a+family)
· [Opens a link as someone new](http://localhost:6006/?path=/story/prototypes-f-023-family-and-invitations--final&nav=false&panel=false&globals=viewport.value:!undefined&args=start:Opens+a+link+as+someone+new).

- **Family page, owner:** Name (a field; Cancel / Save name once it differs), Members (rows: initials, name, You and
  Owner tags, "Started the family …" / "Joined …", a ⋯ with Remove from family on the others), Invite someone
  (Create invite link; "Waiting to be opened": each link's "For …", the date it works until, the days left, Cancel),
  Leave the family. From 1024 px each section's title and a line on what it does on the left, the control on the
  right, as Settings.
- **Family page, member:** the name as text ("The family's owner can change it."), Members without menus, Leave the
  family. **No family:** Start a family (the three lines on the left; Family name and Start a family on the right)
  and Join a family (ask its owner for a link).
- **Create invite link:** a dialog (a sheet on the phone), "Who is it for? (optional)", Create link; then the
  People page's link card (For …, the link, Copy link and Share) and when it stops working.
- **Remove**, **Leave** and **Delete family** (an owner alone) as in round 1; an owner leaving others picks the next
  owner from pills.
- **Opening a link:** as in round 1 (variant 1's join pages).
- Fixed since round 1: the Start a family button sat 44 px under the name field on the desktop (the form stretched
  to the section's height); now 16 px.

Checked: the design check on the story's six starts (only the password field's eye button "overlap" the app's own
invite page has too); typecheck, ESLint, Prettier; every state above at 375 and 1440 px, light and dark, looked at
and kept in [`prototypes/`](prototypes/) (owner, owner-invite, owner-remove, owner-leave, no-family, member, join,
join-in-a-family, join-new).

### Open points (proposals, built into the final prototype)

1. **Who invites:** only the owner (Google, Apple, Spotify, YNAB). A member sees "The owner invites and removes
   people."
2. **The owner leaving:** with others in the family the owner names who looks after it next, in the Leave dialog
   (Google and Apple make the owner delete the family instead, which for a couple means starting over); alone, Leave
   becomes **Delete family**. Nothing of anyone's is deleted either way.
3. **Renaming:** the owner can rename the family (the AC only says "with a name").
4. **How many people:** no limit while the app is for family and friends.
5. **Family links on the People page:** the admin's *Invite links* tab lists them too, with the family's name, and
   can cancel them; a family owner's link lets someone new create an account while sign-up is invite-only (owner's
   decision, 2026-10-29).
6. **Removed or left:** their accounts, transactions and categories stay theirs; they stop seeing the family and the
   family stops seeing them; coming back needs a new link.

### Built (2026-11-11)

As the final prototype, with the six open points as proposed. How it works
([ADR 0029](../../../decisions/0029-families.md)):

- **Data:** `families` (name, owner, created) and `family_members` (one row per person, a unique index: one family
  each); a family's link is an F-028 invitation with a `family_id`, made by the owner, 7 days, used once. A new
  `created_account` column keeps the People page's "Invited" to links that created the account (the migration
  `AddFamilies` marks every link used before as such).
- **API** (`/api/family`): `GET` (the family, or 204), `POST` start, `PUT name`, `POST invitations` (the link, shown
  once), `POST invitations/{id}/cancel`, `POST members/{id}/remove`, `POST leave` (`newOwnerId` for an owner with
  others), `POST join` (`token`; 409 already in a family, 410 a link that doesn't work or is the admin's). The link
  preview (`GET /api/invitations/{token}`) names the family and its members for a family's link; the admin's list
  has the family's name.
- **Sign-up with a family's link** (password or Google) joins the family in the account's transaction; the page goes
  on to Family with "You joined the … family.". Sign in and Continue with Google on that page come back to the link.
- **Deleting accounts** (the admin's Delete, the E2E clean-up) takes them out of their families first: an owner's
  family goes to whoever has been in it longest, an emptied one is deleted and its waiting links cancelled.

Added in the build, not in the prototype (small; say if they should differ):
- Someone who opens a link to **their own family** (a member who got the link by mistake): "You're already in the
  Kovalenko family. This link is for someone else. It still works for them until …", Go to Family.
- Someone signed in whose link **no longer works** sees F-028's "This invite link doesn't work any more" with Go to
  Family instead of Sign in; someone already in a family goes straight to Family instead (most likely they have just
  created their account with that link, through Google).
- The admin's *Invite links* tab shows a family's link with a "Kovalenko family" tag next to its note.

Owner's review (2026-11-11): generic placeholders instead of the prototype's examples: Family name "Our family" (was
"Kovalenko"), Who is it for? "Their name" (was "Mom").

## Tests

- Unit: Family rules (one family per user, invitation expiry, the owner's hand-over).
- E2E (Playwright): Invite, accept, leave.
- Built: `FamilyTests` (Domain: start, join once, rename and remove by the owner only, leave, hand-over, the last one
  leaving, deleted accounts), a family link's lifetime, the validators, `FamilyControllerTests`; Vitest
  `FamilyPage.test.tsx` (start, owner's page, rename, a link made and shown once, cancel, remove, leave with the next
  owner, member, load error; the link: join, already in another family, someone new joins by signing up, the admin's
  link goes on into the app); E2E `family.spec.ts` (someone new joins with the link and is removed; someone with an
  account joins and leaves), desktop and phone.

## Notes

- Uses the invitation links of [F-028](../F-028-invite-only-access/F-028-invite-only-access.md) with a family
  attached: a family owner's link also lets a new person create an account while sign-up is invite-only
  (owner's decision, 2026-10-29).
