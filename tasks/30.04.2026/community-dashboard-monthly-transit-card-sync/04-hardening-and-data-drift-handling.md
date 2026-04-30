# 04 - Hardening And Data Drift Handling

- Status: Planned
- Priority: P1
- Area: Reliability / Data Integrity
- Files:
  - `src/app/api/community/astro-charts/route.ts`
  - `supabase/migrations/20260404000006_monthly_transits.sql`

---

## Goal

Prevent one malformed or duplicate monthly transit row from causing the whole dashboard Monthly Transit card to fail.

## Checks

- Verify production has the expected constraint:

```sql
UNIQUE (family_member_id, month)
```

- If duplicates exist in production, identify the cleanup path before relying on single-row assumptions.
- Prefer array queries for dashboard reads.
- If multiple rows are encountered for one member/month, pick the newest valid row and log the drift.
- If one row has invalid `transit_data`, skip it or mark that member as missing/stale without failing other members.

## Acceptance Criteria

- [ ] Dashboard API does not use `.maybeSingle()` for household transit list reads.
- [ ] One bad row cannot hide other valid household transit rows.
- [ ] Logs identify data drift without exposing sensitive user data to the browser.
- [ ] Constraint verification/cleanup is documented.
