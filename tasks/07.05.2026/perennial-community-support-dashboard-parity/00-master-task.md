# Perennial Community Support Dashboard Parity - Master Task

- Status: Planned
- Priority: P1
- Area: Perennial / Community / Support
- Routes: `/community/support`, `/community/support/new`, `/community/support/[id]`
- Reference Existing Flow: `/dashboard/support`

---

## Goal

Give Perennial Mandalism community members the same support-ticket experience diviners currently have in `/dashboard/support`, while keeping Community-specific context visible to admins.

## Current State

The global support ticket APIs already exist and are scoped by `requester_user_id`, but the Community portal does not expose a support UI:

- `src/app/community/layout.tsx` has no `Support` nav item.
- There is no `src/app/community/support` route.
- Some Community APIs tell users to open support tickets, but there is no Community portal destination.
- Ticket creation currently hard-codes `requester_role: "customer"`, which loses Perennial/Community context.

## Task Split

- `01-backend-support-ticket-context.md`
  - Extend or confirm shared support APIs for Community-created tickets.
  - Preserve auth, ownership, messages, close, and CSAT behavior.
- `02-frontend-community-support-portal.md`
  - Build Community support pages and navigation.
  - Reuse the existing dashboard support UX pattern where practical.
- `03-regression-and-qa-checklist.md`
  - Verify Community, admin, and existing diviner support behavior.

## Acceptance Criteria

- [ ] Community members can access Support from the Community portal.
- [ ] Community-created tickets are distinguishable in admin views through role, category, tags, or related entity context.
- [ ] Existing `/dashboard/support` behavior is not regressed.
- [ ] Ticket ownership and internal-note privacy remain enforced.
- [ ] CSAT and close/reply flows work for Community tickets.

## Out Of Scope

- No admin ticket redesign.
- No astrology chart generation changes.
- No ritual, tarot, billing, or family workflow rewrites.
