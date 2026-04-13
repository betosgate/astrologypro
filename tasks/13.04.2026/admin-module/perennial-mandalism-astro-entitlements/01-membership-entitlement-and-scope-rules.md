# 01 Membership Entitlement and Scope Rules

## Goal

Define exactly which Perennial Mandalism users and family records are entitled to automatic natal charts, relationship charts, family dynamics, and monthly transits.

## Current Repo Grounding

The current family and relationship systems are attached to:

- `community_members`
- `community_family_members`
- `relationship_charts`
- `monthly_transits`

The current relationship and transit APIs already check active membership status.

## Required Product Decision

The platform must make entitlement explicit instead of leaving it implied in page logic.

Recommended entitlement bundle for active Perennial Mandalism members:

- self natal chart
- natal chart for all eligible family member profiles in the subscription scope
- relationship chart coverage for all valid pairs
- monthly transit reports for all eligible profiles

## Scope Model

The entitlement layer should define:

- who gets automatic chart generation
- how many family profiles are included
- which profile types are eligible
- whether adults and children receive the same chart depth

## Recommended Rule Set

### Active member required

All chart automation requires:

- active community membership

### Eligible profile set

Eligible profiles should include:

- the primary member profile
- all active family member profiles attached to that member

### Family dynamic coverage

“Full family dynamic chart” should be interpreted as:

- all pairwise relationship charts across the available family set

That means this is not one magical new chart type by default. It is:

- a family relationship matrix
- a family overview layer on top of pairwise synastry

## Architectural Recommendation

Avoid creating a brand-new astrology engine for “family dynamics” unless the business really wants a separate interpretive artifact.

Safer model:

1. keep pairwise synastry as the canonical relationship engine
2. add a derived family overview summary later if needed

## Deliverables

- entitlement matrix by plan and membership status
- profile eligibility rules
- definition of family dynamic coverage
- non-entitled and paused-state behavior
