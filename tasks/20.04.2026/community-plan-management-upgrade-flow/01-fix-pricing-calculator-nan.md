# Task 01 - Fix Community Plan Pricing Calculator NaN

- Status: Planned
- Priority: P0
- Area: Frontend / API contract
- Endpoint: `GET /api/community/plan/preview`
- Page Route: `/community/plan`

---

## Goal

Stop the Community plan calculator from rendering `$NaN` by aligning the preview API response with the frontend's expected data shape.

## Problem

The frontend expects flat pricing fields, but the backend may return values inside a nested `breakdown` object. When the frontend reads undefined fields as numbers, the UI can display `$NaN`.

## Implementation Steps

1. Inspect the frontend type/interface used by the Community plan calculator.
2. Inspect `src/app/api/community/plan/preview/route.ts`.
3. Identify every numeric field the frontend reads.
4. Return a stable flat response shape from the API.
5. Keep nested `breakdown` only if needed for backward compatibility.
6. Ensure all numeric fields default to valid numbers, not `undefined`.

## Expected Response Shape

Use frontend-compatible flat keys such as:

```json
{
  "base_price": 50,
  "additional_member_price": 20,
  "member_count": 1,
  "additional_member_count": 0,
  "subtotal": 50,
  "total_price": 50,
  "currency": "usd"
}
```

Exact names should match the existing frontend type, not this example blindly.

## Acceptance Criteria

- [ ] Calculator never displays `$NaN`.
- [ ] All preview values are valid numbers.
- [ ] Frontend loading and empty states still render safely.
- [ ] Existing API consumers are not broken.
- [ ] QA verifies multiple member counts and tiers.
