# F-025 · Installable app (PWA)

| | |
|---|---|
| Type | Feature |
| Milestone | M6 — MVP release |
| Status | In progress (variant 3 chosen 2026-11-14; final prototype waiting for the owner's approval) |
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
  - iPhone and iPad (iOS 26 and later) have no install event. A person adds the site through Safari's ••• → Share →
    *Add to Home Screen*, and it opens as a web app by default ("Open as Web App" switch). Instructions are the only
    help the app can give there.

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
      dialog; on iPhone it shows Safari's three taps (••• → Share → *Add to Home Screen*, then Add). Where it lives
      and how often it appears is chosen in the design round (open point 1).
- [ ] **Icons** from the current logo (owner, 2026-11-14).
- [ ] **Dark mode:** the browser's bars (`theme-color`) and the splash background follow the light / dark theme.
- [ ] Works at 375 px and 1440 px, light and dark; every new text through i18n.

## Tasks

- [x] Owner: answer the open points (2026-11-14)
- [x] References and 3 prototype stories for the install hint, the update notice and the offline start (round 1,
      2026-11-14)
- [x] The owner's choice: variant 3 (2026-11-14); the final prototype
- [ ] The owner's approval of the final prototype
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

### Brief (2026-11-14)

- **Who and when:** the couple, once per phone (and per computer): the day they put the app on the home screen.
  After that, every release (a toast) and every blackout or metro ride without a network (the pill).
- **The one job:** get Pup Budget onto the home screen once, without nagging, then stay quiet. What they must see
  first: what installing gives (it opens at once, even at night) and the one button or the taps to do it.
- **The subject's world:** the phone's home screen with the app's icon among the others; Safari's own buttons,
  drawn the way the person will find them; Kyiv's blackouts, when the network goes and the app should say so plainly.
- **One feeling:** "it's a real app now", calm, asked once.

### Plan from the design system

- **Reused:** the app shell (top bar, tab bar, More sheet, the sidebar and its rows), `ResponsiveDialog` (sheet on
  the phone, dialog on the desktop), the app's buttons (primary pill, quiet word), the toast (Mantine's notification
  in the app's places, B-013), the waking-up pill's look and place, the start screen with the brand.
- **New:** the install sheet; the More row with a second line; the sidebar row; the card (variants 2 and 3); the
  update toast with Reload; the offline pill and start. No new token: the tile uses the logo's colours, the home
  screen picture the slip's charcoal (`--pup-color-hero`).
- **The bold element:** the sheet's picture of a home screen at night with the app's icon on it (the logo's sky as a
  rounded square, as Android and the iPhone will show it).
- **Motion:** none beyond the sheet's own.
- **Slop check:** the iPhone steps are numbered because they are a sequence; Safari's buttons are drawn as small
  keys with their icons, not as text in quotes; no icon in a tinted circle on the rows; no "Submit"-like copy
  ("Install", "Not now", "Got it", "Reload").

### References (2026-11-14)

Mobbin needs a sign-in for its search, so open examples and guides were used instead:

- Discourse's iOS *Add to Home Screen* pop-up ([meta.discourse.org](https://meta.discourse.org/t/ios-add-to-homescreen-popup/266897)):
  a short pop-up with the steps and Safari's Share icon drawn in the text. Taken: the steps with the icons inline.
- OneSignal's and Notificare's install banners for iPhone
  ([OneSignal](https://documentation.onesignal.com/docs/en/getting-your-audience-to-add-to-home-screen.md),
  [Notificare](https://notificare.com/blog/2024/09/16/web-push-in-ios-add-to-home-screen/)): a small banner once,
  with the reason to install. Taken: variant 2's card, with the reason in one line.
- The reload snackbar of installable apps ([mwc-pwa-reload](https://npmjs.com/package/mwc-pwa-reload),
  [Dean Hume](https://deanhume.com/displaying-a-new-version-available-progressive-web-app/)): a toast that stays,
  with one action; dismissing it keeps the old version until the next start. Taken: the update toast as it is.
- iOS 26's Safari moved Share into the ••• menu
  ([MacRumors how-to](https://www.macrumors.com/how-to/save-safari-bookmark-web-app-iphone-home-screen/)): ••• →
  Share → *Add to Home Screen* → Add. Taken: the three taps in the iPhone sheet (not two, as first planned).
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

### Prototype stories (round 1)

*Prototypes / F-025 Installable app*, each opening on Transactions as Yulia. The toolbar's Controls (or `&args=` in
the link) set **platform** (*Chrome or Edge*: the app's Install opens the browser's own dialog; *iPhone Safari*:
the three taps; *Installed app*: no hint anywhere) and **moment** (*Update ready*: the toast; *Offline*: the pill).

- [Variant 1: In the menu](http://localhost:6006/?path=/story/prototypes-f-025-installable-app--in-the-menu&nav=false&panel=false&globals=viewport.value:!undefined):
  quiet. *Install the app* is the first row in More, with "Opens at once from your home screen" under it; on the
  desktop a row over the account row at the sidebar's foot (there is no user menu), only in Chrome or Edge. Found
  only by someone who opens More.
- [Variant 2: Once on the page](http://localhost:6006/?path=/story/prototypes-f-025-installable-app--once-on-the-page&nav=false&panel=false&globals=viewport.value:!undefined):
  on the phone a card at the top of the page with the app's icon, "Pup Budget on your home screen", one line on why,
  Install and Not now. After Not now it is gone for good (only the browser's own menu is left). Nothing on the
  desktop: Chrome's address bar has its own install button.
- [Variant 3: Once, then in More](http://localhost:6006/?path=/story/prototypes-f-025-installable-app--once-then-in-more&nav=false&panel=false&globals=viewport.value:!undefined):
  variant 2's card first; Not now says "It's in More whenever you want it" and the row from variant 1 is there from
  then on. The desktop has variant 1's sidebar row.
- [Every variant: offline at start](http://localhost:6006/?path=/story/prototypes-f-025-installable-app--offline-at-start&nav=false&panel=false&globals=viewport.value:!undefined):
  the app opened from the home screen without a network: the brand, "You're offline.", "Pup Budget opens once the
  phone is online again." and Try again.

The same in every variant: the install sheet (a dialog on the desktop) with the home screen picture, one sentence on
what it gives and Install / Not now, or on the iPhone the three taps and Got it; the update toast "A new version is
ready." with Reload (it stays until Reload or ×); the pill "No connection: you can look, not save" in the waking-up
pill's place.

Checked 2026-11-14: the design check on the four stories (360 – 1440 px, light and dark): 0 issues, 0 console errors;
the states inside the page (More open, both sheets, the card's Not now, the update toast, the offline pill, the
installed app) as Playwright screenshots at 375 and 1440 px, light and dark, looked at.

Chosen variant: **variant 3 "Once, then in More"** (owner, 2026-11-14). Variants 1 and 2 were removed.

### Final prototype (2026-11-14)

[Final prototype](http://localhost:6006/?path=/story/prototypes-f-025-installable-app--final&nav=false&panel=false&globals=viewport.value:!undefined)
and [Final: offline at start](http://localhost:6006/?path=/story/prototypes-f-025-installable-app--offline-at-start&nav=false&panel=false&globals=viewport.value:!undefined)
in *Prototypes / F-025 Installable app*, with the same controls (platform, moment). Variant 3 as shown in round 1:

- **Phone, in a browser:** the card at the top of the page once (the app's icon, "Pup Budget on your home screen",
  "Opens at once, even while the server sleeps at night.", Install and Not now). Not now hides it for good and says
  "It's in More whenever you want it."; from then on *Install the app* is the first row in More, with "Opens at once
  from your home screen" under it.
- **Desktop, in Chrome or Edge:** *Install the app* as a row over the account row at the sidebar's foot (a tooltip
  in the rail). Safari on the Mac and Firefox get no hint.
- **Install** (card, row) opens the sheet (a dialog on the desktop): the home screen picture, one sentence on what it
  gives; Chrome or Edge: Not now and Install (the browser's own dialog); iPhone: the three taps (••• → Share → Add to
  Home Screen, then Add) and Got it.
- **Installed app:** no card, no row, no sheet.
- **After a release:** the toast "A new version is ready." with Reload, until Reload or ×.
- **Offline:** the pill "No connection: you can look, not save" in the waking-up pill's place; opened without a
  network, the start screen says "You're offline." and "Pup Budget opens once the phone is online again." with Try
  again.

Checked 2026-11-14: the design check on both stories (360 – 1440 px, light and dark): 0 issues, 0 console errors; the
states inside the page as Playwright screenshots at 375 and 1440 px, light and dark, looked at.

## Notes

- Out of scope: offline viewing or adding of transactions, and push notifications. Neither is planned yet; each
  would be its own change after the MVP.
- E2E runs against `vite preview`, the production build, so the service worker is real there; that is why the
  other specs block it.
