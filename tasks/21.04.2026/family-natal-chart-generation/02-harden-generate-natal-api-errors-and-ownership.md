# Backend Task - Harden Generate Natal API Errors & Ownership Checks

- Status: Planned
- Priority: P0
- Area: Backend / API / Community Family Charts
- File: `src/app/api/community/generate-natal/route.ts`
- Related Page: `/community/family/[id]`
- Depends On: `01-register-and-apply-natal-generation-db-migrations.md`

---

## Problem

`POST /api/community/generate-natal` currently returns:

```json
{
  "error": "Family member not found"
}
```

for an existing family member when the underlying database query fails.

During QA, the actual root cause was missing schema columns (`natal_status`, retry fields, etc.), but the API masked the DB/schema error as a 404. This makes debugging difficult and leads users/developers to believe the member row does not exist.

## Required Backend Fix

### 1. Separate Ownership Lookup from Natal Governance Query

Do not rely on one large `.select(...).single()` query to prove both ownership and schema correctness.

Recommended flow:

1. Authenticate user.
2. Resolve the active community member row for `user.id`.
3. Verify the requested `familyMemberId` belongs to that member.
4. Only then fetch/select natal generation fields.

This allows the API to distinguish:

- unauthenticated user
- no active community member
- real family member not found
- family member exists but belongs to another account
- schema/query failure
- chart generation failure

### 2. Return Accurate Error Responses

Use accurate status codes and messages.

Suggested response handling:

- `401 Unauthorized`: no logged-in user.
- `403 Forbidden`: logged-in user is not allowed to generate this member's chart.
- `404 Family member not found`: row truly does not exist for this owner.
- `422 Missing birth data`: required birth data is incomplete.
- `500 Database schema error`: selected columns/table are missing or migration was not applied.
- `500 Chart generation failed`: astrology generation logic throws.

### 3. Validate Birth Data Before Generation

Before calling `generateNatalChart`, validate:

- `date_of_birth` exists.
- `birth_city` exists.
- `birth_lat` and `birth_lng` are usable numbers.

Birth time may remain optional if the business rule allows chart generation without exact birth time.

If required values are missing, return an actionable `422` instead of creating a confusing server error.

### 4. Keep Existing Natal Governance Behavior

Do not remove or bypass:

- `natal_status`
- retry limit enforcement
- `locked_for_review`
- `natal_regeneration_audit`
- email notification behavior

This task is about error correctness and API safety, not changing chart lifecycle rules.

## Acceptance Criteria

- [ ] Existing valid family member ID no longer returns `404 Family member not found` because of unrelated DB/schema errors.
- [ ] Real missing member ID still returns `404`.
- [ ] Family member owned by another account returns `403` or `404` without leaking private data.
- [ ] Missing required birth data returns `422` with an actionable message.
- [ ] Missing migration/schema error returns a clear backend error, not `Family member not found`.
- [ ] Successful chart generation still writes `natal_chart`, `chart_updated_at`, and natal governance fields.
- [ ] Regeneration retry behavior remains intact.

## QA Checklist

- [ ] Log in as a community member.
- [ ] Generate chart for a valid owned family member.
- [ ] Confirm response is `200` and chart data is saved.
- [ ] Try a random UUID as `familyMemberId`.
- [ ] Confirm response is `404` or safe non-leaking not-found response.
- [ ] Try a family member with missing `birth_city` or missing lat/lng.
- [ ] Confirm response is `422` with a clear message.
- [ ] Temporarily test/inspect schema-error path if possible by mocking a failed DB select.
- [ ] Confirm API logs include enough detail for developers without exposing private data to users.

## Important Constraints

- Do not apply DB migrations in this task.
- Do not fix family member add/edit birth-location persistence in this task.
- Do not change the frontend UI in this task except if absolutely necessary to display the improved API error.
- Do not weaken RLS or ownership boundaries.
- Do not expose another user’s family member details in error responses.
