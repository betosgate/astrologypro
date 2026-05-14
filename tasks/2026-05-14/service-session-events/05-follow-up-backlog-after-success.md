# Follow-Up Backlog After Successful Initial Launch

## Objective

Track features intentionally deferred until the initial implementation proves stable and valuable.

## Notification Integration

Later wire the notification bell for:

- RSVP confirmation
- event starting soon
- new replay available
- booked service session reminder
- reading completed
- new community resource
- billing or plan update

Do not implement this in the initial sessions/events phase.

## Family And Household Expansion

Later evaluate whether `/community/sessions` should show:

- sessions booked for linked family members
- sessions grouped by family member
- recordings tied to family/member charts
- relationship chart session history

Do not expose household sessions until ownership and privacy rules are explicit.

## Event Enhancements

Later add:

- event detail page
- event capacity
- RSVP cutoff
- host/facilitator
- replay link for community event recordings
- calendar export per event

## Bulk RSVP Optimization

Current `/community/events` fetches RSVP state per event. Later optimize with:

- RSVP data included in `/api/community/events`
- or a bulk endpoint for event IDs

## Dedicated Session API

If `/community/sessions` grows, consider a dedicated route:

```txt
GET /api/community/sessions
```

Keep first implementation server-rendered unless client interactivity requires otherwise.

