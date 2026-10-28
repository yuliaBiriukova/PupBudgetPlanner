# 0011. Self-hosted fonts with Fontsource

- Status: Accepted
- Date: 2026-10-27

## Context

The app shell (F-010) uses two Google Fonts: Unbounded (headings, amounts, the app name) and Manrope (text). Both
need Cyrillic for the Ukrainian translation. They can be linked from Google's CDN or bundled with the app.

## Decision

Bundle them with the **Fontsource** npm packages (`@fontsource/unbounded`, `@fontsource/manrope`, pinned
versions), importing only the weights we use: Unbounded 300, Manrope 400 and 500. Each weight's CSS covers all
subsets (Latin, Cyrillic, …) with `unicode-range`, so the browser downloads only the subsets a page needs.

## Consequences

- No request to a third-party CDN: no visitor data sent to Google, no extra DNS/TLS round trip, and the fonts
  work offline once cached, which the PWA (F-025) needs.
- Font files ship in our build (a few dozen kB per subset) and are versioned with the app.
- A new weight or font means a new import in `src/main.tsx` and `.storybook/preview.tsx`.
