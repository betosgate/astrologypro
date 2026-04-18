# Task VF-05 - Confirm or Implement Missing Task-Specified Files

- Status: Not Started
- Priority: P1
- Owner: Full Stack
- Area: Landing page builder completeness
- Source: Local verification of `docs/tasks/2026-04-17`
- Created: 2026-04-18

## Files Listed In Original Task Specification

- `src/app/api/dashboard/landing-pages/[templateId]/preview/route.ts`
- `src/components/dashboard/landing-page-card.tsx`
- `src/components/dashboard/landing-page-filters.tsx`
- `src/components/dashboard/landing-page-summary.tsx`
- `src/components/dashboard/landing-page-empty-state.tsx`
- `src/components/dashboard/builder/section-list-item.tsx`
- `src/components/dashboard/builder/page-settings-panel.tsx`
- `src/components/dashboard/builder/builder-toolbar.tsx`

## Problem

The task docs list files/routes that are not present. Some behavior may have been implemented inline, but this needs explicit confirmation or implementation.

During the 2026-04-18 local verification rerun, the builder page loaded, but this endpoint returned `404` for an enabled template:

```text
/api/dashboard/landing-pages/[templateId]/preview
```

That confirms the preview route is not only missing from the filesystem, but also unavailable at runtime.

## Implementation

1. Review whether each missing file is still required by the product behavior.
2. If behavior exists inline, document the intentional deviation in the relevant task file or README.
3. If behavior is missing, implement the file/route using existing patterns.
4. Pay special attention to the missing preview API route because the task explicitly called for a draft preview workflow.

## Acceptance Criteria

- Each missing file is either implemented or explicitly marked as intentionally consolidated elsewhere.
- Draft preview workflow is verified.
- Landing page builder UI remains usable after any extraction/refactor.

## Verification

- Open `/dashboard/landing-pages/[templateId]/builder`.
- Edit a draft section.
- Preview draft content without publishing.
- Confirm public page still shows only published content.
