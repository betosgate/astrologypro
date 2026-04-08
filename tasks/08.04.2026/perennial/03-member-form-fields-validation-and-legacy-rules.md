# Perennial Member Form Fields, Validation, And Legacy Rules

- Status: Ready For Implementation
- Date: 2026-04-08
- Category: Perennial Signup
- Owner: Frontend
- Priority: P0
- Task File: `tasks/08.04.2026/perennial/03-member-form-fields-validation-and-legacy-rules.md`

## Goal

Implement the full Perennial household member form experience with accurate required fields, validation behavior, and old-project relationship/questionnaire rules, while honoring the new password-generation decision.

## Important Resolved Conflict

Old notes included manual `password` and `confirm_password` inputs.

Final confirmed product rule:

1. do not render manual password inputs for any member
2. passwords are generated automatically after successful payment
3. generated credentials are emailed to each member

The UI must clearly communicate this instead of asking users to type passwords.

## Required Core Fields Per Member

Use current project field names for common fields in the new implementation.

Old names remain reference context only where they differ.

These fields are required for every member unless a later explicit product change says otherwise.

1. `first_name`
2. `last_name`
3. `email`
4. `phone`
5. `gender`
6. `state`
7. `city`
8. `zip`
9. `address`
10. `occupation`
11. `date_of_birth`
12. `birth_time`

## Required Contact And Identity Rules

1. Every member must have a unique email address.
2. The UI must validate duplicate emails across household members before payment.
3. Email fields must validate format and reject blank or whitespace-only values.
4. Phone fields must follow the legacy formatting behavior.
5. ZIP must be numeric and exactly 5 digits.

## Legacy Phone Formatting Requirement

Progressive formatting behavior must match the old PM flow:

- `123` => `123`
- `1234` => `(123) 4`
- `1234567` => `(123) 456-7`
- final format => `(123) 456-7890`

## Birth And Location Rules

1. `date_of_birth` is required.
2. `birth_time` is required.
3. `state` is required.
4. `city` is required.
5. `zip` is required.
6. City input should be treated as city-search/autocomplete capable if such service exists in current frontend architecture.
7. If remote autocomplete is unavailable, the form must still make the city requirement explicit and not silently downgrade validation behavior.

## Relationship Rules

Use current-project-compatible naming for the top-level relationship field.

Canonical new-project naming:

1. `relation_type` = top-level relation category
2. `sub_relation` = second-level relationship type

Old UI wording such as `Relation` and `Relationship Type` may remain visible in labels.

For the primary member:

1. do not require `relation_type`
2. do not require `sub_relation`

For additional members:

1. `relation_type` is required
2. `sub_relation` is required once `relation` is chosen

Allowed `relation_type` values:

1. `Couple`
2. `Family`

Allowed `sub_relation` values:

If `relation_type === "Couple"`:

1. `Husband`
2. `Wife`

If `relation_type === "Family"`:

1. `Son`
2. `Daughter`
3. `Spouse`
4. `Partner`
5. `Other`

## Optional Questionnaire Requirement

The full old optional questionnaire remains for every member.

Each member form must support an expandable optional section with clear expand/collapse behavior.

Questionnaire fields to keep:

1. `relationship_status`
2. `personality`
3. `strengths`
4. `lifeAreasFulfilling`
5. `lifeAreasImprovement`
6. `longTermGoals`
7. `majorLifeEvents`
8. `stressManagement`
9. `workLifeBalance`
10. `relationship_with_family`
11. `biggest_current_challenges`
12. `focus_on_specific_relationships`
13. `guidance_on_specific_decision`
14. `concerns_about_romantic_life`
15. `ongoing_projects_or_plans`
16. `social_life_fulfillment`
17. `spiritualPractices`
18. `selfDiscovery`
19. `externalInfluences`
20. `achieveFromReading`
21. `specificQuestions`
22. `goalsOutcomes`
23. `practicalSpiritualPref`
24. `mainConcern`
25. `additionalInfo`

## Validation UX

When submit or continue fails:

1. show a clear global error message
2. find the first invalid field across the whole household form
3. scroll it into view smoothly
4. focus the field if possible
5. keep user-entered values intact

## Generated Credentials Messaging

The form must explicitly state:

1. each member will receive login credentials by email after successful payment
2. passwords are generated automatically
3. manual password creation is not part of the signup form

## Acceptance Criteria

1. every member form contains the confirmed required fields
2. additional members enforce legacy relation/sub-relation rules
3. duplicate-email validation works across all members
4. the optional questionnaire exists for every member
5. manual password fields are not shown
6. the UI clearly explains generated-email credentials
7. validation failure scrolls and focuses the first invalid field
