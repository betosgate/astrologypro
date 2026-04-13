# 03 Relationship Chart Coverage and Family Dynamics

## Goal

Reuse the existing relationship-chart engine to provide family-wide chart coverage for all available members.

## Current Repo Grounding

Relationship charts already exist through:

- `src/app/api/community/relationship-charts/route.ts`
- `src/lib/astro/synastry.ts`
- `relationship_charts`

The current model:

- requires both people to have natal charts
- calculates synastry
- upserts one record per pair

## Product Interpretation

The user asked for:

- relationship charts with all members available
- a full family dynamic chart

The most defensible architecture is:

- pairwise relationship coverage is the canonical data layer
- the family dynamic view is a derived visualization or summary layer

## Recommended Coverage Rule

For a family set of `n` eligible people, the platform should target:

- every valid pair combination

This produces the full relationship matrix without inventing a second inconsistent chart logic.

## Family Dynamic Layer

Recommended output above pairwise charts:

- relationship coverage scorecard
- pair summary list
- strongest harmonious pairs
- highest-friction pairs
- family-wide interpretive overview

This can be generated from existing synastry records rather than recalculating new astrology primitives.

## Regeneration Rule

Relationship charts should regenerate only when:

- person A natal chart changed
- person B natal chart changed
- a pair has never been generated

Do not allow arbitrary unlimited “refresh” without tying it to actual natal input changes or admin support action.

## Performance Concern

Pair counts grow quickly with family size.

That means the architecture should:

- calculate missing pairs incrementally
- avoid recomputing all pairs after a minor unrelated change

## Deliverables

- family relationship coverage rules
- pairwise generation strategy
- derived family overview specification
- recalculation triggers and invalidation rules

---

## Implementation — 2026-04-13

### Migration
`supabase/migrations/20260413000183_relationship_chart_batch_tracking.sql`

**Columns added to `relationship_charts`:**
- `invalidated_at` TIMESTAMPTZ — NULL = chart is current; non-NULL = needs regeneration
- `invalidation_reason` TEXT — e.g. `'natal_chart_updated:person_a_id'`
- `updated_at` TIMESTAMPTZ

**Database trigger:**
- `trg_invalidate_rc_on_natal_change` — fires AFTER UPDATE OF `natal_chart` on `community_family_members`
- When a natal chart changes, all relationship charts where that person is `person_a_id` or `person_b_id` are automatically marked `invalidated_at = NOW()`
- Only marks currently-valid charts (does not reset already-invalidated ones)

### New API endpoint
`src/app/api/community/relationship-charts/batch/route.ts`

**POST** — generates all missing or invalidated pairwise charts in one request:
- Filters to members with `natal_status = 'generated'`
- Skips pairs with current (non-invalidated) charts
- Generates and upserts missing pairs using existing `calculateSynastry()`
- Returns `{ generated, skipped, blocked, invalidatedRegenerated }`
- Family dynamic view is a derived layer on top of these pairwise records (scorecard, strongest/friction pairs can be computed at query time from existing `chart_data`)
