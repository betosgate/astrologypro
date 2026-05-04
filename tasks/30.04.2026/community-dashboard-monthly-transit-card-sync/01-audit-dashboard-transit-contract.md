# 01 - Audit Dashboard Transit Contract

- Status: Planned
- Priority: P0
- Area: Audit / Dashboard Monthly Transit
- Files:
  - `src/app/api/community/astro-charts/route.ts`
  - `src/components/community/astro-charts-section.tsx`
  - `src/app/community/transits/page.tsx`

---

## Goal

Document the current dashboard Monthly Transit data contract before implementation.

## Audit Items

- Confirm what `/api/community/astro-charts` returns today:
  - `natalChart`
  - `natalCharts`
  - `monthlyTransit`
  - `status.natal`
  - `status.transit`
- Confirm the dashboard UI only supports one `monthlyTransit`.
- Confirm `/community/transits` already uses all eligible household members.
- Confirm `/community/transits` eligibility is complete birth data.
- Confirm dashboard Monthly Transit still depends on the first generated natal-chart member.
- Confirm whether `.maybeSingle()` can produce the visible failed state.

## Deliverable

Short implementation note in the task or PR describing:

- current dashboard API shape
- target dashboard API shape
- migration/compatibility plan for older UI assumptions
