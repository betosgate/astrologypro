# Admin List Polish

## Target Page

```txt
src/app/admin/calendar/page.tsx
```

## Goal

Make `/admin/calendar` clearly communicate recurring status without requiring developers or admins to inspect database fields.

## Required UI Changes

For each event row/card:

- Keep category badge.
- Keep audience badge.
- Keep active/inactive status.
- Add recurring display where relevant:
  - `Recurring`
  - `Automation Pending`
  - `Occurrence #1`, `Occurrence #2`, etc.
  - `Generated` for child occurrences if space allows.

## Recommended Badge Language

Use professional, non-technical labels:

- `Recurring`
- `Automation Pending`
- `Occurrence #3`
- `Series Start`

Avoid:

- `cron`
- `lambda`
- raw DB field names
- `parent`
- `child`

## Sorting/Filtering

Do not add complex recurrence filters unless simple.

Optional simple filter:

```txt
All / One-time / Recurring
```

If adding this takes too much code, defer it.

## Preview Modal

If the admin opens preview/details from the list, include:

- timezone
- recurrence status
- occurrence number
- automation pending note for recurring events

## Verification

Manually verify:

1. One-time event has no recurring badge.
2. Recurring series start shows recurring + automation pending.
3. Generated occurrences show occurrence number.
4. Active/inactive badge still works.
5. Category badges still match community categories.

