# Product

## Problem

Today we track every expense and income daily in a mobile app (Monefy), and at the end of each month
copy category totals by hand into a Google Sheets spreadsheet — one sheet per person per year.
That is double work, and the free Monefy version has no custom categories and no multiple currencies.

## Goal

One web application where each person enters daily expenses, income and transfers, and the
monthly / yearly report (the same shape as the spreadsheet) is built automatically — per person and
for the whole family. Works well on a phone and on a desktop. Anyone can sign up.

## Users

- **Person** — signs up, has their own accounts, categories and transactions.
- **Family** — a group of people. Each person belongs to at most one family. Family members can see
  each other's data and the combined family numbers.

## Features

### MVP

1. **Sign up / sign in** — email + password, and Google sign-in.
2. **Accounts (where the money is)** — e.g. "Monobank UAH", "PrivatBank USD", "Cash EUR".
   Each account has one currency and an opening balance. Current balance per account and the
   total in the report currency.
3. **Categories** — every new user gets their own copy of the default categories (below).
4. **Transactions**
   - Expense: account, amount, category, date, note.
   - Income: account, amount, category, date, note.
   - Transfer: from account → to account. If the currencies differ (currency exchange), both
     amounts are entered (e.g. 100 USD → 4,150 UAH); the effective rate is calculated from them
     and the app suggests the target amount using the NBU rate.
   - List with filters (period, account, category, type); edit and delete.
   - Fast entry on mobile is a priority — this replaces Monefy.
5. **Reports** — monthly and yearly, same layout as the spreadsheet:
   category groups → categories as rows, months as columns, `Total` and `Avg`;
   summary rows `Total Income`, `Total Expenses`, `NET`, and balance at month end.
6. **Family** — create a family, invite a member with an invite link, accept the invitation.
   Switch any report / list between **Me**, **a family member**, and **Family (combined)**.
7. **Settings** — display name, report currency (default UAH).
8. **Installable on the phone** (PWA), responsive for mobile and desktop.

### After MVP (candidates, in no fixed order)

- Integration tests (Testcontainers, in CI).
- Email via Resend: email confirmation, password reset, invitations by email.
- Private accounts / transactions hidden from the family.
- Category management: add, rename, reorder, **remove default categories**.
- Ukrainian localization.
- Import history from the Google Sheets spreadsheet (2024–2026).
- Import from Monefy CSV export.
- Dashboard with charts.
- Budgets / limits per category.
- Export of reports to Excel.
- Automatic import of card transactions from the Monobank personal API.
- Transfer fees as part of a transfer.

### Out of scope

- Recurring transactions — not needed.

## Domain glossary

| Term | Meaning |
|------|---------|
| Account | A place where money is stored: bank account or cash. Has exactly one currency. |
| Transaction | Expense, Income or Transfer. |
| Category group | Top-level grouping for the report: Income, Home expenses, Daily living, … |
| Category | A row in the report, e.g. Groceries. Belongs to a group. Owned by one person. |
| Report currency | Currency in which reports are shown (default UAH). |
| Family | A group of people who see each other's finances. |

## Business rules

1. **Exchange rates.** Amounts in other currencies are converted into the report currency with the
   official **NBU rate on the transaction date**. Past months therefore never change when the rate
   changes (the spreadsheet recalculated everything with *today's* rate).
2. **Transfers are not income or expense.** They only move money between accounts. A bank commission
   is entered as a separate expense in the "Bank commission" category.
3. **Balance of an account** = opening balance + income − expenses ± transfers.
4. **Balance at month end** in reports = sum of all account balances at the last day of the month,
   converted with the NBU rate of that day.
5. **Categories are personal**, but every user starts from the same default set. The family report
   merges categories that have the same group and name.
6. **One family per person.** A person can leave a family; the family owner can remove members.
7. **Average** in the yearly report = total ÷ number of months that already passed in that year
   (the spreadsheet always divided by 12). *(See OPEN_QUESTIONS Q-004.)*

## Default categories

Based on the 2026 spreadsheet (Yulia's and Vlad's sheets merged; "Therapist" and "Therapy" are the
same category; meter categories such as electricity and water are dropped — they are part of "Bills").

| Group | Categories |
|-------|-----------|
| Income | Salary, Gifts, Other |
| Home expenses | Rent, Bills, Home supplies, Electronics, Bank commission, Gifts, Tax, Delivery, Other |
| Daily living | Groceries, Clothing, Eating out, Transportation, Salon/Barber, Sport |
| Health | Doctor/Dentist, Medicine/Drugs/Skincare, Emergency, Therapy |
| Education | English lessons, Piano lessons, Driving |
| Entertainment | Activities, Books, Games, Hobbies, Vacation |
| Subscriptions | Spotify, Phone, Subscriptions |

> "Emergency" is under Health in Yulia's sheet and under Home expenses in Vlad's — see Q-001.
