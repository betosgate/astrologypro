# 04 Verify Community Edit Save Contract - 2026-04-17

- Status: Planned
- Priority: P1
- Owner: Full-stack Developer / Codex
- Parent: `00-master-task.md`
- Depends on: `03-fix-role-specific-admin-user-detail-fetch.md`
- Task File: `tasks/17.04.2026/admin-edit-user-community-role/04-verify-community-edit-save-contract.md`

## Goal

Confirm that saving the admin edit form for community users updates only supported fields and does not attempt to write `is_active`.

## Files To Inspect

| File | What to verify |
|---|---|
| `src/app/admin/users/edit/[id]/page.tsx` | Form submits `name`, `phone`, `isActive`, `role`, `rowId`, and `nameCol`. |
| `src/app/api/admin/users/[id]/route.ts` | PUT skips `is_active` updates for `community` role. |

## Current Safe Behavior To Preserve

The `PUT` route already contains:

```ts
if (isActive !== undefined && !["client", "community"].includes(role)) {
  updates.is_active = isActive;
}
```

Keep this behavior unless the schema is intentionally changed.

## Test Steps

1. Open `/admin/users/edit/[id]` for a community user.
2. Change the display name.
3. Change the phone number.
4. Save.
5. Confirm the request to `PUT /api/admin/users/[id]` succeeds.
6. Confirm `community_members.full_name` and `community_members.phone` are updated.
7. Confirm no update attempts `community_members.is_active`.

## Acceptance Criteria

- [ ] Community edit form saves without database error.
- [ ] Name updates `community_members.full_name`.
- [ ] Phone updates `community_members.phone`.
- [ ] `is_active` is not included in community updates.
- [ ] Admin audit note is still written after successful update.
