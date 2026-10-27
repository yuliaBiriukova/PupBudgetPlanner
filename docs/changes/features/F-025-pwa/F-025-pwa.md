# F-025 · Installable app (PWA)

| | |
|---|---|
| Type | Feature |
| Milestone | M6 — MVP release |
| Status | Todo |
| Branch | `feature/F-025-pwa` |
| Design | not needed |

## Goal

Open the app from the phone's home screen like a native app.

## Acceptance criteria

- [ ] Manifest with name, icons and colors; installable on Android and iOS
- [ ] App shell is cached, so the app opens instantly even when the server sleeps
- [ ] Offline / waking-up message instead of an error page

## Tasks

- [ ] Add `vite-plugin-pwa`
- [ ] Icons
- [ ] Caching strategy
- [ ] Install hint

## Tests

- Unit: —
- E2E (Playwright): Manifest and service worker are present.

## Notes

- —
