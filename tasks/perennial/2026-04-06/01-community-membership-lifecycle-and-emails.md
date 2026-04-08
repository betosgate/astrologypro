# Close Community Membership Lifecycle And Email Gaps - 2026-04-06

- Status: Completed (2026-04-08, upstream)
- Completion Notes: Umbrella — covered by completed children: welcome/enrollment emails (webhook), `src/app/api/community/plan/{cancel,uncancel,change-tier}/route.ts`, billing/unsubscribe route added in 2026-04-07/10.1.
- Priority: P1
- Owner: Fullstack
- Scope: membership emails, checkout follow-up, subscription lifecycle
- Estimate: 2-4 days
- Task File: `docs/tasks/perennial/2026-04-06/01-community-membership-lifecycle-and-emails.md`

## Goal

Bring the community membership flow up to the requirement document for signup emails, upgrade confirmation, and subscription lifecycle management.

## Verified Current Code Truth

- Community checkout entry exists in `src/app/api/community/checkout/route.ts`.
- Community upgrade messaging exists in `src/app/community/upgrade/page.tsx`.
- Family management basics already exist in:
  - `src/app/api/community/family/route.ts`
  - `src/app/api/community/family/[id]/route.ts`
- The current implementation does not expose a verified member-facing cancel-at-period-end flow.
- The current implementation does not expose a verified downgrade flow from family to individual.
- Requirement-driven emails are not wired:
  - community membership welcome
  - Mystery School enrollment confirmation
  - monthly transit ready

## User-Visible Problem

Members can start the flow, but the lifecycle around confirmation, cancellation, downgrade, and transactional communication is incomplete.

## Required Behavior

1. Community membership purchase must trigger a welcome email.
2. Mystery School enrollment from the community path must trigger enrollment confirmation.
3. Monthly transit readiness must support member notification.
4. Community members must be able to cancel at end of billing period while retaining access until expiry.
5. Individual to family upgrade must follow the intended billing rule.
6. Family to individual downgrade must apply on the next billing cycle with extra-member handling.

## Tasks

1. Add email trigger flow for community membership welcome.
2. Add email trigger flow for Mystery School enrollment confirmation.
3. Add monthly transit ready notification trigger aligned with the transit generation flow.
4. Implement community subscription status read/update path for cancel, upgrade, and downgrade.
5. Add UI entry points for subscription management in the community area if not already present.
6. Enforce individual versus family plan member-limit rules consistently in backend lifecycle flows.

## Acceptance Criteria

- successful community signup sends the welcome email
- successful Mystery School enrollment sends confirmation
- monthly transit ready flow can notify eligible members
- cancel retains access until current period end
- upgrade and downgrade follow the documented business rules
- family-member limits remain consistent with plan state

## Verification Test Plan

1. Create or simulate a successful community checkout and verify the welcome email event fires.
2. Trigger Mystery School enrollment and verify the confirmation email event fires.
3. Generate a monthly transit cycle and verify the ready notification path works.
4. Cancel an active subscription and verify access remains until the stored period end.
5. Upgrade individual to family and verify the family limit changes correctly.
6. Downgrade family to individual and verify next-cycle handling removes extra-member access correctly.

## Notion Summary

P1 lifecycle gap: the current community flow needs the missing membership emails and full subscription management rules so Perennial members can be onboarded, upgraded, downgraded, and cancelled correctly.
