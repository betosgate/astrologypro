# Task 05: Analytics Copy, Governance, and Edge Cases

## Goal

Define the product rules that keep the public numbers trustworthy, comprehensible, and hard to misuse.

## Why This Is Needed

Surface-level counts are easy to misunderstand if the platform does not define:

- what counts
- what does not count
- what happens with very low values
- what happens when the diviner is inactive recently

## Rules To Define

### 1. Naming standard

Pick one public-facing term and use it consistently:

- `sessions`
- or `readings`

Do not alternate terms in the same module.

### 2. Low-volume handling

Decide how to display:

- zero total sessions
- zero in last 7 days
- zero in last 30 days

Recommended:

- show literal zeros only when the whole block is enabled and the diviner accepts that presentation
- otherwise allow the diviner to keep the block hidden

### 3. Fraud and trust posture

These counts should be server-derived only.

Never let the diviner edit:

- lifetime count
- 7-day count
- 30-day count

They may control visibility only.

### 4. Timezone rule

Define whether recent counts use:

- UTC
- diviner timezone
- rolling-hour windows

Use one rule across the app.

### 5. Future extensibility

This block may later grow to include:

- response time
- repeat client rate
- average rating

Architect the rendering component so additional trust metrics can be added without redesigning the logic each time.

## Acceptance Criteria

- the feature has clear language and metric definitions
- the numbers cannot be manually manipulated
- edge cases are resolved before implementation starts

## Status

Done.

Implemented with server-derived completed-booking counts only, consistent `Sessions` labeling in the public block, rolling windows based on request-time server timestamps, and no editable numeric inputs anywhere in dashboard or admin.
