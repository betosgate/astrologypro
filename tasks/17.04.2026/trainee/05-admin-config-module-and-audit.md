# Task 05 - Admin Config Module And Audit

- Status: Planned
- Owner: Full-stack
- Depends On: `02-data-model-and-migrations.md`

## Purpose

Give Admin a controlled UI and API for managing the trainee dashboard appointment block without code changes.

## Why A Dedicated Config Module Is Better Than Reusing Generic Dashboard Content

The existing `dashboard-content` feature is a useful pattern reference, but this task needs behavior-aware fields:

1. feature enablement
2. booking link
3. open mode
4. state-specific messages
5. validation tied to required booking behavior

Therefore:

1. reuse the admin CRUD/API/UI patterns
2. do not force this into the generic content feed unless that system already cleanly supports behavioral config

## Admin Fields To Support

1. `is_enabled`
2. `block_title`
3. `block_body`
4. `button_label`
5. `booking_link`
6. `open_mode`
7. `highlight_variant`
8. `helper_text`
9. `success_message`
10. `cancelled_message`
11. `post_booking_message`
12. `display_priority`

## Validation Rules

1. Title is required when enabled.
2. Body is required when enabled.
3. Button label is required when enabled.
4. Booking link is required when enabled.
5. Booking link must be a valid URL unless the implementation intentionally stores a provider config key.
6. Max lengths should be enforced in both client and server validation.

## Recommended Routes

1. `GET /api/admin/tabbie-appointment-config`
2. `PUT /api/admin/tabbie-appointment-config`

## Recommended Admin UI Placement

One of:

1. a new dedicated page such as `src/app/admin/tabbie-appointment/page.tsx`
2. a new card or tab under an existing admin configuration surface

Recommended:

1. use a dedicated page so config and monitoring are easy to find later

## Audit Requirements

Any change must log:

1. actor identity
2. old values
3. new values
4. timestamp
5. action type

Recommended target:

1. write to `admin_activity_log`
2. optionally store a structured diff in `details`

## Deliverables

1. config table access helpers
2. admin API route(s)
3. admin page and form component(s)
4. server-side validation
5. audit logging on every create/update
