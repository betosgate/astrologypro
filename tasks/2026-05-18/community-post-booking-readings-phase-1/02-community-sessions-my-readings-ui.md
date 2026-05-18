# Task 02 - Community Sessions My Readings UI

- Status: Proposed
- Priority: P1
- Owner: Frontend
- Area: `src/app/community/sessions`
- Created: 2026-05-18

## Objective

Turn `/community/sessions` into the Community member's read-only “My Readings”
page.

## Requirements

- Fetch `GET /api/community/bookings`.
- Split readings into:
  - Upcoming
  - Past
- Show a useful empty state with a Community reading CTA.
- Keep Phase 1 read-only except Join and Details.

## Row/Card Fields

Each reading should show:

- Service name
- Diviner name
- Date/time
- Duration
- Status
- Join button when `join_href` exists and status is joinable
- Details button via `BookingDetailSheet`

## Status Handling

Join should be visible for:

```text
pending
confirmed
in_progress
```

Past/completed/cancelled readings should still allow Details.

## UX Notes

- Use the existing Community layout and styling patterns.
- Avoid a new dashboard design system.
- Keep the page scannable; this is a utility page, not a marketing page.
- Add a small dashboard entry point later only after this page works.

## Acceptance Criteria

- `/community/sessions` loads for logged-in Community members.
- Empty state routes users through the existing Community reading CTA flow.
- Upcoming and past sections render correctly.
- Join opens the tokenized session URL in the same tab or as a normal link.
- Page handles API errors gracefully.

