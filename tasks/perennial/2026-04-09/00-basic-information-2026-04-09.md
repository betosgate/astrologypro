# Perennial Task Folder Basic Information - 2026-04-09

- Folder: `tasks/perennial/2026-04-09`
- Purpose: Structured Perennial onboarding tasks by scenario and execution steps.
- Created By: Codex
- Date: 2026-04-09

## Task Groups Added

### Group 11 - Single Plan

1. `11-master-task-single-signup-minimal-and-post-login-profile-2026-04-09.md`
2. `11.1-single-signup-minimal-fields-and-validation-2026-04-09.md`
3. `11.2-post-login-profile-completion-form-and-prefill-2026-04-09.md`
4. `11.2a-single-post-login-profile-frontend-form-and-prefill-2026-04-09.md`
5. `11.2b-single-post-login-profile-backend-prefill-and-save-2026-04-09.md`
6. `11.3-city-search-api-integration-for-birth-location-2026-04-09.md`
7. `11.3a-single-birth-location-autocomplete-frontend-integration-2026-04-09.md`
8. `11.3b-single-birth-location-city-search-backend-contract-2026-04-09.md`
9. `11.4-natal-and-monthly-transit-readiness-rules-2026-04-09.md`
10. `11.4a-single-readiness-ui-gating-and-status-2026-04-09.md`
11. `11.4b-single-readiness-backend-rules-and-state-2026-04-09.md`
12. `11.5-ux-routing-guards-and-first-login-experience-2026-04-09.md`
13. `11.6-acceptance-qa-checklist-single-onboarding-2026-04-09.md`

### Group 12 - Couple Plan

1. `12-master-task-couple-signup-minimal-and-post-login-profile-2026-04-09.md`
2. `12.1-couple-signup-minimal-fields-and-validation-2026-04-09.md`
3. `12.2-couple-post-login-profile-completion-form-and-prefill-2026-04-09.md`
4. `12.2a-couple-post-login-profile-frontend-form-and-prefill-2026-04-09.md`
5. `12.2b-couple-post-login-profile-backend-prefill-and-save-2026-04-09.md`
6. `12.3-couple-birth-location-city-search-integration-2026-04-09.md`
7. `12.3a-couple-birth-location-frontend-integration-2026-04-09.md`
8. `12.3b-couple-birth-location-backend-contract-2026-04-09.md`
9. `12.4-couple-natal-and-monthly-transit-readiness-rules-2026-04-09.md`
10. `12.4a-couple-readiness-ui-gating-and-status-2026-04-09.md`
11. `12.4b-couple-readiness-backend-rules-and-state-2026-04-09.md`
12. `12.5-couple-ux-routing-guards-and-first-login-experience-2026-04-09.md`
13. `12.6-couple-acceptance-qa-checklist-2026-04-09.md`

### Group 13 - Post-Login Birth Location Autocomplete

1. `13-master-task-signup-birth-location-autocomplete-2026-04-09.md`
2. `13.1-signup-birth-location-ui-and-autocomplete-behavior-2026-04-09.md`
3. `13.2-signup-validation-and-payload-contract-birth-location-2026-04-09.md`
4. `13.3-backend-checkout-validation-for-birth-location-2026-04-09.md`
5. `13.4-acceptance-qa-checklist-birth-location-signup-2026-04-09.md`

### Group 14 - Family Plan

1. `14-master-task-family-signup-minimal-and-post-login-profile-2026-04-09.md`
2. `14.1-family-signup-minimal-fields-and-validation-2026-04-09.md`
3. `14.2-family-post-login-profile-completion-form-and-prefill-2026-04-09.md`
4. `14.2a-family-post-login-profile-frontend-form-and-prefill-2026-04-09.md`
5. `14.2b-family-post-login-profile-backend-prefill-and-save-2026-04-09.md`
6. `14.3-family-birth-location-city-search-integration-2026-04-09.md`
7. `14.3a-family-birth-location-frontend-integration-2026-04-09.md`
8. `14.3b-family-birth-location-backend-contract-2026-04-09.md`
9. `14.4-family-natal-and-monthly-transit-readiness-rules-2026-04-09.md`
10. `14.4a-family-readiness-ui-gating-and-status-2026-04-09.md`
11. `14.4b-family-readiness-backend-rules-and-state-2026-04-09.md`
12. `14.5-family-ux-routing-guards-and-first-login-experience-2026-04-09.md`
13. `14.6-family-acceptance-qa-checklist-2026-04-09.md`

## Notes

1. Single, Couple, and Family tasks use the same structure and same naming style.
2. Mixed frontend/backend planning items are now split into separate frontend and backend tasks for easier understanding.
3. City search/birth-location behavior is aligned between Single, Couple, and Family tasks.
4. Group 13 is planning-only for post-login birth-location autocomplete and validation.
5. Group 14 applies the same phased signup + post-login completion pattern to Family plan.
6. The intended public-entry UX for these tasks is: website landing -> `GET START` -> Perennial choose-plan screen with `Single`, `Couple`, and `Family` cards -> user selects a plan -> the signup form is shown below on the same screen -> user submits basic information only -> user reaches home/dashboard -> a post-login completion form opens for birth date, birth time, birth place, and remaining guidance fields.
