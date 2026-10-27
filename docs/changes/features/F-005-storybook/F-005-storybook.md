# F-005 · Storybook

| | |
|---|---|
| Type | Feature |
| Milestone | M0 — Foundation |
| Status | Review |
| Branch | `feature/F-005-storybook` |
| Design | not needed |

## Goal

A component workshop where every component and screen state can be reviewed.

## Acceptance criteria

- [x] Storybook runs with `npm run storybook` and builds with `npm run build-storybook`
- [x] Stories are wrapped in the Mantine provider and theme
- [x] Toolbar switches light/dark and mobile/tablet/desktop viewports
- [x] One sample story

## Tasks

- [x] Install Storybook (Vite builder)
- [x] Add Mantine decorator and color-scheme toggle
- [x] Add viewport presets
- [x] Add sample story

## Tests

- Unit: Storybook build runs in CI (added to the pipeline in F-008).
- E2E (Playwright): —
- Checked by hand in the browser: toolbar light/dark, the three viewport presets, the sample play function passes.

## Notes

- Storybook 10.6 (`@storybook/react-vite`) reuses `frontend/vite.config.ts`; config lives in `frontend/.storybook/`.
- Addons: `addon-docs` (autodocs pages) and `addon-a11y` (accessibility panel; reports only, not enforced yet).
  All MIT-licensed.
- Every story is wrapped in `AppProviders` (Mantine theme, dates, notifications, TanStack Query) and the i18n
  setup, exactly like the app. The providers are remounted per story, so each story gets a fresh query cache and
  starts in the toolbar's color scheme.
- Color scheme: a `colorScheme` toolbar global (Light / Dark); a story can pin it with
  `globals: { colorScheme: 'dark' }`. Components that switch the scheme themselves still work inside stories.
- Viewports: Mobile 375×812 (default, per CLAUDE.md "Screens and design"), Tablet 768×1024, Desktop 1280×800.
- Sample story: `src/shared/ui/ColorSchemeToggle.stories.tsx` (Light, Dark, and a play function that clicks the
  toggle).
- `eslint-plugin-storybook` lints story files. `.storybook/*.ts(x)` are part of `tsconfig.app.json`.
- Running play functions as Vitest tests (`@storybook/addon-vitest`) needs Vitest browser mode with Playwright;
  revisit after F-006 if wanted.
- Router-dependent components will need a router decorator; add it with the first story that needs one (F-010).
