# Data Model And API Contract

## Current Table

Current `calendar_events` fields:

```txt
id
title
description
category
start_at
end_at
display_for
priority
is_active
created_at
updated_at
```

## Required Migration

Add recurrence metadata to `calendar_events`.

Recommended additive migration:

```sql
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS recurrence_series_id UUID,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recurrence_rule JSONB,
  ADD COLUMN IF NOT EXISTS recurrence_position INTEGER,
  ADD COLUMN IF NOT EXISTS recurrence_generated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence_series
  ON public.calendar_events (recurrence_series_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence_parent
  ON public.calendar_events (recurrence_parent_id);
```

### Why JSONB For Rule

Use `recurrence_rule` to avoid repeated migrations while the product is still settling.

Example:

```json
{
  "type": "weekly",
  "days": ["sun"],
  "range_start": "2026-05-17",
  "range_end": "2026-07-26",
  "timezone": "America/New_York",
  "automation": "manual_on_save",
  "cron_enabled": false
}
```

## Category Contract

Admin should save only these category values:

```txt
ritual
sunday_service
live_class
meditation
other
```

UI labels:

```txt
Ritual
Sunday Service
Live Class
Meditation
Other
```

Do not add event category CRUD in this phase.

## Audience Contract

Admin should save only current `display_for` values:

```txt
public
members
students
members_and_guests
```

UI labels:

```txt
Public
Members
Students
Members & Guests
```

## POST /api/admin/calendar

### One-Time Payload

```json
{
  "title": "New Moon Ritual",
  "description": "Optional description",
  "category": "ritual",
  "start_at": "2026-05-21T23:30:00.000Z",
  "end_at": "2026-05-22T01:00:00.000Z",
  "display_for": "members",
  "priority": 1,
  "is_active": true,
  "recurrence": {
    "enabled": false
  }
}
```

### Recurring Payload

```json
{
  "title": "Sunday Service",
  "description": "Weekly gathering",
  "category": "sunday_service",
  "start_at": "2026-05-17T14:00:00.000Z",
  "end_at": "2026-05-17T15:15:00.000Z",
  "display_for": "members",
  "priority": 1,
  "is_active": true,
  "recurrence": {
    "enabled": true,
    "type": "weekly",
    "days": ["sun"],
    "range_end": "2026-07-26",
    "timezone": "America/New_York"
  }
}
```

## Recurring Save Behavior

When recurrence is disabled:

```txt
Insert one event row.
```

When recurrence is enabled:

```txt
Generate all matching dates from start_at date through recurrence.range_end.
Insert one row per occurrence.
All rows share recurrence_series_id.
First occurrence has recurrence_parent_id = null.
Later occurrences have recurrence_parent_id = first occurrence id.
Each row has start_at/end_at adjusted to the occurrence date.
```

## Chunking Requirement For Developers/Agents

Do not implement the API/data work as one large patch.

Recommended API/data chunks:

1. Migration only.
2. Constants/types only.
3. Recurrence occurrence calculation helper only.
4. POST validation for one-time events only.
5. POST manual occurrence generation only.
6. PUT single-row behavior only.
7. DELETE single/future-series behavior only if safe.

Each chunk must be verified before continuing.

## Required Future-Cron Comment In Code

The manual recurrence generation code must include a comment similar to:

```ts
// Temporary Phase 1 path: recurrence occurrences are generated synchronously
// when an admin saves the event. This avoids running cron/Lambda before launch
// while still creating real calendar_events rows for RSVP and Add to Calendar.
// Future cron/worker should handle rolling generation, cleanup, reminders, and
// long-range maintenance from recurrence_rule/recurrence_series_id.
```

This comment should live next to the function or code block that creates the generated occurrence rows.

## Validation Rules

API must reject:

- missing title
- invalid category
- missing start_at
- missing end_at
- end_at <= start_at
- invalid display_for
- invalid priority
- recurrence enabled with no selected days
- recurrence range_end before start date
- recurrence producing more than a safe limit

Recommended initial occurrence limit:

```txt
max 120 occurrences
```

## PUT /api/admin/calendar/[id]

Minimum acceptable Phase 1 behavior:

- edit a single event row
- if editing a generated occurrence, update only that occurrence
- if editing a parent/root occurrence and recurrence fields are changed, show/require a `seriesAction`

Recommended supported `seriesAction` values:

```txt
single
series_regenerate
```

`series_regenerate` can:

1. delete future generated child occurrences in the same series that have no RSVP rows
2. regenerate future occurrences from the submitted rule
3. preserve past occurrences

If this is too risky for Phase 1, implement only `single` updates and display a clear UI note:

```txt
Series-wide editing will be added before launch. Edit individual occurrences for now.
```

## DELETE /api/admin/calendar/[id]

Minimum acceptable Phase 1 behavior:

- delete single row
- if the row is part of a series, allow admin to choose:
  - delete this occurrence only
  - delete future occurrences in this series

Never delete RSVP history silently for past occurrences.
