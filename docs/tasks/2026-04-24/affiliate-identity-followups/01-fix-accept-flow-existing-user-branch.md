# Task 01 - Fix Accept Flow Existing-User Branch - 2026-04-24

- Status: Not Started
- Priority: P0
- Depends On: existing 2026-04-23 accept flow implementation
- Blocks: Task 04

## Problem

`POST /api/affiliate/accept` currently decides between sign-in and sign-up by checking `affiliate_accounts.user_id`, not by correctly determining whether an `auth.users` account already exists for the invite email.

That breaks this documented case from the 2026-04-23 sprint:

- invite sent to `someone@example.com`
- recipient independently signs up as a client before accepting
- canonical `affiliate_accounts.user_id` is still `NULL`
- accept flow should go through the sign-in branch

Instead, the current implementation falls into the sign-up branch and attempts `admin.auth.admin.createUser(...)`, which fails on duplicate email.

## Required Outcome

Make the accept flow behave as documented in `03-accept-flow.md`:

1. Anonymous + no existing auth user for invite email -> sign-up branch
2. Anonymous + existing auth user for invite email -> sign-in branch
3. Logged-in + matching session email -> session branch

## Implementation Notes

- Keep `consume_invite_and_activate_junction(...)` as the single path that links `affiliate_accounts.user_id`.
- Do not silently link by email without an invite claim.
- Use an auth-user existence check that is actually authoritative for Supabase Auth, not a proxy through `affiliate_accounts.user_id`.
- Preserve the current email-mismatch defense.

## Verification

- Existing auth user with matching invite email can sign in and claim successfully.
- Fresh email still uses sign-up.
- Logged-in matching user still claims successfully.
- Logged-in mismatched user still gets 403.
- Re-consume, expired, and revoked cases keep their current behavior.

## Suggested Files

- `src/app/api/affiliate/accept/route.ts`
- tests added in the follow-up Task 04
