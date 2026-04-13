# 04 Monthly Transit Orchestration and Delivery

## Goal

Formalize monthly transit generation so it remains once-per-month, automated, observable, and aligned to membership eligibility.

## Current Repo Grounding

Monthly transit automation already exists in:

- `src/app/api/cron/monthly-transits/route.ts`
- `src/lib/astro/transits.ts`
- `monthly_transits`

The current implementation already:

- requires cron auth
- filters to active memberships
- skips rows already generated for that month
- inserts one row per family member and month
- attempts email notification

## Current Gap

The cron exists, but the product contract is not yet fully governed.

Missing concepts:

- formal user entitlement definition
- visibility into generation success or failure
- retry policy for failed monthly generation
- admin reporting for missed generations

## Required Product Rule

Monthly transit generation must happen:

- once per eligible profile per calendar month

This should remain an idempotent invariant.

## Recommended Lifecycle States

Per profile per month:

- `pending`
- `generated`
- `notified`
- `failed`
- `suppressed`

## Failure Handling

Generation failure must not silently disappear.

Recommended behavior:

- mark the month record as failed or log a failed attempt
- surface it to admin operations
- allow controlled retry by automation or staff action

## Delivery Rule

Transit generation and user notification are separate concerns.

That means:

- chart generation can succeed even if email fails
- notification state should be tracked independently

## Deliverables

- monthly transit entitlement rules
- generation and notification state model
- failure and retry strategy
- admin observability requirements
