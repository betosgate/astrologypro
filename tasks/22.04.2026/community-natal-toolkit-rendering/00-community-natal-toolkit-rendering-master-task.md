# Master Task - Community Natal Chart Shared Toolkit Rendering

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Natal Chart Rendering
- Git Remote: `https://github.com/betosgate/astrologypro.git`
- Task Folder: `tasks/22.04.2026/community-natal-toolkit-rendering`
- Related Pages:
  - `/admin/horoscope`
  - `/community/horoscope`
  - `/community/family/[id]`
  - `/community/charts/detailed`
  - `/community`

---

## Purpose

Community natal chart rendering should use the same shared Horoscope Toolkit component that the admin Horoscope Toolkit already uses.

The current community natal/family chart display appears to be a temporary custom implementation. It shows a simplified local natal wheel and summary cards, but it does not match the rich admin toolkit rendering.

This bundle splits the work into smaller tasks so a junior developer or AI agent can implement safely.

## Read This First

Use direct file links as source references:

- Admin Horoscope Toolkit component:
  - GitHub: https://github.com/betosgate/astrologypro/blob/master/src/app/admin/horoscope/page.tsx
  - Relative path: `src/app/admin/horoscope/page.tsx`
- Admin Horoscope input requirements note:
  - GitHub: https://github.com/betosgate/astrologypro/blob/master/tasks/22.04.2026/astro-toolkit/admin-horoscope-tab-input-requirements.md
  - Relative path: `tasks/22.04.2026/astro-toolkit/admin-horoscope-tab-input-requirements.md`
- Existing relationship toolkit reuse pattern:
  - GitHub: https://github.com/betosgate/astrologypro/blob/master/src/app/community/charts/detailed/page.tsx
  - Relative path: `src/app/community/charts/detailed/page.tsx`
- Toolkit prefill helper:
  - GitHub: https://github.com/betosgate/astrologypro/blob/master/src/lib/horoscope-toolkit-prefill.ts
  - Relative path: `src/lib/horoscope-toolkit-prefill.ts`
- Current community horoscope page:
  - GitHub: https://github.com/betosgate/astrologypro/blob/master/src/app/community/horoscope/page.tsx
  - Relative path: `src/app/community/horoscope/page.tsx`
- Current family member detail page:
  - GitHub: https://github.com/betosgate/astrologypro/blob/master/src/app/community/family/%5Bid%5D/page.tsx
  - Relative path: `src/app/community/family/[id]/page.tsx`
- Current dashboard chart cards task:
  - GitHub: https://github.com/betosgate/astrologypro/blob/master/tasks/22.04.2026/community-dashboard/01-fix-astro-charts-infinite-loading-empty-state.md
  - Relative path: `tasks/22.04.2026/community-dashboard/01-fix-astro-charts-infinite-loading-empty-state.md`

## Key Findings

The admin Horoscope Toolkit already exports a reusable component:

```ts
export function HoroscopeToolkitPage({
  basePath = "/admin/horoscope",
  allowedSlugs,
  initialPrefill = null,
}: HoroscopeToolkitPageProps = {}) {
  // ...
}
```

The relationship detailed page already proves the desired reuse model. It imports:

```ts
import { buildToolkitPrefillForm } from "@/lib/horoscope-toolkit-prefill";
import { HoroscopeToolkitPage } from "@/app/admin/horoscope/page";
```

Then it passes:

```tsx
<HoroscopeToolkitPage
  basePath="/community/charts/detailed..."
  allowedSlugs={allowedSlugs}
  initialPrefill={encodeURIComponent(JSON.stringify(prefill))}
/>
```

For Nativity Birth Chart, the toolkit tab slug is:

```txt
western_horoscope_v2
```

The admin toolkit natal flow calls:

- `/api/admin/astro/compute` with `endpoint: "western_horoscope"`
- `/api/admin/astro/compute` with `endpoint: "natal_wheel_chart"`
- `/api/admin/astro/natal-wheel` for the alternate/free wheel SVG

Monthly transit future-month flows may call:

- `/api/admin/astro/planet-return` with `steps: "astrology_report_monthly"`

That planet-return call is not the normal Nativity Birth Chart call. It belongs to monthly transit/report flows when a future month is selected.

## Required Instruction For Developer / AI

Read every task file under:

```txt
tasks/22.04.2026/community-natal-toolkit-rendering
```

Work on this bundle in small steps.

Do not attempt to implement all tasks in one pass. This is a multi-part rendering and routing change, and doing everything at once can easily miss details.

Required execution style:

1. Pick only one numbered task file at a time.
2. Read the referenced source files for that task before editing.
3. Write down the implementation approach briefly in the PR/chat before making large edits.
4. Implement only that task's scope.
5. Run the task-specific QA checklist.
6. Confirm the task's acceptance criteria before moving to the next task.
7. If a task uncovers missing data, unclear ownership behavior, or conflicting route expectations, stop and document the finding instead of guessing.

Recommended AI/Codex workflow:

- Do `01` first as analysis only.
- Do `02`, verify it, then stop for review.
- Do `03`, verify it, then stop for review.
- Do `04` last after the target toolkit routes are already working.

Do not delete the existing temporary community natal/family chart UI during this work. If a page is replaced with the shared toolkit renderer, comment out the old JSX/code block with a clear legacy note so it can be reviewed or restored if needed.

Do not change the astrology calculation APIs unless a task explicitly asks for it.

Do not weaken membership, ownership, or RLS boundaries.

Do not change chart-generation database migration behavior in this bundle.

## Task List

1. `01-audit-admin-toolkit-and-community-rendering-contract.md`
2. `02-render-self-natal-chart-with-shared-toolkit.md`
3. `03-render-family-member-natal-chart-with-shared-toolkit.md`
4. `04-update-dashboard-chart-links-and-empty-states.md`

## Suggested Execution Order

1. Complete the audit/contract task first.
2. Implement self natal rendering on `/community/horoscope`.
3. Implement family member natal rendering on `/community/family/[id]`.
4. Update dashboard card links and empty states after the target pages are ready.

## System/Notion-Friendly Task Text

Replace temporary community natal chart rendering with the shared admin Horoscope Toolkit renderer. Use `HoroscopeToolkitPage` from `src/app/admin/horoscope/page.tsx`, follow the existing relationship detailed page pattern in `src/app/community/charts/detailed/page.tsx`, prefill the toolkit using `buildToolkitPrefillForm`, restrict community natal pages to the `western_horoscope_v2` tab, and preserve the existing temporary family chart UI by commenting it out rather than deleting it.

## Final Acceptance Criteria

- [ ] `/community/horoscope` renders the shared Horoscope Toolkit for the logged-in member's own natal chart.
- [ ] `/community/family/[id]` renders the shared Horoscope Toolkit for the selected owned family member's natal chart.
- [ ] Toolkit form data is prefilled from saved birth details.
- [ ] The Nativity Birth Chart tab uses `western_horoscope_v2`.
- [ ] The shared toolkit calls the same admin astrology APIs it uses in `/admin/horoscope`.
- [ ] Existing relationship detailed chart rendering still works.
- [ ] Existing ownership and membership checks remain intact.
- [ ] Temporary old family chart UI is commented out, not deleted.
- [ ] Dashboard chart cards no longer point users into temporary or misleading chart states.
