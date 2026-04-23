# Task 02 — Invite Flow Refactor

- Status: Not Started
- Priority: P0 (Critical)
- Depends On: 01
- Blocks: 03, 04

## Goal

Rewrite the diviner-facing invite endpoint against the new canonical `affiliate_accounts` + junction + `affiliate_invites` model. Delete the legacy direct-add endpoint `POST /api/dashboard/affiliates` per D4. Issue a signed, single-use, time-bound accept token and send it in the invitation email. Stop using the tracking-link slug as a claim URL.

## Current State

- `POST /api/dashboard/affiliates` — direct-add, creates a `diviner_affiliates` row with `status='active'` immediately ([src/app/api/dashboard/affiliates/route.ts:70-165](../../../../src/app/api/dashboard/affiliates/route.ts#L70-L165)). **Delete.**
- `POST /api/dashboard/affiliates/invite` — creates a pending `diviner_affiliates` row, reuses the `affiliate_referral_links` slug as accept URL ([src/app/api/dashboard/affiliates/invite/route.ts](../../../../src/app/api/dashboard/affiliates/invite/route.ts)). **Rewrite.** The slug is an attribution code — it should never have been an auth token.
- `sendAffiliateInvitation` — existing email helper in [src/lib/email.ts:3142](../../../../src/lib/email.ts#L3142). Reuse, update template.
- Diviner UI `src/app/dashboard/affiliates/page.tsx` has an Add Affiliate sheet + Invite dialog. Task 04 removes the Add sheet; this task only touches the APIs.
- Existing commission-cap guard `assertAffiliateShareWithinCap()` from [supabase/migrations/20260413000198_affiliate_share_cap.sql](../../../../supabase/migrations/20260413000198_affiliate_share_cap.sql) — keep using it.

## Target Behavior

### Deleted

- `POST /api/dashboard/affiliates` — removed. `GET` list endpoint stays.
- Any caller of the deleted POST must be updated first. Task 06 greps the repo. Known caller: the Add sheet in the diviner UI (removed in Task 04).

### Rewritten: `POST /api/dashboard/affiliates/invite`

**Contract**

```
POST /api/dashboard/affiliates/invite
Auth: diviner session
Body: {
  email: string,
  name: string,
  message?: string,
  default_commission_type?: 'percentage' | 'fixed',
  default_commission_value?: number
}
Responses:
  201 { data: { invite_id, junction_id, affiliate_account_id, accept_url_masked, expires_at, email_delivery: 'sent' | 'failed' } }
  400/422 Problem — validation
  403 Problem — caller is not a diviner, OR canonical account is blocked
  409 Problem — existing active/pending/suspended/blocked junction for this diviner+account pair
  429 Problem — rate limit
  500 Problem
```

**Happy path** (all writes through the admin client)

1. Auth: resolve `user` from session; resolve `diviner` via `diviners.user_id = user.id`. 403 if not a diviner.
2. **Agreement gate (server-side).** Read `diviners.affiliate_agreement_signed` from the loaded diviner record (existing column, already maintained by `POST /api/dashboard/affiliate-agreement`). If `false`, return 403 with `type: https://httpstatuses.io/403, title: "Affiliate agreement not signed", detail: "Sign the affiliate partnership agreement before inviting affiliates."`. This duplicates the Task 04 UI gate at the API layer — a crafted POST cannot bypass it. Same check applies to the `/resend` endpoint.
3. Validate body. Strict email regex. `name` trimmed non-empty. `default_commission_*` passes `assertAffiliateShareWithinCap()`.
4. Reject diviner inviting their own email (422).
5. Normalize email (trim + lowercase — though `CITEXT` also handles this server-side).
6. Rate-limit: `aff_invite_create:${divinerId}` — 5 / 10 min. On hit → 429 with `Retry-After`.
7. Call the atomic RPC `create_affiliate_invite(...)` (defined below) which:
   - Upserts canonical `affiliate_accounts` (`status='unclaimed'` on insert).
   - Rejects if `affiliate_accounts.status='blocked'` (P0001 → 403).
   - Rejects if an existing junction for this (diviner, account) pair has `status IN ('active','pending','suspended','blocked')` (P0002 → 409).
   - Creates the junction (`status='pending'`, `invited_at=NOW()`, stores `created_by`, commission config, and legacy columns for back-compat).
   - Inserts `affiliate_invites` with `token_hash` and `expires_at=NOW()+14d`.
8. `await sendAffiliateInvitation(...)` AFTER the RPC commits. Passes the **raw** token in the URL.
9. If email send throws → log `invite.email_send_failed` with `invite_id`, return 201 with `email_delivery: 'failed'`. Do NOT roll back the invite; the diviner can resend from the UI (Task 04).
10. Return 201 with a **masked** accept URL (`/affiliate/accept/<TOKEN_REDACTED>`). Never return the raw token.

### New: `POST /api/dashboard/affiliates/invite/[inviteId]/resend`

- Generate a new raw token, new SHA-256 hash.
- Atomically mark prior open invites for the same `junction_id` as revoked (`revoked_at=NOW()`).
- Insert a new `affiliate_invites` row with fresh `expires_at`. Bump `resent_count`.
- Send email. Same error handling as above.
- Rate limit: `aff_invite_resend:${junctionId}` — 3 / 24 hours.
- Caller must be the same diviner that issued the original invite (object-level auth).
- Same agreement-signed gate as create (403 if `affiliate_agreement_signed = false`).

### New: `POST /api/dashboard/affiliates/invite/junction/[junctionId]/resend` (legacy-pending variant)

A grandfathered `diviner_affiliates` row with `status='pending'` may have no prior `affiliate_invites` row (see Task 01 § Backfill step 6). The regular resend endpoint requires an existing `invite_id`, so this sibling endpoint issues a fresh token for a legacy junction:

- Caller is the owning diviner.
- Junction status must be `pending`.
- Insert a new `affiliate_invites` row (no prior row to revoke).
- Send email. Return 201 with same shape as create.
- Same rate-limit key as resend.

### New: `POST /api/dashboard/affiliates/invite/[inviteId]/revoke`

- `UPDATE affiliate_invites SET revoked_at = NOW() WHERE id = :id AND diviner_id = :callerDivinerId AND consumed_at IS NULL AND revoked_at IS NULL`.
- **Decision:** if the junction is `status='pending'` and has no downstream commission rows, delete the junction; otherwise set `status='suspended'`. Keeps the list clean after mis-invites while preserving commission history.
- 409 if the invite was already consumed (junction already accepted — diviner should suspend instead).

## Implementation Steps

### 1. Delete direct-add

- Remove the `POST` handler from [src/app/api/dashboard/affiliates/route.ts](../../../../src/app/api/dashboard/affiliates/route.ts). Keep `GET`.
- Task 06 greps for `fetch\(["'\`][^"'\`]*api/dashboard/affiliates["'\`]` with `method: "POST"` across `src/`, `tests/`, `scripts/`. All callers must be migrated before deletion.

### 2. Create the RPC

Migration: `supabase/migrations/20260423000002_affiliate_invite_rpc.sql`.

```sql
CREATE OR REPLACE FUNCTION create_affiliate_invite(
  p_diviner_id        UUID,
  p_email             CITEXT,
  p_name              TEXT,
  p_phone             TEXT,
  p_message           TEXT,
  p_commission_type   TEXT,
  p_commission_value  NUMERIC,
  p_token_hash        TEXT,
  p_expires_at        TIMESTAMPTZ,
  p_created_by        UUID
) RETURNS TABLE (invite_id UUID, junction_id UUID, affiliate_account_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_junction_id UUID;
  v_invite_id UUID;
BEGIN
  -- Upsert canonical affiliate account
  INSERT INTO affiliate_accounts (email, name, phone, status)
  VALUES (p_email, p_name, p_phone, 'unclaimed')
  ON CONFLICT (email) DO UPDATE
    SET name = COALESCE(affiliate_accounts.name, EXCLUDED.name)
  RETURNING id INTO v_account_id;

  -- Reject if blocked platform-wide
  IF EXISTS (SELECT 1 FROM affiliate_accounts WHERE id = v_account_id AND status = 'blocked') THEN
    RAISE EXCEPTION 'account_blocked' USING ERRCODE = 'P0001';
  END IF;

  -- Reject if existing junction
  IF EXISTS (
    SELECT 1 FROM diviner_affiliates
    WHERE diviner_id = p_diviner_id
      AND affiliate_account_id = v_account_id
      AND status IN ('active','pending','suspended','blocked')
  ) THEN
    RAISE EXCEPTION 'junction_exists' USING ERRCODE = 'P0002';
  END IF;

  -- Create junction — populate legacy columns too, for back-compat with unmigrated readers
  INSERT INTO diviner_affiliates (
    diviner_id, affiliate_account_id, status,
    default_commission_type, default_commission_value,
    notes, created_by, invited_at,
    name, email, phone
  )
  VALUES (
    p_diviner_id, v_account_id, 'pending',
    COALESCE(p_commission_type, 'percentage'),
    COALESCE(p_commission_value, 0),
    CASE WHEN p_message IS NULL OR p_message = '' THEN 'Invited via dashboard' ELSE 'Invitation: ' || p_message END,
    p_created_by, NOW(),
    p_name, p_email, p_phone
  )
  RETURNING id INTO v_junction_id;

  -- Create invite
  INSERT INTO affiliate_invites (
    diviner_id, affiliate_account_id, junction_id, email,
    token_hash, message, invited_by, expires_at
  ) VALUES (
    p_diviner_id, v_account_id, v_junction_id, p_email,
    p_token_hash, p_message, p_created_by, p_expires_at
  )
  RETURNING id INTO v_invite_id;

  RETURN QUERY SELECT v_invite_id, v_junction_id, v_account_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_affiliate_invite FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_affiliate_invite TO service_role;
```

### 3. Rewrite the route

File: [src/app/api/dashboard/affiliates/invite/route.ts](../../../../src/app/api/dashboard/affiliates/invite/route.ts). Full rewrite.

Key:

- `crypto.randomBytes(32).toString('base64url')` → raw token (43 chars).
- `crypto.createHash('sha256').update(raw).digest('hex')` → stored hash.
- `admin.rpc('create_affiliate_invite', { ... })` for the atomic write.
- Map PG exception codes: `P0001` → 403; `P0002` → 409.
- RFC 9457 Problem+JSON error shape.
- Log `invite.created` / `invite.email_send_failed` with `invite_id`, `junction_id`, `affiliate_account_id`, `diviner_id`. Never log raw token or email body.
- Return `{ data: { invite_id, junction_id, affiliate_account_id, accept_url_masked, expires_at, email_delivery } }`.

### 4. Update email template

File: [src/lib/email.ts](../../../../src/lib/email.ts). Update `sendAffiliateInvitation`:

- Subject: `{{divinerName}} invited you to be an affiliate partner on AstrologyPro`
- Body:
  - Greeting (HTML-escaped `{{divinerName}}`)
  - Optional `{{message}}` block (HTML-escaped)
  - CTA button → `{{acceptUrl}}` (the raw-token URL)
  - Plain-text fallback with the URL
  - Expiry notice: "This invitation expires on {{expires_at_human}}. If you didn't expect this email, you can ignore it."

Unit test the template with an XSS payload in `message` — assert it renders as text, not HTML.

### 5. Add resend + revoke endpoints

Paths:
- `src/app/api/dashboard/affiliates/invite/[inviteId]/resend/route.ts`
- `src/app/api/dashboard/affiliates/invite/[inviteId]/revoke/route.ts`

Both:
- Enforce object-level authorization (caller diviner must own the invite).
- Use a small RPC `resend_affiliate_invite(p_invite_id, p_new_token_hash, p_new_expires_at)` for atomic revoke-prior + insert-new.
- Rate-limit per key noted above.

### 6. Rate limiter

File: `src/lib/rate-limit.ts` (create if missing; check first in Task 06 audit).

Signature:

```ts
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; retryAfterSeconds: number }>;
```

Implementation: if a Redis or Upstash client is present elsewhere in the repo, reuse. Otherwise add a small PG-backed table:

```sql
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start TIMESTAMPTZ NOT NULL
);
```

Apply the sliding-window logic in the helper.

### 7. Logging (structured JSON)

Events:
- `invite.created` — `{ invite_id, junction_id, affiliate_account_id, diviner_id }`
- `invite.email_send_failed` — `{ invite_id, error_code }` (no body)
- `invite.resent` — `{ invite_id, resent_count }`
- `invite.revoked` — `{ invite_id, reason }`

## Verification Plan

### A. Unit

`tests/unit/api/dashboard/affiliates/invite.test.ts`:

- New canonical account created on first invite to a fresh email.
- Reuses existing canonical account on second invite from a different diviner to the same email.
- 409 when same diviner re-invites same account (pending OR active OR suspended).
- 422 when commission exceeds cap.
- 422 when diviner invites their own email.
- 429 after 5 rapid invites from one diviner.
- `token_hash` stored in DB matches expected SHA-256 format (64 hex chars).
- Raw token not in API response.
- XSS payload in `message` renders as text in the email template.

### B. Integration

Supabase local. POST an invite, assert:

- One new `affiliate_accounts` row (`status='unclaimed'`).
- One new `diviner_affiliates` row (`status='pending'`, `affiliate_account_id` set, legacy `name/email/phone` populated).
- One new `affiliate_invites` row (`token_hash` set, `expires_at≈NOW()+14d`, `consumed_at` NULL, `revoked_at` NULL).
- Email sender called once with an `acceptUrl` matching `/affiliate/accept/[43-char base64url token]`.

### C. E2E (Playwright, on staging)

1. Log in as `diviner1@test.astrologypro.com`.
2. Navigate to `/dashboard/affiliates`.
3. Click **Invite Affiliate**, fill `new.affiliate@test.astrologypro.com`, name "New Aff", optional commission `10%`.
4. Submit → toast "Invitation sent to new.affiliate@... They have 14 days to accept."
5. DB: `affiliate_accounts`, `diviner_affiliates` (pending), `affiliate_invites` all have expected rows.
6. Mail stub captured an email containing `/affiliate/accept/...`.

### D. Security

- Cross-diviner revoke: Diviner B tries to revoke Diviner A's invite → 403.
- Expired token: force `UPDATE affiliate_invites SET expires_at = NOW() - INTERVAL '1 day'`; accept flow (Task 03) returns 410 — verify no invite state is changed.
- Brute force: 1000 random `/affiliate/accept/...` hits from one IP → 404 throughout; rate limiter kicks in.
- SQL injection attempt in `message` field → parameterized query; no behavior change.

### E. Problem+JSON shape

`curl -s -X POST /api/dashboard/affiliates/invite -d '{}' | jq` → returns:

```json
{
  "type": "https://httpstatuses.io/422",
  "title": "Validation error",
  "detail": "name and email are required.",
  "status": 422
}
```

No stack traces, no internal field names.

## Edge Cases

1. **Diviner invites their own email.** 422. Enforced in the route before the RPC.
2. **Invitee is already a diviner or social_advocate.** Allowed — one auth user can be multiple identity types. The canonical account is separate from `diviners` and `social_advocates`.
3. **Invitee is already an `affiliate_account` for 3 other diviners.** Expected — RPC reuses the canonical row, adds junction #4.
4. **Invitee signed up for a client account after the invite but before accepting.** Per D5 they remain unlinked until the accept click. Accept flow (Task 03) handles the sign-in branch.
5. **SMTP rejects the address.** `email_delivery: 'failed'` in response; invite row remains; diviner can resend.
6. **Revoke a pending invite whose junction has an approved commission.** Block revoke with 409 — paid commissions cannot be orphaned. Diviner must suspend instead.
7. **Second concurrent invite to the same account.** 409. Rate-limit also bounds it.
8. **Race: two diviners invite the same fresh email simultaneously.** `affiliate_accounts.email UNIQUE` admits one insert; the other `ON CONFLICT` path reuses. Both junctions succeed.
9. **Token in email forwarded by invitee.** Recipient can only accept with matching email (Task 03 enforces logged-in email = invite email); forwarding buys nothing.

## Out of Scope

- SSE / websocket for real-time invite status on the diviner UI.
- Bulk CSV invite import.
- Commission change at resend time (keep original commission frozen; edit via junction after accept).
- Self-service invite link generation for the affiliate (only the diviner issues invites).

## Rollback Plan

- Revert the route file to the pre-refactor version (`git revert` the Task 02 PR).
- Keep the RPC and `affiliate_invites` table — harmless when unused.
- Feature flag `AFFILIATE_IDENTITY_V2 = OFF`: the old code path still works because Task 01's ALTER was additive and legacy columns are populated by the RPC alongside the canonical ones.
