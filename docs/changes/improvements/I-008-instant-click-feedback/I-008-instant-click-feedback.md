# I-008 · Instant response to clicks on check boxes and dialog buttons

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | High |
| Status | Done (closed without changes: not reproducible on production) |
| Branch | — (nothing built; closed in the I-007 pull request) |
| Design | not needed (same look, faster) |
| Approved | — (nothing to build) |

## Goal
Clicking a check box, or a button that opens a dialog, responds at once. Today there is a visible delay, and the
app feels slow. Found by the owner after F-028, 2026-10-29.

## Acceptance criteria
- [ ] A check box shows its new state within one frame of the click (no visible delay), also with a long People
      list.
- [ ] A dialog or phone sheet starts opening right after the click.
- [ ] The cause is found and written down here (measured, not guessed), with numbers before and after.

## Tasks
- [ ] Measure in the browser (Performance panel / React Profiler) on the People page with many people: which
      clicks are slow and why.
- [ ] Write the root cause and the planned fix here; owner approves.
- [ ] Fix.

## Tests
- Unit: —
- E2E (Playwright): a check box is checked and a dialog is visible shortly after the click.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
- Possible causes to check (not confirmed): the whole list re-rendering on every check box change; Mantine's
  open/close transitions on `Modal` / `Drawer` and the check box; work done before the dialog is shown.
- **Closed 2026-10-29 without changes.** The owner tested on production: check boxes and dialog buttons respond
  fine there. The delay was seen on localhost, most likely because of the development build (React's development
  mode and the Vite dev server are much slower than the production build). Nothing was measured or changed; if the
  delay shows up on production, it gets a new bugfix.
