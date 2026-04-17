# Master Task - Admin Edit User Community Role Fix - 2026-04-17

- Status: Planned
- Priority: P1
- Owner: Full-stack / Backend
- Scope: Admin user edit page, admin user detail API, community role profile fetching, edit/save QA.
- Task File: `tasks/17.04.2026/admin-edit-user-community-role/00-master-task.md`

---

## Problem

Admins cannot open the edit form for users with community roles. From the admin users list or user detail page, clicking edit for a community user attempts to fetch profile details and fails, causing the form to close or redirect back to `/admin/users`.

Page route:

```txt
/admin/users/edit/[id]
```

Endpoint:

```txt
GET /api/admin/users/[id]
```

Observed frontend behavior:

```txt
Failed to load user profile
```

## Verified Relevance

The issue is legitimate. The edit page loads profile data from `GET /api/admin/users/[id]`.

The API route loops through multiple role tables and currently uses this same select for every role:

```ts
.select("id, user_id, phone, is_active")
```

That select is unsafe for `community_members` because `community_members` does not have `is_active`. The same route's update logic already acknowledges this:

```ts
// is_active not present on clients or community_members
```

When the community lookup fails, the edit page treats the profile as not found and redirects away.

## Goal

Make admin edit user load and save correctly for community-role users without breaking existing edit behavior for diviners, clients, advocates, or trainees.

## Sub-Tasks

| # | File | What to do | Status |
|---|---|---|---|
| 01 | `01-reproduce-and-capture-admin-edit-community-error.md` | Reproduce the community edit failure and capture the exact API response/log. | Planned |
| 02 | `02-audit-admin-user-detail-role-table-contracts.md` | Audit selected fields for each role table and identify schema mismatches. | Planned |
| 03 | `03-fix-role-specific-admin-user-detail-fetch.md` | Update `GET /api/admin/users/[id]` to use role-specific selects and error handling. | Planned |
| 04 | `04-verify-community-edit-save-contract.md` | Confirm `PUT /api/admin/users/[id]` saves community user fields without `is_active`. | Planned |
| 05 | `05-end-to-end-qa-checklist.md` | Final QA across community and non-community edit flows. | Planned |

## Implementation Notes

- Do not add an `is_active` column to `community_members` just to satisfy the shared select.
- Use role-specific field selection instead of assuming every role table has the same columns.
- Preserve current behavior for diviner provider preferences.
- Keep community active state derived from `membership_status` or default it for display only.
- Log Supabase lookup errors during debugging so missing-column issues are visible.

## Acceptance Criteria

- [ ] Admin can open `/admin/users/edit/[id]` for `perennial_mandalism` community users.
- [ ] Admin can open `/admin/users/edit/[id]` for `mystery_school` community users.
- [ ] `GET /api/admin/users/[id]` no longer selects `is_active` from `community_members`.
- [ ] Community edit save updates supported fields, such as name and phone.
- [ ] Existing edit behavior still works for diviner, client, advocate, and trainee users.
- [ ] The edit page no longer redirects back to `/admin/users` for valid community users.
