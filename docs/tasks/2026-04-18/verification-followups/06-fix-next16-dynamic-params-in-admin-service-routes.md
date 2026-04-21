# Task VF-06 - Fix Next 16 Dynamic Params in Admin Service Routes

- Status: Not Started
- Priority: P0
- Owner: Full Stack
- Area: Admin service templates and diviner service assignment
- Source: Manual checklist verification rerun on 2026-04-18
- Created: 2026-04-18

## Files

- `src/app/admin/service-templates/[id]/page.tsx`
- `src/app/api/admin/service-templates/[id]/route.ts`
- `src/app/api/admin/diviners/[id]/services/route.ts`
- `src/app/api/admin/diviners/[id]/services/[templateId]/route.ts`
- `src/app/api/admin/diviners/[id]/services/audit-log/route.ts`
- `src/app/api/admin/diviners/[id]/services/bulk/route.ts`
- `src/app/api/admin/diviners/[id]/services/clone/route.ts`

## Problem

Manual checklist testing found admin service detail/edit surfaces failing under Next.js 16 dynamic route params.

Observed failures:

- `/admin/service-templates/33a43256-7dc2-4ad4-88aa-3def8740ac56` returned the app 404 page.
- `/api/admin/diviners/50559eec-600b-4547-92a8-d9c1b0d98888/services` returned `404` with `Diviner not found`.

The affected files type route params as plain objects, for example:

```ts
{ params }: { params: { id: string } }
```

Other already-working routes in this app use the Next 16 pattern:

```ts
{ params }: { params: Promise<{ id: string }> }
const { id } = await params;
```

Because `params.id` is read synchronously, the ID can be `undefined`, causing valid records to return 404.

## Implementation

1. Read the relevant Next.js 16 route/page params docs in `node_modules/next/dist/docs/` before editing.
2. Update the service-template edit page to await dynamic params.
3. Update all admin diviner service assignment API routes to await dynamic params.
4. Update admin service-template detail/update/delete API route to await dynamic params.
5. Check for the same params pattern in nearby admin service routes and fix if it affects this feature.
6. Keep response shapes unchanged except for fixing false 404s.

## Acceptance Criteria

- `/admin/service-templates/[id]` loads the edit form for a valid template ID.
- `/api/admin/service-templates/[id]` works for valid template IDs.
- `/api/admin/diviners/[id]/services` returns service assignments for a valid diviner ID.
- Admin diviner detail page loads service assignment data without toast errors.
- Service assignment enable/disable/publish actions can call their APIs successfully.
- Invalid IDs still return proper 404 responses.

## Verification

Use:

```text
admin.test@astrologypro.com
AdminTest2026!
```

Manual checks:

1. Open `/admin/service-templates`.
2. Click edit on Nativity Birth Chart.
3. Confirm `/admin/service-templates/[id]` loads the edit form.
4. Open `/admin/diviners`.
5. Open `test-diviner-1` detail.
6. Confirm the service assignment section loads services.
7. Toggle a test service, verify the public page and destination options update, then restore the original state.

API checks:

```bash
GET /api/admin/service-templates/[id]
GET /api/admin/diviners/[id]/services
GET /api/admin/diviners/[id]/services/audit-log
```
