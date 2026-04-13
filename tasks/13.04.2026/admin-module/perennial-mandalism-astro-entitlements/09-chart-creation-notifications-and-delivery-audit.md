# 09 Chart Creation Notifications and Delivery Audit

## Goal

Ensure users are explicitly notified whenever a natal chart or monthly transit artifact is created.

## Product Rule

When the system creates:

- a natal chart
- a monthly transit

the user must receive a notification.

This should not be treated as optional discovery through the dashboard alone.

## Current Repo Grounding

Monthly transit generation already attempts email delivery in:

- `src/app/api/cron/monthly-transits/route.ts`

The current monthly transit flow already distinguishes:

- generation
- notification delivery

This is the correct model and should be extended consistently to natal chart creation.

## Notification Channels

Recommended minimum:

- email
- in-app/dashboard notification state

Email is the required outward notification.

In-app notification is recommended because:

- users may miss email
- the dashboard should still surface a visible “new chart ready” state

## Natal Notification Rule

When a natal chart is first successfully created:

- send a “your natal chart is ready” notification
- include the profile or person name the chart belongs to
- link the user to the correct chart view

If the natal chart is regenerated later:

- send a different “your natal chart was updated” notification
- avoid pretending it is a first-time chart

## Monthly Transit Notification Rule

When a monthly transit is successfully created:

- send a “your monthly transit is ready” notification
- identify the relevant month
- identify the relevant family member if applicable
- link to the monthly transit area

## Separation of Concerns

Chart generation success and notification success must be tracked separately.

That means:

- chart creation may succeed even if email fails
- failed notifications must remain visible to admin ops
- the system should support safe resend behavior

## Delivery Audit Requirements

For each created natal chart or monthly transit, track:

- artifact type
- artifact id or linked entity id
- recipient user id
- recipient email
- delivery channel
- delivery status
- first sent at
- last attempted at
- resend count

## Anti-Spam Rule

Do not notify repeatedly for the same artifact unless:

- a resend is explicitly requested
- a regeneration creates a materially new artifact state

Monthly transit remains once per month, so it naturally supports one primary notification per profile per month.

## Admin Visibility

Admin should be able to inspect:

- charts created without notification
- notification failures
- resend attempts
- delivery status by artifact type

## Deliverables

- natal and monthly notification specification
- email versus in-app delivery rules
- delivery audit model
- resend and failure-handling policy
