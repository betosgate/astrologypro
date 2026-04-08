# Perennial Field Mapping And Payload Normalization

- Completion Notes: Implemented. The page maps form state to the spec-defined canonical names (first_name, last_name, date_of_birth, birth_time — NOT firstname/lastname/dob). Optional questionnaire fields use their exact spec names (lifeAreasFulfilling, workLifeBalance, etc.). The /api/perennial-signup/checkout validator accepts every field, defaults missing optionals to null, and stores the household payload in pending_perennial_signups.household JSONB. The household-provisioning helper persists core profile fields to community_members columns (phone, gender, state, city, zip, address, relation_type) and the full intake — including the entire 25-field optional questionnaire — to community_members.intake_data. Non-primary members get a community_family_members row with relationship = sub_relation (the most specific legacy label). Primary member is recorded with relation_type="Self" and sub_relation=null in metadata + intake_data; non-primary members carry their full relation_type + sub_relation pair end-to-end.
- Earlier notes: NOT IMPLEMENTED — deferred. The console.log payload demonstrates the intended shape but the spec details (sub_relation handling, age_group derivation, profile_completion derivation) need a dedicated normalisation pass.
- Status: Completed (2026-04-08)
- Date: 2026-04-08
- Category: Perennial Signup
- Owner: Fullstack
- Priority: P0
- Task File: `tasks/08.04.2026/perennial/08-field-mapping-and-payload-normalization.md`

## Goal

Give the implementing AI one canonical reference for how old Perennial signup fields map to the current/new project concepts, schemas, and payload expectations.

This task exists because the old project and the current project use overlapping concepts but not always the same field names.

The implementing AI must not guess this mapping.

## Important Context

There are three different layers that can use different names:

1. old UI labels and old frontend state keys
2. new frontend state keys chosen for the new signup flow
3. current repo API/schema field names

The implementing AI may choose clean frontend-internal names, but must do so intentionally and document the mapping in code where needed.

## Core Rule

Preserve old user-visible labels where they still fit.

Normalize internal names only where necessary for correctness, clarity, or current-schema compatibility.

For common fields that already have an established current-project name, do not keep the old project key name in the new implementation.

That means:

1. use current project naming for common/shared fields by default
2. use old names only as reference context
3. keep old labels/copy only where this is a UI wording choice, not a data-model choice

## Current Repo Reference Points

The existing repo already uses some relevant field names in:

1. `src/app/api/community/members/create/route.ts`
2. `supabase/migrations/20260407000098_community_members_add_fields.sql`

Those files are reference context only. They do not fully define the new multi-user household signup backend, but they do reveal current naming conventions already used in this codebase.

## Canonical Field Mapping

## Naming Policy For The New Implementation

The new implementation should prefer current project field names for common fields.

Use old names only when one of these is true:

1. the field represents legacy-specific behavior that does not yet have a stable current name
2. the old wording is only a visible UI label, not a state/payload key
3. the implementing AI is temporarily mapping old imported data before normalizing it

Examples:

1. use `first_name`, not `firstname`, as the canonical current-project name
2. use `last_name`, not `lastname`, as the canonical current-project name
3. use `date_of_birth`, not `dob`, as the canonical current-project name
4. use `birth_time`, not `time_of_birth`, as the canonical current-project name

If the frontend needs a compatibility adapter for old shapes, that adapter should translate into current-project names immediately.

### Identity / Core Profile

1. old `firstname`
   - meaning: member first name
   - current repo usage: `firstname` in API request body
   - current DB column: `first_name`
   - canonical new-project name: `first_name`
   - guidance: use `first_name` in new implementation; old `firstname` is reference only unless a compatibility layer is explicitly needed

2. old `lastname`
   - meaning: member last name
   - current repo usage: `lastname`
   - current DB column: `last_name`
   - canonical new-project name: `last_name`
   - guidance: use `last_name` in new implementation; old `lastname` is reference only unless a compatibility layer is explicitly needed

3. old `email`
   - meaning: member login/contact email
   - current repo usage: `email`
   - current DB column: `email`
   - guidance: exact carry-through

4. old `phone`
   - meaning: member phone
   - current repo usage: `phone`
   - current DB column: `phone`
   - guidance: exact carry-through

5. old `gender`
   - meaning: member gender
   - current repo usage: `gender`
   - current DB column: `gender`
   - guidance: exact carry-through

6. old `occupation`
   - meaning: member occupation
   - current repo status: no confirmed existing `community_members.occupation` column found
   - guidance: treat as a required product field for the new signup flow, but do not assume current PM schema already stores it
   - implementation note: if backend support is added later, persist intentionally; until then this must not be silently dropped without an explicit decision

### Address / Geography

7. old `state`
   - meaning: state/region
   - current repo usage: `state`
   - current DB column: `state`
   - guidance: exact carry-through

8. old `city`
   - meaning: city
   - current repo usage: `city`
   - current DB column: `city`
   - guidance: exact carry-through

9. old `zip`
   - meaning: ZIP/postal code
   - current repo usage: `zip`
   - current DB column: `zip`
   - guidance: exact carry-through

10. old `address`
   - meaning: full address
   - current repo usage: `address`
   - current DB column: `address`
   - guidance: exact carry-through

### Birth / Astrology Inputs

