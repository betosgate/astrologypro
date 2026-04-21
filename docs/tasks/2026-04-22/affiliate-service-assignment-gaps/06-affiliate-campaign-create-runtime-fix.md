# Task 06 — Affiliate Campaign Create Runtime Fix

- Status: Not Started
- Priority: P0 (Critical)
- Depends On: 2026-04-21 Task 05
- Blocks: Any real affiliate-owned V2 campaign flow

## Goal

Fix the runtime failure preventing affiliates from creating campaigns from valid assignments. In the live flow test, `POST /api/advocate/assignments/[id]/campaigns` returned `500` with:

```json
{"error":"new row for relation \"affiliate_campaigns\" violates check constraint \"affiliate_campaigns_commission_type_check\""}
```

Until this is fixed, the V2 model cannot be used in production even if the surrounding UIs render correctly.

## Current State

- Route: `src/app/api/advocate/assignments/[id]/campaigns/route.ts`
- Assignment rows store commission type as `percent | flat`
- `affiliate_campaigns.commission_type` still appears to expect the legacy enum/value shape used elsewhere in the app
- The route currently inserts a mixed payload:
  - `commission_type` copied from assignment
  - `commission_type_snapshot` copied from assignment
- Live API test proved the insert is rejected by the database constraint

## Implementation Steps

### 1. Audit the true allowed values on `affiliate_campaigns`

Check:
- canonical schema migration that originally created `affiliate_campaigns`
- any later migrations altering `commission_type`
- all existing rows in dev/staging

Document the actual allowed domain. Do not assume the 2026-04-21 task doc is still correct if the earlier table used legacy values such as `percentage`.

### 2. Normalize the create payload

In `src/app/api/advocate/assignments/[id]/campaigns/route.ts`:

- map assignment commission type to the exact value accepted by `affiliate_campaigns.commission_type`
- keep `commission_type_snapshot` aligned with the V2 snapshot semantics expected by the attribution layer
- ensure both fields are internally consistent instead of mixing legacy and V2 values

If needed, add a small shared mapper:

`src/lib/affiliate-commission-normalization.ts`

```ts
export function toCampaignCommissionType(input: "percent" | "flat"): "percentage" | "fixed" { ... }
export function toSnapshotCommissionType(input: "percent" | "flat"): "percent" | "flat" { ... }
```

Use one place for normalization so inserts, updates, and analytics do not drift.

### 3. Verify the same issue does not exist in any other V2 write path

Audit:
- migration script clone path
- any dashboard campaign create/edit route that may now accept affiliate-owned campaigns
- any seed/helper scripts inserting affiliate-owned campaign rows

### 4. Add regression coverage

At minimum:
- route-level test or scriptable verification that creating an affiliate-owned campaign from an active assignment returns 201
- assert inserted row contains:
  - `owner_type='affiliate'`
  - `owner_affiliate_id`
  - `source_assignment_id`
  - normalized `commission_type`
  - normalized `commission_type_snapshot`

## Verification Plan

1. Create / reuse an active assignment.
2. Call:

```http
POST /api/advocate/assignments/:id/campaigns
```

with a valid body.

3. Expect `201` and a payload containing `campaign_code`.
4. Query the DB:

```sql
SELECT owner_type, owner_affiliate_id, source_assignment_id, commission_type, commission_type_snapshot
FROM affiliate_campaigns
WHERE id = '<new-id>';
```

5. Confirm no constraint error occurs.
6. Re-run the live flow through `/r/<code>` and confirm the created campaign is usable without manual DB seeding.

## Edge Cases

- Existing legacy campaigns may still use legacy `commission_type` values; do not break their reads
- `flat` commission must map deterministically and not silently become percent
- If campaign updates are allowed later, they must not be able to mutate the inherited destination or source assignment

## Rollback Plan

Revert the route mapper changes. No schema rollback required.
