# I-001 · Working agreement: PR hand-off, Playwright checks, change docs first, design references

| | |
|---|---|
| Type | Improvement |
| Milestone | M1 — Authentication & app shell |
| Priority | High |
| Status | Done |
| Branch | `improvement/I-001-working-agreement-rules` |
| Design | not needed |

## Goal
Make the owner's review cheaper: Claude hands over finished, self-checked work in one pull request, and
every request from the owner is planned in the repo before any code is written.

## Acceptance criteria
- [x] Opening the PR is the end of Claude's work on a change: the same PR already marks the change `Done` in its
      description file, `BACKLOG.md`, `ROADMAP.md` (when a milestone changes) and `PROGRESS.md`. Merging is the
      owner's job; no separate "mark done" PR (like PR #14 for F-010).
- [x] Screens are checked with Playwright — screenshots looked at, not only tests run — before design variants
      are shown and before every commit that changes UI. Examples from F-010: the label on the primary button
      was invisible, and the app name was cut off in the sidebar by default.
- [x] When the owner reports a bug or proposes a feature or improvement, its folder, description file and
      backlog row are created first, before any code. Every such change has a priority.
- [x] UI design starts from references: Mobbin and other examples open on the internet. Nothing that needs the
      owner's sign-in (banking apps, Claude's UI), and the owner is never asked to sign in for references.
- [x] The rules are in `CLAUDE.md`, `docs/changes/README.md` (templates), `docs/DESIGN_RULES.md`, the
      `design-screen` skill and the PR template.

## Tasks
- [x] `CLAUDE.md`: new "Owner requests" and "Finishing a change" sections; UI checks in the pre-push list and the
      definition of done; references in "Screens and design".
- [x] Priority: column in the backlog tables for improvements and bugfixes, row in all templates, scale in
      `docs/changes/README.md`.
- [x] `docs/DESIGN_RULES.md` process and `design-screen` skill: references step and the Playwright look-check.
- [x] `.github/pull_request_template.md`: checklist items for the `Done` status and the UI check.

## Tests
- Docs only; no code changes.

## Notes
- Statuses stay `Todo` · `In progress` · `Review` · `Done` · `Blocked`; `Review` is now only for work handed to
  the owner before a PR exists (e.g. design variants waiting for a choice).
