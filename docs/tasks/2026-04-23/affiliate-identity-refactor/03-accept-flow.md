# Task 03 — Accept Flow

- Status: Not Started
- Priority: P0 (Critical)
- Depends On: 01, 02
- Blocks: 05

## Goal

Build the public-facing invitation accept flow end-to-end. A prospective affiliate receives an email with `/affiliate/accept/<raw-token>`, clicks it, and — depending on their auth state — signs up, signs in, or confirms. On success: the `affiliate_accounts.user_id` is atomically linked, the `diviner_affiliates` junction flips `pending → active`, the `affiliate_invites` row is consumed. Enforces D5 (explicit invite-click only; no auto-link by email).

## Current State

- No `/affiliate/accept/...` route exists.
- No `POST /api/affiliate/accept` handler exists.
- Task 01 ships `affiliate_accounts` + `affiliate_invites`; Task 02 ships the invite RPC + hashed-token issuance.
- The raw token lives only in the recipient's email; server stores only `token_hash`.
- Existing `/affiliate/*` routes are broken scaffolding — Task 05 rehabs them. For this task we only need to create the `/affiliate/accept/[token]` route under that tree.
- Middleware: [src/proxy.ts](../../../../src/proxy.ts) (NOT `src/middleware.ts`). Session helper is [src/lib/supabase/middleware.ts](../../../../src/lib/supabase/middleware.ts).

## Target Behavior

### Route: `/affiliate/accept/[token]` (Server Component)

Public — no auth guard at the middleware layer (caller may be anonymous). On GET:

1. SHA-256 the raw token from the URL segment.
2. Look up `affiliate_invites` by `token_hash`. Join `diviners` (for display name) and `affiliate_accounts`.
3. Determine view state:
   - Not found → `InviteNotFoundView`.
   - `consumed_at IS NOT NULL` → `InviteAlreadyUsedView` with link to `/affiliate/login`.
   - `revoked_at IS NOT NULL` → `InviteRevokedView`.
   - `expires_at < NOW()` → `InviteExpiredView` with instructions to ask the diviner to resend.
4. If still valid, check `supabase.auth.getUser()`:
   - Anonymous → `AcceptScreen` with tabs **Sign In** / **Create Account**. Email field pre-filled, read-only, from `affiliate_invites.email`. Create tab collects `password`, `name` (default from junction), optional `phone`.
   - Signed in, email matches → `AcceptScreen` confirm-mode. Headline + commission preview + optional message.
   - Signed in, email mismatch → `EmailMismatchView`. Copy: "You're signed in as <currentEmail> but this invitation was sent to <inviteEmail>. Sign out to continue, or ask the diviner to re-invite this account's email." Includes sign-out button. **No "accept anyway" option.**
5. `AcceptScreen` submits to `POST /api/affiliate/accept` with `{ token, password?, name?, phone? }`.

### API: `POST /api/affiliate/accept`

```
Body: { token: string, password?: string, name?: string, phone?: string }
Responses:
  200 { redirect_to: '/affiliate' }
  400 Problem — validation
  403 Problem — logged-in email mismatch
  404 Problem — token not found (hash doesn't match any invite)
  409 Problem — already consumed
  410 Problem — expired or revoked
  429 Problem — rate-limited
  500 Problem
```

Three branches, one endpoint:

**Branch 1 — Sign-up** (anonymous, no `auth.users` row for the invite email, `password` provided)

1. Rate-limit by IP + token_hash.
2. `supabase.auth.admin.createUser({ email, password, email_confirm: true })`. `email_confirm: true` is correct here: the invite token acts as proof-of-email-ownership (user clicked a link delivered to that mailbox).
3. Call `consume_invite_and_activate_junction(invite_id, new_user_id)` RPC.
4. `UPDATE affiliate_accounts SET name = COALESCE(name, $p_name), phone = COALESCE(phone, $p_phone)` for the linked account (if fields provided).
5. Create session cookie.
6. 200 + `{ redirect_to: '/affiliate' }`.

**Branch 2 — Sign-in** (anonymous, email has existing `auth.users`, `password` provided)

1. Rate-limit.
2. `supabase.auth.signInWithPassword({ email, password })` → session on response.
3. Verify signed-in email equals invite email (defense-in-depth).
4. RPC `consume_invite_and_activate_junction(invite_id, user_id)`.
5. 200 + redirect.

**Branch 3 — Already logged in, email matches**

1. Rate-limit.
2. Verify server-side that the session email matches invite email.
3. RPC (idempotent if already linked).
4. 200 + redirect.

### RPC: `consume_invite_and_activate_junction`

Migration: `supabase/migrations/20260423000003_accept_rpc.sql`.

