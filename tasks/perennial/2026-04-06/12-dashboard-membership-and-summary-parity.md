# Improve Perennial Dashboard Membership And Summary Parity - 2026-04-06

- Status: Completed (2026-04-08, upstream)
- Completion Notes: Top membership block uses `MembershipCard` (with status badge, plan, billing, renewal, slots progress, action buttons including Add Member, Update Payment, Subscribed/Unsubscribe).
- Priority: P2
- Owner: Frontend
- Scope: membership summary, plan visibility, status messaging, top-level dashboard cards
- Estimate: 1-2 days
- Task File: `tasks/perennial/2026-04-06/12-dashboard-membership-and-summary-parity.md`

## Goal

Tighten the Perennial dashboard so membership status, plan state, and top-level summary cards are clearer and closer to the intended member experience.

## Verified Current Code Truth

- The current Perennial dashboard exists at `src/app/community/page.tsx`.
- It already shows membership status and a broad summary of community data.
- The current dashboard is functional, but the membership summary experience is still a general dashboard rather than a dedicated Perennial dashboard pass.

## User-Visible Problem

Members can access the dashboard, but the page does not yet present the strongest membership-focused overview for plan type, expiry, renewal state, upgrade context, and next-step clarity.

## Required Behavior

1. Dashboard must clearly show active plan and membership status.
2. Dashboard must clearly show renewal, expiry, or upgrade context when relevant.
3. Top-level cards must prioritize the most important Perennial summary signals.

## Tasks

1. Review the current dashboard card order and membership summary hierarchy.
2. Improve membership status, plan, and expiry presentation.
3. Add or refine upgrade / manage-membership CTA visibility where appropriate.
4. Ensure summary cards remain useful on both desktop and mobile layouts.

## Acceptance Criteria

- plan and status are easy to identify immediately
- expiry or renewal context is visible when relevant
- dashboard summary feels membership-led rather than generic

## Verification Test Plan

1. Open the dashboard as an active member and verify the summary is understandable without scrolling deeply.
2. Verify plan, status, and expiry messaging is visible and accurate.
3. Verify the page remains usable on smaller screens.

## Notion Summary

P2 dashboard gap: the Perennial dashboard already works, but it still needs a focused pass on membership summary clarity, plan context, and top-level overview hierarchy.
