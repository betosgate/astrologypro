# Task 04 - Update Dashboard Chart Links And Empty States

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Chart Navigation
- Page Route: `/community`
- Files:
  - `src/components/community/astro-charts-section.tsx`
  - `src/app/api/community/astro-charts/route.ts`
  - `src/components/community/chart-quick-actions.tsx`
  - `src/app/community/page.tsx`
- Depends On:
  - `02-render-self-natal-chart-with-shared-toolkit.md`
  - `03-render-family-member-natal-chart-with-shared-toolkit.md`
- Related Existing Task:
  - `tasks/22.04.2026/community-dashboard/01-fix-astro-charts-infinite-loading-empty-state.md`

---

## Problem

After the shared toolkit pages are available, the dashboard chart cards should direct users to the new canonical chart rendering surfaces.

The dashboard also has a known loading/empty-state issue where missing chart data can look like a long-running generation job.

This task connects the dashboard to the new shared toolkit routes and keeps the empty-state behavior honest.

## Required Implementation

### 1. Update Natal Chart Navigation

For the logged-in member's own natal chart, dashboard actions should point to:

```txt
/community/horoscope
```

For family-member natal chart flows, use:

```txt
/community/family/[id]
```

Do not point users to temporary chart-only views if the shared toolkit route is ready.

### 2. Keep Empty State Behavior Accurate

Coordinate with:

```txt
tasks/22.04.2026/community-dashboard/01-fix-astro-charts-infinite-loading-empty-state.md
```

If `/api/community/astro-charts` returns no natal chart, the dashboard should not spin for minutes.

Use clear empty-state copy such as:

```txt
No natal chart found yet. Open Horoscope to generate or view your chart.
```

Do not show:

```txt
Your chart is being prepared...
```

unless the backend has an explicit pending/in-progress status.

### 3. Review Quick Actions

Inspect:

```txt
src/components/community/chart-quick-actions.tsx
```

Decide whether quick actions should:

- link to the shared toolkit page, or
- keep the existing generation modal for saved chart data

Do not silently keep two conflicting natal chart experiences.

If both remain, label actions clearly so users understand the difference.

### 4. Confirm API Query Behavior

Inspect:

```txt
src/app/api/community/astro-charts/route.ts
```

Queries where "no rows" is normal should not use `.single()` in a way that causes false errors.

Prefer `.maybeSingle()` or explicit empty-state handling.

## Constraints

- Do not create new chart generation jobs automatically from dashboard load.
- Do not change admin toolkit behavior.
- Do not remove dashboard cards.
- Do not show "being generated" copy unless there is a real pending status.
- Keep this task focused on navigation and empty-state behavior.

## Acceptance Criteria

- [ ] Dashboard natal chart action points to `/community/horoscope` for the user's own chart.
- [ ] Family chart links point to the correct `/community/family/[id]` detail route.
- [ ] Empty natal state stops loading quickly and links to the shared toolkit route.
- [ ] Empty monthly transit state stops loading quickly or follows explicit pending status.
- [ ] `/api/community/astro-charts` handles missing rows as normal empty states.
- [ ] Quick actions do not create confusing duplicate natal chart experiences.
- [ ] Existing ready states still render correctly when data exists.

## QA Checklist

- [ ] Log in as a member with no saved natal chart.
- [ ] Open `/community`.
- [ ] Confirm natal chart card stops loading quickly.
- [ ] Click the natal chart action and confirm it opens `/community/horoscope`.
- [ ] Log in as a member with saved natal/family chart data.
- [ ] Confirm dashboard ready state links to the correct shared toolkit route.
- [ ] Confirm Network tab does not show endless `/api/community/astro-charts` polling after empty state is known.
- [ ] Confirm monthly transit card still behaves correctly.

## Notes For Junior Developer

This task should be done after the shared toolkit routes exist.

Do not solve dashboard linking by adding another chart renderer. Reuse the routes created in Tasks 02 and 03.

For Codex / AI agents: do this task last. Before editing, verify Tasks 02 and 03 are already implemented and working locally.

---

## Implementation Notes (22.04.2026)

Status: **Done**.

Changes landed:

- `src/components/community/astro-charts-section.tsx`
  - Ready-state "View Full Chart" link: `/community/family` → `/community/family/${natalChart.id}` (deep-links straight into the per-member toolkit route from Task 03 instead of bouncing through the family list).
  - Empty-state copy: now reads "No natal chart found yet. Open Horoscope to generate or view your chart." The CTA is a Button → `/community/horoscope` (the shared toolkit from Task 02) instead of "Add Family Member".
  - Empty vs. pending wording distinction preserved: "Your chart is being prepared..." still only renders when `status === "pending"` from the backend (which today is never emitted — reserved).
- `src/components/community/chart-quick-actions.tsx`
  - Natal Chart tile converted from a `<Button onClick={handleGenerate("natal")}>` that opened the birth-data modal into a `<Button asChild><Link href="/community/horoscope">…</Link></Button>`. Dashboard no longer has two natal-chart surfaces.
  - Monthly Transits and Relationship Charts tiles kept as one-click generators — they have no canonical toolkit route on this surface and aren't duplicated elsewhere, so they don't violate the "no two conflicting experiences" rule.
  - Inline comment records that `"natal"` remains in the `ChartType` union for API shape reasons but is no longer dispatched from the UI.
- `src/app/community/page.tsx`
  - `quickActions[0]` (natal): `ownChartReady ? "/community/family" : "/community/profile"` → `ownChartReady ? "/community/horoscope" : "/community/profile"`. Label: "View Charts" → "View Chart".
  - `quickActions[1]` (transits): `"/community/family"` → `"/community/transits"`.
  - Own-natal-chart ready card "View Charts →" link: `/community/family` → `/community/horoscope` (and subcopy tweaked from "ready to generate" → "open your chart" to match the toolkit's render-on-demand behavior).
- `src/app/api/community/astro-charts/route.ts`
  - No code change required — already uses `.maybeSingle()` for the family-with-chart lookup and the monthly-transit lookup, so missing rows are not treated as errors. Explicit `status: { natal, transit }` remains the source of truth for the dashboard's poll loop.

Verification:

- Scoped typecheck via `tsconfig.ux-check.json` (includes all four touched files plus prior Task 02 / 03 files and their lib helpers): `tsc --noEmit -p tsconfig.ux-check.json` → EXIT 0.
- Quick-action hrefs, ready-card hrefs, and AstroChartsSection empty-state copy all point at routes delivered by Tasks 02 (`/community/horoscope`) and 03 (`/community/family/[id]`).
- `AstroChartsSection` continues to stop polling on `ready`, `empty`, and `failed` (see the existing `stopPolling()` branches) — unchanged by this task. No "Your chart is being prepared..." copy is ever rendered unless the backend emits `status: "pending"`, which today it does not.

Constraints honored:

- No new chart generation is triggered from dashboard load.
- Admin toolkit behavior is unchanged.
- Dashboard cards are preserved; only their CTAs and empty-state copy were updated.
- "Being generated" copy is still gated behind explicit `status === "pending"`.
