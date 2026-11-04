# I-019 · One look for buttons and other UI elements across the app

| | |
|---|---|
| Type | Improvement |
| Milestone | M3 — Transactions |
| Priority | Medium (proposed) |
| Status | Done |
| Branch | `improvement/I-019-ui-consistency` |
| Design | A before / after page of every element that changes, for the owner's approval (no new screens) |
| Approved | 2026-11-04, by the owner in chat ("Approved, build it"): the [before / after page](prototypes/before-after.html) with 44 px buttons (52 px only on sign-in), the grey word for Cancel and pill keys. The Storybook "Design system" pages earlier the same day, by the request ("add design system to storybook") |

## Goal

The sidebar's "Add transaction" button doesn't look like the app's other buttons (owner, 2026-11-04, with screenshots
of the full and the collapsed sidebar). The owner asked whether the app has a design system, and to check every UI
element in the app and align them.

## Is there a design system?

Partly. What exists:

- **Rules:** [DESIGN_RULES.md](../../../DESIGN_RULES.md): colours, fonts, spacing rules, touch targets, states, text.
- **Tokens:** `frontend/src/app/theme.ts`: the colours (charcoal and sky), fonts, radii, and the `--pup-…` colour
  variables for both schemes.
- **Shared components:** `ResponsiveDialog`, `BottomSheet`, `CurrencyPicker`, `FadingScrollArea`, and the check box and
  fields themed once in `theme.ts`.
- **Storybook "Design system"** (added 2026-11-04): *Foundations* (colour tokens of both schemes read from `theme.ts`,
  type, corners, spacing, icons) and *Components* (every element as built today, with where it is used).

What's missing is the **component level**: nothing says what a button, a switch or a pill looks like. Every screen
sets them itself (`radius="xl"` on 60 buttons one by one, its own heights and colours), so screens built without
copying one of the others drift. The sidebar's Add button is one of these.

## Audit (2026-11-04, from the code)

### Buttons

