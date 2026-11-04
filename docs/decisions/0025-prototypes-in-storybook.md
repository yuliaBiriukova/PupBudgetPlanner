# 0025. Prototypes are Storybook stories built from the app's own parts

- Status: Accepted
- Date: 2026-11-04

## Context

Design rounds were self-contained HTML files in the change folder, written by hand. Each one redrew the app's shell,
form and lists, so the prototypes drifted from the real UI (fonts, spacing, buttons), and the owner couldn't tell
what was new and what was only drawn differently (I-021). They were also large: about 40 KB of HTML per variant.
Storybook already has the design system (I-019) and every screen with a fake API.

## Decision

- A variant or a final prototype is a **Storybook story** in `frontend/src/prototypes/<ID-name>/`, titled
  `Prototypes/<ID> <name>`. It renders the real screen with the app's providers, theme and fake data and adds only
  the new part, built from Mantine, `theme.ts` and the shared parts.
- A prototype **never edits the app's files**: a component it needs differently is copied into its folder. So it
  isn't implementation and may be made before the owner's approval. It passes typecheck, ESLint and Prettier like
  any other file; plain English text is fine in it.
- The **design check** runs on the story's iframe address; it sets light and dark through the Storybook global.
- The change folder holds the links to the stories and the **final prototype's screenshots**. When the change is
  built, its prototype stories are deleted; the real stories replace them.
- Earlier HTML prototypes stay as they are.

## Consequences

- Prototypes look exactly like the app, and a round costs fewer tokens: only the new part is written.
- Seeing a prototype needs Storybook running (`npm run storybook` in `frontend/`), not a file opened from disk.
- A prototype that changes the look itself (a new token, another font) shows it with a theme override inside its
  folder and names it in the description file.
