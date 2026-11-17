# Roadmap

MVP first, deployed and usable by our family; then expand. Each milestone ends with a working app.
Releases happen by merging `develop` into `main` (the only deployed branch).
Feature details are in [BACKLOG.md](BACKLOG.md) and [changes/](changes/).

## MVP

| # | Milestone | Features | Outcome | Status |
|---|-----------|----------|---------|--------|
| M0 | Foundation | F-001 – F-009 | Repo, docs, scaffolded backend + frontend, Storybook, Playwright, CI, hello world deployed to Render + Neon | Done |
| M1 | Authentication & app shell | F-010 – F-013, F-028 | Sign up / sign in (email + password, Google), app layout & navigation, default categories; invite-only sign-up while the app is for family and friends | Done |
| M2 | Accounts & categories | F-014 – F-016 | Accounts with opening balances and balances overview, categories view, settings | Done |
| M3 | Transactions | F-017 – F-020 | Quick add expense / income / transfer (incl. currency exchange), list, edit, delete; NBU rates | Done |
| M4 | Reports | F-021 – F-022 | Monthly and yearly reports like the spreadsheet, in the report currency | Done |
| M5 | Categories & family | F-029, F-023 – F-024, F-030 | Add / rename / reorder / remove categories and groups; create family, invite link, member and combined views; each person decides what the family sees of their money | Done (F-029, F-023, F-024, F-030, I-006) |
| M6 | MVP release | F-025 – F-026 | PWA, polish, launch | Done (released 2026-11-14) |

## After MVP

| # | Milestone | Outcome |
|---|-----------|---------|
| M7 | Budgets | A monthly budget (a total, groups and categories): plan each month, see what's left on a Budget page, when adding an expense and on Transactions; a reminder on the 1st (F-033, done); saving jars for goals, filled from the month's plan and its savings (F-034) |
| M8 | Email | Resend: email confirmation, password reset, invitations by email |
| M9 | Privacy & categories | Delete my account (F-027, done); a privacy policy page (F-031, done); a generic default set for new people (F-032, done) |
| M10 | Data import | Spreadsheet history 2024–2026, Monefy CSV |
| M11 | Insights | Dashboard with charts, Excel export |
| M12 | Localization | Ukrainian UI |
| M13 | Automation | Monobank API auto-import of card transactions |

Order after the MVP will be agreed when we get there.
