# 08 Base User Auto Provisioning Natal and Monthly Only

## Goal

Define the exact automation that should run when the base Perennial Mandalism user is created.

## Product Rule

When the base user is created, the system should automatically provision only:

- natal chart readiness
- monthly transit readiness

It should not automatically generate:

- relationship charts
- family dynamic coverage

Those require broader family context and should happen only after the relevant people exist.

## Current Repo Grounding

Base-user and membership provisioning already touch:

- `community_members`
- Stripe webhook membership creation paths
- signup and onboarding flows

Relevant grounding:

- `src/app/api/stripe/webhooks/route.ts`
- `src/app/auth/callback/route.ts`
- `supabase/migrations/20260403000011_new_roles.sql`

The current astro generation logic is already separate by domain:

- natal chart generation lives in `src/app/api/community/generate-natal/route.ts`
- monthly transit generation lives in `src/app/api/cron/monthly-transits/route.ts`
- relationship generation lives in `src/app/api/community/relationship-charts/route.ts`

This separation supports the requested provisioning rule.

## Recommended Provisioning Interpretation

Base-user creation should do two things:

### 1. Natal chart provisioning

Create the system state required so the base user can have a natal chart generated as soon as valid birth data is present.

This may mean:

- ensuring the primary user has an eligible chart profile
- queueing natal generation if birth data is already complete
- otherwise marking natal status as awaiting required data

### 2. Monthly transit provisioning

Create the system state required so the user is included in monthly transit generation once a natal chart exists.

This means:

- do not generate a monthly transit immediately unless business explicitly wants same-month instant backfill
- do ensure the profile becomes part of the monthly cron eligibility model

## What Must Not Happen at Base-User Creation

### Relationship charts

Do not auto-generate relationship charts at base-user creation because:

- one person alone cannot produce pairwise synastry
- even if family members are later added, relationship coverage should be incremental and context-aware

### Family dynamic chart

Do not auto-generate a family dynamic layer at base-user creation because:

- this is a derived artifact from multiple eligible people
- generating it before enough profiles exist would create misleading empty states

## Recommended Event Flow

1. base user created
2. `community_members` membership row becomes active or provisioned
3. primary profile chart status becomes tracked
4. if birth data is sufficient, natal generation is queued or executed
5. monthly transit eligibility is activated for the primary profile
6. no relationship generation occurs yet

## Edge Cases

### Missing birth data

If signup does not capture enough birth data:

- mark natal as pending input
- do not fail the entire user provisioning flow

### Immediate transit expectation

If product wants “current month transit on signup,” that should be a separate admin-configured rule, not assumed by default.

The safer default is:

- monthly transit remains part of the recurring monthly engine

### Family plan household signups

If multiple users are provisioned together, apply this rule per base profile:

- natal readiness yes
- monthly transit readiness yes
- relationship coverage no at provisioning time

Relationship generation can run after all member profiles exist and natal coverage is complete.

## Deliverables

- base-user chart provisioning sequence
- signup-to-chart eligibility rules
- exclusion rule for relationship and family-dynamic generation at signup
- edge-case handling for missing data and household signups
