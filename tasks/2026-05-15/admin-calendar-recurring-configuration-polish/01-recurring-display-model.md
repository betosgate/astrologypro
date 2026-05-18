# Recurring Display Model

## Goal

Create a consistent display language for one-time events, recurring series parents, and generated recurring occurrences.

## Existing Data

The Phase 1 migration added:

- `event_timezone`
- `recurrence_series_id`
- `recurrence_parent_id`
- `recurrence_rule`
- `recurrence_position`
- `recurrence_generated_at`

## Display Rules

### One-Time Event

Condition:

```ts
!event.recurrence_series_id
```

Show:

- no recurring badge
- normal edit/delete behavior

### Recurring Parent / Template Occurrence

Condition:

```ts
event.recurrence_series_id && !event.recurrence_parent_id
```

Show badges:

- `Recurring`
- `Automation Pending`
- `Series Start` or `Occurrence #1`

Admin copy:

```txt
This is the first occurrence in a recurring series. In this phase, generated occurrences were created when the admin saved the event. Cron automation is pending before launch.
```

### Generated Occurrence

Condition:

```ts
event.recurrence_series_id && event.recurrence_parent_id
```

Show badges:

- `Recurring`
- `Generated Occurrence`
- `#<recurrence_position>`

Admin copy:

```txt
This edits only this occurrence. Series-wide editing will be added before launch.
```

## Helper Recommendation

Add a small helper rather than scattering checks everywhere.

Possible file:

```txt
src/lib/calendar-events/display.ts
```

Example shape:

```ts
export function getRecurrenceDisplay(event: CalendarEventLike) {
  const isRecurring = Boolean(event.recurrence_series_id);
  const isGeneratedOccurrence = Boolean(event.recurrence_parent_id);
  const isSeriesStart = isRecurring && !isGeneratedOccurrence;

  return {
    isRecurring,
    isGeneratedOccurrence,
    isSeriesStart,
    occurrenceLabel: isRecurring ? `#${event.recurrence_position ?? 1}` : null,
    automationLabel: isRecurring ? "Automation Pending" : null,
  };
}
```

Keep this helper UI-focused. Do not put API mutation logic here.

