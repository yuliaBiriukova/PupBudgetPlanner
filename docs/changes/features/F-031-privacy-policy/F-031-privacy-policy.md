# F-031 · Privacy policy page

| | |
|---|---|
| Type | Feature |
| Milestone | M9 — Privacy & categories (after the MVP) |
| Priority | Medium |
| Status | Todo |
| Branch | `feature/F-031-privacy-policy` |
| Design | 3 prototype stories required (the `/privacy` page and where it is linked from) |
| Approved | 2026-11-14 the description ("Approved, design it"); final prototype: — |

## Goal

People outside the family can use Pup Budget with Google sign-in: Google publishes the app (out of Testing, where only
listed test users get in) only with a public privacy policy link and a home page link on its Branding page. A public
`/privacy` page in the app gives that link and tells everyone what the app keeps about them. Added by the owner on
2026-11-14.

**Priority Medium:** publishing is unblocked today by the same text as a Google Doc (below), so the page itself can wait
for its turn; it is the first step towards opening the app beyond the family.

## Now, before this change: the Google Doc

1. The owner fills in the two **[brackets]** of [`privacy-policy.md`](privacy-policy.md), pastes its text (from
   "Pup Budget privacy policy" on) into a Google Doc and publishes it (File → Share → Publish to web).
2. Google Cloud → Branding: *Application home page* `https://pup-budget-planner.onrender.com`, *Application privacy
   policy link* the Google Doc's published link; no logo (a logo sends the app to Google's review).
3. Audience → **Publish app**. Only the basic scopes are asked for (`openid`, `email`, `profile`), so no review is
   needed; anyone with a Google account can then sign in, and the invite links still decide who gets an account.

## Acceptance criteria

- [ ] `/privacy` opens for anyone, signed in or not, without waking the API (the text is part of the app), and shows
      the text of [`privacy-policy.md`](privacy-policy.md) with the owner's contact email.
- [ ] It is linked from the Sign in and Create account pages, the invite page, and Settings (or More on the phone).
- [ ] It reads well at 320 – 1440 px, light and dark, and passes the axe check.
- [ ] Google's Branding page links to `https://pup-budget-planner.onrender.com/privacy` instead of the Google Doc
      (owner, after the release).

## Tasks

- [ ] Owner: the Google Doc and publishing the Google app (above), now
- [x] Owner reviews the policy text and approves this description (2026-11-14)
- [x] References and 3 prototype stories: the page and its links (2026-11-14)
- [ ] Owner picks a variant (variant 2, 2026-11-14); final prototype approved
- [ ] The page, its route and the links; the contact email from configuration, not the repository
- [ ] Unit and E2E tests; screenshots looked at (phone and desktop, light and dark)
- [ ] After the release: the Branding page's link moved to `/privacy`

## Design

**Brief.** Someone who got an invite link, or came from Google's consent screen, decides whether to trust a small app
with their money; a family member checks later from Settings. The page's one job: answer "what happens to my money
data" in seconds: the promises (no ads, no trackers, never sold) and the date first, the full text right after. It
should read as a note from a person, not a legal wall, and feel calm and trustworthy. The bold element: the promise in
the display face (Unbounded 300).

**Plan.** Reused: the sign-in frame and forms (F-011), Settings and its sections (F-016) in the app shell, the
logo and name, F-030's folding rows, the theme's tokens (hero, rule, hover, accent), Unbounded 300 for headings,
Manrope 400/500 for text at 16 / 26 px in a 640 px column. New: only the page and its links. No new token. Motion: none
but a fold opening (160 ms, as F-030). Slop check: dropped a middle-dot "Privacy policy · last updated" line, an odd
15 px size, and icons in tinted circles for the promises.

**References** (open pages, no sign-in):

- [Stripe privacy policy](https://stripe.com/privacy) — the contents beside the text on the desktop, "Last updated"
  under the title (variant 2).
- [37signals privacy policy](https://37signals.com/policies/privacy/) — a plain summary with "We never sell your data"
  before anything else, and links to the sections at the top (variants 2 and 3).
- [Monzo customer privacy notice](https://monzo.com/legal/privacy-notice) — plain, friendly language for a money app,
  the date at the top (the text's tone).

**Prototype stories** — *Prototypes / F-031 Privacy policy* (`frontend/src/prototypes/F-031-privacy-policy/`). Each
opens on the privacy page; the *start* control opens it on Sign in, Create account or Settings, where the link is, and
the links lead between them as in the app.

| Story | Thesis | Link |
|-------|--------|------|
| Variant 1: In the sign-in frame | The sign-in screens' charcoal half with the promises stays put beside the text; under the form "How Pup Budget keeps your data"; Settings "Your data" with a button | [open](http://localhost:6006/?path=/story/prototypes-f-031-privacy-policy--variant-1&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 2: A document with contents | The app's top line, the contents beside the text marking the section being read (folded under the title on the phone); a quiet "Privacy policy" under the form; Settings "Privacy" as a row with the date | [open](http://localhost:6006/?path=/story/prototypes-f-031-privacy-policy--variant-2&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 3: Answers first | One sentence says it all in big type, then the questions people ask as folding rows with a one-line answer, Open all; under the form a two-line card "Your money stays yours"; Settings shows the promises | [open](http://localhost:6006/?path=/story/prototypes-f-031-privacy-policy--variant-3&nav=false&panel=false&globals=viewport.value:!undefined) |

Chosen variant: **variant 2 "A document with contents"**, as it is (owner, 2026-11-14).

**Final prototype** (2026-11-14): [Final prototype](http://localhost:6006/?path=/story/prototypes-f-031-privacy-policy--final&nav=false&panel=false&globals=viewport.value:!undefined).
`/privacy` opens under the app’s top line (the logo and *Pup Budget*, which lead to the app, and *Back*, which goes
back to the page it was opened from, or to the app when opened straight from a link). The title *Privacy policy* in
Unbounded 300, *Last updated* under it, the summary a size up, the intro, then the sections in a 640 px column. On the
desktop the contents (*On this page*) stay beside the text and mark the section being read with the sidebar’s edge
bar; a section picked there is marked even when the page can’t scroll it to the top. On the phone the contents fold
under the intro; picking a section closes the fold and then scrolls to it. Under the Sign in and Create account forms
(and the invite page) a quiet *Privacy policy* link; in Settings a last section *Privacy* with a row *Privacy policy*
and its date, opening the page.

Approved for implementation: —

## Tests

- Unit: the page renders every section; the links are there on Sign in, Create account, the invite page and Settings.
- E2E (Playwright): `/privacy` opens signed out and signed in; the Sign in page's link leads there.
- Screens checked in Playwright screenshots (phone / desktop, light / dark): `/privacy`, and the pages with the link.

## Notes

- The text is plain-language and written from the app as it is; it is not legal advice. If the app is opened to people
  in the EU at scale, a lawyer's look is worth it (GDPR).
- When a change alters what the app keeps or who sees it (F-027 Delete my account, password reset by email, an
  import), it updates [`privacy-policy.md`](privacy-policy.md) and the page in the same change.
- Open point: should the policy say where Neon's database is (region)? The repository doesn't say; F-007 recommended
  Frankfurt. The owner can check it in the Neon console.
