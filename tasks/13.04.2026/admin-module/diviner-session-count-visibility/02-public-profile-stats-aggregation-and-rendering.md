# Task 02: Public Profile Stats Aggregation and Rendering

## Goal

Extend the public profile stats pipeline to include lifetime, 7-day, and 30-day completed session counts, then render them in a dedicated block.

## Why This Is Needed

`src/app/[username]/page.tsx` already computes `completedSessions`, reviews, and availability. This is the correct place to extend rather than adding a second competing data path.

## Required Aggregation Design

### 1. Metric definitions

Use `bookings.status = 'completed'` only.

Do not count:

- pending
- confirmed but not completed
- cancelled
- no-show
- refunded sessions unless product explicitly says they still count as completed

### 2. Time window definitions

Add:

- `completedSessionsLifetime`
- `completedSessionsLast7Days`
- `completedSessionsLast30Days`

Define the time window consistently:

- rolling last 7 x 24 hours
- rolling last 30 x 24 hours

or

- local calendar windows in the diviner timezone

Pick one rule and document it. For trust-facing metrics, rolling windows are usually simpler and less ambiguous.

### 3. Query strategy

Prefer one query or one small set of aggregate queries instead of full booking hydration.

If Supabase query ergonomics are awkward, use:

- one lifetime count query
- one count query for `>= now - 7 days`
- one count query for `>= now - 30 days`

Keep the implementation simple and index-friendly.

### 4. Public rendering

Render the new module near existing trust metrics in the profile hero or adjacent trust band.

Recommended layout:

- large lifetime count as the anchor number
- two smaller recent-activity stats beneath or alongside it

Example labels:

- `1,248 sessions completed`
- `26 in the last 7 days`
- `91 in the last 30 days`

### 5. Visibility behavior

If resolved visibility is false:

- do not render the block
- do not render empty placeholders

### 6. Reuse potential

Consider whether `src/app/api/public/diviners/route.ts` should also expose these fields later for directory cards or sort options. That is optional for initial implementation, but the task should note it.

## Files In Scope

- `src/app/[username]/page.tsx`
- the component that renders public profile metrics or hero stats
- shared stats helper if extracted

## Acceptance Criteria

- public profile shows all three counts when enabled
- counts come from completed bookings only
- the feature reuses the existing public stats pipeline cleanly

## Status

Done.

Implemented in `src/app/[username]/page.tsx` with rolling 7-day and 30-day completed-booking counts, rendered in `src/components/landing/diviner-hero.tsx` when visibility resolves true.
