# Frontend/Backend Task - Fix Astro Charts Loading Loop Empty State

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Charts UX
- Page Route: `/community`
- Component: `src/components/community/astro-charts-section.tsx`
- API Route: `src/app/api/community/astro-charts/route.ts`

---

## Problem

The Community Dashboard chart cards can stay in a loading state for too long even when there is no chart data.

Observed UI:

- `Your Natal Chart` keeps showing `Your chart is being prepared...`
- `Monthly Transit` keeps showing `Monthly transit is being calculated...`
- `/api/community/astro-charts` continues being called repeatedly.

This is bad UX because a normal "no data exists yet" state is presented like an active background generation job.

Current frontend behavior:

- `AstroChartsSection` calls `/api/community/astro-charts` immediately.
- Then it polls every 10 seconds.
- It keeps polling up to `MAX_POLLS = 18`, around 3 minutes.
- If the API returns `{ natalChart: null, monthlyTransit: null }`, the component does not stop loading immediately.

Current code location:

```txt
src/components/community/astro-charts-section.tsx
```

Relevant behavior:

```ts
const POLL_INTERVAL_MS = 10_000;
const MAX_POLLS = 18; // ~3 minutes
```

## Expected UX

If the API responds successfully and chart data is missing, the UI should show a clear empty state after one or two checks.

Example empty states:

- Natal chart: `No natal chart found yet. Add or generate a chart to continue.`
- Monthly transit: `No monthly transit data found for this month yet.`

Do not keep showing a spinner unless the backend can explicitly say generation is currently pending.

## Root Cause To Verify

The current API response only returns:

```json
{
  "natalChart": null,
  "monthlyTransit": null
}
```

It does not distinguish between:

- no family member exists
- family member exists but no natal chart has been generated
- natal chart exists but monthly transit has not been generated
- monthly transit generation is actually pending
- monthly transit generation failed

Because the frontend has no status signal, it assumes missing data might still appear soon and keeps polling.

## Required Implementation

### 1. Stop Polling Quickly On Confirmed Empty Results

Update `AstroChartsSection` so that successful `null` responses do not cause 3 minutes of loading.

Minimum acceptable behavior:

- On first successful response with `natalChart: null`, stop `natalLoading` and show the natal empty state.
- On first successful response with `monthlyTransit: null`, stop `transitLoading` and show the transit empty state.

Alternative acceptable behavior:

- Allow only 1 retry after a null response.
- After 2 successful null responses, stop loading and show empty state.

### 2. Only Poll When There Is A Real Pending State

Polling should only continue if the API can indicate an actual pending/in-progress generation state.

Recommended API response shape:

```ts
{
  natalChart: NatalChartData | null;
  monthlyTransit: ChartData | null;
  status: {
    natal: "ready" | "empty" | "pending" | "failed";
    transit: "ready" | "empty" | "pending" | "failed";
  };
}
```

If adding statuses is too much for this pass, keep it frontend-only and stop after one or two null responses.

### 3. Improve Empty State Copy

Replace misleading generation/loading copy with accurate states:

- Loading: `Checking chart data...`
- Empty natal: `No natal chart found yet. Generate your chart from Family or Horoscope.`
- Empty transit: `No monthly transit data found for this month yet.`
- Failed/error: `Could not load chart data. Try refreshing.`

### 4. Handle API Errors Explicitly

If `/api/community/astro-charts` returns non-OK or throws:

- Stop infinite-looking loading.
- Show an error state after a small retry limit.
- Do not silently return forever.

### 5. Review API `.single()` Usage

Inspect `src/app/api/community/astro-charts/route.ts`.

The route uses `.single()` for queries where "no rows" is a valid outcome:

- `community_family_members`
- `monthly_transits`

If no data is expected sometimes, prefer `.maybeSingle()` or explicit error handling so the API can cleanly represent empty state.

## Constraints

- Scope this task to `/community` chart cards only.
- Do not change chart generation logic.
- Do not create new chart generation jobs automatically from this component.
- Do not keep polling for minutes when the API has already confirmed no data.
- Do not show "being prepared" or "being calculated" unless there is a real pending status.

## Acceptance Criteria

- [ ] If `/api/community/astro-charts` returns `natalChart: null`, the natal card shows an empty state after one or two successful checks.
- [ ] If `/api/community/astro-charts` returns `monthlyTransit: null`, the transit card shows an empty state after one or two successful checks.
- [ ] The dashboard no longer shows spinners for around 3 minutes when no chart data exists.
- [ ] API calls stop after empty state is confirmed.
- [ ] Polling continues only if there is an explicit pending/in-progress status.
- [ ] API errors do not leave cards stuck in loading forever.
- [ ] Existing ready states still work when chart/transit data exists.

## QA Checklist

- [ ] Log in as a Perennial member with no natal chart and no monthly transit.
- [ ] Navigate to `/community`.
- [ ] Confirm `Your Natal Chart` stops loading quickly and shows a no-data message.
- [ ] Confirm `Monthly Transit` stops loading quickly and shows a no-data message.
- [ ] Open Network tab and confirm `/api/community/astro-charts` does not keep firing for minutes after null data.
- [ ] Test a member with a natal chart but no monthly transit.
- [ ] Confirm natal card shows ready while transit card shows empty.
- [ ] Test a member with both natal chart and monthly transit.
- [ ] Confirm both cards show ready.
- [ ] Simulate API failure and confirm an error state appears instead of endless loading.

## Notes For Junior Developer

- The key UX rule: `null` data is not the same as `loading`.
- First decide whether the backend can provide explicit statuses. If not, fix the frontend to stop after one or two successful null responses.
- Use `.maybeSingle()` for Supabase queries where "no row" is normal.
- Keep this change isolated to chart-card loading behavior.
