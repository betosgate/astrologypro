# Improve Perennial Dashboard Chart And Family Summary Parity - 2026-04-06

- Status: Planned
- Priority: P2
- Owner: Fullstack
- Scope: natal/transit summary cards, family preview, chart readiness visibility
- Estimate: 1-2 days
- Task File: `tasks/perennial/2026-04-06/13-dashboard-chart-and-family-summary-parity.md`

## Goal

Improve the dashboard presentation of chart readiness, transit summaries, and family-member previews so the Perennial home screen better reflects the member's active astrology context.

## Verified Current Code Truth

- The dashboard already surfaces chart and family-related information in `src/app/community/page.tsx`.
- Chart readiness and transit summaries are split across dashboard widgets and supporting APIs.
- Family members are already managed through the family flow.

## User-Visible Problem

The dashboard has the data, but chart readiness, transit highlights, and family-member context are not yet presented as a tightly connected Perennial summary workflow.

## Required Behavior

1. Dashboard must show chart readiness in a clear way.
2. Dashboard must show meaningful monthly transit highlights.
3. Dashboard must show family preview with strong entry points into member detail workflows.

## Tasks

1. Review current chart summary card behavior and improve empty/loading/error states.
2. Improve visibility of monthly transit highlights on the dashboard.
3. Improve family preview card layout and action clarity.
4. Ensure chart and family sections guide members to the right detailed pages.

## Acceptance Criteria

- chart status is easy to understand
- monthly transit summary is visible and useful
- family-member preview is actionable and easy to scan

## Verification Test Plan

1. Open dashboard with available chart and transit data and verify the summary is useful.
2. Open dashboard with missing or pending chart data and verify the state messaging is clear.
3. Verify family preview links move users into the right member flows.

## Notion Summary

P2 dashboard gap: the Perennial home view needs a stronger chart-and-family summary layer so members can immediately understand what is ready, what changed this month, and which family member to open next.
