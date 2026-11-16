# F-032 · Generic default categories for new people

| | |
|---|---|
| Type | Feature |
| Milestone | M9 — Privacy & categories |
| Priority | Medium |
| Status | Done |
| Branch | `feature/F-032-generic-default-categories` |
| Design | not needed (the set is data; the screens don't change) |
| Approved | 2026-11-16 ("Approved, build it") |

## Goal
A person who signs up gets a generic set of starting categories, not the owner's own personal ones, so the app can
be opened to people outside the family ([Q-011](../../../OPEN_QUESTIONS.md)).

## Today
Every new person gets a copy of the spreadsheet's set
([`DefaultCategories.cs`](../../../../backend/src/PupBudgetPlanner.Domain/Categories/DefaultCategories.cs), written
when the account is created in `AccountCreator`; listed in [PRODUCT.md](../../../PRODUCT.md#default-categories)).
Personal ones: Bank commission, English lessons, Piano lessons, Driving, Spotify, Emergency; the slash names
(Salon/Barber, Medicine/Drugs/Skincare) are the spreadsheet's wording.

## Agreed (owner, 2026-11-15)

The owner took Claude's proposal as it was and added the Car group; the Pets and Kids groups were turned down.

| # | Group | Categories | Change from today |
|---|-------|-----------|--------|
| 1 | Income | Salary, Side income, Gifts, Other | + Side income |
| 2 | Home expenses | Rent, Bills, Home supplies, Electronics, Bank fees, Tax, Delivery, Services, Other | Bank commission → Bank fees; Gifts moved to Daily living; + Services |
| 3 | Daily living | Food, Toiletries, Clothing, Eating out, Transportation, Self-care, Sport, Gifts, Other | Groceries → Food; + Toiletries; Salon/Barber → Self-care; Gifts from Home expenses; + Other |
| 4 | Car | Fuel, Parking, Service & repairs, Insurance, Other | new group, next to Daily living (transport) |
| 5 | Health | Doctor/Dentist, Medicine, Therapy, Other | Medicine/Drugs/Skincare → Medicine; − Emergency; + Other |
| 6 | Entertainment | Activities, Books, Games, Hobbies, Vacation, Other | + Other |
| 7 | Subscriptions | Music & streaming, Phone, Software, Other | Spotify → Music & streaming; + Software; Subscriptions → Other |

- Review round 1 (owner, 2026-11-15): Groceries → Food; Hobbies → Hobby; the Education group removed (English
  lessons, Piano lessons and Driving go with it); a Toiletries category added; Personal care needs a narrower name;
  why Taxi is apart from Transportation.
- Review round 2 (owner, 2026-11-15): Taxi stays apart and Transportation becomes Public transport; Personal care
  becomes Self-care; Toiletries (soap, shampoo, toothpaste, skincare) goes in Daily living, after Food.
- Review round 3 (owner, 2026-11-15): Hobby back to Hobbies.
- Review round 4 (owner, 2026-11-16): Toiletries → Toiletry, then back to Toiletries.
- Review round 5 (owner, 2026-11-16): every group ends with an "Other" category (40 categories in 7 groups).
- Review round 6 (owner, 2026-11-16): Public transport and Taxi merged back into Transportation; Services added to
  Home expenses and Software to Subscriptions (each before Other); the expense Gifts moved from Home expenses to Daily
  living (the income Gifts stays). 41 categories in 7 groups.

- **Who gets it:** everyone who signs up from now on, family members included. Existing accounts keep their
  categories; nothing is changed in the database (no migration of anyone's data).
- People who want the old categories add them in Categories (F-029).

## Acceptance criteria
- [x] A person who signs up (email or Google) gets the agreed set, in the agreed order.
- [x] Existing people's categories, transactions and reports are unchanged.
- [x] PRODUCT.md "Default categories" lists the new set; Q-011 is moved to Answered.

## Tasks
- [x] Agree on the set and who gets it with the owner (Q-011, 2026-11-15).
- [x] Replace the set in `DefaultCategories`; update its unit tests (`DefaultCategoriesTests`, `CategoriesOverviewTests`). The tests that used the old default as data (`CategorySetTests`, `SpreadsheetYearTests`) get it as test data, `SpreadsheetCategories`.
- [x] Check the E2E tests that pick a default category by name after sign-up and update them (categories, transactions, reports, family views, family privacy: Groceries → Food, the new groups and counts).
- [x] Docs: PRODUCT.md, Q-011, ROADMAP (M9 Done), BACKLOG, PROGRESS, ADR 0015.

## Tests
- Unit: `DefaultCategoriesTests` — the groups, categories and order of the new set; every group ends with "Other". `CategoriesOverviewTests` — the new set in the report order.
- E2E (Playwright): `categories.spec.ts` — a new person sees the new set on the Categories page (phone and desktop); the specs that use a default category by name updated.
- Screens: unchanged; a new person's Categories page checked in screenshots at 375 px and 1440 px, light and dark, and in the Browser pane.

## Notes
- Added 2026-11-15 at the owner's request ("Finish M9 (Q-011)").
- Category names are stored as text in English. A Ukrainian default set (M12) will need its own decision on how
  new people get names in their language.
