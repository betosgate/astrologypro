# Admin List And Community Alignment

## Files

Primary admin list file:

```txt
src/app/admin/calendar/page.tsx
```

Community page should generally not need major changes:

```txt
src/app/community/events/page.tsx
```

Only touch community page if category normalization requires a small update.

## Admin List Requirements

Upgrade `/admin/calendar` list to make event data easier to audit.

### Category Badges

Show category as a colored badge:

```txt
Ritual
Sunday Service
Live Class
Meditation
Other
```

Use the same visual category language as `/community/events`.

### Recurring Indicator

For rows with `recurrence_series_id`, show a small badge:

```txt
Recurring
```

For generated child occurrences, optionally show:

```txt
Occurrence
```

For the first/root occurrence, optionally show:

```txt
Series start
```

### Filters

Current filters:

- start date from
- start date to
- category text

Recommended update:

- category dropdown instead of free text
- optional recurring filter:
  - All
  - One-time
  - Recurring

### Actions

Keep:

- preview
- edit

Add only if low-risk:

- delete single occurrence
- delete future series occurrences

If delete series behavior is not implemented, do not show a misleading series delete control.

## Community Alignment

Community `/community/events` must display only real saved rows.

If admin recurring creation generated 8 rows, community calendar should show 8 real dated events across the months.

Category mapping should support both old seed values and new values:

```txt
sunday_service -> Sunday Service
ceremony -> Ritual or Other, depending current mapping decision
workshop -> Other unless a Workshop category is added
orientation -> Other unless an Orientation category is added
```

Recommended Phase 1 mapping:

```txt
ritual -> Ritual
sunday_service -> Sunday Service
ceremony -> Ritual or Other only if existing seed cleanup is not done
live_class -> Live Class
live class -> Live Class
meditation -> Meditation
everything else -> Other
```

Do not add more user-facing categories unless product/client approves.

## Data Cleanup Note

Existing seed data may have categories:

```txt
ceremony
workshop
orientation
sunday_service
```

Do not run destructive cleanup automatically.

If needed for demo, add a separate seed/data-normalization task later.

