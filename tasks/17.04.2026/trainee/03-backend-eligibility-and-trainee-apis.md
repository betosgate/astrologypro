# Task 03 - Backend Eligibility And Trainee APIs

- Status: Planned
- Owner: Backend
- Depends On: `02-data-model-and-migrations.md`

## Purpose

Implement the server-side logic that decides whether a trainee should see the booking block and what state the block should render.

## Core Eligibility Rule

Use current training logic instead of duplicating logic in the UI.

Recommended rule:

1. trainee exists
2. trainee has completed training according to current authoritative rules
3. feature config is enabled
4. appointment completion flag is false

Then:

1. `tabbie_appointment_required = true`
2. `tabbie_appointment_status = eligible_to_book` if there is no active booking

## New Shared Backend Helper

Create a shared service module, for example:

1. `src/lib/trainee-tabbie-appointments.ts`

Responsibilities:

1. read current config
2. evaluate trainee eligibility
3. load current appointment summary
4. compute dashboard state payload
5. update summary fields on `trainees` when authoritative state changes

## Recommended Server Contract

Create a helper result like:

```ts
type TraineeTabbieDashboardState = {
  isTrainingCompleted: boolean;
  isFeatureEnabled: boolean;
  isRequired: boolean;
  showBlock: boolean;
  status:
    | "not_required"
    | "eligible_to_book"
    | "booking_in_progress"
    | "booked"
    | "cancelled"
    | "completed"
    | "no_show"
    | "failed"
    | "manually_completed"
    | "manually_cancelled";
  completed: boolean;
  currentAppointment: {
    id: string;
    scheduledStartAt: string | null;
    scheduledEndAt: string | null;
    timezone: string | null;
    externalBookingId: string | null;
  } | null;
  content: {
    title: string;
    body: string;
    buttonLabel: string;
    helperText: string | null;
    openMode: "same_tab" | "new_tab";
    bookingLink: string | null;
    variant: "info" | "neutral" | "warning" | "success";
  } | null;
};
```

## API Endpoints To Add

### 1. Trainee status API

Suggested route:

1. `GET /api/trainee/tabbie-appointment`

Return:

1. training completion status
2. whether to show booking block
3. current appointment status
4. appointment date/time if booked
5. current content config snapshot
6. sync error indicator if relevant

### 2. Booking CTA bootstrap endpoint

Only add this if you need a controlled redirect or signed context payload:

1. `POST /api/trainee/tabbie-appointment/launch`

Responsibilities:

1. re-check eligibility
2. write a `booking_in_progress` history entry if useful
3. return the configured booking URL or redirect metadata

## Integration With Existing Dashboard

Choose one of these implementation approaches:

1. server-render directly inside `src/app/trainee/page.tsx`
2. server-render page shell and call the new API from a client component

Recommended for this repo:

1. fetch the state on the server in `src/app/trainee/page.tsx`
2. pass it into a focused presentational component
3. use API routes for mutations, webhook updates, and admin tools

## Safety Rules

1. Never expose a booking link for ineligible trainees.
2. If config is enabled but booking link is missing, return a recoverable UI state and log an admin-visible issue.
3. Never let frontend determine eligibility by itself.

## Deliverables

1. new shared service/helper module
2. trainee API route(s)
3. tests for eligibility calculation
4. integration into trainee dashboard data loading
