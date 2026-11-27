# Open questions

When a question is answered, move it to "Answered" with the answer and date, and update the related docs.

## Open

| ID | Question | Proposal | Blocks |
|----|----------|----------|--------|

## Answered

| ID | Question | Answer | Date |
|----|----------|--------|------|
| Q-015 | Monthly budget (F-033) with its total: what does the quick-add form show for a category with no budget in a group with none? Do the jars planned in the month (F-034) count within the month's total? | The month's total "left"; yes, the total is what the person plans to spend and set aside, so planned jar amounts count within it | 2026-11-16 |
| Q-014 | Saving jars (F-034): currency, taking money out, reaching the goal, progress, which account saved money comes from, moving what's left mid-month, spending into jar money, where jars show | One currency per jar (NBU rate when converted); take out any time; "Goal reached", then close; progress bar and "a month to make it"; the person picks the account; ~~the month's total "left" goes down~~ (changed 2026-11-27: jar money isn't an expense, the month's spent and left don't change); a warning on the account; a section on Accounts or its own page (design round). Details in [F-034](changes/features/F-034-saving-jars/F-034-saving-jars.md#q-014-and-q-015-owner-accepted-claudes-proposals-as-they-were-2026-11-16) | 2026-11-16 |
| Q-013 | Monthly budgets (F-033): per group too? A family budget? Income? Past months? A skipped month? The push time on the 1st? | A total for the month, groups and categories (changed the same day): a group's budget not smaller than its categories' sum, the groups' sum not bigger than the total; personal only for now; no income budgets; past months viewable and editable; a skipped month is offered to plan; push at 09:00 Kyiv. Details in [F-033](changes/features/F-033-category-budgets/F-033-category-budgets.md#q-013-owner-accepted-claudes-proposals-as-they-were-2026-11-16) | 2026-11-16 |
| Q-011 | Default categories for people outside the family: the current set is the owner's own (Bank commission, English / Piano lessons, Driving, Spotify, Emergency) | A generic set for everyone who signs up from now on (family too); existing accounts keep theirs. The personal ones renamed or dropped (no Education group), Toiletries, Services, Software, Side income, an "Other" in every group and a Car group added; no Pets or Kids groups. The set is in [F-032](changes/features/F-032-generic-default-categories/F-032-generic-default-categories.md#agreed) | 2026-11-15 |
| Q-010 | Deleting an account: right away or after a grace period; how to confirm; a family owner with other members; signing up again; export first? | Right away; the password (or Google once more) plus a typed word; the owner picks the next owner, as "Leave family" does; signing up again needs an invite like anyone new; export once M11 has it. Details in [F-027](changes/features/F-027-delete-account/F-027-delete-account.md#agreed) | 2026-11-14 |
| Q-012 | Accounts already created on production before invite-only sign-up | They keep access and show "Before invites"; after the release the admin looks through the People page and blocks or deletes anyone unknown (F-028) | 2026-10-29 |
| Q-001 | Group of the default "Emergency" category | Health | 2026-10-27 |
| Q-002 | Keep the free API awake during the day with an external ping? | Yes: every 14 min, 07:00–23:00 Kyiv (F-009) | 2026-10-27 |
| Q-003 | Can people add their own categories in the MVP? | No, after the MVP together with rename / remove (2026-10-27). Changed 2026-11-06: yes, in the MVP before Family, with groups too (F-029) | 2026-11-06 |
| Q-004 | Yearly "Avg": divide by 12 or by months passed? | Months passed | 2026-10-27 |
| Q-005 | Hosting | Render, one service (SPA + API) for the least risk with Google sign-in; database on Neon | 2026-10-27 |
| Q-006 | Storybook hosting without paying for GitHub Pages | Free Render static site | 2026-10-27 |
| Q-007 | Branching and commits | `main` / `develop` / `feature` / `improvement` / `bugfix`; IDs `F-` / `I-` / `B-`; only `main` deployed | 2026-10-27 |
| Q-008 | Docs per change | `docs/changes/{features,improvements,bugfixes}/<ID-name>/` with all related files | 2026-10-27 |
| Q-009 | Setup work type | Feature | 2026-10-27 |
| — | UI library / frontend | Mantine / React + TypeScript | 2026-10-27 |
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
