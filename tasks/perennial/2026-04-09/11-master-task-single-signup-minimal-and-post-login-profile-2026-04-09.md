# Master Task - Perennial Single Signup (Minimal) + Post-Login Profile Completion - 2026-04-09

- Status: Planned
- Priority: P0
- Owner: Fullstack
- Scope: onboarding path, single-plan signup form reduction, post-login profile completion screen, city search integration, natal/transit readiness gating
- Task File: `tasks/perennial/2026-04-07/11-master-task-single-signup-minimal-and-post-login-profile-2026-04-09.md`

## Objective

Implement a two-phase Perennial onboarding flow for the `Single` plan:

1. Signup phase collects only basic information.
2. After successful signup + login, a profile-completion form collects birth and insight fields needed for natal chart, monthly transits, and better guidance.

## User Scenario

1. User lands on AstrologyPro website.
2. User clicks `GET START`.
3. User opens `/perennial-signup`.
4. User selects `Single`.
5. Signup form shows only basic fields (no deep questionnaire).
6. User completes signup + payment.
7. User logs in to Perennial dashboard.
8. On first login, user sees a profile-completion form:
   - prefilled with values already captured at signup
   - missing fields left empty for user to complete
9. User selects birth location from city search API and completes remaining fields.
10. System marks user as natal/transit ready.

## Non-Negotiable Product Rules

1. This task applies to `Single` plan onboarding only.
2. Do not ask manual password creation in signup.
3. Keep generated-password-by-email model.
4. In signup phase, do not require optional questionnaire fields.
5. In post-login phase, require birth fields and selected guidance fields.

## Child Tasks

1. `11.1-single-signup-minimal-fields-and-validation-2026-04-09.md`
2. `11.2-post-login-profile-completion-form-and-prefill-2026-04-09.md`
3. `11.3-city-search-api-integration-for-birth-location-2026-04-09.md`
4. `11.4-natal-and-monthly-transit-readiness-rules-2026-04-09.md`
5. `11.5-ux-routing-guards-and-first-login-experience-2026-04-09.md`
6. `11.6-acceptance-qa-checklist-single-onboarding-2026-04-09.md`

## Fields - Phase Split

### Phase A: Signup (Single, basic only)

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

### Phase B: Post-login completion (required first)

1. `date_of_birth`
2. `birth_time`
3. `birth_location_label`
4. `birth_lat`
5. `birth_lng`
6. `birth_tzone`

### Phase B: Post-login completion (guidance fields user should fill)

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

## API Requirement

Use city search endpoint for birth location lookup:

- URL: `https://astrologypro.com/api/admin/astro/city-search`
- Method: `POST`
- Request body:
```json
{ "q": "kolk" }
```
- Response key: `results[]` with `label`, `lat`, `lng`, `timezone.offset_string`.

## Done Definition

1. Single signup is minimal and excludes birth + deep optional fields.
2. First login forces a completion form until required post-login fields are completed.
3. Completion form pre-fills signup fields.
4. Birth location selection works via city-search API.
5. Natal chart can be created after required completion fields exist.
6. Monthly transits can be generated once natal chart exists.
