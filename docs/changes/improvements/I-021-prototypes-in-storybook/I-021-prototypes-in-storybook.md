# I-021 · Prototypes as Storybook stories built from the app's own parts

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | High |
| Status | Done |
| Branch | `improvement/I-021-prototypes-in-storybook` |
| Design | not needed |
| Approved | 2026-11-04, by the owner's request ("when you create prototypes use the storybook and design system to keep prototypes aligned with real UI so that it doesn't confuse me"); the way and the clean-up picked in chat the same day |

## Goal
Hand-written HTML prototypes redraw the app's screens by hand, so they never look quite like the real thing, and
that confused the owner. From now on a prototype is a Storybook story: the real screen (real components, theme and
fake data) with only the new part added. It also costs fewer tokens, since only the new part is written.

## Acceptance criteria
- [x] A design round's variants and final prototype are Storybook stories in
      `frontend/src/prototypes/<ID-name>/`, under *Prototypes / <ID> <name>* in the sidebar, made from the app's
      components, `theme.ts` and the design system, with the fake API the screen stories use.
- [x] A prototype story doesn't change the app's files; a part it needs differently is copied into its folder.
      Prototype stories don't count as implementation and may be made before the approval.
- [x] The design check runs on a story (`http://localhost:6006/iframe.html?id=…`) in light and dark, named after
      the story.
- [x] The change folder keeps the links to the stories and the final prototype's screenshots (375 and 1440 px,
      light and dark).
- [x] When the change is built, its prototype stories are deleted; the screenshots stay.
- [x] The rule is in `CLAUDE.md`, `docs/DESIGN_RULES.md`, `docs/changes/README.md` and the `design-screen` skill;
      ADR 0025 records the decision.

## Tasks
- [x] `CLAUDE.md`: "What is implementation", the change folder's contents, "Screens and design".
- [x] `docs/DESIGN_RULES.md` §2 "Process"; `docs/changes/README.md` (folder tree, rules, template).
- [x] `.claude/skills/design-screen/SKILL.md`: the steps for a round made of stories.
- [x] `frontend/scripts/design-check.mjs`: a Storybook story gets its color scheme from the toolbar's global and
      its name from the story's id.
- [x] ADR 0025.

## Tests
- The design check run on an existing story (*Transactions / Transactions list*) in light and dark: the screenshots
  show the dark scheme in the dark shots and the story's name in the file names.
- Docs and tooling only; no app code changes.

## Notes
- Earlier changes keep their HTML prototypes; I-017 was already built and merged when this was decided.
- Picked by the owner in chat (2026-11-04): stories over HTML exported from Storybook or HTML with the theme's
  tokens; prototype stories deleted once the change is built.
- A squash merge keeps only the final state on `develop`, so after a change is built its prototype stories are
  found in the PR's commits; the screenshots are the lasting record.
