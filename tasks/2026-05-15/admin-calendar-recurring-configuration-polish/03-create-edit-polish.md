# Create/Edit Polish

## Target Files

```txt
src/components/admin/calendar-event-form.tsx
src/app/admin/calendar/new/page.tsx
src/app/admin/calendar/[id]/edit/page.tsx
```

## Goal

Make recurrence setup and edit behavior clear to admins.

## Create Page Requirements

On `/admin/calendar/new`:

- Keep visible timezone field.
- Keep `Repeat this event`.
- Keep repeat day checkboxes.
- Keep `Weekend`, `Weekdays`, `Everyday` shortcuts.
- Keep range end date.
- Keep occurrence preview.

Improve preview copy:

```txt
Occurrences are shown in <timezone>.
Occurrences will be created as real calendar events when this form is saved.
Automation is pending before launch.
```

Show an `Automation Pending` badge or note near recurrence controls when repeat is enabled.

## Edit Page Requirements

On `/admin/calendar/[id]/edit`:

If event is one-time:

- normal edit form

If event is recurring:

- show recurrence context block above or inside the form
- show whether this is:
  - series start
  - generated occurrence
- show occurrence number if available
- show timezone
- show automation pending note

Important copy:

```txt
This edits only this occurrence. Series-wide editing is not enabled in this phase.
```

Do not expose a misleading whole-series edit form yet.

## Delete UX

For Phase 2, keep default delete as single occurrence only.

If adding future-series delete UI:

- only show it for recurring events
- warn that events with RSVPs cannot be deleted
- API already blocks future-series deletion if targeted events have RSVPs

If unsure, defer future-series delete UI and keep only single occurrence delete.

## Validation

Keep these validations intact:

- title required
- category required
- audience required
- start required
- end required
- timezone required
- end after start
- recurrence days required when repeat is enabled
- range end required when repeat is enabled
- over 120 occurrences blocked

