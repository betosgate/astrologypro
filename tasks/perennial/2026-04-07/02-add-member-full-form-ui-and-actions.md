# Build Full Add Member Form UI And Actions - 2026-04-07

- Status: Planned
- Priority: P1
- Owner: Frontend
- Scope: dedicated screen, legacy-aligned fields, layout parity, submit/reset/cancel buttons
- Estimate: 1-2 days
- Task File: `tasks/perennial/2026-04-07/02-add-member-full-form-ui-and-actions.md`

## Goal

Create a dedicated "Add Perennial Mandalism Member" screen that exposes the expanded field set from the legacy flow and presents the form in a full-screen layout similar to the shared reference.

## Verified Current UI Truth

- The current project already has lightweight add-member/family forms.
- The current forms do not expose the full legacy field set.
- The current `/community/plan` add-member flow is dialog-based rather than a full-screen create page.

## User-Visible Problem

The project does not yet provide the larger legacy-style create-member screen that shows all requested inputs at once and supports the expected button actions.

## Required Behavior

1. Opening add-member must show a dedicated form screen.
2. The form must expose these legacy-aligned fields in UI:
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
3. The screen must provide `Submit`, `Reset`, and `Cancel` buttons.
4. The layout should follow the shared reference direction rather than a small inline dialog.

## Tasks

1. Define the form layout for desktop and mobile using the shared reference.
2. Add the full field set with appropriate input types.
3. Group long-text, contact, relationship, checkbox, and credential fields in a readable structure.
4. Add `Submit`, `Reset`, and `Cancel` action buttons.
5. Make sure the form can be reused or extended without reintroducing the old minimal dialog assumptions.

## Acceptance Criteria

- full field set is visible on the dedicated add-member screen
- the screen feels like a standalone create flow, not a small modal
- submit, reset, and cancel buttons are all present
- layout remains usable on mobile and desktop

## Verification Test Plan

1. Open the add-member screen and verify the requested fields are visible.
2. Verify checkbox and long-text fields render correctly.
3. Verify the button row includes submit, reset, and cancel.
4. Verify the layout remains readable across screen sizes.

## Notion Summary

P1 form parity gap: Perennial needs a dedicated create-member screen with the larger legacy-style field set and explicit submit, reset, and cancel actions instead of the current lightweight modal-style add-member experience.