```sql
CREATE OR REPLACE FUNCTION consume_invite_and_activate_junction(
  p_invite_id UUID,
  p_user_id   UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_junction_id UUID;
  v_account_id  UUID;
BEGIN
  -- Lock + claim the invite
  UPDATE affiliate_invites
     SET consumed_at = NOW(), consumed_by = p_user_id
   WHERE id = p_invite_id
     AND consumed_at IS NULL
     AND revoked_at IS NULL
     AND expires_at > NOW()
  RETURNING junction_id, affiliate_account_id INTO v_junction_id, v_account_id;

  IF v_junction_id IS NULL THEN
    RAISE EXCEPTION 'invite_not_claimable' USING ERRCODE = 'P0003';
  END IF;

  -- Allow this transaction to bypass the trigger-guard on user_id mutation
  PERFORM set_config('app.allow_affiliate_account_user_link', 'true', true);

  -- Activate junction
  UPDATE diviner_affiliates
     SET status = 'active', accepted_at = NOW()
   WHERE id = v_junction_id
     AND status = 'pending';

  -- Link user to canonical account (idempotent)
  UPDATE affiliate_accounts
     SET user_id = COALESCE(user_id, p_user_id),
         status  = CASE WHEN status = 'unclaimed' THEN 'active' ELSE status END,
         updated_at = NOW()
   WHERE id = v_account_id;

  -- Hard check — if the account got linked to a DIFFERENT user, bail out loudly
  IF EXISTS (
    SELECT 1 FROM affiliate_accounts
    WHERE id = v_account_id AND user_id IS DISTINCT FROM p_user_id
  ) THEN
    RAISE EXCEPTION 'account_already_linked' USING ERRCODE = 'P0004';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION consume_invite_and_activate_junction FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_invite_and_activate_junction TO service_role;
```

The `UPDATE ... RETURNING` on `affiliate_invites` with `consumed_at IS NULL` acts as a per-row lock — concurrent accepts yield exactly one 200 and one `invite_not_claimable`.

### Trigger guard: `affiliate_accounts.user_id` is only mutated by the accept flow

Same migration:

```sql
CREATE OR REPLACE FUNCTION guard_affiliate_account_user_link()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.user_id IS DISTINCT FROM NEW.user_id
     AND current_setting('app.allow_affiliate_account_user_link', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'affiliate_accounts.user_id may only be changed by the accept flow'
      USING ERRCODE = 'P0005';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_affiliate_account_user_link
  BEFORE UPDATE OF user_id ON affiliate_accounts
  FOR EACH ROW EXECUTE FUNCTION guard_affiliate_account_user_link();
```

This enforces D5 at the data layer: nothing outside the RPC can link a user to an affiliate account. Client sign-up, diviner sign-up, admin scripts — all are blocked.

## Implementation Steps

### 1. Migration

File: `supabase/migrations/20260423000003_accept_rpc.sql` — contains both the RPC and the trigger.

### 2. Page route

Files:

- `src/app/affiliate/accept/[token]/page.tsx` (Server Component — state resolution).
- `src/app/affiliate/accept/[token]/components/AcceptScreen.tsx` (Client Component — form).
- `src/app/affiliate/accept/[token]/components/{InviteNotFoundView,InviteAlreadyUsedView,InviteRevokedView,InviteExpiredView,EmailMismatchView}.tsx`.

### 3. API handler

File: `src/app/api/affiliate/accept/route.ts`. Handles the three branches.

### 4. Session creation

For Branch 1 (sign-up), set the Supabase session cookie on the response. Use the existing server-side Supabase cookie conventions from [src/lib/supabase/server.ts](../../../../src/lib/supabase/server.ts) / [src/lib/supabase/middleware.ts](../../../../src/lib/supabase/middleware.ts).

### 5. CSRF

Repo audit confirmed: **no explicit CSRF pattern exists.** Other state-changing POST routes (e.g., `POST /api/dashboard/affiliate-agreement`) rely solely on Supabase session cookies + browser SameSite defaults. For the accept flow, add one layered defense on top:

