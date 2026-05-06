/**
 * Affiliate attribution helpers.
 *
 * Centralizes the logic that resolves a `ref_code` (the campaign_code on
 * affiliate_campaigns) into the affiliate + commission context needed to
 * credit a conversion. Used by:
 *   - /r/[code] click logger (indirectly — reads owner fields itself)
 *   - Stripe webhook booking-confirmation handler (Task 03)
 *
 * Attribution is URL-only. No cookies, no localStorage. If a booking row
 * does not carry ref_code, no commission is credited.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AffiliateType,
  AffiliateCampaignOwnerType,
  AffiliateCommissionType,
  AffiliateDestinationType,
} from "@/types/affiliate-assignment";
import { computeRipenessAt } from "@/lib/affiliate-payout-ripeness";

/** Campaign codes are `cmp_` followed by 8 unambiguous alphanumeric chars. */
const REF_CODE_PATTERN = /^cmp_[A-Za-z0-9]{8}$/;

/**
 * Validate that a value smells like a campaign code. Use this to sanitize
 * anything that came from an untrusted source (query params, webhook
 * metadata) before storing or querying by it.
 */
export function isValidRefCode(value: unknown): value is string {
  return typeof value === "string" && REF_CODE_PATTERN.test(value);
}

/**
 * Normalize a free-form ref_code candidate. Returns the trimmed string if
 * it matches the canonical format, otherwise null. Never throws.
 */
export function sanitizeRefCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return REF_CODE_PATTERN.test(trimmed) ? trimmed : null;
}

export interface AttributionContext {
  campaign_id: string;
  diviner_id: string | null;
  owner_type: AffiliateCampaignOwnerType;
  owner_affiliate_id: string | null;
  owner_affiliate_type: AffiliateType | null;
  /**
   * Phase 1.5: account-direct ownership (set when owner_affiliate_type='general',
   * NULL on per-diviner campaigns).
   */
  owner_affiliate_account_id: string | null;
  commission_value_snapshot: number | null;
  commission_type_snapshot: AffiliateCommissionType | null;
  source_assignment_id: string | null;
  destination_type: AffiliateDestinationType | null;
  destination_service_template_id: string | null;
  status: string;
}

/**
 * Resolve a ref_code to an active, affiliate-owned campaign.
 *
 * Returns null if:
 *   - refCode is missing or doesn't match the canonical format
 *   - no campaign matches
 *   - the campaign is not currently `status='active'`
 *   - the campaign is not `owner_type='affiliate'` (diviner-owned
 *     campaigns never credit commission)
 *
 * Uses the admin client to avoid RLS blocking the lookup — callers are
 * expected to be server-side trusted code (Stripe webhook, etc.).
 */
export async function resolveAffiliateFromRef(
  admin: SupabaseClient,
  refCode: string | null | undefined
): Promise<AttributionContext | null> {
  const code = sanitizeRefCode(refCode);
  if (!code) return null;

  const { data: campaign } = await admin
    .from("affiliate_campaigns")
    .select(
      `id, diviner_id, status, owner_type, owner_affiliate_id, owner_affiliate_type,
       owner_affiliate_account_id,
       source_assignment_id, destination_type, destination_service_template_id`
    )
    .eq("campaign_code", code)
    .eq("status", "active")
    .eq("owner_type", "affiliate")
    .maybeSingle();

  if (!campaign) return null;
  if (!campaign.owner_affiliate_type) return null;

  // Phase 1.5: per-diviner campaigns require owner_affiliate_id; general
  // campaigns require owner_affiliate_account_id. The CHECK constraint on
  // affiliate_campaigns enforces this server-side; this is the client guard.
  const isPerDiviner =
    campaign.owner_affiliate_type === "diviner_affiliate" ||
    campaign.owner_affiliate_type === "social_advocate";
  const isGeneral = campaign.owner_affiliate_type === "general";
  if (isPerDiviner && !campaign.owner_affiliate_id) return null;
  if (isGeneral && !campaign.owner_affiliate_account_id) return null;

  return {
    campaign_id: campaign.id as string,
    diviner_id: (campaign.diviner_id as string | null) ?? null,
    owner_type: campaign.owner_type as AffiliateCampaignOwnerType,
    owner_affiliate_id: (campaign.owner_affiliate_id as string | null) ?? null,
    owner_affiliate_type: campaign.owner_affiliate_type as AffiliateType,
    owner_affiliate_account_id:
      (campaign.owner_affiliate_account_id as string | null) ?? null,
    // Snapshot fields no longer read from the campaign (spec v1.2 — rate is
    // stamped on the booking, not on the campaign). Kept in the returned
    // shape as null for backward-compat; dropped entirely in 01b.
    commission_value_snapshot: null,
    commission_type_snapshot: null,
    source_assignment_id: (campaign.source_assignment_id as string | null) ?? null,
    destination_type: (campaign.destination_type as AffiliateDestinationType | null) ?? null,
    destination_service_template_id:
      (campaign.destination_service_template_id as string | null) ?? null,
    status: campaign.status as string,
  };
}

