# F-025 · Installable app (PWA)

| | |
|---|---|
| Type | Feature |
| Milestone | M6 — MVP release |
| Status | In progress (planned 2026-11-14; open points answered, design round next) |
| Branch | `feature/F-025-pwa` |
| Design | 3 prototype stories required: the install hint, the update notice and the offline start (owner, 2026-11-14) |
| Approved | — |

## Goal

Open the app from the phone's home screen (or the computer's app list) like a native app: its own icon, no browser
bars, and it opens at once even when the free server is asleep at night.

Today the app is a website. At night, when the Render service sleeps, nothing appears until the server has woken up
(up to about a minute), because the server also delivers the app's own files. Once installed with its files cached,
the app opens straight away and the existing "Waking up the server…" pill (F-010) shows while the data waits.

## What is there already

- **Icons:** the logo (a coin stack on a sky circle) as `favicon.svg`, `favicon.ico` and a 180 px
  `apple-touch-icon.png` for iPhone home screens (F-010, B-002). There is no manifest or service worker yet.
- **Waking up:** `useServerWake` asks `/api/health` at start and retries for about a minute. `StartupScreen` and
  `WakePill` show "Waking up the server… 12 s", then a "Connected" toast. If the server never answers, the start
  screen says "Couldn't reach the server." with Try again. Nothing tells the person when *their* network is down.
- **Server caching** (`SpaHostingExtensions`): hashed files under `/assets/` are cached for a year, and `index.html`
  and other unhashed files are revalidated (`no-cache`). The service worker file and the manifest get `no-cache`
  through that rule.
- **Phone layout:** the bottom bar, the sign-in pages and the bottom sheets already pad for the iPhone's home
  indicator (`env(safe-area-inset-*)`), which matters in standalone mode.
- **Platforms (checked 2026-11-14):**
  - Android Chrome and desktop Chrome / Edge fire `beforeinstallprompt`, so the app can offer its own Install
    button.
  - iPhone and iPad (iOS 26 and later) have no install event. A person adds the site through Share → *Add to Home
    Screen*, and it opens as a web app by default ("Open as Web App" switch). Instructions are the only help the
    app can give there.

## Acceptance criteria

Proposed; the owner settles the open points before approval.

- [ ] **Installable:** a web app manifest with the name *Pup Budget Planner*, the short name *Pup Budget*, the
      logo's icons (192 px, 512 px and a 512 px *maskable* one for Android's shaped icons; the 180 px iPhone icon
      stays), `display: standalone`, start at `/`, and colours from the theme. Chrome's install check passes on
      Android and desktop; on iPhone, *Add to Home Screen* gives the logo and opens without Safari's bars.
- [ ] **Opens at once:** the app's own files (HTML, JS, CSS, fonts, icons) are cached by a service worker. Opened
      from the home screen while the server sleeps, the app appears at once (the start screen with the waking-up
      pill) instead of a blank page.
- [ ] **No money data on the device:** API answers (`/api/…`) are never cached, so nothing of anyone's money stays
      on the phone after Sign out. Viewing money offline is not in the MVP.
- [ ] **Sign-in keeps working:** the service worker never answers `/api/…` itself, so Google sign-in's
      `/api/auth/google/callback`, invite links and cookies behave as today.
