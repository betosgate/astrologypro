# Master Task - Perennial Couple Signup (Minimal) + Post-Login Couple Profile Completion - 2026-04-09

- Status: Planned
- Priority: P0
- Owner: Fullstack
- Scope: couple onboarding path, minimal couple signup fields, post-login completion form for both members, city search reuse, natal/transit readiness for couple
- Task File: `tasks/perennial/2026-04-09/12-master-task-couple-signup-minimal-and-post-login-profile-2026-04-09.md`

## Objective

Implement a two-phase Perennial onboarding flow for the `Couple` plan:

1. Signup phase collects essential basic fields for primary and partner.
2. After payment + login, show a couple profile-completion form with prefilled signup values plus birth date, birth time, birth place, and remaining guidance fields.

## User Scenario

1. User lands on AstrologyPro website.
2. User clicks `GET START`.
3. User opens the Perennial signup screen at `/perennial-signup`.
4. The first view on that screen shows the three Perennial plan choices: `Single`, `Couple`, and `Family`.
5. User selects `Couple`.
6. The page scrolls to or reveals the shared signup form below the plan cards.
7. User fills the Couple signup basic-information fields for the primary member and partner.
8. User completes signup + payment.
9. User logs in.
10. On first login, user sees the planned couple profile-completion flow with signup values prefilled and birth fields still to complete.
11. After completion, the normal post-login experience continues unchanged.

## Non-Negotiable Product Rules

1. This task applies to `Couple` plan onboarding only.
2. The plan-selection step happens before the form on the same Perennial signup screen.
3. Do not ask manual password creation in signup.
4. Keep generated-password-by-email model.
5. After basic signup, the user reaches home/dashboard and the completion form opens there.

## Child Tasks

1. `12.1-couple-signup-minimal-fields-and-validation-2026-04-09.md`
2. `12.2-couple-post-login-profile-completion-form-and-prefill-2026-04-09.md`
3. `12.2a-couple-post-login-profile-frontend-form-and-prefill-2026-04-09.md`
4. `12.2b-couple-post-login-profile-backend-prefill-and-save-2026-04-09.md`
5. `12.3-couple-birth-location-city-search-integration-2026-04-09.md`
6. `12.3a-couple-birth-location-frontend-integration-2026-04-09.md`
7. `12.3b-couple-birth-location-backend-contract-2026-04-09.md`
8. `12.4-couple-natal-and-monthly-transit-readiness-rules-2026-04-09.md`
9. `12.4a-couple-readiness-ui-gating-and-status-2026-04-09.md`
10. `12.4b-couple-readiness-backend-rules-and-state-2026-04-09.md`
11. `12.5-couple-ux-routing-guards-and-first-login-experience-2026-04-09.md`
12. `12.6-couple-acceptance-qa-checklist-2026-04-09.md`

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

### Must keep for mapping

1. `relationType`
2. `subRelation`

### High-value insight fields

1. `date_of_birth`
2. `birth_time`
3. `birth_location_label`
4. `relationship_status`
5. `mainConcern`
6. `longTermGoals`
7. `personality`
8. `strengths`
9. `lifeAreasFulfilling`
10. `lifeAreasImprovement`
11. `majorLifeEvents`
12. `relationship_with_family`
13. `focus_on_specific_relationships`
14. `guidance_on_specific_decision`
15. `concerns_about_romantic_life`

## Done Definition

1. The public `GET START` journey reaches a Perennial choose-plan screen that includes `Single`, `Couple`, and `Family`.
2. After selecting `Couple`, the user completes the Couple signup form below on the same screen.
3. Couple signup excludes birth date, birth time, and birth place for both members.
4. After login, completion form opens with signup values prefilled and birth fields visible.
5. Birth location search uses same city API contract as single flow.
6. Couple chart/transit readiness gates are enforced.
