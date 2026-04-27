# Task 01 - Fix Dashboard Monthly Transit Lookup

- Status: Planned
- Priority: P0
- Area: Perennial / Community Dashboard / Monthly Transits
- File: `src/app/api/community/astro-charts/route.ts`
- Page Route: `/community`

---

## Problem

The dashboard chart API reads this month's transit record for the first ready family member.

During scan, the lookup appears to use:

```ts
.eq("member_id", natalCharts[0].id)
```

But `monthly_transits` stores the family member reference as:

```ts
family_member_id
```

This can prevent already-generated monthly transit rows from appearing on the dashboard.

## Required Backend Fix

Change the monthly transit query to filter by:

```ts
.eq("family_member_id", natalCharts[0].id)
```

Keep the existing response contract:

- `monthlyTransit`
- `status.transit`
- `natalChart`
- `natalCharts`

## Acceptance Criteria

- [ ] Existing current-month transit rows are returned by `/api/community/astro-charts`.
- [ ] No transit row still returns `monthlyTransit: null`.
- [ ] `status.transit` is `ready` when a row exists.
- [ ] `status.transit` is `empty` when no row exists.
- [ ] No unrelated dashboard response shape changes are introduced.
