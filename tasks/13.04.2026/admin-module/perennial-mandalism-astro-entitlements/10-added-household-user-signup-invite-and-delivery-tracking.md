# 10 Added Household User Signup Invite and Delivery Tracking

## Goal

Ensure that when an existing Perennial Mandalism user adds another household user, the added person receives an email prompting them to complete signup.

## Product Rule

When a member adds a new household user with an email address:

- the platform must send a signup-completion email to that added person
- the email must direct them into the correct activation or completion flow
- invite state must be tracked so admin and the inviting member can see what happened

## Current Repo Grounding

The repo already has a family invite flow:

- `src/app/api/community/family/[id]/invite/route.ts`
- `src/lib/email.ts` via `sendFamilyMemberInvite`

The current flow already:

- generates a unique token
- stores `invite_email`, `invite_token`, and `invite_sent_at`
- sends an invite email

This is the correct base and should be treated as the canonical mechanism.

## Current Gap

The current wording and task structure emphasize chart access, but the business requirement is broader:

- the added user must be invited to complete signup

That means the architecture should explicitly define:

- when the invite is mandatory
- whether sending is automatic or optional
- what the destination flow is
- how acceptance, expiration, and resend are tracked

## Recommended Rule

For household users with an email:

- sending the invite should be automatic at the point the user is added

Do not make this dependent on the primary user remembering to manually click a second button unless product wants that as an override.

## Invite Outcome States

Track the invite lifecycle clearly:

- `not_sent`
- `sent`
- `delivered` if provider-level delivery tracking exists
- `accepted`
- `expired`
- `resent`
- `failed`

At minimum, the product must visibly track:

- sent
- accepted
- expired
- failed

## Email Purpose

The email should not merely say “someone added you.”

It should clearly tell the recipient:

- they were added to a household or family plan
- they need to complete signup or activate access
- what they will gain access to after completion
- the invite link expiration window

## Destination Flow

The invite CTA should lead to a dedicated completion flow that can:

- validate the invite token
- let the added user set credentials if needed
- attach the accepted account to the intended household record
- mark invite acceptance time

## Admin and Member Visibility

The inviting member should be able to see:

- whether the invite was sent
- whether it was accepted
- whether it expired
- whether resend is available

Admin should be able to see the same states plus:

- resend history
- delivery failures
- acceptance lag

## Architectural Recommendation

Keep this aligned with the existing `community_family_members` invite fields rather than creating a second invitation system for household users.

If the product later wants a richer invite domain, it should be layered on top of the same canonical household invite state.

## Deliverables

- automatic invite-on-add rule
- signup-completion invite lifecycle
- member and admin visibility requirements
- resend, expiration, and failure-handling policy

---

## Implementation — 2026-04-13

### Migration
`supabase/migrations/20260413000187_invite_status_tracking.sql`

**Columns added to `community_family_members`:**
- `invite_status` TEXT — `not_sent | sent | accepted | expired | failed | resent`
- `invite_resend_count` INTEGER DEFAULT 0 — total invites sent (initial + resends)
- `invite_expires_at` TIMESTAMPTZ — 7 days from `invite_sent_at`
- `invite_failure_reason` TEXT — for admin debugging

Backfill: rows with `invite_accepted_at` → `'accepted'`; rows with `invite_sent_at` only → `'sent'`.

### Auto-invite on family add
`src/app/api/community/family/route.ts` — POST handler updated:
- Accepts optional `inviteEmail` in the request body
- If `inviteEmail` is provided: automatically sends invite at the point of family member creation
- No second manual "send invite" button required
- Invite token, `invite_sent_at`, `invite_expires_at`, and `invite_status = 'sent'` are persisted before email is sent
- If email fails: status set to `'failed'` with `invite_failure_reason` — token is saved so resend works

### Updated invite route
`src/app/api/community/family/[id]/invite/route.ts` — updated:
- Detects resend by checking existing `invite_status`
- Sets `invite_status = 'resent'` and increments `invite_resend_count` on resend
- Sets `invite_expires_at` to 7 days from now on every send/resend
- Sets `invite_status = 'failed'` with `invite_failure_reason` on email error (token still valid for retry)
- Returns `{ success, invite_status, expires_at }` in response

### Acceptance flow (existing)
`/join/family-invite?token=<token>` validates the token and sets `invite_accepted_at` and `user_id` on the family member row — the `invite_status` should be updated to `'accepted'` in that route (frontend ticket to implement).
