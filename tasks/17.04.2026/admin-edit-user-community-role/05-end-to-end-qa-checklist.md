# 05 End-to-End QA Checklist - Admin Edit User Community Role Fix - 2026-04-17

- Status: Planned
- Priority: P1
- Owner: QA / Full-stack Developer / Codex
- Parent: `00-master-task.md`
- Depends on: `01`, `02`, `03`, `04`
- Task File: `tasks/17.04.2026/admin-edit-user-community-role/05-end-to-end-qa-checklist.md`

## Goal

Verify that admin user editing works for community-role users and that the fix does not regress other role edit flows.

## Preflight Checklist

- [ ] `01` captured the original failing behavior.
- [ ] `02` audited role table field contracts.
- [ ] `03` implemented role-specific user detail fetching.
- [ ] `04` verified community edit save behavior.

## Community Role QA

Test a Perennial Mandalism user:

- [ ] Open `/admin/users`.
- [ ] Locate a `perennial_mandalism` community user.
- [ ] Click edit.
- [ ] Confirm `/admin/users/edit/[id]` opens.
- [ ] Confirm name and phone prefill.
- [ ] Save a harmless edit.
- [ ] Confirm save succeeds.
- [ ] Confirm the user remains visible in `/admin/users`.

Test a Mystery School community user:

- [ ] Open `/admin/users`.
- [ ] Locate a `mystery_school` community user.
- [ ] Click edit.
- [ ] Confirm `/admin/users/edit/[id]` opens.
- [ ] Confirm name and phone prefill.
- [ ] Save a harmless edit.
- [ ] Confirm save succeeds.

## API QA

- [ ] `GET /api/admin/users/[id]` returns `200` for a community user.
- [ ] Response includes `role: "community"`.
- [ ] Response includes `table: "community_members"`.
- [ ] Response does not require `is_active` from `community_members`.
- [ ] `PUT /api/admin/users/[id]` succeeds for a community user name/phone update.

## Regression QA

Verify edit still opens and saves for:

- [ ] Diviner user.
- [ ] Client user.
- [ ] Social advocate user.
- [ ] Trainee user.

## Closeout Notes

Record before closing:

- [ ] Test community user ids.
- [ ] Test non-community user ids.
- [ ] Original API failure status/body.
- [ ] Final API success response shape.
- [ ] Any role table columns intentionally excluded from shared selects.

## Acceptance Criteria

- [ ] Admin edit form opens for community users.
- [ ] Admin edit form saves community name and phone.
- [ ] No community query selects non-existent `is_active`.
- [ ] Existing admin edit flows for other roles still work.
- [ ] QA notes are complete enough for another developer to audit the fix.
