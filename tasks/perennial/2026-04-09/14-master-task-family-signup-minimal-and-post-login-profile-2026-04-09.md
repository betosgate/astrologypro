# Master Task - Perennial Family Signup (Minimal) + Post-Login Family Profile Completion - 2026-04-09

- Status: Planned
- Priority: P0
- Owner: Fullstack
- Scope: family onboarding path, choose-plan Family flow, minimal signup fields, post-login completion form for family members, city search reuse, natal/transit readiness for family
- Task File: `tasks/perennial/2026-04-09/14-master-task-family-signup-minimal-and-post-login-profile-2026-04-09.md`

## Objective

Implement a two-phase Perennial onboarding flow for the `Family` plan:

1. Signup phase collects only basic information + essential birth identity fields for the primary member and family members.
2. After successful signup + payment + login, a post-login family profile-completion form collects remaining guidance fields.

## User Scenario

1. User lands on AstrologyPro website.
2. User clicks `GET START`.
3. User opens `/perennial-signup`.
4. User selects `Family`.
5. Signup form shows the required minimal fields and birth location fields already added in previous tasks:
   - `birthLocationLabel`
   - `birthLat`
   - `birthLng`
   - `birthTzone`
6. User completes signup + payment.
7. User logs in to Perennial dashboard.
8. On first login, user sees a family profile-completion form:
   - prefilled with values already captured at signup
   - remaining guidance fields left empty for user to complete
9. System marks each family member as natal/transit ready after required chart fields exist.

## Non-Negotiable Product Rules

1. This task applies to `Family` plan onboarding only.
2. Keep the same structure and flow already used for `Single` and `Couple`.
3. Do not ask manual password creation in signup.
4. Keep generated-password-by-email model.
5. In signup phase, do not require optional questionnaire block.
6. `date_of_birth`, `birth_time`, `birthLocationLabel`, `birthLat`, `birthLng`, `birthTzone` are collected at signup, not in post-login form.

## Child Tasks

1. `14.1-family-signup-minimal-fields-and-validation-2026-04-09.md`
2. `14.2-family-post-login-profile-completion-form-and-prefill-2026-04-09.md`
3. `14.2a-family-post-login-profile-frontend-form-and-prefill-2026-04-09.md`
4. `14.2b-family-post-login-profile-backend-prefill-and-save-2026-04-09.md`
5. `14.3-family-birth-location-city-search-integration-2026-04-09.md`
6. `14.3a-family-birth-location-frontend-integration-2026-04-09.md`
7. `14.3b-family-birth-location-backend-contract-2026-04-09.md`
8. `14.4-family-natal-and-monthly-transit-readiness-rules-2026-04-09.md`
9. `14.4a-family-readiness-ui-gating-and-status-2026-04-09.md`
10. `14.4b-family-readiness-backend-rules-and-state-2026-04-09.md`
11. `14.5-family-ux-routing-guards-and-first-login-experience-2026-04-09.md`
12. `14.6-family-acceptance-qa-checklist-2026-04-09.md`

## Fields - Phase Split

### Phase A: Signup (Primary family account holder)

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
11. `date_of_birth`
12. `birth_time`
13. `birthLocationLabel`
14. `birthLat`
15. `birthLng`
16. `birthTzone`

### Phase A: Signup (Each additional family member)

1. `relationType` = `Family`
2. `subRelation` = valid family relation option from UI
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
13. `date_of_birth`
14. `birth_time`
15. `birthLocationLabel`
16. `birthLat`
17. `birthLng`
18. `birthTzone`

### Phase B: Post-login completion (guidance fields user should fill)

1. `relationType`
2. `subRelation`
3. `relationship_status`
4. `mainConcern`
5. `longTermGoals`
6. `personality`
7. `strengths`
8. `lifeAreasFulfilling`
9. `lifeAreasImprovement`
10. `majorLifeEvents`
11. `relationship_with_family`
12. `focus_on_specific_relationships`
13. `guidance_on_specific_decision`
14. `concerns_about_romantic_life`

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

1. Family choose-plan flow exists in same style as Single and Couple.
2. Family signup includes `date_of_birth`, `birth_time`, `birthLocationLabel`, `birthLat`, `birthLng`, `birthTzone` for all required members.
3. First login completion form excludes already-captured birth fields.
4. Completion form pre-fills signup fields.
5. Birth location selection works via city-search API.
6. Natal chart can be created after required chart fields exist.
7. Monthly transits can be generated once natal chart exists.
