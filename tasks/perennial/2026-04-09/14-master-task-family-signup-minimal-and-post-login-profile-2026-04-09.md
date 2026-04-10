# Master Task - Perennial Family Signup (Minimal) + Post-Login Family Profile Completion - 2026-04-09

- Status: Planned
- Priority: P0
- Owner: Fullstack
- Scope: family onboarding path, choose-plan Family flow, minimal signup fields, post-login completion form for family members, city search reuse, natal/transit readiness for family
- Task File: `tasks/perennial/2026-04-09/14-master-task-family-signup-minimal-and-post-login-profile-2026-04-09.md`

## Objective

Implement a two-phase Perennial onboarding flow for the `Family` plan:

1. Signup phase collects only basic information for the primary member and family members.
2. After successful signup + payment + login, a post-login family profile-completion form collects birth date, birth time, birth place, and remaining guidance fields.

## User Scenario

1. User lands on AstrologyPro website.
2. User clicks `GET START`.
3. User opens the Perennial signup screen at `/perennial-signup`.
4. The first view on that screen shows the three Perennial plan choices: `Single`, `Couple`, and `Family`.
5. User selects `Family`.
6. The page scrolls to or reveals the shared signup form below the plan cards.
7. Signup form shows required minimal basic-information fields only.
8. User completes signup + payment.
9. User logs in to Perennial dashboard.
10. On first login, user sees a family profile-completion form:
   - prefilled with values already captured at signup
   - includes `date_of_birth`, `birth_time`, `birthLocationLabel`, `birthLat`, `birthLng`, `birthTzone`
   - remaining guidance fields left empty for user to complete
11. System marks each family member as natal/transit ready after required chart fields exist.

## Non-Negotiable Product Rules

1. This task applies to `Family` plan onboarding only.
2. Keep the same structure and flow already used for `Single` and `Couple`.
3. Do not ask manual password creation in signup.
4. Keep generated-password-by-email model.
5. In signup phase, do not require optional questionnaire block.
6. `date_of_birth`, `birth_time`, `birthLocationLabel`, `birthLat`, `birthLng`, `birthTzone` are collected in the first post-login completion form, not during signup.
7. The plan-selection step happens before the form on the same Perennial signup screen.
8. After basic signup, the user reaches home/dashboard and the completion form opens there.

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

### Phase B: Post-login completion (guidance fields user should fill)

1. `relationType`
2. `subRelation`
3. `date_of_birth`
4. `birth_time`
5. `birthLocationLabel`
6. `birthLat`
7. `birthLng`
8. `birthTzone`
9. `relationship_status`
10. `mainConcern`
11. `longTermGoals`
12. `personality`
13. `strengths`
14. `lifeAreasFulfilling`
15. `lifeAreasImprovement`
16. `majorLifeEvents`
17. `relationship_with_family`
18. `focus_on_specific_relationships`
19. `guidance_on_specific_decision`
20. `concerns_about_romantic_life`

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

1. The public `GET START` journey reaches a Perennial choose-plan screen that includes `Single`, `Couple`, and `Family`.
2. After selecting `Family`, the user completes the Family signup form below on the same screen.
3. Family choose-plan flow exists in same style as Single and Couple.
4. Family signup excludes birth date, birth time, and birth place fields for all members.
5. First login completion form includes birth fields for all required members.
6. Completion form pre-fills signup fields.
7. Birth location selection works via city-search API.
8. Natal chart can be created after required chart fields exist.
9. Monthly transits can be generated once natal chart exists.