/**
 * Compute commission cents from an order amount + commission snapshot.
 * Matches the semantics used elsewhere in the codebase:
 *   - percent → commission_value is a whole-number percentage (10 = 10%)
 *   - flat    → commission_value is a dollar amount (100 = $100.00)
 * Returns 0 on malformed input rather than throwing.
 */
export function computeCommissionCents(
  orderAmountCents: number,
  commissionType: AffiliateCommissionType | null | undefined,
  commissionValue: number | null | undefined
): number {
  if (!Number.isFinite(orderAmountCents) || orderAmountCents <= 0) return 0;
  if (commissionValue == null || !Number.isFinite(Number(commissionValue)))
    return 0;
  const value = Number(commissionValue);
  if (value < 0) return 0;

  if (commissionType === "flat") {
    return Math.max(0, Math.round(value * 100));
  }
  // Default to percent for null / 'percent' / unexpected values
  return Math.max(0, Math.round((orderAmountCents * value) / 100));
}

// ───────────────────────────────────────────────────────────────────────────
// Conversion attribution — Task 03
// ───────────────────────────────────────────────────────────────────────────

export interface CreditConversionInput {
  bookingId: string;
  orderAmountCents: number;
  /** Copy of bookings.ref_code. Used for conversion row snapshot + campaign lookup. */
  refCode: string | null | undefined;
  /**
   * bookings.commission_source_assignment_id — authoritative rate source
   * for per-diviner credits. NULL when the booking was stamped via the
   * Phase 1.5 general path (use stampedTemplateId then) or not at all.
   */
  stampedAssignmentId: string | null;
  /**
   * Phase 1.5: bookings.commission_source_template_id — authoritative
   * source for general-program credits. Mutually exclusive in practice
   * with stampedAssignmentId. Both NULL → no commission.
   */
  stampedTemplateId: string | null;
  /** bookings.commission_rate_type_stamp — 'percent' or 'flat', or NULL. */
  stampedRateType: "percent" | "flat" | null;
  /** bookings.commission_rate_value_stamp — NUMERIC, or NULL. */
  stampedRateValue: number | null;
  /**
   * Phase-2-prerequisite (2026-05-05 sprint): the cents value carved
   * out at booking creation, persisted on
   * bookings.affiliate_commission_amount_cents. When provided and
   * non-negative, used verbatim for the conversion row's
   * commission_amount_cents — guarantees exact match with what the
   * platform actually retained at PaymentIntent time. NULL on
   * pre-2026-05-05 bookings; falls back to recomputing via
   * computeCommissionCents in that case.
   */
  stampedCommissionCents?: number | null;
  /**
   * Phase 2 sprint (2026-05-05 affiliate-payouts-phase-2): used by the
   * payout-ripeness helper to compute when the conversion becomes
   * eligible for transfer (24h after the session ends). NULL for
   * non-booking conversions; helper falls back to
   * `created_at + 24h`.
   */
  bookingScheduledAt?: string | Date | null;
  bookingDurationMinutes?: number | null;
}

export interface CreditConversionResult {
  conversionId: string;
  commissionCents: number;
  campaignId: string;
  /**
   * Junction id (`diviner_affiliates.id`) for per-diviner credits, or NULL
   * for Phase 1.5 general credits (which have no junction). Use
   * `affiliateAccountId` when you need the cross-cutting account identity.
   */
  affiliateId: string | null;
  /**
   * `affiliate_accounts.id`. Always set on a successful credit, regardless
   * of whether the path was per-diviner or general.
   */
  affiliateAccountId: string;
  affiliateType: AffiliateType;
}

/**
 * Credit a commission to the affiliate that owns the campaign identified
 * by `refCode`. Idempotent — a second call for the same booking returns
 * null because campaign_conversions has UNIQUE (booking_id).
 *
 * Returns null (no commission credited) when any of:
 *   - refCode is missing / malformed
 *   - no active affiliate-owned campaign matches the refCode
 *   - the campaign's destination doesn't match the booking:
 *       SERVICE  → campaign.destination_service_template_id must equal templateId
 *       PROFILE  → campaign.diviner_id must equal divinerId
 *   - the source assignment has been revoked (is_active=false)
 *   - the booking is already credited (unique index on booking_id)
 *
 * All failure paths are logged with structured event
 * `affiliate_conversion_no_match` so operations can grep for data-loss.
 */
