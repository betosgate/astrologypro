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

export type ReverseForBookingResult =
  | { ok: true; conversionId: string; amountCents: number; affiliateId: string }
  | {
      ok: false;
      reason: "no_conversion" | "already_reversed" | "db_error" | "not_found";
      detail?: string;
    };

/**
 * Look up the `campaign_conversions` row for a booking and mark it
 * reversed. Used by the refund pipeline (see Task 05 of the carve-out
 * sprint, docs/tasks/2026-05-05/affiliate-carve-out-at-booking-creation/).
 *
 * Idempotent + non-throwing:
 *   - If the booking has no conversion row (non-affiliate booking),
 *     returns ok=false with reason="no_conversion". This is the
 *     normal case for most refunds.
 *   - If the row is already reversed (e.g. duplicate refund webhook),
 *     returns ok=false with reason="already_reversed".
 *   - DB errors return ok=false with reason="db_error" + detail. Caller
 *     should log and continue; a Stripe refund must NOT be rolled back
 *     because the reversal failed.
 */
export async function reverseAffiliateConversionForBooking(input: {
  admin: SupabaseClient;
  bookingId: string;
  reversedBy: string | null;
  reason: string;
}): Promise<ReverseForBookingResult> {
  const { admin, bookingId, reversedBy, reason } = input;

  const { data: conversion, error: fetchErr } = await admin
    .from("campaign_conversions")
    .select("id, reversed_at, payout_status, affiliate_id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, reason: "db_error", detail: fetchErr.message };
  }
  if (!conversion) {
    return { ok: false, reason: "no_conversion" };
  }
  const c = conversion as Record<string, unknown>;
  if (c.reversed_at) {
    return { ok: false, reason: "already_reversed" };
  }

  // Phase 2 / Task 05: branch on payout_status.
  //   'unpaid' | 'ripe' | 'paying' | 'blocked' → money still on platform,
  //                                              reverse the conversion
  //   'paid'                                   → affiliate already paid,
  //                                              apply DB-level offset
  //   'offset_applied'                         → already handled (defensive)
  const status = (c.payout_status as string | null | undefined) ?? "unpaid";

  if (status === "paid") {
    const { applyRefundOffsetForBooking } = await import(
      "@/lib/affiliate-offset"
    );
    const offsetResult = await applyRefundOffsetForBooking({
      admin,
      bookingId,
      reason,
      actorUserId: reversedBy,
    });
    if (offsetResult.ok !== true) {
      const offsetFail = offsetResult;
      return {
        ok: false,
        reason: "db_error",
        detail: `offset failed: ${offsetFail.reason}${
          offsetFail.detail ? ` — ${offsetFail.detail}` : ""
        }`,
      };
    }
    return {
      ok: true,
      conversionId: offsetResult.conversionId,
      amountCents: offsetResult.offsetCents,
      affiliateId: (c.affiliate_id as string) ?? "",
    };
  }

  if (status === "offset_applied") {
    return { ok: false, reason: "already_reversed" };
  }

  // Default path — money still on platform, normal reversal applies.
  const result = await reverseConversion({
    admin,
    conversionId: c.id as string,
    reversedBy,
    reason,
  });
  return result;
}