11. old `dob`
   - meaning: date of birth
   - current repo status: old UI name differs from DB naming
   - current DB column: `date_of_birth`
   - canonical new-project name: `date_of_birth`
   - guidance: use `date_of_birth` in the new implementation; old `dob` is reference only

12. old `time_of_birth`
   - meaning: birth time
   - current repo status: old UI name differs from DB naming
   - current DB column: `birth_time`
   - canonical new-project name: `birth_time`
   - guidance: use `birth_time` in the new implementation; old `time_of_birth` is reference only

13. old `birth_city`
   - meaning: birthplace city
   - current DB column: `birth_city`
   - guidance: exact semantic match if used

### Relationship Fields

14. old `relation`
   - meaning: top-level relation category for additional members
   - old allowed values: `Partner/Couple`, `Family`
   - current repo status: no exact same field name already standardized in PM schema
   - nearest current field: `relation_type`
   - canonical current-project leaning: `relation_type`
   - guidance: use `relation_type` as the canonical new-project field name

15. old `sub_relation`
   - meaning: second-level relationship type, such as `Husband`, `Wife`, `Son`, `Daughter`
   - current repo status: no exact DB column discovered for `sub_relation`
   - canonical new-project field name: `sub_relation`
   - guidance: this cannot be assumed to exist in current schema; the new implementation must explicitly define where it lives
   - acceptable approaches:
     - new dedicated field in future backend contract
     - store in normalized relationship payload
     - store inside structured metadata
   - not acceptable: silently dropping it

16. existing repo `relation_type`
   - meaning in current repo: generic relation field
   - limitation: likely insufficient alone for full old `relation + sub_relation` parity unless clearly repurposed
   - guidance: do not assume `relation_type` fully replaces both old fields without explicit modeling

### Relationship Status

17. old `relationship_status`
   - meaning: member relationship status
   - current repo usage: `relationship_status`
   - current DB column: `relationship_status`
   - guidance: exact carry-through

### Credentials

18. old `password`
   - old meaning: manual password entry
   - new product meaning: not collected in the form
   - guidance: do not render, do not require in frontend validation, do not preserve as UI field

19. old `confirm_password` / `confirmpassword`
   - old meaning: manual password confirmation
   - new product meaning: not collected in the form
   - guidance: do not render, do not require in frontend validation

### Legacy Questionnaire Fields Already Reflected In Current Repo Naming

These fields already align closely with current repo naming and should usually carry through directly if the future payload supports them:

20. `personality`
21. `strengths`
22. `lifeAreasFulfilling`
23. `lifeAreasImprovement`
24. `longTermGoals`
25. `majorLifeEvents`
26. `relationship_with_family`
27. `biggest_current_challenges`
28. `mainConcern`
29. `additionalInfo`
30. `achieveFromReading`
31. `focus_on_specific_relationships`
32. `stressManagement`
33. `workLifeBalance`
34. `concerns_about_romantic_life`
35. `social_life_fulfillment`
36. `spiritualPractices`
37. `guidance_on_specific_decision`
38. `ongoing_projects_or_plans`
39. `selfDiscovery`
40. `externalInfluences`
41. `specificQuestions`
42. `goalsOutcomes`

Current repo note:

Most of these are already grouped under `intake_data` JSONB in the existing PM member-create route.

### Legacy Questionnaire Fields Not Clearly Present In Current Repo PM Contract

43. `practicalSpiritualPref`
   - current repo status: not found in current PM create route or add-fields migration
   - guidance: keep as required questionnaire scope from old product, but do not assume existing persistence support

44. `additional_info`
   - current repo status: appears in current PM create route
   - guidance: treat carefully as distinct from `additionalInfo`; do not merge accidentally unless product explicitly wants that

## Payload Normalization Guidance

The implementing AI should separate these concepts clearly:

1. UI labels
2. frontend state keys
3. submission payload keys
4. persistence/storage keys

The UI may keep old-friendly wording in labels, but state and payload keys should prefer current-project naming for common fields.

Legacy names should survive only where they are already the chosen canonical new-project field, such as `sub_relation`.

## Canonical Recommendations For New Frontend

Unless a backend contract explicitly requires different names, the implementing AI should prefer this approach:

1. Use current-project names in frontend form state for common fields whenever a stable equivalent exists.
2. Keep legacy-only names only for concepts that do not yet have a clean current-project field, such as `sub_relation`.
3. Add comments or helper functions where any compatibility mapping still exists.

## Fields That Must Not Be Silently Lost

The implementing AI must pay special attention to these because they are easy to forget during normalization:

1. `occupation`
2. `relation`
3. `sub_relation`
4. `practicalSpiritualPref`
5. `additionalInfo`
6. `additional_info`

## Required Implementation Behavior

1. If the new frontend uses renamed internal fields, the mapping must be explicit in code.
2. If a current backend/schema field does not yet exist for an old required concept, the implementing AI must not silently omit the field from the UI requirements.
3. If a field is intentionally deferred or staged, that decision must be visible in comments or task notes.
4. Do not conflate similarly named questionnaire fields without an explicit decision.

## Acceptance Criteria

1. the implementing AI has one canonical field-mapping reference
2. old field-name differences do not cause accidental data loss
3. renamed fields like `dob -> date_of_birth` are handled intentionally
4. unsupported fields like `sub_relation` and `occupation` are not forgotten during implementation planning
5. the new signup page can preserve old behavior while still fitting the new project structure
