# Book Without Diviner Flow

## Objective

Replace the current `book/demo?...` fallback used by the post-intake dialog action `Book Without Choosing a Diviner` with a real shared booking flow.

The new flow must:
- start from a non-diviner-specific intake submission
- present a shared booking calendar experience aligned with the existing diviner booking calendar structure
- allow the user to pick a date first
- if more than one matching diviner is available on that date, prompt the user to choose a diviner
- then continue into the existing booking flow with the selected diviner and matching service

This task is specifically for the non-diviner `general-*` template path that begins from the public template intake form.

## Mandatory Working Mode For Claude

Claude must not jump into implementation immediately.

Before making code changes, Claude must:
1. audit the current public booking flow end to end
2. understand how diviner booking pages, availability endpoints, service visibility rules, and intake submissions currently work
3. identify the safest reuse points instead of rebuilding booking from scratch
4. document any assumptions before implementing

Claude must treat the existing diviner booking page and availability APIs as the primary source of truth wherever possible.

## Current State

After intake submission on a general template:
- `Choose a Diviner and Book`
  - already routes into `/discover?template=...&submission=...`
  - directory is now matched to compatible diviners and service rows
- `Book Without Choosing a Diviner`
  - still redirects to `/book/demo?template=...&submission=...`
  - this must be removed

Relevant existing code:
- public template intake success dialog:
  - `src/components/services/template-intake-form.tsx`
- matched discover flow:
  - `src/app/discover/page.tsx`
  - `src/app/discover/discover-filters.tsx`
- diviner booking page:
  - `src/app/[username]/book/[serviceSlug]/page.tsx`
- booking UI:
  - `src/components/booking/booking-wizard.tsx`
- public service visibility / template access:
  - `src/lib/diviner-service-access.ts`
  - `src/lib/service-landings.ts`
- saved intake submissions:
  - `service_template_intake_submissions`
  - `src/app/api/services/[slug]/intake/route.ts`

## Product Requirement

For general template users who do not want to choose a diviner up front:

1. user completes intake form
2. success dialog appears
3. user clicks `Book Without Choosing a Diviner`
4. user lands on a new shared booking route
5. route shows a calendar / availability-first experience similar to the existing diviner booking calendar structure
6. user selects a date
7. if exactly one compatible diviner is available on that date, the system can proceed directly
8. if multiple compatible diviners are available on that date, the user must be shown those diviners and choose one
9. after diviner resolution, user continues into the existing diviner booking flow
10. the saved intake submission context must remain attached so it can be used later in booking / toolkit logic

## Non-Goals

- do not redesign the full booking engine from scratch
- do not replace the existing diviner-specific booking wizard
- do not break the `Choose a Diviner and Book` path
- do not remove the direct diviner booking route

## Preferred Architecture

The safest architecture is:
- add a new shared booking route for general templates
- use the saved intake submission + template slug to resolve compatible services
- use existing availability endpoints and booking wizard patterns where possible
- hand off to the current `/{username}/book/{serviceSlug}` route once a diviner is resolved

Avoid building a parallel payment or booking implementation unless absolutely necessary.

## Expected Deliverables

- new shared booking route for non-diviner template submissions
- proper compatibility lookup between submission/template and live diviner services
- calendar-first availability selection UI
- conditional diviner selection UI when multiple diviners match the chosen date
- handoff into existing booking flow with submission context preserved
- no remaining dependence on `/book/demo` for this branch

## Execution Breakdown

Claude must execute this task in the following order:

1. `01-system-map-and-gap-analysis.md`
2. `02-route-contract-and-data-resolution.md`
3. `03-shared-calendar-page.md`
4. `04-date-selection-and-diviner-resolution.md`
5. `05-booking-handoff-and-intake-context.md`
6. `06-verification-and-regression-checklist.md`

## Acceptance Criteria

- Clicking `Book Without Choosing a Diviner` no longer hits `/book/demo`
- The user reaches a real shared booking page
- Only compatible diviners/services for the submission template are considered
- The user can choose a date before choosing a diviner
- If multiple diviners match on that date, the UI requires an explicit diviner choice
- The final booking handoff uses the real booking flow
- Intake submission context is preserved through the handoff
- Existing direct diviner booking pages still work unchanged

