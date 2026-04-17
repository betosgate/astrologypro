# 02 Audit Admin User Detail Role Table Contracts - 2026-04-17

- Status: Planned
- Priority: P1
- Owner: Backend Developer / Codex
- Parent: `00-master-task.md`
- Depends on: `01-reproduce-and-capture-admin-edit-community-error.md`
- Task File: `tasks/17.04.2026/admin-edit-user-community-role/02-audit-admin-user-detail-role-table-contracts.md`

## Goal

Audit the role tables used by `GET /api/admin/users/[id]` and document which columns are safe to select for each role.

## File To Inspect

```txt
src/app/api/admin/users/[id]/route.ts
```

## Current Risk

The endpoint loops through role tables:

```ts
const tables = [
  { table: "diviners", role: "diviner", nameCol: "display_name" },
  { table: "clients", role: "client", nameCol: "full_name" },
  { table: "social_advocates", role: "advocate", nameCol: "name" },
  { table: "community_members", role: "community", nameCol: "full_name" },
  { table: "trainees", role: "trainee", nameCol: "name" },
];
```

But it uses the same select for every role:

```ts
id, user_id, phone, is_active
```

This is unsafe because not every table has `is_active`.

## Columns To Verify

| Role | Table | Required columns for edit fetch |
|---|---|---|
| diviner | `diviners` | `id`, `user_id`, `display_name`, `phone`, `is_active`, `video_provider`, `phone_provider` |
| client | `clients` | `id`, `user_id`, `full_name`, `phone` |
| advocate | `social_advocates` | `id`, `user_id`, `name`, `phone`, `is_active` |
| community | `community_members` | `id`, `user_id`, `full_name`, `phone`, `membership_status`, `membership_type` |
| trainee | `trainees` | `id`, `user_id`, `name`, `phone`, `training_status` or `is_active` only if present |

## Database Audit SQL

Use this pattern for each role table:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'community_members'
ORDER BY column_name;
```

## Acceptance Criteria

- [ ] Confirm whether `community_members.is_active` exists. Expected: no.
- [ ] Confirm whether `clients.is_active` exists. Expected: no.
- [ ] Confirm whether `trainees.is_active` exists before selecting it.
- [ ] Document safe select fields for each role table.
- [ ] Identify any other shared-select assumptions that can break role fetching.
