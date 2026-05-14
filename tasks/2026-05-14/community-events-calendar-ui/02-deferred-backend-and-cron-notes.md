# Deferred Backend And Cron Notes

## Objective

Record backend work intentionally deferred until after the `/community/events` UI is stable.

## Later API Improvement

Current page fetches RSVP details per event. Later optimize `/api/community/events` to return:

- current user RSVP status
- going count
- maybe count

This avoids an N+1 fetch pattern on the calendar page.

## Later Recurrence Model

Do not copy the legacy Nest implementation directly.

Recommended future table:

```txt
calendar_event_occurrences
```

Purpose:

- expand recurring event definitions into concrete dated occurrences
- support calendar rendering from occurrences
- support per-occurrence cancellation or override

## Later Reminder Model

Recommended future table:

```txt
calendar_event_reminders
```

Purpose:

- queue RSVP/event reminder emails
- deduplicate reminders
- allow cron batch processing

## Later Cron Routes

Recommended future routes:

```txt
/api/cron/calendar-event-occurrences
/api/cron/calendar-event-reminders
```

Important:

- process batches, not one reminder at a time
- use unique constraints for idempotency
- do not delete and recreate RSVP history on event update

## Legacy Research Summary

Legacy Nest exposed event processing through HTTP endpoints:

- `GET /event/event-slot-process`
- `GET /event/event-notification-process`

These behaved like externally triggered cron endpoints. The event service did not contain an active `@Cron()` for this calendar module.

Legacy risks to avoid:

- event update deleted slots, subscriptions, and notifications
- notification processor sent only one queued reminder per run
- missed-day reminders could be skipped
- generated slot identity changed after event edits

