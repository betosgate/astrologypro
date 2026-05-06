import type { SupabaseClient } from "@supabase/supabase-js";

export type ApplyOffsetResult =
  | {
      ok: true;
      offsetCents: number;
      newBalanceOffsetCents: number;
      conversionId: string;
    }
  | {
      ok: false;
      reason: "no_conversion" | "already_offset_applied" | "db_error";
      detail?: string;
    };

/**
 * Apply a refund-after-payout offset for a booking.
 *
 * Call only when the booking's linked conversion is in state
 * `paid` (i.e., the affiliate has been paid).
 *
 * Increments `affiliate_accounts.balance_offset_cents` by the conversion's
 * `paid_amount_cents`. Marks the conversion's `payout_status =
 * 'offset_applied'` so a second refund of the same booking is a no-op.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/05-refund-offset-tracking.md
 */
export async function applyRefundOffsetForBooking(input: {
  admin: SupabaseClient;
  bookingId: string;
  reason: string;
  actorUserId: string | null;
}): Promise<ApplyOffsetResult> {
  const { admin, bookingId, reason, actorUserId } = input;

  // Resolve the conversion + affiliate account. We do two roundtrips to
  // keep the join shape simple — the alternative nested join is fragile
  // against PostgREST.
  const { data: conversion, error: fetchErr } = await admin
    .from("campaign_conversions")
    .select(
      "id, affiliate_id, payout_status, paid_amount_cents, affiliate_account_id",
    )
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, reason: "db_error", detail: fetchErr.message };
  }
  if (!conversion) {
    return { ok: false, reason: "no_conversion" };
  }
  const c = conversion as Record<string, unknown>;
  if (c.payout_status === "offset_applied") {
    return { ok: false, reason: "already_offset_applied" };
  }
  if (c.payout_status !== "paid") {
    return {
      ok: false,
      reason: "db_error",
      detail: `unexpected payout_status=${String(c.payout_status)}; expected 'paid'`,
    };
  }

  // Resolve affiliate_account_id. Phase 2 conversions store it
  // directly on campaign_conversions (per attribution helper updates).
  // For older rows (pre-Phase-2) fall back via diviner_affiliates.
  let affiliateAccountId =
    (c.affiliate_account_id as string | null | undefined) ?? null;
  if (!affiliateAccountId) {
    const { data: junction } = await admin
      .from("diviner_affiliates")
      .select("affiliate_account_id")
      .eq("id", c.affiliate_id as string)
      .maybeSingle();
    affiliateAccountId =
      ((junction as Record<string, unknown> | null)?.affiliate_account_id as
        | string
        | null) ?? null;
  }
  if (!affiliateAccountId) {
    return {
      ok: false,
      reason: "db_error",
      detail: "could not resolve affiliate_account_id",
    };
  }

  const { data: account } = await admin
    .from("affiliate_accounts")
    .select("balance_offset_cents")
    .eq("id", affiliateAccountId)
    .maybeSingle();
  const currentOffset = Number(
    ((account as Record<string, unknown> | null)?.balance_offset_cents as
      | number
      | null) ?? 0,
  );
  const offsetIncrement = Number((c.paid_amount_cents as number | null) ?? 0);

  if (offsetIncrement <= 0) {
    await admin
      .from("campaign_conversions")
      .update({ payout_status: "offset_applied" })
      .eq("id", c.id as string);
    return {
      ok: true,
      offsetCents: 0,
      newBalanceOffsetCents: currentOffset,
      conversionId: c.id as string,
    };
  }

  const newOffset = currentOffset + offsetIncrement;
  const now = new Date().toISOString();

  const { error: updErr } = await admin
    .from("affiliate_accounts")
    .update({
      balance_offset_cents: newOffset,
      balance_offset_last_changed_at: now,
    })
    .eq("id", affiliateAccountId);
  if (updErr) {
    return { ok: false, reason: "db_error", detail: updErr.message };
  }

  await admin
    .from("campaign_conversions")
    .update({ payout_status: "offset_applied" })
    .eq("id", c.id as string);

  // admin_action_log requires admin_user_id (NOT NULL FK to auth.users).
  // System callers (cron, webhook) pass actorUserId=null — log via console
  // only; the refund_events row + the conversion row already provide audit
  // trail.
  if (actorUserId) {
    try {
      await admin.from("admin_action_log").insert({
        admin_user_id: actorUserId,
        action_kind: "affiliate_offset_applied",
        target_resource_type: "affiliate_account",
        target_resource_id: affiliateAccountId,
        reason: (reason && reason.length >= 5
          ? reason
          : `Offset applied for booking ${bookingId}`
        ).slice(0, 500),
        payload: {
          conversion_id: c.id,
          booking_id: bookingId,
          offset_increment_cents: offsetIncrement,
          new_balance_offset_cents: newOffset,
        },
      });
    } catch (err) {
      console.error("[applyRefundOffsetForBooking] audit log failed", err);
    }
  } else {
    console.info("[applyRefundOffsetForBooking] system-actor offset", {
      affiliateAccountId,
      bookingId,
      offset_increment_cents: offsetIncrement,
      new_balance_offset_cents: newOffset,
      reason,
    });
  }

  // Task 09 hook: notify the affiliate that their next payout has been
  // reduced. Best-effort; never fail the offset on a notification miss.
  try {
    const { notifyAffiliateOffsetApplied } = await import(
      "@/lib/affiliate-notifications"
    );
    await notifyAffiliateOffsetApplied({
      admin,
      affiliateAccountId,
      offsetIncrementCents: offsetIncrement,
      newBalanceOffsetCents: newOffset,
      bookingId,
    });
  } catch (err) {
    console.error("[applyRefundOffsetForBooking] notify failed", err);
  }

  return {
    ok: true,
    offsetCents: offsetIncrement,
    newBalanceOffsetCents: newOffset,
    conversionId: c.id as string,
  };
}
