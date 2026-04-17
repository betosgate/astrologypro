# Task 07 - Trainee Dashboard UI And State Rendering

- Status: Planned
- Owner: Frontend
- Depends On: `03-backend-eligibility-and-trainee-apis.md`, `05-admin-config-module-and-audit.md`

## Purpose

Render the post-training appointment block on the trainee dashboard in a way that is clear, stateful, and consistent with the existing portal.

## Primary Target

1. `src/app/trainee/page.tsx`

Recommended supporting components:

1. `src/components/trainee/tabbie-appointment-card.tsx`
2. optional status badge/date helper utilities

## Placement

The block should appear high on the dashboard, before low-priority widgets.

In the current dashboard structure, place it near:

1. progress summary
2. next action cards
3. recent activity

Do not bury it below tertiary informational panels.

## State Variants To Render

### Eligible, not booked

Render:

1. admin-configured title
2. admin-configured body
3. CTA button
4. helper text if present
5. visual style `info`

### Booked

Render:

1. booked state title/message
2. current appointment date/time
3. timezone if available
4. optional message about reschedule/cancel through booking system
5. visual style `neutral`

### Cancelled

Render:

1. cancelled or rebook message
2. CTA to book again
3. warning styling

### Completed

Render:

1. success message
2. completed timestamp if appropriate
3. optional removal of CTA
4. success styling

## Recommended UX Rules

1. Button label comes from admin config in eligible and cancelled states.
2. Open in same tab or new tab based on config.
3. If booking link is unavailable, show a friendly error state instead of dead CTA.
4. If date/time exists, always format it in a clear locale-aware form.
5. Mobile layout must remain readable and should not collapse critical copy.

## Data Loading Recommendation

Because `src/app/trainee/page.tsx` is already a server component with parallel data fetching:

1. keep state loading on the server if possible
2. pass normalized data into the card component
3. only use client behavior for transient actions or live refresh after redirect return

## Deliverables

1. dashboard card component
2. page integration into trainee dashboard
3. state-specific rendering
4. responsive styling
5. graceful empty/error state handling
