# Master Task - Calendar Events Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Calendar of Events
- Status: Done
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/calendar-events`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/calendar-events`
- Primary Next Routes:
  - `/admin/calendar-events`
  - `/admin/calendar-events/add`
  - `/admin/calendar-events/edit/[id]`

## Objective

Close the remaining Angular-to-Next parity gaps for the Calendar Events admin module, focusing on list search/filter/preview behavior and the remaining authoring ergonomics in the custom event form.

## Current Product Truth

- The Next calendar events module already supports the base CRUD flow and most of the event data model.
- The remaining verified gaps are:
  - list preview
  - start-date range filtering
  - category and displayed-event-for filtering
  - stronger title/category search UX
  - richer notification-template authoring
  - time input ergonomics

## Child Tasks

1. `01-close-calendar-events-list-search-filter-and-preview-parity.md`
2. `02-close-calendar-events-form-authoring-parity.md`

## Done Definition

- `/admin/calendar-events` supports preview plus the practical search/filter controls Angular admins use.
- add and edit forms preserve the full event model while improving notification-template and time-entry authoring to match Angular expectations more closely.
- existing recurring-day, subscription, quarter, and visibility behaviors continue to work.

## Verification Gate

1. Validate preview works from the event list.
2. Validate start-date filtering, category search, displayed-event-for filtering, and status filtering all work together.
3. Validate add and edit still save the full event model correctly.
4. Validate subscription notification template authoring remains correct.
5. Validate time entry is reliable and no regression is introduced in edit hydration.

## Notion Ready Summary

Title: Calendar Events parity

Summary:
The Next Calendar Events module already covers most of the event model and CRUD flow. The remaining parity work is mainly admin workflow fidelity: list preview, stronger event search/filter controls, and a couple of form-authoring ergonomics such as notification-template editing and safer time input handling.
