# Diviner Session Count Visibility Pack

## Objective

Add a public-facing stats block that can show:

- total completed readings or sessions to date
- completed readings in the last 7 days
- completed readings in the last 30 days

The block must be controllable by:

- the diviner from their own dashboard
- an admin on behalf of the diviner

This is architecture and task definition only. It does not implement the feature.

## Current Repo Grounding

### Existing public stats path

The public profile already computes and renders profile stats in `src/app/[username]/page.tsx`.

Confirmed current fields:

- `completedSessions`
- `averageRating`
- `reviewCount`
- `openSlotsThisWeek`

The count is currently derived from `bookings` where:

- `diviner_id = ?`
- `status = 'completed'`

### Existing visibility control system

There is already a publish-control framework for public diviner sections:

- `src/lib/diviner-publishing.ts`
- `src/app/admin/diviners/[id]/publishing-controls.tsx`
- `src/app/api/admin/diviners/[id]/publishing/route.ts`
- `supabase/migrations/20260413000160_diviner_publish_controls.sql`

This system currently supports section-level blocking such as:

- `hero`
- `bio`
- `services`
- `live`
- `media`
- `testimonials`
- `weekly_subscription`

### Existing dashboard profile editing path

The authenticated diviner already updates profile data via:

- `src/app/api/dashboard/profile/route.ts`

## Product Intent

This block is a social-proof and activity-trust module. It should answer:

- is this diviner active?
- how much experience do they have overall?
- have they been seeing clients recently?

It should not expose raw operational data or become misleading because of cancellations, no-shows, or draft bookings.

## Recommended Product Model

### Metric source of truth

Use `bookings` with `status = 'completed'` as the source of truth.

### Time windows

Calculate:

- `lifetime_completed_sessions`
- `completed_sessions_last_7_days`
- `completed_sessions_last_30_days`

using `scheduled_at` or `completed_at` if a canonical completion timestamp exists. If both exist in the system, standardize on one and document it.

### Visibility logic

Use a two-layer model:

1. Diviner preference:
   - diviner can choose to show or hide the block
2. Admin override:
   - admin can force-hide or force-show regardless of diviner preference

If no admin override exists, the diviner preference should decide visibility.

### Public copy model

Do not label the numbers ambiguously. Use explicit labels such as:

- `Sessions completed`
- `Last 7 days`
- `Last 30 days`

If product language prefers “readings” instead of “sessions,” standardize that term platform-wide for this module.

## Workstreams

1. `01-db-settings-and-visibility-precedence.md`
2. `02-public-profile-stats-aggregation-and-rendering.md`
3. `03-diviner-dashboard-control-surface.md`
4. `04-admin-override-and-publishing-integration.md`
5. `05-analytics-copy-governance-and-edge-cases.md`

## Acceptance Standard

This feature is complete only when:

- the public page can show total, 7-day, and 30-day completed session counts
- the diviner can manage visibility from their own dashboard
- the admin can manage or override visibility on behalf of the diviner
- visibility precedence is deterministic and documented
- counts are derived from the same booking truth used elsewhere

## Status

- `01-db-settings-and-visibility-precedence.md` — Done
- `02-public-profile-stats-aggregation-and-rendering.md` — Done
- `03-diviner-dashboard-control-surface.md` — Done
- `04-admin-override-and-publishing-integration.md` — Done
- `05-analytics-copy-governance-and-edge-cases.md` — Done
