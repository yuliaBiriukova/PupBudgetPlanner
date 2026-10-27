# F-002 · GitHub repository

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Todo |
| Branch | `feature/F-002-github-repository` |
| Design | not needed |

## Goal

Private GitHub repository with the agreed branches.

## Acceptance criteria

- [ ] Private repo `PupBudgetPlanner` exists on the owner's GitHub account
- [ ] `main` and `develop` are pushed; `develop` is the default branch for pull requests
- [ ] Merge settings: squash merge (for PRs into `develop`) and merge commits (for releases into `main`)
  allowed, rebase merge disabled, branches deleted automatically after merge
- [ ] Pull request template in `.github/pull_request_template.md`
- [ ] F-001 is merged into `develop` through a pull request

## Tasks

- [ ] Owner runs `gh auth login`
- [ ] Create the private repo with `gh repo create`
- [ ] Push `main`, `develop` and `feature/F-001-planning-docs`
- [ ] Set `develop` as the default branch
- [ ] Configure merge settings with `gh repo edit`
- [ ] Open the F-001 pull request

## Tests

- Unit: —
- E2E (Playwright): —

## Notes

- Branch protection rules are not available for private repos on the free GitHub plan; we rely on the agreed workflow instead.
