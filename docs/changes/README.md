# Changes

Every feature, improvement and bugfix has **its own folder** here with all related files:
the description file (named like the folder), HTML design prototypes, screenshots and notes.

```
docs/changes/
├─ features/
│  └─ F-010-app-shell/
│     ├─ F-010-app-shell.md
│     └─ prototypes/
│        ├─ variant-1.html
│        ├─ variant-2.html
│        └─ variant-3.html
├─ improvements/
│  └─ I-001-short-name/
│     └─ I-001-short-name.md
└─ bugfixes/
   └─ B-001-short-name/
      └─ B-001-short-name.md
```

## Rules

- IDs: `F-xxx` feature (setup work counts as a feature), `I-xxx` improvement, `B-xxx` bugfix.
  Numbered separately per type, never reused.
- Folder name = branch name without the type prefix: branch `feature/F-010-app-shell` →
  folder `features/F-010-app-shell/`.
- The description file has the same name as the folder: `F-010-app-shell/F-010-app-shell.md`.
- Create the folder and the description file as soon as the change is added to the plan
  ([BACKLOG.md](../BACKLOG.md)), not when work starts. When the owner reports a bug or proposes a feature or
  improvement, this is the very first step — before looking into the code.
- Every improvement, bugfix and feature added after the initial plan has a [priority](#priority).
- Keep the status in the description file in sync with the backlog. The pull request already sets the status
  to `Done` (description file, backlog, roadmap, progress); merging it is the owner's job.
- Screens: references first (well-made apps, the internet, Mobbin), then 3 HTML prototypes in `prototypes/`;
  the references used and the chosen variant are recorded in the description file.
- **Approval before implementation.** No backend or frontend code until the owner has explicitly approved the
  description file and, for screens, the final prototype (for a bugfix: the root cause and the planned fix).
  Picking options in a design round is not approval. The date goes into the `Approved` row; until then it says
  `—`. Details in [CLAUDE.md](../../CLAUDE.md#how-we-work).

## Priority

| Priority | Meaning | When |
|----------|---------|------|
| `High` | Blocks use or development: wrong money data, a broken flow, red CI, a visible defect on a main screen | Next, before other work of the milestone |
| `Medium` | Noticeable, but there is a workaround or it affects a side screen | Within the current milestone |
| `Low` | Polish, nice to have | When there is room, or after the MVP |

Claude proposes the priority from this table; the owner has the last word.

## Template: feature / improvement

```markdown
# F-000 · Title

| | |
|---|---|
| Type | Feature / Improvement |
| Milestone | Mx — Name |
| Priority | High / Medium / Low |
| Status | Todo / In progress / Review / Done / Blocked |
| Branch | `feature/F-000-short-name` |
| Design | 3 HTML prototypes required / not needed |
| Approved | — (date the owner approved the description and the final prototype) |

## Goal
Why we do this, in one or two sentences.

## Acceptance criteria
- [ ] Observable result the user can check.

## Tasks
- [ ] Implementation step.

## Design
References (Mobbin, other apps, the internet): link — what we take from it.
Prototypes: `prototypes/`. Chosen variant: — · Final prototype approved: —

## Tests
- Unit:
- E2E (Playwright):
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
Decisions, links, open points.
```

## Template: bugfix

```markdown
# B-000 · Title

| | |
|---|---|
| Type | Bugfix |
| Priority | High / Medium / Low |
| Status | Todo / In progress / Review / Done |
| Branch | `bugfix/B-000-short-name` |
| Found in | version / date / environment |
| Approved | — (date the owner approved the root cause and the planned fix) |

## Steps to reproduce
1.

## Expected
## Actual
## Root cause
## Fix
## Tests
- Regression test that fails before the fix and passes after it.
```
