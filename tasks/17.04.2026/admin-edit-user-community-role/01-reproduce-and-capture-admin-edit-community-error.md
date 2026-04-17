# 01 Reproduce and Capture Admin Edit Community Error - 2026-04-17

- Status: Planned
- Priority: P1
- Owner: Junior Developer / Codex
- Parent: `00-master-task.md`
- Depends on: None
- Task File: `tasks/17.04.2026/admin-edit-user-community-role/01-reproduce-and-capture-admin-edit-community-error.md`

## Goal

Reproduce the admin edit failure for a community-role user and capture the exact frontend, API, and server-side behavior.

## Routes

Admin edit page:

```txt
/admin/users/edit/[id]
```

Profile API:

```txt
GET /api/admin/users/[id]
```

## Steps

1. Sign in as an admin.
2. Open `/admin/users`.
3. Filter or locate a community user:
   - `perennial_mandalism`
   - `mystery_school`
4. Click the edit action.
5. Observe whether the edit form opens or redirects back to `/admin/users`.
6. Capture the network response for `GET /api/admin/users/[id]`.
7. Capture server logs for the same request.

## What To Record

- User role and membership type.
- Auth user id used in the edit URL.
- HTTP status from `GET /api/admin/users/[id]`.
- Response body.
- Console toast or UI message.
- Server-side Supabase error, if present.

## Expected Failure Before Fix

The likely failure is caused by the API selecting `is_active` from `community_members`, even though that column does not exist.

## Acceptance Criteria

- [ ] A community user reproduces the failed edit form load.
- [ ] The exact API status and response body are documented.
- [ ] Server logs are checked.
- [ ] The failing user id and membership type are documented for retest.
