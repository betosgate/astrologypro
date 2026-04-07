# Add Monthly Transit Ready Email - 2026-04-06

- Status: Planned
- Priority: P1
- Owner: Fullstack
- Scope: monthly transit notification trigger, delivery eligibility
- Estimate: 0.5-1 day
- Task File: `docs/tasks/perennial/2026-04-06/02-monthly-transit-ready-email.md`

## Goal

Implement the requirement-driven monthly transit ready email for active community members.

## Verified Current Code Truth

- Monthly transit page exists at `src/app/community/transits/page.tsx`.
- Transit generation logic exists in `src/app/api/cron/monthly-transits/route.ts`.
- A verified member-notification path for �monthly transit ready� is not currently exposed.



## Required Behavior

1. Members with eligible monthly transit data can receive a monthly transit ready notification.
2. Notification should be tied to successful transit generation or publish-ready state.
3. Duplicate sends for the same cycle should be avoided.

## Tasks

1. Define the monthly transit ready event boundary.
2. Add notification eligibility rules for active members.
3. Trigger the email from transit generation completion or a controlled post-generation step.
4. Add per-cycle deduplication tracking.

## Acceptance Criteria

- monthly transit ready email can be sent for the correct cycle
- only eligible active members receive it
- the same cycle does not send repeatedly to the same member

## Verification Test Plan

1. Generate the monthly transit cycle.
2. Verify the eligible active member set is calculated correctly.
3. Verify the monthly transit ready email sends once per user per cycle.

## Notion Summary

P1 notification gap: the monthly transit feature exists, but the documented ready-email flow still needs to be wired to the actual transit generation lifecycle.
