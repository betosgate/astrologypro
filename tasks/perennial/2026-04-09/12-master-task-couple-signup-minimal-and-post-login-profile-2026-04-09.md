# Master Task - Perennial Couple Signup (Minimal) + Post-Login Couple Profile Completion - 2026-04-09

- Status: Planned
- Priority: P0
- Owner: Fullstack
- Scope: couple onboarding path, minimal couple signup fields, post-login completion form for both members, city search reuse, natal/transit readiness for couple
- Task File: `tasks/perennial/2026-04-09/12-master-task-couple-signup-minimal-and-post-login-profile-2026-04-09.md`

## Objective

Implement a two-phase Perennial onboarding flow for the `Couple` plan:

1. Signup phase collects only basic fields for primary and partner.
2. After payment + login, show a couple profile-completion form with prefilled signup values and required birth/guidance fields.

## Child Tasks

1. `12.1-couple-signup-minimal-fields-and-validation-2026-04-09.md`
2. `12.2-couple-post-login-profile-completion-form-and-prefill-2026-04-09.md`
3. `12.2.1-couple-post-login-profile-save-api-contract-and-user-id-update-rules-2026-04-09.md`
4. `12.3-couple-birth-location-city-search-integration-2026-04-09.md`
5. `12.4-couple-natal-and-monthly-transit-readiness-rules-2026-04-09.md`
6. `12.5-couple-ux-routing-guards-and-first-login-experience-2026-04-09.md`
7. `12.6-couple-acceptance-qa-checklist-2026-04-09.md`

## Couple Signup Fields (Phase A)

### Primary member

1. `firstName`
2. `lastName`
3. `email`
4. `phone`
5. `gender`
6. `occupation`
7. `address`
8. `city`
9. `state`
10. `zip`

### Second member (partner)

1. `relationType` = `Couple`
2. `subRelation` = `Husband` or `Wife`
3. `firstName`
4. `lastName`
5. `email`
6. `phone`
7. `gender`
8. `occupation`
9. `address`
10. `city`
11. `state`
12. `zip`

## Couple Post-Login Fields (Phase B)

### Must fill first (both members)

1. `date_of_birth`
2. `birth_time`
3. `birth_location_label`
4. `birth_lat`
5. `birth_lng`
6. `birth_tzone`

### Must keep for mapping

1. `relationType`
2. `subRelation`

### High-value insight fields

1. `relationship_status`
2. `mainConcern`
3. `longTermGoals`
4. `personality`
5. `strengths`
6. `lifeAreasFulfilling`
7. `lifeAreasImprovement`
8. `majorLifeEvents`
9. `relationship_with_family`
10. `focus_on_specific_relationships`
11. `guidance_on_specific_decision`
12. `concerns_about_romantic_life`

## Done Definition

1. Couple signup only asks minimal basic fields for both members.
2. After login, completion form opens with signup values prefilled.
3. Birth location search uses same city API contract as single flow.
4. Couple chart/transit readiness gates are enforced.