| What | Today | Where it differs |
|------|-------|------------------|
| Shape | 60 buttons are pills (`radius="xl"`, set on each one); Mantine's default is 12 px | **12 px corners:** the sidebar's Add transaction (its own `UnstyledButton`, not a `Button`), the phone keys' Save (`AmountKeys`), Not found's "Go home", the start screen's "Try again", the sidebar's collapse button, the phone bar's buttons, the sun / moon toggle |
| Height | 36 px (Mantine's default) in every pop-up's footer and on Settings; 40 px the sidebar's Add; 44 px rows (People bulk bar, archive / delete, Cancel link); 48 px empty-state buttons (Transactions); 52 px page buttons (New account, New invite link) and sign-in | **36 px is below the 44 px touch target** (DESIGN_RULES §4) and is the most used height: Cancel / Save in every dialog. Five heights for one kind of thing |
| Secondary (Cancel, Keep) | `subtle` grey (no border) in 8 places; `default` (outlined) in 9; `outline` in 1 | The same "Cancel" is a borderless grey word in the account, People and delete dialogs, an outlined pill in the transaction dialog and Delete transaction |
| Danger (Delete) | Three copies of the red: `dangerButton` in Accounts and People, `danger` in Transactions (which keeps Mantine's charcoal background and only changes the text and the hover) | One shared danger button |
| Text on the charcoal button | `--pup-color-on-primary` (theme rule, 2026-10-28) | The sidebar's Add uses Mantine's `--mantine-primary-color-contrast` instead. It looks right in both schemes today, but it skips the rule |

### Switches (segmented choices)

Four separate builds of the same pill switch: Accounts' Group by (Mantine `SegmentedControl`), the transaction type
(`SegmentedControl`), Settings' report currency and theme (its own radio group) and sign-in's Sign in / Create account
(its own). Two use the `--pup-color-switch` colours and two use `--pup-color-choice`, so in dark mode the track and
the picked pill come in two shades.

### Pills and chips

Selectable pills are 44 px in all four places (account card styles, the form's categories, the Transactions filters,
the filter chips), but they come in two borders (`--pup-color-field-border` on the card styles, `--pup-color-rule` on
the others) and two side paddings (16 or 14 px). The read-only tags (Categories 36 px, People's status 22 px with a
1 px padding, an odd value against the even-numbers rule) are a different element and may stay as they are, sized to
their place.

### Fields, menus, check boxes, pop-ups

Already shared: every field has the same focus border, check boxes are themed once, and every pop-up uses
`ResponsiveDialog` / `BottomSheet`. Fields are 52 px with 16 px text almost everywhere, but the height is copied into
six screens' styles, and the copies drift: sign-in has its own padding and radius, Settings and the account form differ
in background, and People's "Type delete to confirm" field keeps Mantine's lighter border. Both menus (People) set
`radius="md"` themselves, and their Delete item is Mantine's `red`, not the app's danger colour.

### Icon buttons and icons

Icon buttons come in 36 px (Sign out), 40 px (clear a list's search), 44 px (⋯, Delete) and the shell's 44 px with
12 px corners (collapse, the phone bar, the sun / moon toggle): two below the touch target, two shapes. Icons are
drawn with a stroke of 1.6, 1.7 (most) or 1.8.

Every variant above, as built, is on the Storybook pages *Design system / Components* (marked "Differs").

## Proposal

Set each element **once** (theme defaults or one shared component), so a new screen gets the right look without
copying it, and write it down in DESIGN_RULES under a new "Components" section.

1. **Button** defaults in `theme.ts`: pill shape and the scheme's text colour for every button; the per-button
   `radius="xl"` goes away.
2. **One height:** 44 px for every button in the app, in pages, rows and pop-ups, a page's main action too (meets the
   touch target). Only the sign-in screens keep their 52 px button, full width under their 52 px fields (F-011)
   (owner, 2026-11-04). 36, 40, 48 and the in-app 52 px go away; the keypad's keys stay 52 px.
3. **Four kinds:** *primary* (charcoal pill), *grey word* (Cancel, Keep, Clear all and actions in rows, with or
   without an icon; owner, 2026-11-04), *danger* (one red pill for the confirming Delete), *red word* (Delete in rows
   and in the account form, with its icon). No outlined buttons are left.
4. **Sidebar Add transaction** becomes the primary button: pill, 44 px, the same text colour; in the collapsed rail a
   44 px round + button.
5. **Icon buttons** (`ActionIcon`): 44 px circles everywhere, the shell's ones too; icons drawn with a 1.7 stroke.
6. **One pill switch** (shared component or themed `SegmentedControl`) for all four switches, 44 px, on the `choice`
   track with the picked option raised in the text colour; the transaction type keeps its colour.
7. **One selectable pill** (shared class or component): 44 px, the fields' border, 16 px at the sides, 14 px text, the
   picked one in the accent's tint (the category keeps its tick); a picked type filter keeps the type's colour.
8. **Fields:** 52 px, set once in the theme instead of six copies: the surface behind it, the fields' border, 16 px
   inside.
9. **The phone keypad:** pill keys and a pill Save, 52 px (owner, 2026-11-04).
10. **Menus:** Delete in the app's danger colour; Mantine's red fails contrast in light mode (3.2:1, found by the
    design check).
11. A **Storybook "Design system"** that shows every element, light and dark, as the reference (done, 2026-11-04).

### Open points

1. Secondary button style: ~~an outlined pill or a borderless grey word?~~ **Answered by the owner, 2026-11-04: the
   grey word everywhere** (Cancel, Keep, Clear all); the outlined pill goes away as a secondary button.
2. ~~Field height~~: not a question after all. Fields are already 52 px nearly everywhere (the first audit got this
   wrong), so they stay 52 px.
3. The phone keys' Save (`AmountKeys`) is shaped like the keys around it (12 px). Proposal: **keep it**, it's a key on
   the keypad, not a button on the page. The owner asked to see round keys (2026-11-04):
   [prototypes/keypad-round-keys.html](prototypes/keypad-round-keys.html), today next to A · pill keys (52 px) and
   B · circle keys (60 px, like a phone's calculator). **Answered by the owner, 2026-11-04: A · pill keys**, every key
   and Save a 52 px pill.

## Acceptance criteria

- [x] Every button in the app is one of the four kinds above, a 44 px pill (52 px only on the sign-in screens), and
      gets it from the theme or a shared component, not from props on each button.
- [x] The sidebar's Add transaction (full and collapsed) looks like the app's primary buttons.
- [x] Every switch, selectable pill and icon button looks the same wherever it is.
- [x] DESIGN_RULES has a "Components" section that says how each element looks; Storybook has a "Design system" page.
- [x] Nothing below 44 px that can be tapped (the buttons, icon buttons, switches, pills and menu items above).
- [x] Checked on every changed screen and pop-up at 375 and 1440 px, light and dark.

## Tasks

- [x] Audit: every kind of UI element in the app, how each is styled today and where they differ (2026-11-04).
- [x] Storybook "Design system" (owner, 2026-11-04), in `frontend/src/shared/design-system/`: *Foundations* (colours of both schemes read from the theme,
      type, corners, spacing, icons) and *Components* (every kind of element as the app has it today, the differences
      named), as the reference for the before / after; updated to the one look once it is approved.
- [x] The owner answers the open points (2026-11-04).
- [x] Before / after page of every element that changes, checked like a prototype (`npm run design:check`):
      [prototypes/before-after.html](prototypes/before-after.html) (2026-11-04).
- [x] The owner approves it (2026-11-04, "Approved, build it").
- [x] Theme (`theme.ts`, `theme.module.css`): buttons 44 px pills with the `quiet`, `danger` and `danger-quiet`
      variants (a disabled `danger` faded red); icon buttons 44 px circles; one field (52 px, 16 px inside, the surface,
      the fields' border); one pill switch for `SegmentedControl`; 44 px menu items. `--pup-color-choice-active` goes.
- [x] Screens: every `radius="xl"`, outlined and red-copy button moved to the theme and its variants (Continue with
      Google keeps its outline; People's selection bar and the form's Today / Yesterday keep their own look); the
      sidebar's Add the primary pill (a 44 px circle in the rail); phone sheets' and pop-ups' buttons 44 px; page actions
      44 px; pill keys on the keypad; strokes 1.7; Sign out and the lists' clear buttons 44 px; the sheet's X round; the
      menu's Delete in the danger colour.
- [x] One look for the switches (Accounts, the transaction type, Settings, sign-in) and the pills you pick
      (`shared/ui/Pills.module.css`: the account form, the categories, the filters); the six copied field styles go.
- [x] Storybook *Design system / Components* shows the one look; DESIGN_RULES gets a "Components" section.

## Design

References: the app's own approved prototypes and the Storybook *Design system* pages (the elements as built); no
new screen. Prototypes: [before-after.html](prototypes/before-after.html) (every element today and after; its
design check flags only the "Today" column, the defects this change fixes) and
[keypad-round-keys.html](prototypes/keypad-round-keys.html) (the keypad's shape, A chosen).

## Tests

- Unit: the existing 227 pass (the change is styles; no new logic).
- E2E (Playwright): the full suite, 56 passed and 6 skipped as before. It caught the rail's + 12 px off the icons' axis
  (`shell.spec.ts`), fixed.
- Screens checked in Playwright screenshots (phone / desktop, light / dark): the Storybook stories of the shell
  (full, rail, dark, phone), Accounts (page, new account, edit end, delete, archived), People (list, menu, delete,
  links, new link, picked), Settings, sign-in, the transaction form (phone with the keypad, desktop, edit, delete,
  exchange), the Transactions list and its Filters sheet, the currency list and the dialogs, and every *Design system*
  page; no page errors, no sideways scroll.

## Notes

- Reported by the owner, 2026-11-04: screenshots of the sidebar, full (charcoal "+ Add transaction", 12 px corners)
  and collapsed (a charcoal square + button), next to the app's pill buttons.
