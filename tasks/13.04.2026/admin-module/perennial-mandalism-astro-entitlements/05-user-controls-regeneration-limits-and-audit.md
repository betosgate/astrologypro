# 05 User Controls Regeneration Limits and Audit

## Goal

Define the user-facing control surface for chart regeneration while enforcing the `3`-attempt correction limit.

## Product Requirement

Users can regenerate charts up to `3` times if they entered info incorrectly.

That means the UX must clearly communicate:

- why regeneration is available
- how many attempts remain
- what changes will invalidate the current chart
- what happens after the limit is exhausted

## Recommended User Experience

### Natal charts

For each profile:

- show current chart status
- show last generated timestamp
- show remaining correction attempts
- require confirmation before using a retry

### Relationship charts

Relationship charts should not expose an independent freeform retry counter if they are derivative of natal charts.

Better model:

- relationship charts refresh when underlying natal data materially changes
- staff can manually force refresh if needed

## Required Auditability

Every regeneration event should capture:

- who initiated it
- when it happened
- which profile was affected
- which fields changed before regeneration
- whether it succeeded

## Limit Exhaustion Rule

When the retry limit is exhausted:

- disable the self-service action
- present a clear explanation
- offer “Create support ticket”

## Admin Controls

Admin should be able to:

- see retry history
- reset retry counts in exceptional cases
- manually regenerate after support review

## Deliverables

- user retry UX specification
- audit event model
- admin override rules
- relationship between natal retries and relationship chart refreshes

---

## Implementation — 2026-04-13

### Migration
`supabase/migrations/20260413000185_natal_regeneration_audit.sql`

**New table `natal_regeneration_audit`:**
- `family_member_id` → FK to `community_family_members`
- `initiated_by_user_id` → FK to `auth.users`
- `retry_number` — which correction attempt (1, 2, 3)
- `fields_changed` TEXT[] — which birth fields changed before this regeneration
- Snapshot columns: `old_date_of_birth`, `new_date_of_birth`, `old_birth_time`, `new_birth_time`, `old_birth_city`, `new_birth_city`
- `succeeded` BOOLEAN, `failure_reason` TEXT
- RLS: members can read their own family's audit history; service_role full access

### API integration (in generate-natal/route.ts)
- Every user correction (non-first-time generation) writes an audit record
- Failed corrections also write an audit record and still consume a retry count
- Generate-natal API returns `retries_used`, `retries_remaining`, `natal_status` in every response so the UI can show the current state
- API accepts optional `changedFields: string[]` in the body — the frontend should pass which fields were changed (e.g. `["date_of_birth", "birth_time"]`) for audit tracking

### Admin override
- Admin can reset `natal_retry_count = 0` and `natal_status = 'generated'` via direct DB update or a future admin UI — no code change needed
- `natal_max_retries` is per-row so admin can grant a higher limit without a migration

### Relationship between natal retries and relationship charts
- When `natal_chart` changes (after a correction), the DB trigger in task 03 automatically invalidates all relationship charts involving that person
- User does not get a separate retry counter for relationship charts — they regenerate automatically via the batch endpoint or on next visit to the charts page