- [ ] **Offline message:** without a network the start screen says the phone is offline (not "Couldn't reach
      the server") with Try again, and it continues by itself when the network is back. If the network drops while
      the app is open, the pill at the top says so instead of "Waking up the server…".
- [ ] **Updates:** after a release, an open app shows a notice *"A new version is ready"* with a *Reload* button
      (open point 2). A half-filled form is never reloaded away without the person's click. The next cold start
      uses the new version (owner, 2026-11-14).
- [ ] **Install hint:** the app offers to install itself in a browser on the phone (and in Chrome / Edge on the
      computer), never inside the installed app. On Android and desktop its button opens the browser's own install
      dialog; on iPhone it shows the two steps (Share → *Add to Home Screen*). Where it lives and how often it
      appears is chosen in the design round (open point 1).
- [ ] **Icons** from the current logo (owner, 2026-11-14).
- [ ] **Dark mode:** the browser's bars (`theme-color`) and the splash background follow the light / dark theme.
- [ ] Works at 375 px and 1440 px, light and dark; every new text through i18n.

## Tasks

- [ ] Owner: answer the open points; then references and 3 prototype stories for the install hint, the update notice
      and the offline start; the final prototype and the owner's approval
- [ ] ADR 0034: the service worker (Workbox via `vite-plugin-pwa`, `generateSW`): what is cached, `/api` excluded,
      updates on prompt
- [ ] `vite-plugin-pwa`: manifest, precache of the build, `navigateFallback` to `index.html` with `/api/` in
      `navigateFallbackDenylist`; no service worker in `vite` dev or Storybook
- [ ] Icons: 192, 512 and maskable 512 PNGs made from `favicon.svg` (`@vite-pwa/assets-generator` or a script),
      `theme-color` meta tags for light and dark
- [ ] API: check `sw.js` and `manifest.webmanifest` are served with `no-cache` and the right content type
      (`application/manifest+json`); a unit test in `SpaHostingExtensionsTests`
- [ ] Offline: online / offline state in `useServerWake` → the start screen and the pill
- [ ] Update notice (`virtual:pwa-register`, `onNeedRefresh`), checked at every start and while the app is open
- [ ] Install hint as chosen in the design round
- [ ] Storybook stories: the install hint (Android / desktop, iPhone), the update notice, the offline start screen
      and pill
- [ ] Unit tests: offline / online in `useServerWake`, the install hint's platform choice and its hiding inside the
      installed app, the update notice
- [ ] E2E: the PWA spec (below); the other specs run with service workers blocked (`serviceWorkers: 'block'`) so a
      cached shell can't change what they test
- [ ] Check on a real phone after the release: install on Android and iPhone, open at night while the server sleeps
      (owner)
- [ ] Docs: ARCHITECTURE (the service worker), DESIGN_RULES "Screen decisions", README (how to install)

## Tests

- Unit (Vitest): offline / online states of the start screen and the pill; the install hint shown only in a
  browser, with the right steps per platform; the update notice and its Reload.
- Unit (xUnit): `sw.js` and the manifest get `no-cache`; the manifest's content type.
- E2E (Playwright, the production build): the manifest is served with its name, icons and `standalone`; the
  service worker takes control of the page; with the network cut (`context.setOffline(true)`) the reloaded app
  appears from the cache and says it's offline; back online, it continues; `/api/…` is never answered from the cache.

## Open points

Asked and answered on 2026-11-14 (owner, in chat):

1. **Design round: yes, 3 prototype stories.** The install hint, the update notice and the offline message are new UI, so the plan is
   🎨 with 3 prototype stories. The variants would differ in where the install hint lives:
   - an *Install the app* row on the More page (phone) and in the user menu (desktop), opening a small sheet;
   - a one-time banner after sign-in on the phone, with *Not now* (never shown again after that);
   - both: the banner once, and the row on More after that.

   The update notice and the offline message reuse the toast and the pill in every variant.
2. **Updates: a notice with Reload.** *"A new version is ready · Reload"*, so nothing is lost mid-form (not a
   reload by itself as soon as a release is out, which could drop a half-typed transaction).
3. **Icons: the current logo.** The coin stack on the sky circle; on Android's shaped icons the sky fills the whole
   shape. No new icon.

## Design

### References

To collect in the design round: Mobbin "install app" / "banner" / "update available" patterns, and open examples
of installable apps (Twitter/X Lite, Starbucks, Spotify web, Excalidraw).

- web.dev, [Patterns for promoting PWA installation](https://web.dev/articles/promote-install): show install UI only
  after `beforeinstallprompt`; good places are a menu row, a dismissible snackbar after a few uses, or below the
  sign-in form; keep it out of the main flows.
- web.dev, [Installation prompt](https://web.dev/learn/pwa/installation-prompt): keep the event, call `prompt()`
  from the app's own button.
- [vite-plugin-pwa: service worker strategies](https://vite-pwa-org.netlify.app/guide/service-worker-strategies-and-behaviors)
  and [auto update](https://vite-pwa-org.netlify.app/guide/auto-update): `autoUpdate` forces `skipWaiting` and
  reloads; `prompt` waits for the app's own Reload button.
- iOS 26 *Add to Home Screen* opens sites as web apps by default (MacRumors,
  [Safari in iOS 26](https://www.macrumors.com/guide/ios-26-safari-features/);
  [firt.dev iOS PWA notes](https://firt.dev/notes/pwa-ios/)).

## Notes

- Out of scope: offline viewing or adding of transactions, and push notifications. Neither is planned yet; each
  would be its own change after the MVP.
- E2E runs against `vite preview`, the production build, so the service worker is real there; that is why the
  other specs block it.
