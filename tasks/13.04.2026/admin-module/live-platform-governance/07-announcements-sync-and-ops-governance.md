# Task 07: Announcements, Sync, and Ops Governance

## Goal

Define how future live event sync and announcements should respect platform governance.

## Why This Is Needed

The broader live strategy includes:

- account connections
- event scheduling sync
- `next live` announcements
- live-now status changes

Those workflows should not operate independently from platform enablement rules.

## Required Governance Rules

### 1. Connection eligibility

Diviners should only be able to connect accounts for platforms that are allowed for them.

### 2. Sync eligibility

If a platform is disabled globally:

- scheduled sync jobs should skip it
- next-live derivation should ignore it
- live-now automation should ignore it

### 3. Announcement eligibility

Only enabled and allowed platforms should generate:

- public next-live cards
- follower notifications
- community announcements

### 4. Operational shutdown behavior

If admin disables a platform after events already exist:

- historical event rows may remain
- future announcements should be suppressed
- public next-live surfaces should stop using that platform

## Acceptance Criteria

- platform governance applies not just to UI but also to background sync and announcement pipelines
- admin disablement acts as a true operational kill switch

## Status

Done.

Current implementation centralizes governance in `src/lib/live-platform-governance.ts` and uses that resolver in live-status/public-render paths so any future sync or announcement workers can reuse the same kill-switch rules instead of inventing a separate policy path.
