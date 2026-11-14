# 0034. The installable app: a service worker that keeps only the app's own files, updates on Reload

- Status: Accepted
- Date: 2026-11-14

## Context

F-025 makes the app installable on the phone and the computer. The free Render service sleeps at night (ADR 0002)
and serves the app's files as well as the API, so a sleeping server meant a blank page for up to a minute before the
"Waking up the server…" pill could even show. The app is used in Kyiv, where the network can go with the power. The
app holds people's money, and family members may share a phone or a computer.

## Decision

- **`vite-plugin-pwa` (Workbox, `generateSW`)** makes the manifest and the service worker from `vite.config.ts`. No
  hand-written service worker.
- **The service worker keeps only the app's own files**: the build's HTML, JS, CSS, woff2 fonts and icons, precached
  at install. Every page address opens `index.html` from the cache (`navigateFallback`), so the app appears at once
  and the existing pill says the server is waking up.
- **The API is never cached or answered by the service worker** (`/api/` in `navigateFallbackDenylist`, no runtime
  caching). Nothing of anyone's money stays on the device after Sign out, Google sign-in's callback and invite links
  reach the server as before, and offline data (looking at or adding transactions) is not in the MVP.
- **A release waits for the person's Reload** (`registerType: 'prompt'`): the open app shows "A new version is
  ready." with Reload; the new version takes over on Reload or on the next start. A release never reloads a page by
  itself, which could drop a half-typed transaction (owner, 2026-11-14). An open app asks for a release every hour
  and whenever it comes back to the screen.
- **Registered in `main.tsx` only**, so Storybook and the unit tests never load the plugin's module; Storybook's
  config leaves the plugin out, so its static site has no service worker. `vite` dev has none either.
- **The server** keeps sending unhashed files (`sw.js`, `workbox-*.js`, `manifest.webmanifest`, `index.html`) with
  `no-cache`, so a release is found at once, and sends the manifest as `application/manifest+json`.
- **Installing**: Chrome and Edge get the app's own Install button, which opens the browser's dialog
  (`beforeinstallprompt`); Safari on the iPhone gets its three taps drawn in the app; the installed app offers
  nothing.
- **E2E**: only `pwa.spec.ts` lets the service worker run, against the production build; every other spec blocks
  service workers, so a cached app can't change what they test.

## Consequences

- At night the installed app opens at once; data still waits for the server, as before.
- A person who never taps Reload uses the old version until they close and open the app again. An old version talks
  to a newer API for that time, so API changes stay backward compatible for at least one release.
- The first release with the service worker shows no update toast (there is no older worker to replace); every later
  one does.
- Locally the PWA spec runs only against `npm run build` + `npm run preview` (`E2E_BASE_URL=http://localhost:4173`);
  against the dev server it is skipped. CI runs it on every PR, since CI tests the production build.
- Looking at data offline, or adding transactions offline to send later, would need runtime caching and a queue: a
  change of its own after the MVP.
