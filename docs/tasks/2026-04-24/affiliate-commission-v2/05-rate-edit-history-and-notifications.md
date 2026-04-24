# Task 05 — Rate-Edit Flow + History + Notifications

- Status: Done (2026-04-24) — admin override assignment/campaign notifications deferred to Task 07 handlers
- Priority: P0
- Depends on: 01 (additive)
- Blocks: —
- Spec: v1.2 (§3.3, §5 Flow G, §7)

## Goal

When a diviner edits an affiliate's commission rate:
1. The update persists on `diviner_service_affiliates`.
2. A history row is written capturing old + new.
3. The affiliate is notified in-app AND by email.

The new rate applies to **bookings created after this edit**. Bookings
already in-flight keep their stamped rate (spec §5 Flow G step 4).
Notification copy must reflect this — tell the affiliate the new rate
takes effect on future bookings, not current ones.

Also wire the remaining notification kinds from spec §7 (all seven kinds
total).

## Part A — `PATCH /api/dashboard/affiliate-assignments/[id]`

File: `src/app/api/dashboard/affiliate-assignments/[id]/route.ts` (PATCH
already exists at line 218; extend, don't rewrite).

### Changes

1. Before the UPDATE, read the current assignment row. Capture
   `commission_type` and `commission_value` as `oldType` / `oldValue`.
2. Perform the UPDATE (existing behavior).
3. If `newType !== oldType || Number(newValue) !== Number(oldValue)`:
   - INSERT `diviner_service_affiliate_rate_history` with old/new pair,
     `changed_by = auth.uid()`, `reason` from body if provided.
   - Resolve the affiliate's user_id via
     `diviner_affiliates → affiliate_accounts → user_id`.
   - Fire `notify({ userId, kind: 'affiliate.rate_changed', ... })`
     (see Part C).
4. On revoke (`is_active` flipped false): fire
   `notify({ userId, kind: 'affiliate.revoked', ... })`. Don't write a
   rate history row for revocation — the history table is strictly for
   rate edits.
5. On initial assignment (POST route, task 03 scope): fire
   `notify({ userId, kind: 'affiliate.assigned', ... })`. Update the POST
   handler in `src/app/api/dashboard/affiliate-assignments/route.ts`.

## Part B — Reversal endpoint + notification

File: `src/app/api/admin/conversions/[id]/reverse/route.ts` (new)

- Admin-only (gate via `getAdminUser`).
- Body: `{ reason: string }` — required, ≤ 500 chars.
- Load `campaign_conversions` row; if `reversed_at` already set → 409.
- UPDATE row: `reversed_at = NOW()`, `reversed_by = auth.uid()`,
  `reversed_reason = body.reason`.
- Fire `notify({ userId: affiliate_user_id, kind: 'affiliate.reversal', ... })`.

Also hook the Stripe refund / dispute webhooks to call the same internal
reversal function (no HTTP round trip). Reason = `'stripe.refund'` or
`'stripe.dispute'`; `reversed_by = NULL` (system action).

## Part C — Notification helper

File: `src/lib/affiliate-notifications.ts` (new)

Wraps the generic `createNotification` helper + email sender:

```ts
export type AffiliateNotificationKind =
  | 'affiliate.assigned'
  | 'affiliate.rate_changed'
  | 'affiliate.revoked'
  | 'affiliate.conversion'
  | 'affiliate.reversal';

export interface NotifyParams {
  kind: AffiliateNotificationKind;
  userId: string;
  title: string;
  body: string;
  actionUrl?: string;
  emailSubject?: string;
  emailHtml?: string;
  digestableEmail?: boolean; // defaults per kind
}

export async function notifyAffiliate(params: NotifyParams): Promise<void>;
```

Behavior:
- Always calls `createNotification` (in-app), subject to per-user
  `notification_preferences.in_app_enabled` for this kind.
- Checks per-kind email preference. If enabled, queues an email.
- `affiliate.conversion` defaults `digestableEmail = true` — buffered to a
  daily digest cron (see Part D).
- All other kinds are immediate email.

The 7 kinds (5 affiliate + 2 admin-override) map to explicit copy +
`actionUrl` shown in spec §7. Build the templates in this file (or a
sibling `src/lib/affiliate-notification-templates.ts`). Note: admin
override notifications are triggered from task 07 handlers, not here.

**Copy note for `affiliate.rate_changed`:** spec requires the message to
clarify that the new rate applies to **future bookings**, not current
in-flight ones. Example:
"Your commission on <product> changed from X to Y. This new rate
applies to new bookings from now on; bookings already in checkout keep
the earlier rate."

## Part D — Daily conversion-email digest

File: `src/app/api/cron/affiliate-conversion-digest/route.ts` (new)

- Cron endpoint protected by `cron-auth` pattern (see `src/lib/cron-auth.ts`).
- Runs daily at 00:00 UTC (configure in Vercel cron / scheduler).
- For each affiliate with unread `affiliate.conversion` notifications in
  last 24h, send one summary email ("You earned $X from Y conversions
  yesterday") and mark those as digested.
- In-app notifications stay individual for the inbox view.

## Part E — `affiliate.conversion` notification hook

In `creditAffiliateConversion` (task 04), after a successful
conversion INSERT, resolve the affiliate user_id and call
`notifyAffiliate({ kind: 'affiliate.conversion', ... })`.

## Acceptance

- Rate edit on an assignment writes a history row AND creates a
  notification visible in the affiliate's inbox.
- Affiliate receives an immediate email on rate change (verify via SES
  dev catcher or the project's equivalent).
- Revoke action fires `affiliate.revoked`; no history row written.
- Initial assignment fires `affiliate.assigned`.
- Admin reversal fires `affiliate.reversal`.
- Conversion notification lands in-app immediately; email digest sends
  next midnight UTC batch.
- Non-rate updates (e.g. editing notes only) do NOT write history or
  notify.

## Suggested files

- `src/app/api/dashboard/affiliate-assignments/[id]/route.ts` (extend)
- `src/app/api/dashboard/affiliate-assignments/route.ts` (extend POST)
- `src/app/api/admin/conversions/[id]/reverse/route.ts` (new)
- `src/lib/affiliate-notifications.ts` (new)
- `src/lib/affiliate-notification-templates.ts` (new, optional)
- `src/app/api/cron/affiliate-conversion-digest/route.ts` (new)
- `src/lib/affiliate-attribution.ts` (add notify call on success)
- Spec: §7 update any copy / trigger detail changes; Changelog line
