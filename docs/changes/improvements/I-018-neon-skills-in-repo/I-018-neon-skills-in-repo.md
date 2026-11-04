# I-018 · Neon skills in the repo; launch.json ignored

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | Low |
| Status | Done |
| Branch | `improvement/I-018-neon-skills-in-repo` |
| Design | not needed |
| Approved | 2026-11-02, the owner asked for it in so many words ("ignore launch.json, but create PR with skills") |

## Goal
Two files have been left untracked in the working copy since the first sessions, and git status always lists them.
Neon's Claude skills, installed on 2026-10-27, go into the repo so every clone and worktree has them. `.claude/launch.json`
holds paths that only work on the owner's laptop, so git ignores it.

## Acceptance criteria
- [x] `.claude/skills/neon/` and `.claude/skills/neon-postgres/` (from `neondatabase/agent-skills` on GitHub) are
      committed as installed, together with `skills-lock.json`, the installer's record of where they came from.
- [x] `.claude/launch.json` is in `.gitignore`; git status no longer lists it.

## Tasks
- [x] Commit the two skills and `skills-lock.json` unchanged.
- [x] `.gitignore`: `.claude/launch.json`.

## Tests
- Tooling only; no app code changes. The skill files were checked for secrets before the commit (none found).

## Notes
- `launch.json` lists the dev servers Claude starts in the desktop app's Browser pane (`web`, `api`, `storybook`,
  `web-5174-api-5298`, `web-lan`), with the laptop's nvm Node path and the `E:/` project path, so it can't be
  shared.
- The skills are third-party content: update them with the installer (it reads `skills-lock.json`), not by hand.
