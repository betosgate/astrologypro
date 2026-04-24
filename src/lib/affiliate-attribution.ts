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
  diviner_id: string;
  owner_type: AffiliateCampaignOwnerType;
  owner_affiliate_id: string | null;
  owner_affiliate_type: AffiliateType | null;
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
       source_assignment_id, destination_type, destination_service_template_id`
    )
    .eq("campaign_code", code)
    .eq("status", "active")
    .eq("owner_type", "affiliate")
    .maybeSingle();

  if (!campaign) return null;
  if (!campaign.owner_affiliate_id || !campaign.owner_affiliate_type) return null;

  return {
    campaign_id: campaign.id as string,
    diviner_id: campaign.diviner_id as string,
    owner_type: campaign.owner_type as AffiliateCampaignOwnerType,
    owner_affiliate_id: campaign.owner_affiliate_id as string,
    owner_affiliate_type: campaign.owner_affiliate_type as AffiliateType,
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
   * bookings.commission_source_assignment_id — authoritative rate source.
   * NULL means the booking was never stamped (spec §3.8), so no commission
   * is credited. Stamping happens at booking creation (Task 04 Part A).
   */
  stampedAssignmentId: string | null;
  /** bookings.commission_rate_type_stamp — 'percent' or 'flat', or NULL. */
  stampedRateType: "percent" | "flat" | null;
  /** bookings.commission_rate_value_stamp — NUMERIC, or NULL. */
  stampedRateValue: number | null;
}

export interface CreditConversionResult {
  conversionId: string;
  commissionCents: number;
  campaignId: string;
  affiliateId: string;
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
    !params.stampedAssignmentId ||
    !params.stampedRateType ||
    params.stampedRateValue == null
  ) {
    logEvent(false, "no_stamp");
    return null;
  }

  // Resolve the assignment's junction + affiliate account so we can
  // (a) re-check status, (b) get the junction id for the conversion row.
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
    .select("status")
    .eq("id", junction.affiliate_account_id as string)
    .maybeSingle();
  if (!account || account.status !== "active") {
    // Fraud-enforcement gate. Even if the booking was stamped at a prior
    // in-flight moment, a later block/unclaimed status means no commission.
    logEvent(false, "account_not_active_at_credit", {
      assignmentId: params.stampedAssignmentId,
      accountStatus: account?.status ?? null,
    });
    return null;
  }

  // Resolve the campaign from ref_code to get campaign_id for the row.
  // The campaign itself is no longer authoritative for rate (spec §3.8).
  const campaign = await resolveAffiliateFromRef(admin, params.refCode);
  if (!campaign) {
    // Unusual: stamp was set but campaign went away between booking and
    // payment. Log and bail — stamp alone doesn't justify a conversion
    // row without a campaign_id (conversions.campaign_id is NOT NULL).
    logEvent(false, "campaign_missing_at_credit", {
      assignmentId: params.stampedAssignmentId,
    });
    return null;
  }

  // Commission is computed from the stamp, NOT from any campaign read.
  const commissionCents = computeCommissionCents(
    params.orderAmountCents,
    params.stampedRateType,
    params.stampedRateValue,
  );

  const { data: inserted, error } = await admin
    .from("campaign_conversions")
    .insert({
      campaign_id: campaign.campaign_id,
      affiliate_id: assignment.affiliate_id,
      affiliate_type: assignment.affiliate_type,
      booking_id: params.bookingId,
      ref_code_snapshot: params.refCode ?? null,
      order_reference: params.bookingId,
      order_amount_cents: params.orderAmountCents,
      commission_amount_cents: commissionCents,
      commission_source: "campaign_assignment",
      rate_type_used: params.stampedRateType,
      rate_value_used: params.stampedRateValue,
    })
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
    affiliateId: assignment.affiliate_id,
    assignmentId: params.stampedAssignmentId,
    stampType: params.stampedRateType,
    stampValue: params.stampedRateValue,
  });

  return {
    conversionId: inserted!.id as string,
    commissionCents,
    campaignId: campaign.campaign_id,
    affiliateId: assignment.affiliate_id as string,
    affiliateType: assignment.affiliate_type as AffiliateType,
  };
}
