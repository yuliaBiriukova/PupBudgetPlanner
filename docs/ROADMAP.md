# Roadmap

MVP first, deployed and usable by our family; then expand. Each milestone ends with a working app.
Releases happen by merging `develop` into `main` (the only deployed branch).
Feature details are in [BACKLOG.md](BACKLOG.md) and [changes/](changes/).

## MVP

| # | Milestone | Features | Outcome | Status |
|---|-----------|----------|---------|--------|
| M0 | Foundation | F-001 – F-009 | Repo, docs, scaffolded backend + frontend, Storybook, Playwright, CI, hello world deployed to Render + Neon | In progress |
| M1 | Authentication & app shell | F-010 – F-013 | Sign up / sign in (email + password, Google), app layout & navigation, default categories | Todo |
| M2 | Accounts & categories | F-014 – F-016 | Accounts with opening balances and balances overview, categories view, settings | Todo |
| M3 | Transactions | F-017 – F-020 | Quick add expense / income / transfer (incl. currency exchange), list, edit, delete; NBU rates | Todo |
| M4 | Reports | F-021 – F-022 | Monthly and yearly reports like the spreadsheet, in the report currency | Todo |
| M5 | Family | F-023 – F-024 | Create family, invite link, member and combined views | Todo |
| M6 | MVP release | F-025 – F-026 | PWA, polish, launch | Todo |

## After MVP

| # | Milestone | Outcome |
|---|-----------|---------|
| M7 | Quality | Integration tests with Testcontainers in CI |
| M8 | Email | Resend: email confirmation, password reset, invitations by email |
| M9 | Privacy & categories | Private accounts / transactions; add / rename / reorder / remove categories |
| M10 | Data import | Spreadsheet history 2024–2026, Monefy CSV |
| M11 | Insights | Dashboard with charts, budgets per category, Excel export |
| M12 | Localization | Ukrainian UI |
| M13 | Automation | Monobank API auto-import of card transactions |

Order after the MVP will be agreed when we get there.
