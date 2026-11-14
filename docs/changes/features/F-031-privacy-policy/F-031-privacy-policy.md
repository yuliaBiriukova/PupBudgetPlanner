# F-031 · Privacy policy page

| | |
|---|---|
| Type | Feature |
| Milestone | M9 — Privacy & categories (after the MVP) |
| Priority | Medium |
| Status | Todo |
| Branch | `feature/F-031-privacy-policy` |
| Design | 3 prototype stories required (the `/privacy` page and where it is linked from) |
| Approved | — |

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
- [ ] Owner reviews the policy text and approves this description
- [ ] References and 3 prototype stories: the page and its links
- [ ] Owner picks a variant; final prototype approved
- [ ] The page, its route and the links; the contact email from configuration, not the repository
- [ ] Unit and E2E tests; screenshots looked at (phone and desktop, light and dark)
- [ ] After the release: the Branding page's link moved to `/privacy`

## Design

References: — (product sites' privacy pages, picked in the design round).
Prototype stories: *Prototypes / F-031 Privacy policy* in Storybook (`frontend/src/prototypes/F-031-privacy-policy/`).
Chosen variant: — · Final prototype approved: —

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
