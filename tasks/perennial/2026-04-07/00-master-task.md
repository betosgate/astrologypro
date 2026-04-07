# Master Task - Perennial Add Member Form And Create Flow - 2026-04-07

- Status: Planned
- Priority: P1
- Owner: Fullstack
- Scope: dashboard entry point, dedicated add-member screen, legacy payload parity, create API/schema, submit/reset/cancel behavior, dashboard layout and sidebar navigation, logout integration
- Estimate: 2-4 days
- Task File: `tasks/perennial/2026-04-07/00-master-task.md`

## Objective

Bring the Perennial member-creation journey closer to the legacy product by adding a dedicated "Add Perennial Mandalism Member" flow with the expanded form fields, the expected create payload, a suitable create API/schema contract, and clear entry points from the dashboard and membership block.

## Current Product Truth

- The current project already supports lightweight member/family creation in the community area.
- Existing add-member flows are much smaller than the legacy form and only capture a limited set of fields.
- The current `/community/plan` flow is dialog-based, while the shared reference shows a full-screen create form.
- The dashboard membership area currently emphasizes plan/billing actions, but does not yet expose the requested dedicated add-member entry point in the same way as the shared reference.

## Child Tasks

1. `01-dashboard-membership-add-member-entry-points.md`
2. `02-add-member-full-form-ui-and-actions.md`
3. `03-member-create-api-schema-and-payload-contract.md`
4. `04-add-member-submit-reset-cancel-flow.md`
5. `05-dashboard-sidebar-navigation-and-logout.md`

## Reference

This task is based on the shared legacy screenshots for:

- a dedicated "ADD PERENNIAL MENDALISIM MEMBER" form screen
- a top-of-dashboard membership block that should also expose member creation

It also references the provided legacy payload that must drive the new form/schema design.

## Required Outcome

1. Members can start the add-member flow from a dedicated add-member block/button.
2. Members can also start the flow from the membership block aligned near the top of the dashboard.
3. Clicking add-member opens or routes to a dedicated full-screen create form matching the shared reference direction.
4. The UI exposes the expanded legacy-aligned field set when the form opens.
5. A create-member API and schema are introduced with a suitable, stable name for this project.
6. Submit creates the member through the new API.
7. Reset clears the form state.
8. Cancel returns the user to the dashboard.

## Done Definition

- dashboard has the requested add-member entry points
- dedicated add-member form screen exists
- form fields align with the requested payload contract
- create API route and schema exist with validation
- submit, reset, and cancel all behave correctly
- success path creates the member and returns the user to the intended flow

## Verification Gate

1. Open the Perennial dashboard and verify add-member is available from the dedicated block/button.
2. Verify the membership block near the top of the dashboard also exposes add-member creation.
3. Open the add-member screen and verify the expanded field set is visible.
4. Submit valid data and verify the member is created.
5. Click reset and verify all inputs return to default values.
6. Click cancel and verify the user is redirected to the dashboard.

## Notion Ready Summary

P1 member-creation gap: the current Perennial project still uses a lightweight member form, but the requested experience needs a dedicated legacy-style add-member screen, expanded payload/schema support, a stable create API, and clear dashboard entry points including the top membership block.
