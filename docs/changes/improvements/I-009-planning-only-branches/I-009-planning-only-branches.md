# I-009 · Planning-only branches

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | High |
| Status | Done |
| Branch | `plan/f028-follow-ups` (the first planning branch) |
| Design | not needed |
| Approved | 2026-10-29, the owner asked for it in so many words (docs only) |

## Goal
The owner can hand over a list of bugs, improvements and features just to add them to the backlog, without
implementing them. Such a list is planned on one branch of its own that carries only the planning, and each
change is built later on its own branch. Added by the owner on 2026-10-29, with the F-028 follow-ups
(I-004 – I-008).

## Acceptance criteria
- [x] A new branch type `plan/<short-name>`, from `develop`, back into `develop` through a pull request
      (squash merge), is in the git workflow of `CLAUDE.md`.
- [x] What it carries is stated: change folders and description files, backlog and roadmap rows, the PROGRESS
      entry, open questions — no code, no tests, no prototypes. A working-agreement change the owner asks for
      together with the plan (like this one) may go on it too.
- [x] The changes it plans stay `Todo`; each is built later on its own `feature/` / `improvement/` / `bugfix/`
      branch, and their description files already name that branch.
- [x] Adding a change to the backlog is not approval to build it (I-003 still applies).
- [x] PR title and commit messages for a planning branch are stated (`Plan: …` with the IDs).
- [x] The rule is in `CLAUDE.md`, `docs/changes/README.md` and the PR template.

## Tasks
- [x] `CLAUDE.md`: "Planning-only lists" in "How we work"; `plan/…` in the branches, PR title and commit message
      rules; the hand-off of a planning PR.
- [x] `docs/changes/README.md`: the rule.
- [x] `.github/pull_request_template.md`: title example and a checklist note for planning PRs.

## Tests
- Docs only; no code changes.

## Notes
- The branch was first created as `improvement/I-004-I-008-people-page-follow-ups` and renamed to
  `plan/f028-follow-ups` before it was pushed.
