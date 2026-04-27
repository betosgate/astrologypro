# 05 Booking Handoff And Intake Context

## Goal

Carry the saved intake submission into the final booking flow.

## Required Outcome

When the user continues after date/diviner resolution, the system must hand off to:
- `/{username}/book/{serviceSlug}`

with enough context to keep the saved intake submission attached.

## Required Questions Claude Must Resolve

1. Should the booking route read `submission` from query params?
2. Should the booking wizard prefill relevant fields from the saved submission?
3. If prefill is deferred, what minimum linkage must still be persisted so the booking can later be tied back to the saved intake?

## Minimum Required Contract

At minimum:
- `submission` id must survive into the real booking route
- final booking creation must not lose that relationship

Preferred outcome:
- selected date and/or chosen diviner context survives cleanly
- birth data or other intake fields can prefill where appropriate

## Important Constraint

Do not fork a second checkout implementation.

The target is to preserve submission context while still using the existing booking route and booking wizard.

## Acceptance Criteria

- no demo route remains in this branch
- booking handoff is real
- submission linkage is preserved
- future toolkit/booking modules can still consume the saved intake data

