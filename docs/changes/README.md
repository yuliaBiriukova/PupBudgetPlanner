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
  ([BACKLOG.md](../BACKLOG.md)), not when work starts.
- Keep the status in the description file in sync with the backlog.
- Screens: 3 HTML prototypes in `prototypes/`; the chosen variant is recorded in the description file.

## Template: feature / improvement

```markdown
# F-000 · Title

| | |
|---|---|
| Type | Feature / Improvement |
| Milestone | Mx — Name |
| Status | Todo / In progress / Review / Done / Blocked |
| Branch | `feature/F-000-short-name` |
| Design | 3 HTML prototypes required / not needed |

## Goal
Why we do this, in one or two sentences.

## Acceptance criteria
- [ ] Observable result the user can check.

## Tasks
- [ ] Implementation step.

## Design
Prototypes: `prototypes/`. Chosen variant: —

## Tests
- Unit:
- E2E (Playwright):

## Notes
Decisions, links, open points.
```

## Template: bugfix

```markdown
# B-000 · Title

| | |
|---|---|
| Type | Bugfix |
| Status | Todo / In progress / Review / Done |
| Branch | `bugfix/B-000-short-name` |
| Found in | version / date / environment |

## Steps to reproduce
1.

## Expected
## Actual
## Root cause
## Fix
## Tests
- Regression test that fails before the fix and passes after it.
```
