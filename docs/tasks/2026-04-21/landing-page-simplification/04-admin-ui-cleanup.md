# Task 04 — Admin UI Cleanup

- Status: Not Started
- Priority: P2
- Depends On: Task 03 (the builder no longer needs admin-side publish helpers)
- Blocks: none
- Feature flag: `LANDING_PAGE_V2`

## Goal

Ensure the admin side writes **only** the admin-owned flags (`services.is_active`, `diviner_services.is_enabled`) and never touches `diviner_services.is_published`. This is the other half of the ownership split — Task 03 stopped the builder from writing admin flags; this task stops the admin from writing the diviner's flag.

## Current State

[src/app/api/admin/diviners/[id]/services/[templateId]/route.ts](../../../../src/app/api/admin/diviners/%5Bid%5D/services/%5BtemplateId%5D/route.ts) accepts a body that can set:

- `is_enabled` (correct — admin owns this)
- `publish_status` (mixes in `is_published` — admin should not own this)

[src/app/admin/diviners/[id]/service-assignment.tsx](../../../../src/app/admin/diviners/%5Bid%5D/service-assignment.tsx) surfaces a "Publish" toggle that calls through to the above route.

[src/app/api/admin/diviners/[id]/services/bulk/route.ts](../../../../src/app/api/admin/diviners/%5Bid%5D/services/bulk/route.ts) likewise writes `is_published` and `publish_status` in bulk.

## Target State

### API — `src/app/api/admin/diviners/[id]/services/[templateId]/route.ts`

PATCH body accepts **only**:
- `is_enabled: boolean` (writes `diviner_services.is_enabled`)
- `price: number` (diviner price override — admin can still set this)
- `notes: string` (admin note)

Any other field, including `is_published`, `publish_status`, `published_at`, `unpublished_at`, `publish`, or `unpublish` actions, returns 422 per RFC 9457.

`services.is_active` and `diviner_services.is_enabled` are **independent** admin flags per the master design — toggling one does not mirror to the other. `services.is_active` has its own admin control (separate PATCH on `/api/admin/services/:id` or similar). Do not auto-flip `is_active` from this endpoint. Do not touch `is_published` under any circumstance.

### API — `src/app/api/admin/diviners/[id]/services/bulk/route.ts`

Same restriction. Strip all `is_published` / `publish_status` writes.

### API — `src/app/api/admin/diviners/[id]/services/clone/route.ts`

Currently clones `publish_status`. Change to always clone with `publish_status = 'draft'` (soon-to-be-deprecated) and `is_published = false`. A cloned service is never "live" on behalf of the new diviner — the new diviner publishes it themselves.

### Admin Service-Assignment UI — `src/app/admin/diviners/[id]/service-assignment.tsx`

Remove:
- The "Publish" / "Unpublish" button for each service row.
- The `PublishBadge` component ([service-assignment.tsx:611](../../../../src/app/admin/diviners/%5Bid%5D/service-assignment.tsx#L611)) that renders publish status.

Keep:
- The "Enable" / "Disable" toggle (writes `is_enabled`).
- The price / notes inputs.
- A read-only "Diviner publish state" indicator that displays the current `is_published` value but cannot toggle it. Useful for admin visibility; not actionable.

### Admin Moderation Routes — `src/app/api/admin/landing-pages/**`

Unchanged in scope, but prepare them for the Deploy 2 rename: they currently key off `landing_page_id`. Once `service_landing_pages` is dropped, keys must become `(diviner_id, template_id)`. For Deploy 1, keep them as-is; no code change needed here.

## Files Touched

| File | Change |
|---|---|
| `src/app/api/admin/diviners/[id]/services/[templateId]/route.ts` | Remove `is_published`/`publish_status` from accepted body. Return 422 if supplied. |
| `src/app/api/admin/diviners/[id]/services/bulk/route.ts` | Same. |
| `src/app/api/admin/diviners/[id]/services/clone/route.ts` | Force cloned rows to `is_published=false`, `publish_status='draft'`. |
| `src/app/admin/diviners/[id]/service-assignment.tsx` | Remove Publish/Unpublish buttons and click handlers. Convert the existing `PublishBadge` at line 611 into a read-only indicator (same visual, no interaction). Keep Enable/Disable controls and price/notes inputs intact. |

## Acceptance Criteria

- [ ] PATCH `/api/admin/diviners/:id/services/:templateId` with body `{ is_published: true }` returns 422. Same for `publish_status`.
- [ ] PATCH with body `{ is_enabled: true }` works as before.
- [ ] Admin UI shows Enable/Disable, not Publish/Unpublish.
- [ ] `grep -r "is_published" src/app/api/admin/` returns only **read** occurrences (for display), never `.update({ is_published: ... })`.
- [ ] `grep -r "publish_status" src/app/api/admin/` shows the same: reads only.
- [ ] Cloning a diviner's services assigns them as `is_enabled=true, is_published=false`.
- [ ] Existing admin tests pass; new test covers the 422 rejection.

## Rollback

Revert the PR. Admin regains the publish toggle. No data changes to undo.

## Out of Scope

- Moderation UI rework (becomes a concern only in Deploy 2 when `service_landing_pages` is dropped).
- Admin dashboards showing aggregate publish metrics — unchanged.
- Migration of any existing admin-set publish state — that data already lives on `diviner_services.is_published`, which remains as-is.
