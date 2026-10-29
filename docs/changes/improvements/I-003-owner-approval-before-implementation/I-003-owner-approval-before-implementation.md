# I-003 · Owner approval before implementation

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | High |
| Status | Done |
| Branch | `improvement/I-003-owner-approval-before-implementation` |
| Design | not needed |
| Approved | 2026-10-29, the owner asked for it in so many words |

## Goal
Claude writes no backend or frontend code for a change until the owner has explicitly approved it. Added by
the owner on 2026-10-29.

Why: in F-028 a session combined the owner's round-4 picks into a new prototype (variant 7), recorded it as
"chosen" and built the backend and the screens within the hour, without ever showing variant 7. The owner
thought the work was still on the prototype. (The owner approved variant 7 afterwards, on 2026-10-29.)

## Acceptance criteria
- [x] Before any implementation, backend or frontend, the owner explicitly approves the change: the
      description file (goal, acceptance criteria, tasks) and, for a 🎨 change, the final prototype. For a
      bugfix: the root cause and the planned fix.
- [x] What is "implementation" is stated: code, tests, migrations and configuration in `backend/`, `frontend/`
      and the deployment files. Planning docs, references, prototypes and reproducing a bug are not, and need no
      approval.
- [x] What is "approval" is stated: the owner's explicit words in chat or on the PR ("approved, build it").
      Picking options in a design round, comments on a prototype or "looks good" are not; after a round Claude
      builds the final prototype, shows it and asks "Approve for implementation?".
- [x] A change the owner asks for in so many words (like this one, docs only) counts as approved by the request.
- [x] The approval and its date are recorded in the description file (a new `Approved` row in all templates)
      and, for screens, in DESIGN_RULES "Screen decisions".
- [x] A bigger change of scope while building (a new screen, behavior different from what was approved) is
      approved again first. The owner's own review comments are approval of what they ask for.
- [x] The rule is in `CLAUDE.md`, `docs/changes/README.md`, `docs/DESIGN_RULES.md`, the `design-screen` skill
      and the PR template.

## Tasks
- [x] `CLAUDE.md`: "Owner approves before implementation" in "How we work", the approval step in "Screens and
      design", a check at the start of every session, a definition-of-done item.
- [x] `docs/changes/README.md`: the rule and an `Approved` row in both templates.
- [x] `docs/DESIGN_RULES.md` process: the final prototype is approved before the screen is built.
- [x] `design-screen` skill, step 6: present, ask for approval, stop.
- [x] `.github/pull_request_template.md`: a checklist item for the recorded approval.

## Tests
- Docs only; no code changes.

## Notes
- The ID I-002 is taken by "corners across the app", named in the F-028 design (decision 8) and not planned
  yet, so this change is I-003.
- F-028's description records the after-the-fact approval of variant 7 on its own branch (PR #23).
