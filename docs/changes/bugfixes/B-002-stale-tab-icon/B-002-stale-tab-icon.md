# B-002 · Tab icon still shows the Vite template icon

| | |
|---|---|
| Type | Bugfix |
| Status | Review |
| Branch | `bugfix/B-002-stale-tab-icon` |
| Found in | Production (https://pup-budget-planner.onrender.com), 2026-10-28, owner's browser after the F-010 release |

## Steps to reproduce
1. Open the app in a browser that visited it before F-010 (when it had the Vite template icon).
2. Look at the tab icon after the F-010 release.

## Expected
The tab shows the app's logo: the coin stack on a sky circle.

## Actual
The tab shows the purple lightning bolt: the Vite template icon from the F-004 scaffold.

## Root cause
The server is right: `/favicon.svg`, `/favicon.ico` and `/apple-touch-icon.png` on Render are the new logo files,
sent with `Cache-Control: no-cache`. But browsers keep tab icons in their own icon cache, keyed by the icon URL,
and seldom ask for them again. The scaffold's Vite icon already lived at `/favicon.svg`, and F-010 replaced the
file under the same URL, so browsers that knew the old icon keep showing it. A new browser shows the logo.

## Fix
- `index.html`: the three icon links carry a version, `?v=2`. A new URL is not in the icon cache, so the browser
  loads the logo. The comment there says to bump `?v=` whenever an icon file changes.
- The files stay at the root (`/favicon.ico`, `/apple-touch-icon.png`), where browsers and tools look for them
  without a link.

## Tests
- E2E `smoke.spec.ts` → "the browser icon is the app logo" now reads the icon links from the page: there are three,
  each has a `?v=` version, and each URL loads the logo (SVG with the sky colour, ICO, PNG).
- The production build keeps `?v=2` in `dist/index.html`.
- A browser's own icon cache can't be reproduced in a test: check the tab icon on Render after the release.