export async function creditAffiliateConversion(
  admin: SupabaseClient,
  params: CreditConversionInput
): Promise<CreditConversionResult | null> {
  const logEvent = (matched: boolean, reason: string, extras?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        event: "affiliate_conversion",
        bookingId: params.bookingId,
        refCode: params.refCode ?? null,
        matched,
        reason,
        ...extras,
      })
    );
  };

  // Spec v1.2 §5 Flow F: rate comes from the booking stamp. Destination
  // + assignment-active checks already happened at booking creation
  // (§3.8). At webhook time we only re-check `affiliate_accounts.status`
  // — the single live read for fraud enforcement.

  if (
    !params.stampedRateType ||
    params.stampedRateValue == null ||
    (!params.stampedAssignmentId && !params.stampedTemplateId)
  ) {
    logEvent(false, "no_stamp");
    return null;
  }

  // Resolve the campaign from ref_code (needed for campaign_id on the row).
  // Campaign is not authoritative for rate (spec §3.8) — only for linkage.
  const campaign = await resolveAffiliateFromRef(admin, params.refCode);
  if (!campaign) {
    logEvent(false, "campaign_missing_at_credit", {
      assignmentId: params.stampedAssignmentId,
      templateId: params.stampedTemplateId,
    });
    return null;
  }

  // Commission is computed from the stamp, NOT from any campaign or
  // template read. When the booking carries the carved-out cents from
  // 2026-05-05's task (affiliate_commission_amount_cents), use that
  // value verbatim — guarantees the conversion row matches what the
  // platform actually retained at PaymentIntent time. Falls back to
  // recomputing for pre-2026-05-05 bookings whose column is NULL.
  const commissionCents =
    typeof params.stampedCommissionCents === "number" &&
    params.stampedCommissionCents >= 0
      ? params.stampedCommissionCents
      : computeCommissionCents(
          params.orderAmountCents,
          params.stampedRateType,
          params.stampedRateValue,
        );

  // Phase 2 (2026-05-05 affiliate-payouts-phase-2): stamp ripeness so the
  // no-show-refunds cron can promote the conversion to `ripe` at the right
  // time. For booking conversions: 24h after session ends. For non-booking
  // conversions (subscriptions, general products without a session): 24h
  // after now.
  const ripenessAt = computeRipenessAt({
    bookingScheduledAt: params.bookingScheduledAt ?? null,
    bookingDurationMinutes: params.bookingDurationMinutes ?? null,
    conversionCreatedAt: new Date(),
  }).toISOString();

  // ── Branch on stamp source ──────────────────────────────────────────────

  let insertPayload: Record<string, unknown>;
  let resolvedAccountId: string;
  let recipientUserId: string | null = null;
  let recipientEmail: string | null = null;
  let resolvedAffiliateId: string | null = null;
  let resolvedAffiliateType: AffiliateType;

  if (params.stampedAssignmentId) {
    // Per-diviner path (Phase 1).
    const { data: assignment } = await admin
      .from("diviner_service_affiliates")
      .select("id, affiliate_id, affiliate_type")
      .eq("id", params.stampedAssignmentId)
      .maybeSingle();
    if (!assignment) {
      logEvent(false, "assignment_gone", {
        assignmentId: params.stampedAssignmentId,
      });
      return null;
    }

    const { data: junction } = await admin
      .from("diviner_affiliates")
      .select("affiliate_account_id")
      .eq("id", assignment.affiliate_id as string)
      .maybeSingle();
    if (!junction || !junction.affiliate_account_id) {
      logEvent(false, "junction_gone", {
        assignmentId: params.stampedAssignmentId,
      });
      return null;
    }

    const { data: account } = await admin
      .from("affiliate_accounts")
      .select("status, user_id, email")
      .eq("id", junction.affiliate_account_id as string)
      .maybeSingle();
    if (!account || account.status !== "active") {
      logEvent(false, "account_not_active_at_credit", {
        assignmentId: params.stampedAssignmentId,
        accountStatus: account?.status ?? null,
      });
      return null;
    }

    resolvedAccountId = junction.affiliate_account_id as string;
    resolvedAffiliateId = assignment.affiliate_id as string;
    resolvedAffiliateType = assignment.affiliate_type as AffiliateType;
    recipientUserId = (account as unknown as { user_id?: string }).user_id ?? null;
    recipientEmail = (account as unknown as { email?: string }).email ?? null;

    insertPayload = {
      campaign_id: campaign.campaign_id,
      affiliate_id: assignment.affiliate_id,
      affiliate_type: assignment.affiliate_type,
      affiliate_account_id: resolvedAccountId,
      booking_id: params.bookingId,
      ref_code_snapshot: params.refCode ?? null,
      order_reference: params.bookingId,
      order_amount_cents: params.orderAmountCents,
      commission_amount_cents: commissionCents,
      commission_source: "campaign_assignment",
      rate_type_used: params.stampedRateType,
      rate_value_used: params.stampedRateValue,
      // Phase 2 payouts:
      ripeness_at: ripenessAt,
      payout_status: "unpaid",
    };
  } else {
    // Phase 1.5 general-program path. The booking was stamped via a
    // service_templates rate; campaign carries the affiliate account
    // directly (no junction). No re-check of template.affiliate_program_enabled
    // here — admin can disable for FUTURE bookings; in-flight bookings
    // honor their stamp (rate-stamping invariant, spec §3.8).
    if (!campaign.owner_affiliate_account_id) {
      logEvent(false, "campaign_missing_account_id", {
        templateId: params.stampedTemplateId,
        campaignId: campaign.campaign_id,
      });
      return null;
    }

    const { data: account } = await admin
      .from("affiliate_accounts")
      .select("status, user_id, email")
      .eq("id", campaign.owner_affiliate_account_id)
      .maybeSingle();
    if (!account || account.status !== "active") {
      logEvent(false, "account_not_active_at_credit", {
        templateId: params.stampedTemplateId,
        accountStatus: account?.status ?? null,
      });
      return null;
    }

    resolvedAccountId = campaign.owner_affiliate_account_id;
    resolvedAffiliateType = "general";
    recipientUserId = (account as unknown as { user_id?: string }).user_id ?? null;
    recipientEmail = (account as unknown as { email?: string }).email ?? null;

    insertPayload = {
      campaign_id: campaign.campaign_id,
      affiliate_id: null,
      affiliate_type: "general",
      affiliate_account_id: resolvedAccountId,
      booking_id: params.bookingId,
      ref_code_snapshot: params.refCode ?? null,
      order_reference: params.bookingId,
      order_amount_cents: params.orderAmountCents,
      commission_amount_cents: commissionCents,
      commission_source: "campaign_assignment",
      rate_type_used: params.stampedRateType,
      rate_value_used: params.stampedRateValue,
      // Phase 2 payouts:
      ripeness_at: ripenessAt,
      payout_status: "unpaid",
    };
  }

  // ── Insert + idempotency handling ───────────────────────────────────────

  const { data: inserted, error } = await admin
    .from("campaign_conversions")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    // 23505 = unique_violation (booking already credited). Idempotent.
    const pgErr = error as unknown as { code?: string; message?: string };
    if (pgErr.code === "23505") {
      logEvent(false, "already_credited");
      return null;
    }
    logEvent(false, "insert_error", { err: pgErr.message ?? String(error) });
    throw error;
  }

  logEvent(true, "credited", {
    conversionId: inserted?.id,
    commissionCents,
    affiliateId: resolvedAffiliateId,
    affiliateType: resolvedAffiliateType,
    accountId: resolvedAccountId,
    assignmentId: params.stampedAssignmentId,
    templateId: params.stampedTemplateId,
    stampType: params.stampedRateType,
    stampValue: params.stampedRateValue,
  });

  // Phase 3 prep (Task 10): if this is the affiliate's first conversion
  // ever, stamp the milestone for funnel analytics. The
  // .is("first_conversion_at", null) filter makes only the FIRST write win
  // — subsequent calls are no-ops at the DB level.
  try {
    await admin
      .from("affiliate_accounts")
      .update({ first_conversion_at: new Date().toISOString() })
      .eq("id", resolvedAccountId)
      .is("first_conversion_at", null);
  } catch (err) {
    console.error(
      "[creditAffiliateConversion] first_conversion_at stamp failed",
      err,
    );
  }

  // Fire `affiliate.conversion` notification (in-app immediate, email
  // queued to daily digest). Fire-and-forget so a notification failure
  // never blocks the webhook from acknowledging Stripe.
  try {
    if (recipientUserId && recipientEmail) {
      const { notifyAffiliate } = await import("@/lib/affiliate-notifications");
      const dollars = (commissionCents / 100).toFixed(2);
      await notifyAffiliate({
        admin,
        userId: recipientUserId,
        affiliateAccountId: resolvedAccountId,
        toEmail: recipientEmail,
        kind: "affiliate.conversion",
        title: `Commission earned: $${dollars}`,
        body: `A referred customer's payment just confirmed. You earned $${dollars} on this conversion. Review your earnings in the affiliate portal.`,
        actionUrl: "/affiliate/earnings",
      });
    }
  } catch (err) {
    console.error("[creditAffiliateConversion] notify failed", {
      conversionId: inserted?.id,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  return {
    conversionId: inserted!.id as string,
    commissionCents,
    campaignId: campaign.campaign_id,
    affiliateId: resolvedAffiliateId,
    affiliateAccountId: resolvedAccountId,
    affiliateType: resolvedAffiliateType,
  };
}
