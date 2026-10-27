# F-002 · GitHub repository

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Done |
| Branch | `feature/F-002-github-repository` |
| Design | not needed |

## Goal

Private GitHub repository with the agreed branches.

## Acceptance criteria

- [x] Private repo `PupBudgetPlanner` exists on the owner's GitHub account
- [x] `main` and `develop` are pushed; `develop` is the default branch for pull requests
- [x] Merge settings: squash merge (for PRs into `develop`) and merge commits (for releases into `main`)
  allowed, rebase merge disabled, branches deleted automatically after merge
- [x] Pull request template in `.github/pull_request_template.md`
- [x] F-001 is merged into `develop` through a pull request

## Tasks

- [x] Owner runs `gh auth login`
- [x] Create the private repo with `gh repo create`
- [x] Push `main`, `develop` and `feature/F-001-planning-docs`
- [x] Set `develop` as the default branch
- [x] Configure merge settings with `gh repo edit`
- [x] Open the F-001 pull request

## Tests

- Unit: —
- E2E (Playwright): —

## Notes

- Done on 2026-10-27 with the GitHub CLI: repo `yuliaBiriukova/PupBudgetPlanner` (private), default branch
  `develop`, squash and merge commits allowed, rebase disabled, branches deleted after merge.
  The pull request template came with F-001; F-001 was merged with [PR #1](https://github.com/yuliaBiriukova/PupBudgetPlanner/pull/1).
- This branch only closes out the docs; there is no code change.
- Branch protection rules are not available for private repos on the free GitHub plan; we rely on the agreed workflow instead.
