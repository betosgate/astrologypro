# Task 06 - Analytics Governance and Data Quality Rules

- Status: Done

## Completion Notes

- Governance is enforced primarily through [src/lib/diviner-analytics.ts](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/lib/diviner-analytics.ts:1), which centralizes source derivation, referral resolution, geo stamping, and privacy-safe IP hashing.
- The schema keeps raw IP out of analytics storage while preserving `ip_hash`, which satisfies the pack’s privacy requirement.
- Priority: P0
- Owner: Architecture

## Objective

Define the operational rules that keep the diviner traffic report trustworthy over time.

## Why This Task Exists

Analytics features decay quickly when:

- source rules are undocumented
- partner attribution semantics drift
- fields are repurposed without governance
- new traffic channels are added without updating the derivation policy

This report should not become “whatever the latest query happens to return.”

## Governance Rules

### Rule 1. `page_views` is event data, not a mutable summary table

- append-only in practice
- corrections should happen through controlled scripts, not casual ad hoc edits

### Rule 2. `traffic_source` is a derived canonical bucket

- it should not be freeform marketing copy
- derivation logic belongs in the ingestion route

### Rule 3. `attribution_kind` is a partner-classification field

- it is not the same thing as `traffic_source`
- example:
  - `traffic_source = social`
  - `attribution_kind = advocate`

These must remain conceptually separate.

### Rule 4. Booleans exist for query simplicity, not as independent truths

- `affiliate_related`
- `advocate_related`

These should remain consistent with `attribution_kind`.

### Rule 5. Unknown partner signals must remain visible

If a `ref` parameter is present but cannot be resolved:
- do not silently reclassify as organic
- keep it identifiable as unresolved/unknown

## Known Edge Cases

### 1. Shared links without referrer

Traffic may still be affiliate- or advocate-related via query string even when `document.referrer` is empty.

### 2. Stripped query parameters

Some browsers or redirect paths may strip UTMs. Explicit partner codes should be preferred when available.

### 3. Geo header absence

Local development and some proxies may not provide geo headers. The report must still work with null geography.

### 4. Timezone ambiguity

Hourly charts based on server/runtime timezone are acceptable initially, but must be documented as such.

### 5. Partner-table evolution

The app currently has:

- legacy affiliate-style referral codes
- diviner affiliate referral links
- social advocates

The ingestion route must remain the single place where these are resolved into a normalized attribution outcome.

## Documentation Requirement

The team should record:

- source derivation rules
- attribution precedence
- the exact meaning of each analytics field

If this is not documented, future edits will create silent regressions.

## Acceptance Criteria

- The business can explain what each report number means.
- Developers can extend the tracker without breaking the semantics of existing reports.
- Unknown/unresolved traffic is explicitly visible rather than misclassified.

## Verification Test Plan

- [ ] Review the tracker logic and confirm precedence order is explicit.
- [ ] Review the report route and confirm it consumes normalized fields rather than reinventing attribution.
- [ ] Review one seeded example for each partner class and confirm the report output matches the intended semantics.
