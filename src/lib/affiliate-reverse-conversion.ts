// src/lib/affiliate-reverse-conversion.ts
//
// Shared reversal helper — marks a `campaign_conversions` row as reversed
// and fires the `affiliate.reversal` notification. Called from:
//   - POST /api/admin/conversions/[id]/reverse  (manual admin action)
//   - Stripe webhook charge.refunded / charge.dispute.created handlers
//
// Admin callers additionally write an `admin_action_log` row; the Stripe
// call sites use reversed_by=null with a system reason. This function
// itself does NOT write the action log — that's the admin route's
// responsibility.
//
// Sprint: docs/tasks/2026-04-24/affiliate-commission-v2/05-rate-edit-history-and-notifications.md
// Spec: docs/specs/affiliate-commission-system.md §5 Flow J

import type { SupabaseClient } from "@supabase/supabase-js";

export type ReverseResult =
  | { ok: true; conversionId: string; amountCents: number; affiliateId: string }
  | { ok: false; reason: "not_found" | "already_reversed" | "db_error"; detail?: string };

export interface ReverseConversionInput {
  admin: SupabaseClient;
  /** campaign_conversions.id */
  conversionId: string;
  /** auth.users.id of the admin who triggered the reversal, or null for system. */
  reversedBy: string | null;
  reason: string;
}

/**
 * Mark a conversion as reversed and fire the affiliate.reversal notification.
 * Idempotent — returns `already_reversed` if reversed_at is already set.
 */
export async function reverseConversion(
  input: ReverseConversionInput,
): Promise<ReverseResult> {
  const { admin, conversionId, reversedBy, reason } = input;

  const { data: existing, error: fetchErr } = await admin
    .from("campaign_conversions")
    .select(
      "id, affiliate_id, campaign_id, order_amount_cents, commission_amount_cents, reversed_at",
    )
    .eq("id", conversionId)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, reason: "db_error", detail: fetchErr.message };
  }
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.reversed_at) return { ok: false, reason: "already_reversed" };

  const { error: updateErr } = await admin
    .from("campaign_conversions")
    .update({
      reversed_at: new Date().toISOString(),
      reversed_by: reversedBy,
      reversal_reason: reason,
    })
    .eq("id", conversionId)
    .is("reversed_at", null);

  if (updateErr) {
    return { ok: false, reason: "db_error", detail: updateErr.message };
  }

  // Fire the affiliate.reversal notification (fire-and-forget).
  try {
    const { data: junction } = await admin
      .from("diviner_affiliates")
      .select("affiliate_account_id")
      .eq("id", existing.affiliate_id as string)
      .maybeSingle();

    if (junction?.affiliate_account_id) {
      const { data: account } = await admin
        .from("affiliate_accounts")
        .select("id, user_id, email")
        .eq("id", junction.affiliate_account_id as string)
        .maybeSingle();

      if (account && (account as { user_id?: string }).user_id) {
        const { notifyAffiliate } = await import("@/lib/affiliate-notifications");
        const dollars = (
          Number(existing.commission_amount_cents ?? 0) / 100
        ).toFixed(2);
        await notifyAffiliate({
          admin,
          userId: (account as { user_id: string }).user_id,
          affiliateAccountId: (account as { id: string }).id,
          toEmail: (account as { email?: string }).email ?? "",
          kind: "affiliate.reversal",
          title: `Commission reversed: $${dollars}`,
          body: `A previously earned commission of $${dollars} has been reversed. Reason: ${reason}`,
          actionUrl: "/affiliate/earnings",
        });
      }
    }
  } catch (err) {
    console.error("[reverseConversion] notification failed", {
      conversionId,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  return {
    ok: true,
    conversionId: existing.id as string,
    amountCents: Number(existing.commission_amount_cents ?? 0),
    affiliateId: existing.affiliate_id as string,
  };
}
