# 03 Fix Role-Specific Admin User Detail Fetch - 2026-04-17

- Status: Planned
- Priority: P1
- Owner: Backend Developer / Codex
- Parent: `00-master-task.md`
- Depends on: `01-reproduce-and-capture-admin-edit-community-error.md`, `02-audit-admin-user-detail-role-table-contracts.md`
- Task File: `tasks/17.04.2026/admin-edit-user-community-role/03-fix-role-specific-admin-user-detail-fetch.md`

## Goal

Update `GET /api/admin/users/[id]` so it fetches each role profile with columns that actually exist for that role.

## File To Change

```txt
src/app/api/admin/users/[id]/route.ts
```

## Required Behavior

1. Do not select `is_active` from `community_members`.
2. Do not select `is_active` from `clients`.
3. Do not select `is_active` from `trainees` unless the audit confirms it exists.
4. Fetch role-specific name fields in the same query where possible.
5. If a Supabase query errors, log enough detail to identify the failed table and selected columns.
6. Continue to support diviner provider fields:
   - `video_provider`
   - `phone_provider`

## Suggested Implementation Shape

Use a role config with explicit select fields, for example:

```ts
{
  table: "community_members",
  role: "community",
  nameCol: "full_name",
  select: "id, user_id, full_name, phone, membership_status, membership_type"
}
```

Then derive `isActive` for response:

```ts
isActive: role === "community"
  ? row.membership_status === "active"
  : row.is_active ?? true
```

## Response Contract

For a valid community user, `GET /api/admin/users/[id]` should return:

```json
{
  "userId": "...",
  "rowId": "...",
  "email": "member@example.com",
  "name": "Member Name",
  "phone": "",
  "isActive": true,
  "role": "community",
  "table": "community_members",
  "nameCol": "full_name"
}
```

## Acceptance Criteria

- [ ] Community user fetch returns `200`.
- [ ] Response includes `role: "community"`.
- [ ] Response includes `table: "community_members"`.
- [ ] Response includes `nameCol: "full_name"`.
- [ ] No query selects `community_members.is_active`.
- [ ] Non-community roles still return the same fields expected by the edit page.
