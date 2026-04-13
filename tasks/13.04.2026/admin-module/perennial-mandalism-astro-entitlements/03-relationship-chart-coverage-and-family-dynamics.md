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
