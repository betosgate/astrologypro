# 02 Automatic Natal Generation and Retry Governance

## Goal

Design automatic natal chart generation for entitled profiles while preventing unlimited recalculation abuse.

## Current Repo Grounding

Natal chart generation already exists in:

- `src/app/api/community/generate-natal/route.ts`

It currently:

- validates ownership through RLS
- reads birth details from `community_family_members`
- computes a chart using `generateNatalChart`
- stores the result back on the family member record

## Current Gap

The current system behaves like an on-demand generator, not a governed entitlement workflow.

Missing concepts:

- automatic first-time generation
- retry counters
- failure states
- input correction window
- lockout and escalation policy

## Recommended Generation States

For each eligible profile, track something like:

- `not_started`
- `queued`
- `generated`
- `failed`
- `locked_for_review`

## Recommended Retry Model

The user requirement says:

- charts should normally generate once
- members can regenerate up to `3` times if they entered information incorrectly

Recommended interpretation:

- first successful chart generation is free and automatic
- after that, allow up to `3` user-initiated correction regenerations
- once the limit is exhausted, block self-service regeneration
- direct the user into the support ticket flow

## Required Audit Fields

Per eligible profile, track:

- first generated timestamp
- last generated timestamp
- successful generation count
- user correction retry count
- last generation failure reason
- lock reason

## Trigger Strategy

Automatic natal generation should trigger when:

- a new eligible profile is created with sufficient birth data
- missing required birth data becomes complete

Automatic generation should not rerun on every edit.

Instead, a material-change rule should decide whether:

- the chart becomes invalidated
- the chart is eligible for regeneration
- the correction retry counter should be used

## Deliverables

- natal generation lifecycle
- retry-limit rules
- material birth-data change rules
- failure handling and lockout policy
