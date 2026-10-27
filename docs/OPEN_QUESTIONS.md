# Open questions

When a question is answered, move it to "Answered" with the answer and date, and update the related docs.

## Open

| ID | Question | Proposal | Blocks |
|----|----------|----------|--------|
| Q-001 | "Emergency" is under **Health** in Yulia's sheet and under **Home expenses** in Vlad's. Which group should the default category be in? | Health | T-106 |
| Q-002 | The free Render API sleeps after 15 min idle (wake-up up to ~1 min). Should we add a free external ping (e.g. cron-job.org every 14 min, 07:00–23:00 Kyiv time) to keep it awake during the day? Fits in Render's 750 free hours/month. | Yes, from M6 | T-603 |
| Q-003 | Can a person **add** their own categories in the MVP (removing defaults is post-MVP)? | Post-MVP, together with remove/rename | T-204 |
| Q-004 | Yearly "Avg": divide by 12 (like the spreadsheet) or by the number of months passed so far? | Months passed | T-402 |

## Answered

| ID | Question | Answer | Date |
|----|----------|--------|------|
| — | Hosting | Render (not Azure, not Google Cloud Run); database on Neon | 2026-10-27 |
| — | UI library | Mantine | 2026-10-27 |
| — | Frontend | React + TypeScript | 2026-10-27 |
| — | Exchange rate for reports | NBU official rate on the transaction date | 2026-10-27 |
| — | Repository | Private GitHub repo, created with the GitHub CLI | 2026-10-27 |
| — | UI language | English; Ukrainian localization later | 2026-10-27 |
| — | Report currency | UAH by default, each user can choose their own | 2026-10-27 |
| — | Categories | Personal; defaults from Yulia's categories; removing defaults is post-MVP | 2026-10-27 |
| — | Family privacy | Private accounts/transactions — post-MVP | 2026-10-27 |
| — | Families per user | One | 2026-10-27 |
| — | History import | Post-MVP | 2026-10-27 |
| — | Integration tests / Docker | Post-MVP; no local Docker | 2026-10-27 |
| — | Email | Password-only sign-up first; Resend later | 2026-10-27 |
| — | Google sign-in | In the MVP | 2026-10-27 |
| — | Recurring transactions | Not needed | 2026-10-27 |
