# I-034 · Screenshots are looked at, never committed

| | |
|---|---|
| Type | Improvement |
| Milestone | M6 — MVP release (development) |
| Priority | Medium |
| Status | Done |
| Branch | `improvement/I-034-no-committed-screenshots` |
| Design | not needed (the working agreement only) |
| Approved | 2026-11-14, the owner in chat ("Yes, stop committing") |

## Goal

The repository doesn't collect screenshots. The owner asked (2026-11-14) why every UI change commits them, and
whether they are needed. They aren't:

- The rule asked for 4 per approved final prototype (375 and 1440 px, light and dark, in the change's
  `prototypes/`), but in practice changes committed whatever was looked at: about 300 PNGs in `docs/changes/`
  across 38 changes, 8 to 36 per design change, plus "fixed", "built" and "repro" shots of bugfixes that no rule
  asked for.
- What was approved is already written down: the change's description file describes the final prototype with its
  date, and DESIGN_RULES "Screen decisions" too. The prototype stories' code stays on GitHub in each PR's commits
  (`refs/pull/<n>/head` outlives the deleted branch), so a prototype can be opened again if ever needed.
- What catches UI mistakes is looking at the screenshots before every commit (the invisible button text and the cut
  app name of the first F-010 build). That stays; keeping the pictures in git adds nothing to it.
- Pictures can't be reviewed in a PR's diff, every UI change made the repository bigger (F-025's alone was almost
  1 MB), and the history keeps them for good.

## Acceptance criteria

- [x] The working agreement (`CLAUDE.md`), DESIGN_RULES §2, the change templates (`docs/changes/README.md`) and the
      `design-screen` skill say: screenshots are taken and looked at (375 and 1440 px, light and dark, as before) and
      sent to the owner in chat, never committed; the description file describes what was approved in words.
- [x] `.gitignore` keeps new images in `docs/changes/` out of the repository, so one can't be committed by
      accident. An image the owner gives as a reference (as I-027's key order) can still be added with
      `git add -f`.
- [x] The screenshots already committed are deleted too (the owner, 2026-11-14: "do it"): 283 files, about 25 MB of
      every checkout, from 38 changes. Only I-027's `reference-key-order.png` stays, the image the owner gave as the key
      order. The history keeps the deleted ones; rewriting it to drop them would mean force-pushing `develop` and `main`,
      so it isn't done.
- [x] Every link and mention of a deleted screenshot in the change docs is reworded (34 links in 21 files, and 8
      plain mentions of their folders, 3 files more): each passage still says what was checked or approved. The HTML
      prototypes of the changes before I-021 (`prototypes/*.html`) stay; none of them uses an image.
- [x] F-025's PR (#104) commits none (its 16 were taken out the same day).

## Tasks

- [x] `CLAUDE.md`: "Changes" (what a change folder holds) and "Screens and design" (the change folder keeps the
      story links, no screenshots)
- [x] `docs/DESIGN_RULES.md` §2, step 2
- [x] `docs/changes/README.md`: the folder's contents, the tree, the "Screens" line and the description template
- [x] `.claude/skills/design-screen/SKILL.md` step 6
- [x] `.gitignore`: images under `docs/changes/`
- [x] Delete the committed screenshots (all but I-027's reference) and reword the change docs that linked them
- [x] BACKLOG, PROGRESS

## Notes

- The PR template's line "Changed screens checked in Playwright screenshots" stays: the check is unchanged, only
  where the pictures go.