- Require `Origin` header to match the request's host for all `POST /api/affiliate/accept` and resend/revoke invite routes. Reject 403 on mismatch or missing Origin when method is POST.
- Continue relying on Supabase cookies for session (already SameSite=Lax by default in Supabase's cookie middleware at [src/lib/supabase/middleware.ts](../../../../src/lib/supabase/middleware.ts)).
- No double-submit token, no CSRF middleware — matches repo convention, keeps the change minimal.
- If the broader codebase adopts a CSRF approach later, replace this Origin check in lockstep.

### 6. Rate limiting

Keys:

- `affiliate_accept:ip:${ip}` — 20 / 10 min
- `affiliate_accept:token:${tokenHash}` — 5 / 10 min (deters brute-forcing a specific invite)

### 7. Observability

Structured logs:

- `accept.success` — `{ invite_id, junction_id, affiliate_account_id, diviner_id, branch: 'signup'|'signin'|'session' }`
- `accept.expired` — `{ invite_id }`
- `accept.consumed_already` — `{ invite_id }`
- `accept.email_mismatch` — `{ invite_id, ip }` (no emails logged)
- `accept.invite_not_found` — `{ ip, token_prefix: firstFourOfHash }`

Add an alert: >10 `accept.invite_not_found` per minute from one IP → potential brute force.

## Verification Plan

### A. Unit

`tests/unit/api/affiliate/accept.test.ts`:

1. Expired token → 410.
2. Revoked token → 410.
3. Consumed token → 409.
4. Email mismatch (signed-in user's email ≠ invite email) → 403.
5. Sign-up branch: new user created, `affiliate_accounts.user_id` set, junction `active`, invite `consumed_at` set.
6. Sign-in branch: same transitions, existing auth user.
7. Session branch: same transitions, already logged in with matching email.
8. Parallel accept (two concurrent requests with same raw token) → exactly one 200, one 409.
9. After accept, attempting `UPDATE affiliate_accounts SET user_id = <another user>` from outside the RPC fails with P0005.

### B. Playwright E2E

`tests/e2e/affiliate-accept-new-user.spec.ts`:

1. Diviner invites `tester+accept@example.com`.
2. Mail stub captures the `acceptUrl`.
3. Fresh browser context opens the URL. Expect Sign-Up tab with email pre-filled, read-only.
4. Submit password + name → redirect to `/affiliate`.
5. `/affiliate` portal (after Task 05) renders this partnership.

`tests/e2e/affiliate-accept-existing-user.spec.ts`:

1. Pre-create auth user `tester+signin@example.com`.
2. Diviner invites that email.
3. Open accept URL anonymously → Sign-In tab.
4. Submit credentials → redirect.
5. `affiliate_accounts.user_id` = the existing auth user id.

`tests/e2e/affiliate-accept-email-mismatch.spec.ts`:

1. Log in as `client1@test.astrologypro.com`.
2. Open an accept URL sent to a different email.
3. Expect `EmailMismatchView`. Assert no "accept anyway" button exists.

### C. Security

- Bogus 43-char token → 404, not 401 (don't leak signature presence).
- 6 bogus token attempts in 5 min from one IP → 429 on the 6th.
- Direct DB: `UPDATE affiliate_accounts SET user_id = <x>` from outside RPC → P0005.
- XSS in `invite.message` from Task 02 → rendered as text in accept screen. Test with `<script>alert(1)</script>`.

### D. Performance

Accept flow p95 < 500ms on staging. Profile the RPC call + session creation. Watch for N+1 joins in the SSR page.

## Edge Cases

1. **User signs up with invite email independently before clicking the invite.** Per D5 their client account stays unlinked. The accept click later triggers Branch 2 (sign-in) and links them.
2. **Diviner revokes the invite while the invitee is on the accept screen.** Submit → RPC returns `invite_not_claimable` → 410. Page re-renders as `InviteRevokedView`.
3. **Invitee clicks the link twice in parallel.** Row lock → exactly one wins.
4. **Invitee forwards the email.** Recipient can only proceed if they own the invite email (sign-up branch requires a password; sign-in requires existing credentials for that email). `email_confirm: true` is acceptable here because the token was delivered to the invite email and clicking it proves control.
5. **Invitee's email is a typo from the diviner.** The real owner of the typo email can claim the invite. Not our problem — it's a unilateral offer. Diviner can revoke if they notice.
6. **Invitee is already linked to a canonical account** (has `affiliate_accounts.user_id`). Branch 2/3 kicks in. RPC is idempotent.
7. **Parallel invites from two diviners to the same fresh email, invitee accepts both.** Each accept links the same `user_id` to the same canonical account (idempotent). Two junctions created; both `active` after respective accepts.
8. **Email domain MX fails after accept.** Doesn't matter — portal is usable without further email.

## Out of Scope

- Magic-link / passwordless sign-in.
- OAuth (Google, Apple).
- 2FA for affiliate accounts.
- A/B testing on the accept landing.

## Rollback Plan

- Revert the page route + API handler (git revert the PR).
- Leave the RPC and trigger in place — inert without the API caller.
- Feature flag `AFFILIATE_IDENTITY_V2 = OFF`: existing pending `diviner_affiliates` rows stay pending; nothing breaks because they were never part of a user-facing flow before this sprint.
