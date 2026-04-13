# Task 03 - Seed Realistic Diviner Traffic Report Data

- Status: Done

## Completion Notes

- Added deterministic demo seed coverage in [supabase/migrations/20260413000171_seed_diviner_activity_analytics.sql](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/supabase/migrations/20260413000171_seed_diviner_activity_analytics.sql:1).
- The seed creates traffic across multiple diviners, countries, sources, partner-attribution types, and hours of day using identifiable `/seed/diviner-traffic/*` paths.
- Priority: P1
- Owner: Database / Demo data

## Objective

Create realistic seed data so the new diviner traffic report can be validated and demoed immediately across multiple diviners, sources, countries, and partner channels.

## Why This Task Exists

A reporting feature without seed coverage is difficult to validate:

- top rankings cannot be inspected
- location breakdowns may be empty
- source classification may never exercise all branches
- partner attribution rows may never appear

## Required Seed Characteristics

The seed should include:

### Multiple diviners

At least 3 diviners with visibly different hit volumes so ranking is obvious.

### Multiple geographies

Include rows across several countries and cities, for example:

- US / New York
- GB / London
- IN / Kolkata
- CA / Toronto
- BR / Sao Paulo

### Multiple traffic sources

Include rows representing:

- direct
- organic search
- social
- referral
- affiliate
- advocate

### Multiple times of day

Spread rows across different hours so the hourly chart has shape.

### Partner splits

Seed some rows as:

- affiliate-related
- advocate-related
- non-partner / organic

## Seed Design Principles

- Use deterministic or semi-deterministic data patterns.
- Do not depend on external APIs.
- Avoid conflicts with existing `page_views` seed logic.
- Make seeded paths identifiable if cleanup is ever needed.

## Files To Read First

- `supabase/migrations/20260413000004_seed_session_data.sql`
- `supabase/migrations/20260401000002_analytics.sql`

## Acceptance Criteria

- The seeded environment shows a meaningful top-diviners ranking.
- Countries, locations, and sources are non-empty and visibly varied.
- Partner-related hits appear in the report without manual setup.

## Verification Test Plan

- [ ] Run the seed migration in a local environment.
- [ ] Query `page_views` and confirm seeded rows include the new attribution and geo columns.
- [ ] Open the report and confirm all sections populate with non-trivial values.
