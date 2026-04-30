# 02 - Update Astro Charts API Monthly List

- Status: Planned
- Priority: P0
- Area: API / Community Dashboard
- File: `src/app/api/community/astro-charts/route.ts`

---

## Goal

Return dashboard monthly-transit data for all eligible household members, not just the first generated natal-chart member.

## Required API Shape

Keep backward compatibility where practical:

```ts
{
  natalChart: NatalChartItem | null;
  natalCharts: NatalChartItem[];
  monthlyTransit: MonthlyTransitItem | null; // legacy first item
  monthlyTransits: MonthlyTransitItem[];
  status: {
    natal: "ready" | "empty" | "pending" | "failed";
    transit: "ready" | "empty" | "pending" | "failed";
  };
}
```

Suggested monthly item:

```ts
type MonthlyTransitItem = {
  id: string;
  family_member_id: string;
  member_name: string;
  month: string;
  transit_data: Record<string, unknown> | null;
  generation_status: string | null;
  full_report_id: string | null;
  full_report_status: string | null;
  full_report_generated_at: string | null;
  created_at: string | null;
};
```

## Required Logic

- Load all `community_family_members` for the active community member.
- Use the same eligibility rule as `/community/transits`: complete birth data.
- Query `monthly_transits` with:

```txt
family_member_id IN eligibleFamilyIds
month = currentMonth
```

- Validate summary rows with `isValidMonthlyTransit(...)`.
- Return valid/current rows in `monthlyTransits`.
- Preserve `monthlyTransit` as the first valid item for old consumers.
- Do not make transit visibility depend on `deriveNatalReportState(...)`.

## Acceptance Criteria

- [ ] API returns all valid current-month transit rows for eligible household members.
- [ ] API does not use `natalCharts[0].id` for monthly transit lookup.
- [ ] API remains compatible with existing dashboard until UI update lands.
- [ ] Invalid/stale rows do not crash the endpoint.
