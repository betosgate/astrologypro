# Add Member Create API, Schema, And Payload Contract - 2026-04-07

- Status: Planned
- Priority: P1
- Owner: Backend
- Scope: API naming, request validation, schema design, payload normalization, member creation persistence
- Estimate: 0.75-1.5 days
- Task File: `tasks/perennial/2026-04-07/03-member-create-api-schema-and-payload-contract.md`

## Goal

Introduce a dedicated create-member API and schema that support the requested legacy-aligned payload while remaining appropriately named and maintainable within this project.

## Verified Current Code Truth

- Existing add-member APIs only support a much smaller payload.
- The current create-member routes do not accept the requested legacy field set.
- There is not yet a dedicated schema/validation contract for the expanded member-creation payload.

## User-Visible Problem

Even if the expanded form is added, the backend cannot currently accept or validate the full requested payload and create the member through a stable dedicated contract.

## Required Behavior

1. A suitable create-member API route must be added for this project.
2. A schema must validate the expanded payload.
3. The schema field names should align with the payload contract being sent by the UI.
4. The create flow must persist the member using the expanded field set or an intentional normalized mapping.
5. The API must support these payload fields:
   - `relation_type`
   - `firstname`
   - `lastname`
   - `email`
   - `phone`
   - `gender`
   - `relationship_status`
   - `state`
   - `city`
   - `zip`
   - `personality`
   - `strengths`
   - `lifeAreasFulfilling`
   - `lifeAreasImprovement`
   - `longTermGoals`
   - `majorLifeEvents`
   - `relationship_with_family`
   - `biggest_current_challenges`
   - `mainConcern`
   - `additionalInfo`
   - `achieveFromReading`
   - `address`
   - `additional_info`
   - `focus_on_specific_relationships`
   - `stressManagement`
   - `workLifeBalance`
   - `concerns_about_romantic_life`
   - `social_life_fulfillment`
   - `spiritualPractices`
   - `guidance_on_specific_decision`
   - `ongoing_projects_or_plans`
   - `selfDiscovery`
   - `externalInfluences`
   - `specificQuestions`
   - `goalsOutcomes`
   - `password`
   - `confirmpassword`
   - `status`
   - `relation_with`
   - `user_type`

## API Naming Guidance

Use a project-appropriate route and schema name such as:

- route: `/api/community/members/create`
- schema: `createCommunityMemberSchema`

If a different name is chosen, it should still clearly communicate:

- community/perennial context
- member creation purpose
- long-term maintainability

## Tasks

1. Define the canonical request contract for the expanded member payload.
2. Introduce request validation schema with clear required/optional rules.
3. Decide and document field normalization where storage names differ from incoming payload names.
4. Add the create-member API route.
5. Return useful success and validation error responses for form integration.

## Acceptance Criteria

- expanded payload is accepted by a dedicated create-member API
- schema validation exists and is explicit
- API name and schema name are suitable for this project
- invalid payloads return actionable validation errors
- successful submissions create the member record correctly

## Verification Test Plan

1. Submit a valid payload and verify member creation succeeds.
2. Submit invalid or missing required fields and verify validation errors are returned.
3. Verify password/confirm-password mismatch is rejected.
4. Verify the route contract remains stable and understandable for frontend usage.

## Notion Summary

P1 backend contract gap: the requested Perennial add-member flow needs a dedicated create API and schema that can validate and persist the expanded legacy payload instead of relying on the current minimal add-member contract.
