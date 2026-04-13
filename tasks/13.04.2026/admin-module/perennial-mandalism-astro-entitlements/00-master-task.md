# Perennial Mandalism Astrology Entitlements Pack

## Objective

Define the product architecture for Perennial Mandalism users so they automatically receive:

- natal charts
- relationship charts across all available family members
- full family dynamic chart coverage
- monthly transit generation

Base-user creation rule:

- when the base Perennial Mandalism user is created, only natal and monthly transit provisioning should happen automatically
- relationship charts and family-dynamic coverage should happen later, after additional family-member context exists

This must reuse the existing astrology module wherever possible.

The system also needs operational rules:

- monthly transits generate once per month
- natal and relationship generation should normally happen once
- members may regenerate up to `3` times if they entered information incorrectly
- after the retry limit, they must open a job or support ticket for review
- when natal or monthly transit artifacts are created, the user must be notified

This pack is architecture and task writing only. It does not implement the feature.

## Current Repo Grounding

### Existing natal chart generation

The repo already supports natal chart generation for family members through:

- `src/app/api/community/generate-natal/route.ts`
- `src/lib/astro/natal-chart.ts`
- `supabase/migrations/20260404000004_family_members.sql`

Natal chart data is already stored on:

- `community_family_members.natal_chart`

### Existing relationship chart generation

The repo already supports relationship chart generation through:

- `src/app/api/community/relationship-charts/route.ts`
- `src/lib/astro/synastry.ts`
- `supabase/migrations/20260404000005_relationship_charts.sql`

### Existing monthly transit generation

The repo already has monthly transit automation through:

- `src/app/api/cron/monthly-transits/route.ts`
- `src/lib/astro/transits.ts`
- `supabase/migrations/20260404000006_monthly_transits.sql`

The cron is already idempotent per family member and month.

### Existing family and chart surfaces

User-facing family and chart pages already exist via:

- `src/app/community/family/page.tsx`
- `src/app/community/family/[id]/page.tsx`
- `src/app/community/charts/page.tsx`
- `src/app/community/transits/page.tsx`

### Existing support ticket system

The repo already has a usable ticket system through:

- `supabase/migrations/20260407000062_support_tickets.sql`
- `src/app/dashboard/support/page.tsx`
- `src/app/api/support/tickets/route.ts`
- `src/app/admin/tickets/page.tsx`

That means chart issues should escalate into the existing support or job ticket framework rather than a separate custom issue channel.

## Product Direction

The correct architecture is:

1. membership entitlement rules
2. automatic generation orchestration
3. retry-limit governance
4. family-wide relationship coverage
5. monthly transit lifecycle
6. support escalation after self-service limits are exhausted

## Workstreams

1. `01-membership-entitlement-and-scope-rules.md`
2. `02-automatic-natal-generation-and-retry-governance.md`
3. `03-relationship-chart-coverage-and-family-dynamics.md`
4. `04-monthly-transit-orchestration-and-delivery.md`
5. `05-user-controls-regeneration-limits-and-audit.md`
6. `06-support-ticket-escalation-for-chart-issues.md`
7. `07-seed-fixtures-rollout-and-ops-monitoring.md`
8. `08-base-user-auto-provisioning-natal-and-monthly-only.md`
9. `09-chart-creation-notifications-and-delivery-audit.md`

## Acceptance Standard

This feature set is complete only when:

- Perennial Mandalism members automatically receive natal chart coverage for eligible profiles
- base-user creation auto-provisions only natal and monthly transit eligibility
- relationship charts are available across the family set using existing synastry logic
- monthly transits generate exactly once per member profile per month
- users are notified when natal charts and monthly transit artifacts are created
- chart regeneration is capped at `3` correction attempts
- support escalation uses the existing ticket system
- admin has visibility into chart status, failures, retries, and unresolved issues
