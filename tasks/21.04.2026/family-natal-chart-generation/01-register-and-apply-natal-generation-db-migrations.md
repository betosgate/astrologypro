# Backend Task - Register & Apply Natal Generation DB Migrations

- Status: Planned
- Priority: P0
- Area: Backend / Database / Admin Migration Runner
- Files:
  - `supabase/migrations/20260413000182_natal_generation_governance.sql`
  - `supabase/migrations/20260413000185_natal_regeneration_audit.sql`
  - `src/data/migrations/`
  - `src/lib/db/migrations.ts`
  - `src/app/api/admin/db/migrate/route.ts`
- Related Endpoint: `POST /api/community/generate-natal`
- Related Page: `/community/family/[id]`

---

## Problem

Clicking **Generate Chart** for an existing family member returns:

```json
{
  "error": "Family member not found"
}
```

Example failing request:

```txt
POST /api/community/generate-natal
Body: { "familyMemberId": "f071b86c-bd87-417e-90fc-653a4edafb00" }
Status: 404
```

The family member row exists in `community_family_members`, so the 404 is misleading.

Root cause found during QA:

- The live database is missing natal generation governance columns such as:
  - `natal_status`
  - `natal_retry_count`
  - `natal_max_retries`
  - `natal_first_generated_at`
  - `natal_last_generated_at`
  - `natal_failure_reason`
  - `natal_lock_reason`
- `src/app/api/community/generate-natal/route.ts` selects those columns.
- The migration that adds those columns exists locally, but is not registered in the admin DB migration allowlist.
- The admin migration panel only runs migrations registered in `src/lib/db/migrations.ts`.

## Required Backend Fix

### 1. Register Existing Migration: Natal Generation Governance

Register this migration with the admin DB migration panel:

```txt
supabase/migrations/20260413000182_natal_generation_governance.sql
```

It must be mirrored into `src/data/migrations/` and added to `src/lib/db/migrations.ts`.

### 2. Register Existing Migration: Natal Regeneration Audit

Register this migration with the admin DB migration panel:

```txt
supabase/migrations/20260413000185_natal_regeneration_audit.sql
```

It must also be mirrored into `src/data/migrations/` and added to `src/lib/db/migrations.ts`.

This is required because `POST /api/community/generate-natal` writes to `natal_regeneration_audit` during regeneration attempts.

### 3. Deploy and Apply from Admin Panel

After code deployment, run both migrations from:

```txt
/admin/db/migrations
```

Run order:

1. `20260413000182_natal_generation_governance`
2. `20260413000185_natal_regeneration_audit`

## Acceptance Criteria

- [ ] `20260413000182_natal_generation_governance` appears in `/admin/db/migrations`.
- [ ] `20260413000185_natal_regeneration_audit` appears in `/admin/db/migrations`.
- [ ] Admin can run both migrations successfully from the panel.
- [ ] `community_family_members` has `natal_status`.
- [ ] `community_family_members` has natal retry/governance columns.
- [ ] `natal_regeneration_audit` table exists.
- [ ] Existing family member rows backfill correctly:
  - rows with `natal_chart IS NULL` default to `natal_status = 'not_started'`
  - rows with `natal_chart IS NOT NULL` become `natal_status = 'generated'`
- [ ] `POST /api/community/generate-natal` no longer fails because of missing schema columns.

## QA Checklist

- [ ] Open `/admin/db/migrations` as an admin.
- [ ] Confirm both natal migrations are listed.
- [ ] Run `20260413000182_natal_generation_governance`.
- [ ] Run `20260413000185_natal_regeneration_audit`.
- [ ] Verify the database columns exist:
  - `community_family_members.natal_status`
  - `community_family_members.natal_retry_count`
  - `community_family_members.natal_max_retries`
  - `community_family_members.natal_first_generated_at`
  - `community_family_members.natal_last_generated_at`
  - `community_family_members.natal_failure_reason`
  - `community_family_members.natal_lock_reason`
- [ ] Verify `natal_regeneration_audit` exists.
- [ ] Log in as a community member with a family member.
- [ ] Navigate to `/community/family/[id]`.
- [ ] Click **Generate Chart**.
- [ ] Confirm the API no longer returns `404 Family member not found` for an existing row.

## Important Constraints

- Do not create a new replacement migration if the existing migrations are valid.
- Do not manually run arbitrary SQL outside the admin migration flow unless explicitly approved.
- Do not change chart-generation business logic in this task.
- Do not fix birth-country/location saving in this task; that belongs to a separate task.
- Do not mask schema errors as `Family member not found`; API hardening belongs to the next backend task.
