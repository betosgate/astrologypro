# Task 01 - Backend Support Ticket Context

- Status: Planned
- Priority: P1
- Area: Backend / API / Support
- Related APIs:
  - `src/app/api/support/tickets/route.ts`
  - `src/app/api/support/tickets/[id]/route.ts`
  - `src/app/api/support/tickets/[id]/messages/route.ts`
  - `src/app/api/support/tickets/[id]/csat/route.ts`
  - `src/app/api/admin/tickets/[id]/route.ts`

---

## Goal

Make the shared support-ticket backend safely support Perennial Community tickets without breaking the existing diviner dashboard support flow.

## Required Behavior

- Accept Community-created support tickets from `/community/support/new`.
- Preserve valid DB ticket `type` values only:
  - `support`
  - `job`
  - `incident`
  - `escalation`
  - `complaint`
  - `refund`
  - `payout`
  - `bug`
  - `moderation`
- Store Community portal context using existing safe fields where possible:
  - `requester_role`
  - `category`
  - `subcategory`
  - `related_entity_type`
  - `related_entity_id`
  - `tags`
- Prefer one of these identifiers for admin visibility:
  - `requester_role: "community"`
  - tag `portal:community`
  - both, if compatible with existing data expectations
- Keep existing rate limit behavior.
- Keep ownership checks unchanged: requester APIs must only expose tickets where `requester_user_id` matches the authenticated user.
- Keep internal notes hidden from requester-facing APIs.

## Community Related Entity Types

Review and support only DB/API-safe related entity values. Community UI may need to map labels to existing values.

Candidate labels:

- family member
- natal chart
- monthly transit
- relationship chart
- ritual
- tarot reading
- event
- broadcast
- subscription
- invoice

If existing API validation cannot represent some labels, document the supported mapping instead of adding schema casually.

## Existing Behavior To Preserve

- `/dashboard/support` can still create tickets.
- Customer replies remain non-internal.
- Replying to `waiting_requester` reopens the ticket to `open`.
- Users can only close their own tickets.
- CSAT only accepts ratings for resolved/closed tickets.
- Duplicate CSAT submission returns conflict.

## Acceptance Criteria

- [ ] Community tickets can be created through the shared support API.
- [ ] Community tickets carry clear portal context for admins.
- [ ] Invalid `type`, `priority`, and `related_entity_type` values are rejected.
- [ ] Requester GET/PATCH/message/CSAT endpoints remain object-level authorized.
- [ ] Internal notes remain admin-only.
- [ ] Diviner dashboard ticket creation still works.

## QA Notes

After implementation, test with:

- one diviner/dashboard user
- one active Perennial Mandalism member
- one admin user

Confirm each requester sees only their own tickets.
