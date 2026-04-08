# Add Membership Welcome And Enrollment Emails - 2026-04-06

- Status: Completed (2026-04-08, upstream)
- Completion Notes: Welcome + enrollment emails fire from `src/app/api/stripe/webhooks/route.ts` (community welcome ~line 181, MS enrollment confirmation ~line 224); SES dedup window provides idempotency.
- Priority: P1
- Owner: Fullstack
- Scope: community welcome email, Mystery School enrollment confirmation
- Estimate: 0.5-1 day
- Task File: `docs/tasks/perennial/2026-04-06/01-membership-welcome-and-enrollment-emails.md`

## Goal

Add the missing transactional emails for community signup and Mystery School enrollment from the Perennial / community flow.

## Verified Current Code Truth

- Community checkout entry exists in `src/app/api/community/checkout/route.ts`.
- Community and Mystery School upgrade messaging exists in `src/app/community/upgrade/page.tsx`.
- A verified email trigger path for:
  - community membership welcome
  - Mystery School enrollment confirmation
  is not currently exposed in the reviewed code.

## Required Behavior

1. Successful community signup sends a welcome email.
2. Successful Mystery School enrollment sends a confirmation email.
3. Email triggering is tied to successful billing or subscription state creation, not only page navigation.

## Tasks

1. Identify the source-of-truth success event for community signup.
2. Trigger the community welcome email from that success path.
3. Identify the source-of-truth success event for Mystery School enrollment.
4. Trigger the enrollment confirmation email from that path.
5. Add safe deduplication so retry or refresh does not send duplicates.

## Acceptance Criteria

- welcome email sends after successful community signup
- enrollment confirmation sends after successful Mystery School enrollment
- duplicate sends are prevented on retry

## Verification Test Plan

1. Complete a community signup flow and verify the welcome email event is emitted once.
2. Complete a Mystery School enrollment flow and verify the confirmation email event is emitted once.
3. Retry the same success path and verify duplicate email protection works.

## Notion Summary

P1 transactional gap: Perennial needs the documented welcome and enrollment confirmation emails wired to real successful subscription events.
