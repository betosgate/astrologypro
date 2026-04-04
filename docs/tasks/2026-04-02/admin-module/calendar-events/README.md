# Calendar Events Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Calendar of Events
- Angular Source Routes:
  - `admin-dashboard/calender-of-events`
  - `admin-dashboard/calender-of-events/add-calendar-of-events`
  - `admin-dashboard/calender-of-events/edit-calendar-of-events/:_id`
- Next Route:
  - `/admin/calendar-events`
  - `/admin/calendar-events/add`
  - `/admin/calendar-events/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/calendar-events`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/calendar-events`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Calendar of Events`.

The Next calendar events module already covers most of the event model and is close to parity. The remaining gaps are mainly in list search/filter/preview behavior and a smaller form-authoring detail around notification template and time input UX.

## Verified Current Comparison Summary

### Already Implemented In Next

- calendar events list route at `/admin/calendar-events`
- calendar events add route at `/admin/calendar-events/add`
- calendar events edit route at `/admin/calendar-events/edit/[id]`
- list uses:
  - `event/event-list`
  - `event/event-list-count`
- list supports:
  - row-level status toggle
  - row-level delete
  - edit navigation
  - title text search
  - status filtering
- form already supports:
  - `title`
  - `priority`
  - `category`
  - `color_code`
  - `start_date`
  - `start_time`
  - `end_date`
  - `end_time`
  - `timezoneValue`
  - `displayed_event_for`
  - `description`
  - `role`
  - `is_recurring`
  - recurring day selection
  - `subscription_availability`
  - `notification_template`
  - `quarter`
  - `visible_in_frontend`
  - `not_available_slot`
  - `holiday_event`
  - `status`
- edit flow already fetches and hydrates the existing event record

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list includes a Preview action from the list
- Angular list supports start-date range filtering on `start_date`
- Angular list supports category autocomplete-style search
- Angular list supports filtering by `displayed_event_for`
- Angular title search is autocomplete-backed rather than plain text only
- Angular uses richer editor authoring for `notification_template` when subscription availability is enabled
- Angular time fields use explicit time-picker style inputs rather than plain text entry

## Recommended Execution Order

1. `01-close-calendar-events-list-search-filter-and-preview-parity.md`
2. `02-close-calendar-events-form-authoring-parity.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/calender-of-events/calender-of-events-routing.module.ts`
- `src/app/admin-dashboard/calender-of-events/calender-of-events/calender-of-events.component.ts`
- `src/app/admin-dashboard/calender-of-events/calender-of-events/calender-of-events.component.html`
- `src/app/admin-dashboard/calender-of-events/add-edit-calendar-of-events/add-edit-calendar-of-events.component.ts`
- `src/app/admin-dashboard/calender-of-events/add-edit-calendar-of-events/add-edit-calendar-of-events.component.html`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/calendar-events/page.tsx`
- `src/app/(admin)/admin/calendar-events/add/page.tsx`
- `src/app/(admin)/admin/calendar-events/edit/[id]/page.tsx`
- `src/app/(admin)/admin/calendar-events/_components/calendar-event-form.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- No endpoint-name-only task is included.
- The Next event form is already materially more complete than most migrated modules; the remaining work is mostly around admin ergonomics and search/filter fidelity.
