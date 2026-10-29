# I-005 · Pages on the People list

| | |
|---|---|
| Type | Improvement |
| Milestone | M2 — Accounts & categories |
| Priority | Medium |
| Status | Todo |
| Branch | `improvement/I-004-I-008-people-page-follow-ups` (shared with I-004 – I-008, as the owner asked) |
| Design | 3 HTML prototypes required (page controls on the People tab) |
| Approved | — |

## Goal
The People list is split into pages, so a long list stays quick and readable, and "Select all" picks only the
people on the page you see. Found by the owner after F-028, 2026-10-29.

## Acceptance criteria
- [ ] The People tab shows one page of people at a time, with controls to move between pages and the total count.
- [ ] The "Select all" check box selects only the people on the current page.
- [ ] Search and sorting work across all people; the result is paged, and a new search goes back to page 1.
- [ ] Changing the page clears the selection (or says clearly what stays selected — decided in the prototype).
- [ ] Works on the phone (375 px) and desktop (1440 px), light and dark.

## Tasks
- [ ] References: pagination in admin lists (Mobbin "pagination", "table").
- [ ] Decide page size and whether paging is on the server (API `page` / `pageSize`) or in the browser — proposal
      in the description before approval.
- [ ] 3 prototypes; owner picks and approves one.
- [ ] Build, replace F-028's "Pick all shown stops at 200" with per-page selection (a page is never over 200).
- [ ] Stories: first, middle and last page; one page only.

## Design
References: —
Prototypes: `prototypes/`. Chosen variant: —

## Tests
- Unit: "Select all" selects only the current page; changing the page.
- E2E (Playwright): page through the list, select all on one page, bulk action affects only those people.
- Screens checked in Playwright screenshots (phone / desktop, light / dark):

## Notes
- With pages of at most 200, F-028's 200-people limit on bulk actions can no longer be hit from the UI.
