# Role Service Package Alignment Pack

## Objective

Define how `astrology` and `tarot` service categories should be assigned across role packages so diviners and trainees see the correct service configuration in:

- their profile surfaces
- their post-signup stepper or onboarding flow

Required product rule:

- there are `3` package types
- one package enables both `astrology` and `tarot`
- one package enables only `astrology`
- one package enables only `tarot`

This rule must be consistent for both:

- `diviner`
- `trainee`

This pack is architecture and task writing only. It does not implement the feature.

## Current Repo Grounding

### Existing service category model

The repo already uses service categories including:

- `astrology`
- `tarot`

Grounding:

- `src/app/api/dashboard/services/route.ts`
- `src/app/[username]/services/page.tsx`
- `src/app/[username]/page.tsx`
- `supabase/migrations/20260331000001_initial_schema.sql`

### Existing public service rendering

The public diviner pages already split services by category:

- astrology services
- tarot services

This proves the frontend already understands the category distinction.

### Existing onboarding and stepper flows

The repo already has role onboarding flows and steppers, especially:

- `src/app/onboarding/page.tsx`
- trainee and perennial onboarding flows in the sign-up task packs

### Existing plan and package admin surfaces

The repo already has package or plan concepts in:

- `src/app/admin/diviner-plans/page.tsx`
- `src/app/admin/packages/page.tsx`

## Product Direction

The correct model is:

1. package capability definition
2. role-to-package assignment
3. service category entitlement
4. stepper personalization
5. profile and public-surface alignment

## Workstreams

1. `01-package-capability-model-for-astro-and-tarot.md`
2. `02-role-to-package-assignment-rules-for-diviner-and-trainee.md`
3. `03-stepper-and-post-signup-service-selection-flow.md`
4. `04-profile-surface-and-service-management-alignment.md`
5. `05-admin-governance-seeding-and-migration-strategy.md`

## Acceptance Standard

This feature set is complete only when:

- the platform has a canonical package model for `both`, `astrology-only`, and `tarot-only`
- diviner and trainee roles resolve to the correct package capability
- the post-signup stepper shows service setup accordingly
- profile surfaces reflect the same package rule
- admin can manage and seed the mapping without hardcoded drift
