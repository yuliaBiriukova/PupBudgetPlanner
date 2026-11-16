# F-033 · Monthly budget: total, groups and categories

| | |
|---|---|
| Type | Feature |
| Milestone | M7 — Budgets |
| Priority | Medium |
| Status | Done (2026-11-16) |
| Branch | `feature/F-033-category-budgets` (planned on `plan/m7-budgets-and-jars`) |
| Design | 🎨 3 prototype stories required (the Budget page with the month's total, group and category budgets, "left" in the quick-add form and on Transactions, the reminder banner) |
| Approved | 2026-11-16 — the description and the final prototype (owner: "the final prototype for f-033 is approved, build it"); 2026-11-16 — the column under the month's final prototype (owner: "Approved, build it") |

## Goal
A person plans how much they will spend this month in total, in a group and in each category, then sees at any time how much is left in each
one, so they can slow down before a category runs out instead of finding it in the report at the month's end.
Asked by the owner on 2026-11-16 as the new M7 (in place of Quality); it was "budgets per category" in M11.

## Acceptance criteria
- [x] A person plans each month's budget on three levels, each optional: a **total for the month**, a budget for
      each expense **group** and for each expense **category**. A new month's plan starts prefilled with last
      month's amounts (all three levels); the person changes what they need and saves. Amounts can be changed or
      removed during the month.
- [x] **Each level fits within the one above it:**
  - a **group's** budget may not be smaller than the sum of its categories' budgets (Daily living 15,000 with
    Food 10,000 and Eating out 3,000 is fine; Eating out 6,000 is not);
  - the **groups' budgets** together may not be bigger than the **month's total** (a group without a budget of its
    own counts with the sum of its categories' budgets);
  - saving is blocked with a message that says what goes over and by how much, also when a group's budget or the
    total is lowered below what is inside it.
- [x] **What counts against each budget:** a category's own spending; a group's: spending in all its categories,
      with or without a budget of their own; the month's total: all the month's expenses. A group without a budget
      of its own shows the sum of its categories' budgets.
- [x] Nothing carries over: unspent money or overspending stays in its month.
- [x] A **Budget page** shows the month's total, groups and categories with budget, spent so far and left; one that went
      over shows by how much, so it stands out. Budgets are set there (no income budgets). Past months can be opened
      and edited; a month that was never planned offers to plan it.
- [x] Budgets are personal: each person plans their own (no family budget for now).
- [x] **When adding an expense**, each category in the quick-add form shows what is left of its own budget this
      month; a category without one shows what is left of its group's budget, if the group has one; failing both,
      what is left of the month's total, if there is one (Q-015).
- [x] **On the Transactions page**, a short summary of this month's budget sits next to the month's list.
- [x] **Reminder on the 1st of the month:**
  - an in-app banner the first time the person opens the app in a month they haven't planned yet ("Plan this
    month's budget", with a button to the Budget page), until they plan it or close it;
  - a phone push notification on the 1st at 09:00 Kyiv time, for people who turned it on (asked once, per device; works from the
    installed app, F-025).
- [x] The amounts are in the person's report currency; spending in other currencies is converted at the NBU rate of
      each transaction's date (PRODUCT.md, business rule 1), whole amounts (ADR 0018), the same numbers as the
      monthly report.
- [x] Editing or deleting a transaction updates "spent" and "left" right away.
- [x] Works on the phone and on the desktop, light and dark.

## Agreed (owner, 2026-11-16)
- Priority Medium; the new M7 "Budgets" replaces "Quality" (whose integration tests stay a post-MVP idea without a
  milestone).
- Budgets are set **month by month**, not once for all months; a new month is **prefilled from last month**.
- **No carry-over** between months.
- "Left" shows on a **Budget page**, **when adding an expense** and **on the Transactions page**.
- A **reminder on the 1st**: an **in-app banner** and a **phone push notification**.
- **Group budgets too** (owner, 2026-11-16, changing Q-013 point 1): a group and its categories can both have
  budgets. A group's budget may not be smaller than the sum of its categories' budgets (saving is blocked). In the
  quick-add form a category shows only its own "left"; the group's "left" shows for categories without a budget of
  their own.
- **A total for the month** (owner, 2026-11-16): the sum of the budgets below it may not be bigger than the month's
  total (saving is blocked).

### Q-013 (owner accepted Claude's proposals as they were, 2026-11-16)

| # | Question | Answer |
|---|----------|--------|
| 1 | Budgets per category only, or also per group (e.g. Daily living)? | ~~Per category; the group shows the sum of its categories' budgets~~ Changed the same day: both, see "Group budgets too" above |
| 2 | Family: personal budgets only, or a family budget on the combined view? | Personal budgets only for now; a family budget later if needed |
| 3 | Income categories? | No budgets for income |
| 4 | Can you look at past months' budgets? | Yes, switch months as on the report; a past month's budget can still be edited |
| 5 | A month the person skipped (never planned): what do the Budget page and "left" show? | The page offers to plan it (prefilled from the last planned month); no "left" in the quick-add form until it is planned |
| 6 | Push time on the 1st | 09:00 Kyiv time |
| 7 | A category with no budget in a group with none: what does the quick-add form show? | What is left of the month's total, if there is one (Q-015, owner accepted the proposal 2026-11-16) |

## Tasks
- [x] Settle Q-013 with the owner; update this file (2026-11-16).
- [x] References (open examples of budgeting apps' category budget screens); noted under Design (2026-11-16).
- [x] 3 prototype stories in `frontend/src/prototypes/F-033-category-budgets/` (round 1 shown 2026-11-16); owner
      picked variant 2; final prototype; owner approved it 2026-11-16.
- [x] Backend: a month's total and budgets per group and category (Domain, Application, migration), the rule that
      each level fits within the one above it, API to read a month (prefilled from the last planned one when empty) and
      save / remove budgets; ADR for the data model.
- [x] Push notifications: web push (VAPID keys on Render and in user-secrets, subscriptions per device, the service
      worker's push handler), a job that sends the reminder on the 1st; turning it on and off in Settings; ADR.
- [x] Frontend: the Budget page, "left" in the quick-add form and on Transactions, the reminder banner, TanStack
      Query hooks, i18n keys, Storybook stories.
- [x] Tests (below); docs: PRODUCT.md, ARCHITECTURE.md, DESIGN_RULES "Screen decisions".

## Design

**Brief.** A Kyiv couple plans the month once, around the 1st, usually on the desktop (the spreadsheet's habit), and
checks it on the phone while adding an expense: "how much can we still spend on eating out?" The Budget page's one
job: show what's left this month, in total and where it is running out, and make planning a month a minute's work
from last month's plan. First thing seen: what's left of the month. The subject's world: the spreadsheet's plan
column, the envelopes cash was split into on payday, the app's own receipts and dark slip. The feeling: calm and in
control, "I know what I can still spend".

**Plan.** Reused: the app shell, the Transactions page (F-020) with its dark slip, the quick-add form (F-018) with its
category pills, `ResponsiveDialog`, the fields and buttons of I-019, the month's name with ‹ › as on Reports, the
family band's look (F-024) for the reminder. New: the Budget page (a menu item after Transactions), the month's budget
on Transactions, "left" in the form, the banner. No new token: bars are the text colour on the rule colour, red
(`expense`) past the budget, the accent for today's tick and for the amount being typed. Amounts tabular and whole, `₴`
after the number, a true minus. Motion: none new; "left" changes after a save as the lists do. Slop check: dropped a
row of three stat cards for the month (the slip or one big number instead), icons in tinted circles on the groups, a
colour per group in the ribbon (colour only means spent and over), and a middle-dot "spent · left" line.

**References** (open pages, no sign-in):

- [YNAB: colours and icons in your plan](https://support.ynab.com/en_us/colors-and-icons-in-your-plan-HJQv_XHko.md) —
  a category's "available" in colour, red when overspent, the colour never the only sign (all variants: red with
  "over").
- [YNAB: progress bars](https://support.ynab.com/en_us/progress-bars-a-guide-SkDEhot09.md) — one bar per category,
  spent against the budget, the overspent part red (variants 1 and 2).
- [Budget app dashboard design (screensdesign)](https://screensdesign.com/articles/budget-app-dashboard-design/) — a
  "spent of budget" head with what's left and the days left in the month (variant 1's slip, variant 2's pace line).
- [Kombai gallery: budget charts](https://kombai.com/gallery/inspirations/charts-ios-123/) — category rows with red
  over-budget bars; a tap opening a sheet to change the amount (variant 2).
- YNAB's "Ready to Assign" (same support site): money handed out until nothing is left to give (variant 3's "still to
  hand out").

**Prototype stories** — *Prototypes / F-033 Monthly budget* (`frontend/src/prototypes/F-033-category-budgets/`). Each
is the whole app with a fake API: it opens on the Budget page, the menu leads to Transactions, the quick-add form shows
what's left, and a saved expense lowers it everywhere. Controls: *thisMonth* "not planned" shows the banner and
planning a new month from October's; *Budget in the phone menu* makes Budget a fifth place in the phone's bottom menu
(off: under More).

| Story | Thesis | Link |
|-------|--------|------|
| Variant 1: The plan column | The spreadsheet's way: the month on the dark slip (left, spent, about how much a day), then a ledger of groups and categories with Plan, Spent and Left columns and a bar each (on the phone "spent of plan" under the name, Left on the right). *Edit plan* turns the Plan column into fields in place, the rule checked as you type, Save blocked with a red line saying by how much. Form: a pill with its own budget says its left after its name; the others get a line under the pills. Transactions: one line under the slip with the month's left and what went over | [open](http://localhost:6006/?path=/story/prototypes-f-033-monthly-budget--variant-1&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 2: On pace | The month's left big, and on every bar a tick where an even pace would be today, so a category spending too fast shows before it runs out. Every line (the total, a group, a category) opens its own dialog saying what it sits in. A new month starts from last month's with one tap. Form: under the amount, the picked category's left and what it leaves after this one, as you type. Transactions: a block with the month's left and the two tightest categories, over the calendar on the desktop | [open](http://localhost:6006/?path=/story/prototypes-f-033-monthly-budget--variant-2&nav=false&panel=false&globals=viewport.value:!undefined) |
| Variant 3: Hand it out (the risk) | The month's total as one ribbon cut into its groups, each filling as it's spent, the part in no group dashed. On the desktop the groups on the left and the picked one's categories on the right (as the Categories page); on the phone a group opens in place. Planning starts from the total and hands it out: to groups, then inside a group to its categories, with a "still to hand out" counter (red when it's more than the month can take). Form: a pill with its own budget is a small gauge along its foot; the picked one's left under the pills. Transactions: the ribbon, slim, under the slip | [open](http://localhost:6006/?path=/story/prototypes-f-033-monthly-budget--variant-3&nav=false&panel=false&globals=viewport.value:!undefined) |

The reminder banner is the same in all three: a band in the accent's tint over every page but Budget, "November has
no budget yet. Start from October's and change what you need.", *Plan November* and ×.

**Open points of round 1** (Claude's proposal in brackets):

- Where Budget sits on the phone: as a fifth place in the bottom menu, "Transactions" is cut to "Transactio…" at
  375 px, so the stories open with Budget under More [under More; the banner, the line on Transactions and the form lead
  to it].
- ~~Variant 2's even pace counts rent paid on the 1st as spending "too fast"~~ Settled 2026-11-16: no pace at all
  (owner: "I don't need this, just show the bar like in transactions").
- Categories with neither a budget nor spending fold under "N more categories" on the Budget page [keep].
- I-016 (this month's total next to every category in the form): the pills could show "spent" for categories without
  a budget [decide with the chosen variant].

Chosen variant: **variant 2 "On pace"** (owner, 2026-11-16: "I like variant 2, show me all the states"). Not approved
for implementation yet; the final prototype comes after the owner has seen its states.

**Variant 2's states** (shown to the owner 2026-11-16, phone and desktop, light and dark): the month (the pace, groups,
categories with and without a budget, a group with no budget of its own counting its categories'); the groups with
nothing planned or spent folded under one line; "Budget for another … category"; the dialogs for the total, a group and a
category, each with what it sits in, and each blocked with a red line when it doesn't fit; a budget added or removed;
no total for the month; a past month ("Not spent of …", what's left doesn't carry over); next month and this month not
planned (Start from October / Start empty), and a month started empty; the banner on Transactions; the month's
block on Transactions; the quick-add line under the amount for a category's own budget, its group's and the month's,
going over as the amount is typed, and none in a month not planned; "left" lower after a save; loading and couldn't
load (their own stories, *Variant 2: loading* and *Variant 2: error*).

Changed while showing them: a line without a budget shows what it spent ("696 ₴ spent", "Nothing spent") with "No
budget" under it, instead of "No budget" twice; the form's line for a fallback reads "In Entertainment: …" / "This
month: …"; a category's dialog says how much still fits in its group; a past month says what's left doesn't carry
over; the folded groups' line has a chevron.

**The reminder on the 1st, in variant 2** (owner asked how the push and the banner look and where the prefill is,
2026-11-16):

- *Banner*: over every page but Budget in a month not planned, in the accent's tint: "November has no budget yet.
  Start from October's plan and change what you need.", with **Start from October** (the prefill itself: it saves
  October's amounts as November's, opens the Budget page and says so in a notification) and ×. The Budget page of a
  month not planned has the same **Start from October** and *Start empty*.
- *Push*: on the Budget page of this month, a card **Remind me on the 1st** (under the month on the desktop, after the
  groups on the phone) says what it is, shows the notification as a phone shows it (a lock screen at 09:00 with Pup's
  icon, "Plan December's budget", "Start from November's and change what you need.") and has **Turn on** (the browser
  then asks to allow notifications) and *Not now* (hides the card for good). Tapping the notification opens the
  Budget page. On an iPhone in Safari, notifications come only to the installed app: the card says so and has **How to
  install** (F-025's sheet).
- *Settings*: a section **Budget reminder** after Theme, "A notification at 09:00 on the 1st to plan the month. On this
  device only.", an On / Off switch and the notification's picture; on an iPhone in Safari a line to install the app
  first instead of the switch.
- The phone draws the real notification, so it looks a little different on Android and the iPhone; the words and the
  icon are ours.

**No pace** (owner, 2026-11-16: "I don't need this, just show the bar like in transactions"): no tick on any bar and no
"faster / slower than an even pace" line. The month's left has one bar under it, spent of the total, 8 px as on the
Transactions slip, and "Spent 33 042 ₴. 15 days to go." (a past month: what's left doesn't carry over); every group
and category keeps its plain bar, red past its budget; the month's block on Transactions has the same bar.

**Final prototype** (2026-11-16, owner: "Yes, build it" for variant 2 as it then was):
[Final prototype](http://localhost:6006/?path=/story/prototypes-f-033-monthly-budget--final&nav=false&panel=false&globals=viewport.value:!undefined),
with [loading](http://localhost:6006/?path=/story/prototypes-f-033-monthly-budget--final-loading&nav=false&panel=false&globals=viewport.value:!undefined)
and [couldn't load](http://localhost:6006/?path=/story/prototypes-f-033-monthly-budget--final-error&nav=false&panel=false&globals=viewport.value:!undefined); [month not planned](http://localhost:6006/?path=/story/prototypes-f-033-monthly-budget--final-not-planned&nav=false&panel=false&globals=viewport.value:!undefined) opens on Transactions with the banner.
Controls: *thisMonth* (planned / not planned), *device* (android / iphone), *Budget in the phone menu*.

- **Where:** a menu item *Budget* after Transactions in the sidebar; on the phone under More (a fifth place in the
  bottom menu cuts "Transactions" short at 375 px).
- **The page:** the month's name with ‹ › (back through past months, forward to next month). On the desktop two
  columns: on the left, sticky, "Left of 50 000 ₴" with a pencil (the total's dialog), what's left big in Unbounded
  300 (red with "Over" past the total), one 8 px bar for spent of the total as on the Transactions slip, "Spent
  33 042 ₴. 15 days to go." and, when some of the total is in no group, "2 500 ₴ of the total isn't in any group."; on
  the right the groups. On the phone the same one under the other.
- **Groups and categories:** a group's head (name, "1 095 ₴ left" or "607 ₴ over" in red) opens the group's dialog; a
  group without a budget of its own shows its categories' sum with "its categories' budgets" under it. Each category
  with a budget or spending is a row: name and left (or over, red) on top, a 6 px bar (red past the budget), "7 149 ₴
  of 13 000 ₴" under it; without a budget, "696 ₴ spent" (or "Nothing spent") in grey, a dashed empty bar and "No
  budget". "+ Budget for another … category" opens *New budget in Daily living* (a sheet on the phone): the group's
  categories without a budget as pills, *Budget for November*, and how much still fits in the group; Save asks for a
  category first ("Pick a category." beside its label) and is blocked, as in the other dialogs, by an amount that
  doesn't fit; the saved category joins the group's rows (owner's review, 2026-11-16: it showed every category of the
  group at once). Groups with nothing planned or spent
  fold into one line "Health, Education: nothing planned or spent" with a chevron.
- **Dialogs** (a sheet on the phone): the line's name as the title, "Budget for November" (right-aligned amount, ₴ at
  the end; a group's empty field shows its categories' sum), then what it sits in: spent so far; for a category "Daily
  living: 22 000 ₴. Its other categories take 14 500 ₴, so up to 7 500 ₴ fits here." (or that it counts only in the
  month's total); for a group its categories' budgets; for the total what the groups take. Remove budget (red word),
  Cancel, Save. Save with an amount that doesn't fit shows the field in red and a red line saying what goes over and by
  how much, and doesn't save.
- **A month not planned:** "November has no budget yet", "Start from October's: the same total, groups and
  categories. Then change any line you need.", **Start from October** and *Start empty*. A past month says "Not spent
  of 50 000 ₴" and "What's left doesn't carry over to the next month."
- **Banner:** over every page but Budget while this month isn't planned, until planned or closed: "November has no
  budget yet. Start from October's plan and change what you need.", **Start from October** (saves the plan, opens
  Budget, says so) and ×.
- **Reminder on the 1st:** the card *Remind me on the 1st* on this month's Budget page (under the month on the desktop,
  after the groups on the phone) with the notification as a phone shows it ("Plan December's budget", "Start from
  November's and change what you need.", 09:00), **Turn on** (the browser asks to allow notifications) and *Not now*.
  On an iPhone in Safari: install the app first, **How to install**. Settings: *Budget reminder* after Theme, On / Off
  for this device in the standard 52 px switch (B-029: the prototype's Settings copy has its fix, Theme too), no picture
  (owner, 2026-11-16); on an iPhone in Safari the install line instead of the switch. Tapping the
  notification opens the Budget page.
- **Quick-add form:** under the amount, the picked category's line: "Eating out: 607 ₴ over, 1 057 ₴ over after this"
  as the amount is typed, with a bar showing spent and this expense (the accent, red past the budget); a category
  without its own budget: "In Entertainment: …" (its group's) or "This month: …" (the total's); nothing in a month not
  planned. After a save, "left" is lower everywhere.
- **Transactions:** under the slip (over the calendar on the desktop) a block *Budget* with the month's left, its bar
  and the two categories closest to running out; it opens the Budget page.
- **Loading:** skeletons in the page's shape; **couldn't load:** "Couldn't load the budget." with Try again.

Approved for implementation: **2026-11-16** (owner: "the final prototype for f-033 is approved, build it"). The
prototype stories were deleted when it was built (the links above no longer open); the real ones are *Budget / Budget
page* (phone, desktop, a blocked dialog, not planned, never planned, loading, couldn't load, the banner, the
notification).

## Built (2026-11-16)

- **Backend** ([ADR 0037](../../../decisions/0037-monthly-budget-and-web-push.md)): `BudgetMonth` with its group and
  category budgets and `BudgetPlan`'s rule (Domain), `BudgetBuilder` (spent at each day's NBU rate, pure) and the
  validators (Application), `BudgetService` and the migration `AddBudgets` (Infrastructure), `BudgetController`
  (`/api/budget`). The reminder: `PushSubscription`, `WebPush` (RFC 8291 encryption and VAPID with .NET's own crypto,
  no new package), `WebPushSender`, `BudgetReminderService`, `PushController` (`/api/push/…`) and
  `BudgetRemindersController` (`POST /api/reminders/budget` with `X-Reminders-Secret`).
- **Frontend** (`features/budget`): the Budget page and its dialogs, the banner in the shell, the *Remind me on the 1st*
  card and the notification's picture, the line under the amount in the quick-add form (expenses only), the *Budget*
  block on Transactions (your own money only), the *Budget reminder* row in Settings, Budget in the sidebar after
  Transactions and first under More on the phone. The service worker loads `push-sw.js`. The budget is fetched again
  after a transaction, a category or the report currency changes. B-029's one line in `Settings.module.css` (the final
  prototype's Settings has it).
- **Decided while building** (small, within the approved design):
  - The banner shows only to someone who has planned a month before (it offers *Start from October*, which needs a
    last plan); someone who never used budgets isn't asked every month. The Budget page still offers *Start empty*.
  - The quick-add line shows for expenses only, and for a saved expense being changed it shows the category's left
    without "after this" (the expense is already counted).
  - The reminder card and the Settings switch need push in the browser and the app's service worker (the production
    build). Where there is none, the card stays away and Settings says "This browser can't show Pup's
    notifications."; when notifications were blocked, Settings says how to allow them; on an iPhone in Safari the card
    offers *How to install* and Settings says to install first.
- **Owner, at the release** (README, "Budget reminder"): a VAPID key pair and a secret as `Push__PublicKey`,
  `Push__PrivateKey` and `Push__RemindersSecret` on Render; a cron-job.org job `POST /api/reminders/budget` at 09:00
  Europe/Kyiv on the 1st (`0 9 1 * *`) with the header `X-Reminders-Secret`. Then turn the reminder on on a phone and
  check the notification by hand (it can be sent at once by running the cron job by hand once this month isn't
  planned).

## Owner's review of PR #115 (2026-11-16)

1. The month's head isn't aligned to the left and the page is too narrow; the same on the other pages: **every page
   aligned to the left and wider** (the shell's content column).
2. *Start empty* shouldn't list every category with spending as "No budget": an empty month shows **only the groups**
   and *+ Budget for another … category*; a category is added when its budget is set.
3. A category can be **taken out of the plan**: it only goes from the list (nothing else is deleted) and comes back with
   *+*. (Built as: a category's row is there while it has a budget; *Remove budget* takes it out.)
4. A group's head shows only what's left: it should show **the same as a category** (a bar and "… of …").
5. **Groups fold** (collapse / expand).
6. The space under the month on the desktop's left column is wasted: think how to use it (proposal to the owner).

Points 1–5 are the owner's words in so many words (approval of what they ask); point 6 is proposed first.

**Built (2026-11-16):** 1. the shell's content column starts at the left after the sidebar and grows to 1280 px
(DESIGN_RULES §4), the Budget page uses all of it; checked on every page at 1440 and 1920 px. 2–3. a group lists only
its categories with a budget; *Remove budget* takes one out, *+ Budget for another … category* (or *Budget for a
category in …* when it has none) brings it back; nothing else is deleted. 4. a group's head is a line like a
category's: left or over, its bar, "… of …" (or "No budget"), still opening its dialog. 5. a chevron before each group
folds it; folded groups are remembered on the device (`pup.budget.folded`). 6. proposed to the owner in chat.

## Owner's second review of PR #115 (2026-11-16)

1. Pages shouldn't start at the left: **centred, but wider than before** (880 px).
2. No folding of groups: **as it was before** (the owner picked "No folding, as before" when asked what the point
   meant).
3. **Delete a month's budget plan.**
4. A group should **stand out more** than a category.

The owner's words in so many words (approval of what they ask). Point 6 of the first review (the space under the month)
is still waiting for the owner's choice.

**Built (2026-11-16):** 1. the shell's content column is centred again and grows to 1280 px (the Reports year 1600 px),
DESIGN_RULES §4. 2. the chevrons and `pup.budget.folded` are gone: every group is open, its categories in line with
it; the groups with nothing planned or spent are still under one line. 3. *Delete November's plan* under the month
(after the groups on the phone) asks first ("Its total and every group and category budget go. Transactions stay"), then
the month is not planned and offers *Start from …* / *Start empty* again; `DELETE /api/budget?month=` (404 when not
planned). 4. a group is a card (surface, rule border, large radius) with its head bigger: the name in Unbounded 18 px, the
amount 15 px medium, an 8 px bar, a rule between it and its categories.

## Owner's third review of PR #115 (2026-11-16)

1. "Why is there still an accordion?": the line folding the groups with nothing planned or spent is gone too. **Every
   group is open**, those with nothing planned or spent after the others.
2. **Prototypes for point 6** of the first review (the column under the month on the desktop), in
   `frontend/src/prototypes/F-033-left-column/` (a copy of the Budget page with the new part under the month):
   - [Variant 1: Not in the plan](http://localhost:6006/?path=/story/prototypes-f-033-left-column--not-in-the-plan-story&nav=false&panel=false&globals=viewport.value:!undefined): this month's spending in categories without a budget,
     biggest first, with its total; a row opens *New budget* in its group. The money the groups no longer list.
   - [Variant 2: Running out](http://localhost:6006/?path=/story/prototypes-f-033-left-column--running-out-story&nav=false&panel=false&globals=viewport.value:!undefined): the four categories over or closest to their budget, each
     with its bar; a row opens its dialog.
   - [Variant 3: Where the total goes](http://localhost:6006/?path=/story/prototypes-f-033-left-column--where-it-goes-story&nav=false&panel=false&globals=viewport.value:!undefined) (the risk): the month's total as one bar split by
     the groups' budgets in shades of the text colour, the part in no group left open, and a legend with each group's
     amount and share; a row scrolls to its group.
   - References: YNAB's budget screen keeps a side panel (the "inspector") next to the category list for the selected
     month or category; Monarch's budget page has a summary column beside the groups. Taken: a side column that adds a
     view of the month the list doesn't give, rather than repeating it.
   The owner liked variants 1 and 3 and asked for both on the page. **Final prototype:**
   [Final: Where it goes and not in the plan](http://localhost:6006/?path=/story/prototypes-f-033-left-column--final-story&nav=false&panel=false&globals=viewport.value:!undefined):
   under the month, *Where the 50 000 ₴ goes* (variant 3), then *Spent outside the plan* (variant 1), then *Delete …'s
   plan*; each part shows only when it has something (no total → no split; nothing spent outside the plan → no list).
   The month's column stays in place as before and, when it is taller than the window, scrolls on its own. Desktop
   only, as the column. **Approved 2026-11-16** (owner: "Approved, build it").
3. Owner's comments on it: the column had a needless sideways scroll (the rows' hover reaching past it): now it scrolls
   only up and down, and only when taller than the window. And **hovering a group's head lights its whole card**
   (built in the app: `.group:has(> .groupHead:hover)`).
4. "This block should be sticky when the user scrolls": it was sticky but stretched to the groups' height by the grid,
   so it scrolled away; now it is as tall as its content (`align-self: start`, in the app) and stays in place to the
   end of the page.

**Built (2026-11-16, after the approval):** `PlanSplit` and `OutsidePlan` (`features/budget/MonthColumn.tsx`) under the
month on the desktop, before the reminder card and *Delete …'s plan*; a row of *Spent outside the plan* opens *New
budget* with its category already picked; the month's column scrolls on its own when taller than the window. The
prototype folder `frontend/src/prototypes/F-033-left-column/` is deleted.

**Owner's comments on the build (2026-11-16):** the column's scroll and stickiness should be as on Transactions, and the
bars as Transactions' "Where it went". Done: the month's column is Transactions' `FitColumn` (moved to
`shared/ui/FitColumn.tsx`, with `scrollParentOf`): sticky, fitted to the window as the page scrolls, and only the
*Spent outside the plan* list scrolls, in the app's `FadingScrollArea`; its rows are "Where it went" rows (name, amount,
share of the month's spending, the red-tinted bar).

Then: "make month select also sticky and the side panel should be the size of the select and have min width as now".
A first try put the switcher at the top of the month's column; the owner didn't like it ("revert and try another
approach, show prototype first"): reverted. **Prototype:**
[Final: Sticky month band](http://localhost:6006/?path=/story/prototypes-f-033-month-head--final&nav=false&panel=false&globals=viewport.value:!undefined)
(`frontend/src/prototypes/F-033-month-head/`): on the desktop the switcher stays where it is, over the page, as a band
that stays in place (the page's background behind it, across the whole width), and the groups scroll under it; the
month's column starts under the switcher, is as wide as it (at least 320 px) and sticks just under the band. Owner's
comments: "the panel should always stay in place, now it scrolls a little because of padding, make cards to fade when
they are scrolled to the top": the switcher and the column now stick exactly where they start (the page's 28 px top
padding counted), nothing moves; over the groups' column a 32 px fade under the band, shown only once the page has
scrolled (a scroll-driven animation). Then "now this scrolls when I scroll the page": on a shorter window the
column's least height didn't fit and FitColumn counted a 16 px sticky top, so the column was pushed up at the page's end;
now everything under the month's figure is one scrolling part (min 120 px) and the prototype's FitColumn copy sticks
at the column's own CSS top: it stays at the same place at every scroll position (checked at 640, 820, 1000 px high).

The owner then asked "can you make the header for budget as for transactions?": a second story,
[Slip header, as Transactions](http://localhost:6006/?path=/story/prototypes-f-033-month-head--slip&nav=false&panel=false&globals=viewport.value:!undefined):
the month on Transactions' dark slip with the torn edge (‹ November 2026 ›, *Change total* at the end of the row, "Left
of 50 000 ₴" and "Spent" big, the slip's bar for the share of the total spent, the days to go and the part in no group
under it); under it the column (where the total goes, spending outside the plan, delete) fitted and sticky as
Transactions' left column, and the groups. The slip scrolls away as on Transactions. Waiting for the owner's pick and
approval; not built.

## Tests
- Unit: spent / left for the month's total, each group and category (currency conversion, over budget, a group's
  spending from categories with and without budgets, the total from all expenses, prefill from the last planned
  month), the rule that categories fit within their group and groups within the total (also when a group's budget
  or the total is lowered, and a group without a budget counting with its categories' sum), the validators, the reminder job's schedule; frontend
  components and hooks.
- E2E (Playwright): plan a month (prefilled from the last), add an expense, see "left" go down on the Budget page,
  in the quick-add form and on Transactions; a month's total with a group and a category budget inside, and saving
  blocked when the categories go over the group or the groups over the total; change and remove a budget; delete a month's plan; the banner in an unplanned month. Push is
  checked by hand on a phone (Playwright can't receive it).
- Screens checked in Playwright screenshots (phone / desktop, light / dark): the Budget page planned, past and next
  month, not planned with and without a month before, the category dialog blocked, the new budget's dialog, the
  total's dialog, the banner on Transactions, the *Budget* block on Transactions, the line in the quick-add form (over
  budget), Settings' *Budget reminder*; in the production build with its service worker the *Remind me on the 1st*
  card and the On / Off switch (52 px, as Theme's after B-029).
- Built: backend `BudgetPlanTests`, `BudgetMonthTests` (Domain), `BudgetBuilderTests`, `BudgetValidatorTests`
  (Application, with the push address and the reminder's words), `WebPushTests` (RFC 8291's example byte for byte, a
  device decrypting, the VAPID JWT verifying), `BudgetControllerTests` (Api); frontend `budget.test.ts`,
  `BudgetPage.test.tsx` (page, blocked dialog, start a month, error, banner), the shell's menu tests; E2E
  `budget.spec.ts` (the flow above on the phone and the desktop; removing and adding budgets and a past month; the
  API's rule). The server's push path was checked once by hand against FCM with a made-up device (FCM answered that
  it doesn't exist, so the signature was accepted, and the job deleted it). The notification on a phone: by the owner.

## Notes
- [F-034](../F-034-saving-jars/F-034-saving-jars.md) (saving jars, built after this) adds jars to the month's plan
  and, on the Budget page and with the reminder on the 1st, the choice to put the month's saved money into a jar.
  The jars planned in a month count within its total (Q-015).
  The Budget page's design should leave room for them.
- Replaces "Budgets / limits per category" from the post-MVP candidates (PRODUCT.md) and from M11 in the roadmap.
- [I-016](../../improvements/I-016-category-month-totals/I-016-category-month-totals.md) (this month's total next to
  each category when adding a transaction) overlaps "left" in the quick-add form: for categories with a budget (their
  own or their group's) F-033 shows what is left; I-016 would add the month's total for the others. Decide in the design round whether I-016 is
  folded in or stays apart.
- Push notifications are new to the app: they need the person's permission on each device, and on an iPhone they
  work only from the app installed on the home screen. The in-app banner covers everyone else.
- The push is the app's first scheduled job besides the keep-awake ping (Q-002); the free server sleeps at night, so
  it runs in the day, at 09:00 Kyiv (Q-013).
