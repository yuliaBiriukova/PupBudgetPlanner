# F-023 · Family and invitations

| | |
|---|---|
| Type | Feature |
| Milestone | M5 — Categories & family |
| Status | Todo |
| Branch | `feature/F-023-family-and-invitations` |
| Design | 3 HTML prototypes required |

## Goal

Form a family to see each other's finances.

## Acceptance criteria

- [ ] Create a family with a name
- [ ] Invite with a link (valid 7 days) that can be sent in any messenger
- [ ] Accept an invitation (only if not already in a family)
- [ ] Leave a family; the owner can remove members

## Tasks

- [ ] 3 HTML prototypes
- [ ] Domain + API
- [ ] UI
- [ ] Storybook stories

## Design

Prototypes: `prototypes/` (not created yet). Chosen variant: —

## Tests

- Unit: Family rules (one family per user, invitation expiry).
- E2E (Playwright): Invite, accept, leave.

## Notes

- Uses the invitation links of [F-028](../F-028-invite-only-access/F-028-invite-only-access.md) with a family
  attached: a family owner's link also lets a new person create an account while sign-up is invite-only
  (owner's decision, 2026-10-29).
