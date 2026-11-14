# Privacy policy text

The text of Pup Budget's privacy policy. For now the owner publishes it as a Google Doc ("Publish to web") and puts
that link on Google's Branding page, so the Google app can be published; F-031 then shows the same text on the app's
own `/privacy` page, and the Branding page's link moves there.

Before publishing, the owner fills in the **[contact email]**: the address people write to (the Branding page's
support email is a good choice). It stays out of the repository; the app's page takes it from the `VITE_CONTACT_EMAIL`
build setting on Render. The restore window is Neon's 6-hour history window on the `production` branch (owner,
2026-11-14); no snapshots are kept.

The app's page shows this text from `frontend/src/shared/i18n/locales/en.json` (`privacyPolicy`); the two are changed
together. It is written from what the app does on 2026-11-14 (data model, cookie, hosting in `render.yaml`, no analytics). When
a change alters what the app keeps or who sees it, this text is updated in the same change.

---

# Pup Budget privacy policy

*Last updated: 14 November 2026*

Pup Budget is a small budgeting app for a family and the people they invite. It is run by one person, not a company.
This page says what the app keeps about you, why, who can see it and how to have it deleted.

**In short:** Pup Budget keeps only what you put into it and what it needs to sign you in. It has no ads, no
analytics and no trackers, and it never sells or shares your data.

## What Pup Budget keeps

**Your account**

- your email address and the name you give;
- your password, stored only as a secure hash: nobody, including the person running the app, can read it;
- if you sign in with Google: your Google account's ID, email address and name. Pup Budget asks Google for nothing
  else: not your contacts, files, mail or calendar;
- when you joined, and the note of the invite link you joined with;
- your settings: report currency and what your family may see of your money.

**Your money data**

- your accounts (name, currency, bank, opening balance, card colour);
- your transactions (amount, date, account, category and the note you write);
- your categories and groups;
- your family, if you are in one, and the invite links you create.

**In your browser**

- one sign-in cookie that keeps you signed in. It is needed for the app to work, is not used for anything else and
  expires 30 days after you last used the app;
- a few display choices (such as the colour scheme, which groups are open, whether the sidebar is folded) kept in
  your browser's storage. They never leave your device;
- if you install the app, your device keeps the app's own files so it opens quickly. Your money data is not stored
  there.

## Why

Only to run the app for you: to sign you in, keep your accounts and transactions, show your totals and reports, and
share with your family what you have chosen to share. Exchange rates come from the National Bank of Ukraine; Pup
Budget sends it nothing about you.

## Who can see your data

- **You.**
- **Your family members**, if you join a family: only what your family privacy settings allow. You can change them at
  any time in Family.
- **The person who runs Pup Budget** sees, on the admin page, the names and email addresses of the people using the
  app, when they joined and whether their access is on, so they can manage invitations and access. As the person who
  looks after the app and its database, they could technically reach other data too; they do not look at your money
  data unless you ask for help with it.
- **Nobody else.** Your data is not sold, rented or shared with anyone, and not used for advertising.

## Where it is kept

Pup Budget uses these services to run:

- **Render** hosts the app, in Frankfurt, Germany. Its server logs may record IP addresses and the times of requests
  for a short time, to keep the service running and safe.
- **Neon** keeps the database.
- **Google**, only if you choose to sign in with Google.

All connections to Pup Budget are encrypted (HTTPS).

## How it is protected

- Sign-up is by invitation only.
- Passwords are stored only as secure hashes.
- After 5 wrong passwords in a row the account is locked for 15 minutes, and repeated sign-in attempts from one place
  are slowed down. Your IP address is used for this only while it happens and is not stored.
- Pages of the app cannot be shown inside other websites.

## How long it is kept

Your data is kept while your account exists. When your account is deleted, everything in it (accounts, transactions,
categories, settings and sign-in details) is deleted with it, and it leaves the database's short-term restore history
within 6 hours. Invite links that can no longer be used are deleted after 30 days.

## Your choices

- **See and change** your name, settings, accounts and transactions in the app at any time.
- **Choose what your family sees** in Family.
- **Delete your account and all its data:** write to [contact email] from your account's email address, and it is
  done within 30 days. Deleting your account yourself in Settings is coming.
- **Ask what is kept about you**, or anything else about your data: [contact email].

## Changes to this page

When this page changes, the date at the top changes. If a change affects what Pup Budget keeps or who can see it,
the app tells you before it applies.

## Contact

[contact email]
