# 01 Fix Pricing Calculator NaN Bug - 2026-04-16

- Status: Planned
- Priority: P0
- Owner: Backend
- Parent: `00-master-task.md`
- Task File: `tasks/16.04.2026/plan-management-fixes/01-fix-pricing-calculator-nan.md`

## Goal

Align the `/api/community/plan/preview` response structure with the `PreviewResult` TypeScript type used in the frontend.

## Context

The frontend `CommunityPlanPage` component expects a flat result object:
```ts
type PreviewResult = {
  base_price: number;
  included_members: number;
  extra_count: number;
  extra_price_per: number;
  extra_total: number;
  total: number;
};
```

Currently, the API returns a nested `breakdown` object with different field names (e.g., `total_monthly`, `extra_members`), causing the UI to see `undefined` and display `$NaN`.

## Files To Change

| File | Change |
|---|---|
| `src/app/api/community/plan/preview/route.ts` | Refactor the JSON response to return flat keys matching the frontend type. |

## Required Behavior

Update the `NextResponse.json` call to:
- Map `baseCharge` to `base_price`
- Map `tier.base_member_limit` to `included_members`
- Map `extraMembers` to `extra_count`
- Map `tier.extra_per_member_usd` to `extra_price_per`
- Map `extraCharge` to `extra_total`
- Map `totalMonthly` to `total`

## Acceptance Criteria

- [ ] Fetching `/api/community/plan/preview?members=X` returns the flat object structure.
- [ ] The "Price Calculator" section on the `/community/plan` page shows real values (e.g. $34.95) instead of $NaN.
