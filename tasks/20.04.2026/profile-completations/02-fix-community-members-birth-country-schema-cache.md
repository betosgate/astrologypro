# Backend Task - Fix Community Members birth_country Schema Cache

- Status: Planned
- Priority: P0
- Area: Backend / Infrastructure
- Endpoint: `POST /api/community/onboarding/complete`
- Page Route: `/community/profile`

---

## Problem

The `POST /api/community/onboarding/complete` endpoint is failing with a 500 Internal Server Error:

```json
{
  "error": "Could not find the 'birth_country' column of 'community_members' in the schema cache"
}
```

This prevents community members from completing their onboarding and saving their birth data. The backend explicitly attempts to update the `birth_country` column (added in migration `20260413000198`), but the PostgREST schema cache is likely stale or the migration was not applied to the environment.

## File

```txt
src/app/api/community/onboarding/complete/route.ts
```

## Required Backend Fix

The issue is primarily infrastructure-based, but requires verification within the backend context.

1.  Verify if the `birth_country` column exists in the `community_members` table in the active database.
2.  If missing, apply migration `supabase/migrations/20260413000198_add_birth_country_to_community_members.sql`.
3.  If the column exists, reload the Supabase/PostgREST schema cache to recognize the new column (`NOTIFY pgrst, 'reload schema';`).

## Constraints

- Do not remove `birth_country` from the backend `updatePayload` as a workaround.
- Do not bypass required validation for other profile fields.
- Ensure the API handles cases where the field is missing from the payload (currently defaults to `null`).

## Acceptance Criteria

- [ ] `community_members` table contains the `birth_country` column.
- [ ] PostgREST schema cache correctly recognizes the column.
- [ ] `POST /api/community/onboarding/complete` returns `200 OK` on valid submission.
- [ ] Profile data (including birth city/country) is correctly saved to the database.

## QA Checklist

- [ ] Log in as a community member and go to `/community/profile`.
- [ ] Fill in required fields (Name, Phone, DOB, Birth Time, Birth City).
- [ ] Click "Save Changes".
- [ ] Confirm no 500 error occurs in the Network tab.
- [ ] Verify the `success: true` response from `/api/community/onboarding/complete`.
- [ ] Run a manual SQL query `SELECT birth_city, birth_country FROM community_members WHERE email = '...'` to verify persistence.
