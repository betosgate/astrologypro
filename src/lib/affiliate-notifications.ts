// src/lib/affiliate-notifications.ts
//
// One entry point (`notifyAffiliate`) that fans a single event to both
// delivery channels defined by spec §7: in-app inbox (notifications
// table) and email (AWS SES). Each channel is gated on the user's
// `affiliate_accounts.notification_prefs` for that kind.
//
// For `affiliate.conversion`, the email is not sent immediately — it is
// deferred to the daily digest cron at
// `src/app/api/cron/affiliate-conversion-digest/route.ts`. In-app
// notifications still fire immediately. This matches spec §7.
//
// Sprint: docs/tasks/2026-04-24/affiliate-commission-v2/05-rate-edit-history-and-notifications.md

import type { SupabaseClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { buildEmailHtml } from "@/lib/email-base";

export type AffiliateNotificationKind =
  | "affiliate.assigned"
  | "affiliate.rate_changed"
  | "affiliate.revoked"
  | "affiliate.conversion"
  | "affiliate.reversal"
  | "admin.override.assignment_revoked"
  | "admin.override.campaign_archived"
  // Phase 2 (2026-05-05 affiliate-payouts-phase-2 / Task 09)
  | "affiliate.payout_completed"
  | "affiliate.payout_failed"
  | "affiliate.offset_applied"
  | "affiliate.stripe_disconnected"
  | "affiliate.stripe_verification_needed";

export interface NotifyAffiliateInput {
  admin: SupabaseClient;
  /** auth.users.id of the recipient. */
  userId: string;
  /** affiliate_accounts.id — used to read notification_prefs. Optional; if
   * omitted, preferences are assumed to be defaults (both channels on). */
  affiliateAccountId?: string;
  kind: AffiliateNotificationKind;
  /** Short inbox title (≤ 120 chars). */
  title: string;
  /** Longer inbox body (≤ 500 chars recommended). */
  body: string;
  /** Optional relative URL the inbox item links to. */
  actionUrl?: string;
  /** Recipient email for the message. Required for email delivery. */
  toEmail: string;
  /** Email subject (overrides default built from title). */
  emailSubject?: string;
  /** Fully-rendered email HTML body (overrides default built from body). */
  emailHtml?: string;
  /** Metadata stored alongside the notification (currently unused by the
   * schema — reserved for when a `metadata JSONB` column lands). */
  metadata?: Record<string, unknown>;
}

const DIGESTABLE_KINDS: ReadonlySet<AffiliateNotificationKind> = new Set([
  "affiliate.conversion",
]);

type PrefsShape = {
  [kind in AffiliateNotificationKind]?: {
    email?: boolean;
    in_app?: boolean;
  };
};

/**
 * Read the per-kind per-channel toggle for an affiliate. Defaults to
 * `{ email: true, in_app: true }` for any kind not explicitly set.
 */
export function resolveAffiliatePrefs(
  prefs: Record<string, unknown> | null | undefined,
  kind: AffiliateNotificationKind,
): { email: boolean; in_app: boolean } {
  const safe = (prefs ?? {}) as PrefsShape;
  const entry = safe[kind] ?? {};
  return {
    email: entry.email ?? true,
    in_app: entry.in_app ?? true,
  };
}

/**
 * Primary entry point. Never throws — notification failures are logged
 * and swallowed so they don't break the state-change operations that
 * triggered them.
 */
export async function notifyAffiliate(input: NotifyAffiliateInput): Promise<void> {
  let prefs: Record<string, unknown> = {};
  if (input.affiliateAccountId) {
    const { data: account } = await input.admin
      .from("affiliate_accounts")
      .select("notification_prefs")
      .eq("id", input.affiliateAccountId)
      .maybeSingle();
    prefs = (account?.notification_prefs as Record<string, unknown>) ?? {};
  }
  const channels = resolveAffiliatePrefs(prefs, input.kind);

  // In-app: always immediate (when enabled).
  if (channels.in_app) {
    try {
      await createNotification({
        userId: input.userId,
        title: input.title,
        body: input.body,
        // The existing `type` CHECK doesn't yet include an 'affiliate'
        // value — use 'billing' as the closest category until a broader
        // notifications overhaul lands.
        type: "billing",
        actionUrl: input.actionUrl,
      });
    } catch (err) {
      console.error("[notifyAffiliate] in-app insert failed", {
        kind: input.kind,
        userId: input.userId,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Email: immediate unless this kind is digestable (conversion).
  if (channels.email && !DIGESTABLE_KINDS.has(input.kind)) {
    try {
      await sendEmail({
        to: input.toEmail,
        subject: input.emailSubject ?? input.title,
        html:
          input.emailHtml ??
          buildEmailHtml({
            title: input.title,
            preheader: input.body.slice(0, 160),
            content: `<p>${escapeHtml(input.body)}</p>`,
            ctaText: input.actionUrl ? "Open affiliate portal" : undefined,
            ctaUrl: input.actionUrl
              ? absoluteUrl(input.actionUrl)
              : undefined,
          }),
      });
    } catch (err) {
      console.error("[notifyAffiliate] email send failed", {
        kind: input.kind,
        toEmail: input.toEmail,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://astrologypro.com";
  return `${appUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

// ───────────────────────────────────────────────────────────────────────
// Copy generators — one per kind. Wrap `notifyAffiliate` with the right
// title/body. Callers pass the kind-specific details; these helpers keep
// the wording consistent.
// ───────────────────────────────────────────────────────────────────────

export function formatRate(
  type: "percent" | "flat" | null | undefined,
  value: number | null | undefined,
): string {
  if (type == null || value == null) return "a custom rate";
  const n = Number(value);
  if (type === "flat") {
    return `$${n.toFixed(2)} per conversion`;
  }
  return `${n}%`;
}

// ───────────────────────────────────────────────────────────────────────
// Phase 2 / Task 09 — affiliate-payout notification helpers.
// All take (admin, affiliateAccountId, ...kind-specific) and resolve the
// recipient (auth.users.id, email) internally so call sites stay terse.
// ───────────────────────────────────────────────────────────────────────

async function resolveAffiliateRecipient(
  admin: SupabaseClient,
  affiliateAccountId: string,
): Promise<{ userId: string; email: string } | null> {
  const { data: row } = await admin
    .from("affiliate_accounts")
    .select("user_id, email")
    .eq("id", affiliateAccountId)
    .maybeSingle();
  const r = row as Record<string, unknown> | null;
  const userId = (r?.user_id as string | null) ?? null;
  const email = (r?.email as string | null) ?? null;
  if (!userId || !email) return null;
  return { userId, email };
}

export async function notifyAffiliatePayoutCompleted(input: {
  admin: SupabaseClient;
  affiliateAccountId: string;
  netCents: number;
  payoutId: string;
  stripeTransferId: string | null;
}): Promise<void> {
  const recipient = await resolveAffiliateRecipient(
    input.admin,
    input.affiliateAccountId,
  );
  if (!recipient) return;
  const dollars = (input.netCents / 100).toFixed(2);
  await notifyAffiliate({
    admin: input.admin,
    userId: recipient.userId,
    affiliateAccountId: input.affiliateAccountId,
    toEmail: recipient.email,
    kind: "affiliate.payout_completed",
    title:
      input.netCents > 0
        ? `Payout sent: $${dollars}`
        : "Payout cycle complete (offset applied)",
    body:
      input.netCents > 0
        ? `Your payout of $${dollars} was transferred to your connected bank account. View details in your affiliate portal.`
        : "Your earnings this cycle were fully consumed by a previous refund offset. No transfer was sent.",
    actionUrl: "/affiliate/payouts",
  });
}

export async function notifyAffiliatePayoutFailed(input: {
  admin: SupabaseClient;
  affiliateAccountId: string;
  netCents: number;
  payoutId: string;
  failureReason: string;
}): Promise<void> {
  const recipient = await resolveAffiliateRecipient(
    input.admin,
    input.affiliateAccountId,
  );
  if (!recipient) return;
  const dollars = (input.netCents / 100).toFixed(2);
  await notifyAffiliate({
    admin: input.admin,
    userId: recipient.userId,
    affiliateAccountId: input.affiliateAccountId,
    toEmail: recipient.email,
    kind: "affiliate.payout_failed",
    title: `Payout failed: $${dollars}`,
    body: `We couldn't send your payout. Reason: ${input.failureReason.slice(0, 200)}. We'll retry automatically; if the problem persists, check your Stripe account status in the affiliate portal.`,
    actionUrl: "/affiliate/payouts",
  });
}

export async function notifyAffiliateOffsetApplied(input: {
  admin: SupabaseClient;
  affiliateAccountId: string;
  offsetIncrementCents: number;
  newBalanceOffsetCents: number;
  bookingId: string;
}): Promise<void> {
  const recipient = await resolveAffiliateRecipient(
    input.admin,
    input.affiliateAccountId,
  );
  if (!recipient) return;
  const incrementDollars = (input.offsetIncrementCents / 100).toFixed(2);
  const balanceDollars = (input.newBalanceOffsetCents / 100).toFixed(2);
  await notifyAffiliate({
    admin: input.admin,
    userId: recipient.userId,
    affiliateAccountId: input.affiliateAccountId,
    toEmail: recipient.email,
    kind: "affiliate.offset_applied",
    title: `Refund applied: -$${incrementDollars}`,
    body: `A refunded booking has reduced your next payout by $${incrementDollars}. Outstanding offset: $${balanceDollars}. Your next earnings cycle will be reduced by this amount before transfer.`,
    actionUrl: "/affiliate/earnings",
  });
}

export async function notifyAffiliateStripeDisconnected(input: {
  admin: SupabaseClient;
  affiliateAccountId: string;
}): Promise<void> {
  const recipient = await resolveAffiliateRecipient(
    input.admin,
    input.affiliateAccountId,
  );
  if (!recipient) return;
  await notifyAffiliate({
    admin: input.admin,
    userId: recipient.userId,
    affiliateAccountId: input.affiliateAccountId,
    toEmail: recipient.email,
    kind: "affiliate.stripe_disconnected",
    title: "Your Stripe account was disconnected",
    body: "Your Stripe connected account has been deauthorized. Reconnect Stripe in the affiliate portal to keep earning and receiving payouts. Existing campaigns continue to work for now.",
    actionUrl: "/affiliate/dashboard",
  });
}

export async function notifyAffiliateStripeVerificationNeeded(input: {
  admin: SupabaseClient;
  affiliateAccountId: string;
  requirementsCurrentlyDue: string[];
  requirementsPastDue: string[];
}): Promise<void> {
  const recipient = await resolveAffiliateRecipient(
    input.admin,
    input.affiliateAccountId,
  );
  if (!recipient) return;
  const total =
    input.requirementsCurrentlyDue.length + input.requirementsPastDue.length;
  await notifyAffiliate({
    admin: input.admin,
    userId: recipient.userId,
    affiliateAccountId: input.affiliateAccountId,
    toEmail: recipient.email,
    kind: "affiliate.stripe_verification_needed",
    title: "Stripe verification needed",
    body: `Stripe needs ${total} additional ${
      total === 1 ? "item" : "items"
    } before your account can receive payouts. Open the affiliate portal to finish verification.`,
    actionUrl: "/affiliate/dashboard",
  });
}
