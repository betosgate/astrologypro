# Task 03 - Verify Onboarding Complete Persistence

- Status: Planned
- Priority: P0
- Area: Perennial Mandalism / API / Persistence
- Primary File: `src/app/api/community/onboarding/complete/route.ts`

---

## Goal

Verify the onboarding completion API reliably persists the state required by the dashboard guard.

This task should avoid broad refactors. Only fix issues found during verification.

## Contract To Verify

The endpoint must:

1. Require an authenticated user
2. Find the user's `community_members` row for `membership_type = perennial_mandalism`
3. Require `membership_status = active`
4. Validate required profile fields
5. Update profile fields
6. Set:

   ```ts
   onboarding_completed: true
   ```

7. Return success only after the update succeeds

## Checks

- Confirm the update is scoped to the correct member row.
- Confirm update errors are returned to the client.
- Confirm `onboarding_completed` is in the same update payload as the profile fields.
- Confirm no later code path resets `onboarding_completed` to false.
- Confirm family-member sync errors return a non-OK response.

## Optional Diagnostic Improvement

If needed, return a slightly richer success payload:

```json
{
  "success": true,
  "redirect": "/community"
}
```

Only do this if useful for clarity. Do not make the client trust this instead of the DB guard.

## Acceptance Criteria

- [ ] `onboarding_completed = true` is persisted only after validation passes
- [ ] API failures are visible to the frontend
- [ ] No silent failure can look like a successful onboarding completion
- [ ] Dashboard access still depends on the DB value, not the client response alone

