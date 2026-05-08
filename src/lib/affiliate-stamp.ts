// src/lib/affiliate-stamp.ts
//
// Booking rate-stamp resolver. Called at booking creation time to lock in
// the commission rate that will pay out when the booking is confirmed.
// Per spec v1.2 §3.8, the stamped rate is authoritative for payout —
// `diviner_service_affiliates` is NOT re-read at webhook time, with the
// single exception of `affiliate_accounts.status` (fraud enforcement,
// handled inside creditAffiliateConversion).
//
// Returning a null stamp is NOT an error — it just means "this booking
// will not earn any commission." The reason code is logged for funnel
// observability but never surfaced to the customer.
//
// Sprint: docs/tasks/2026-04-24/affiliate-commission-v2/04-booking-rate-stamping-and-credit.md

import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeRefCode } from "@/lib/affiliate-attribution";

export type StampRateType = "percent" | "flat";

export type StampReason =
  | "stamped"
  | "no_ref"
  | "no_campaign"
  | "campaign_inactive"
  | "assignment_inactive"
  | "destination_mismatch"
  | "account_not_active"
  | "program_disabled"
  | "no_commission_config"
  | "lookup_error";

export interface StampResult {
  source_assignment_id: string | null;
  /**
   * Phase 1.5: set when the stamp came from a general-program campaign.
   * Mutually exclusive with source_assignment_id in practice (one set, the
   * other null). NULL on per-diviner stamps.
   */
  source_template_id: string | null;
  /**
   * Diviner-owned campaign path: set when the referral code resolves to a
   * campaign the diviner created for themselves (owner_type='diviner').
   * Mutually exclusive with source_assignment_id and source_template_id.
   * Maps to bookings.commission_source_campaign_id.
   */
  source_campaign_id: string | null;
  rate_type_stamp: StampRateType | null;
  rate_value_stamp: number | null;
  /**
   * Phase 1.5: the affiliate account this stamp credits, regardless of
   * whether attribution was per-diviner (resolved via junction) or general
   * (read directly from the campaign). Webhook credit can use this to
   * bypass a junction join.
   */
  affiliate_account_id: string | null;
  reason: StampReason;
}

export interface ResolveStampInput {
  refCode: string | null | undefined;
  divinerId: string;
  /** services.id of the booked service, or null if the booking isn't tied to a specific service. */
  serviceId: string | null | undefined;
}

const NO_STAMP = (reason: StampReason): StampResult => ({
  source_assignment_id: null,
  source_template_id: null,
  source_campaign_id: null,
  rate_type_stamp: null,
  rate_value_stamp: null,
  affiliate_account_id: null,
  reason,
});

/**
 * Resolve the commission rate stamp for a booking. Returns all-null fields
 * when any of the five §3.8 conditions fails. The caller should spread
 * the non-null result into the booking insert payload; on null stamp,
 * the booking is saved without stamp columns (NULL) and no commission
 * will ever be credited for it.
 */
export async function resolveStampForBooking(
  admin: SupabaseClient,
  input: ResolveStampInput,
): Promise<StampResult> {
  // 1. refCode validity
  const code = sanitizeRefCode(input.refCode);
  if (!code) return NO_STAMP("no_ref");

  // 2. Campaign must exist, be active, and owner_type='affiliate'.
  //    (We don't use resolveAffiliateFromRef here so we can avoid the
  //    snapshot SELECT that 01b is going to drop.)
  const { data: campaign, error: campaignErr } = await admin
    .from("affiliate_campaigns")
    .select(
      "id, diviner_id, status, owner_type, owner_affiliate_id, owner_affiliate_type, owner_affiliate_account_id, source_assignment_id, destination_type, destination_service_template_id, commission_type, commission_value",
    )
    .eq("campaign_code", code)
    .maybeSingle();

  if (campaignErr) {
    console.error("[affiliate-stamp] campaign lookup failed", {
      refCode: code,
      error: campaignErr.message,
    });
    return NO_STAMP("lookup_error");
  }
  if (!campaign) return NO_STAMP("no_campaign");
  if (campaign.status !== "active") return NO_STAMP("campaign_inactive");

  // ── Diviner-owned campaign path ────────────────────────────────────────
  // When the diviner creates their own campaign (owner_type='diviner'), there
  // is no affiliate junction. The commission is paid to the diviner themselves
  // based on the campaign's commission_type + commission_value.
  if (campaign.owner_type === "diviner") {
    // Must have a commission rate configured on the campaign.
    if (
      !campaign.commission_type ||
      campaign.commission_value == null
    ) {
      console.log(
        JSON.stringify({
          event: "affiliate_stamp_skipped",
          refCode: code,
          reason: "no_commission_config",
          campaignId: campaign.id,
          note: "Diviner-owned campaign has no commission_type/commission_value configured",
        }),
      );
      return NO_STAMP("no_commission_config");
    }

    // Destination match: SERVICE → template_id; PROFILE → diviner_id.
    let templateId: string | null = null;
    if (input.serviceId) {
      const { data: svc } = await admin
        .from("services")
        .select("template_id")
        .eq("id", input.serviceId)
        .maybeSingle();
      templateId = (svc?.template_id as string | null) ?? null;
    }

    const matchesService =
      campaign.destination_type === "SERVICE" &&
      campaign.destination_service_template_id != null &&
      campaign.destination_service_template_id === templateId;
    const matchesProfile =
      campaign.destination_type === "PROFILE" &&
      campaign.diviner_id === input.divinerId;

    if (!matchesService && !matchesProfile) {
      return NO_STAMP("destination_mismatch");
    }

    return {
      source_assignment_id: null,
      source_template_id: null,
      source_campaign_id: campaign.id as string,
      rate_type_stamp: campaign.commission_type as StampRateType,
      rate_value_stamp: Number(campaign.commission_value),
      affiliate_account_id: null, // no affiliate account; diviner is the recipient
      reason: "stamped",
    };
  }

  // ── Affiliate-owned campaign paths (owner_type='affiliate') ────────────
  if (campaign.owner_type !== "affiliate") {
    return NO_STAMP("campaign_inactive");
  }

  // Phase 1.5: general-program branch. Campaign carries the affiliate
  // account id directly; rate comes from service_templates, not from a
  // per-diviner assignment.
  if (campaign.owner_affiliate_type === "general") {
    const accountId = (campaign.owner_affiliate_account_id as string | null) ?? null;
    const templateId =
      (campaign.destination_service_template_id as string | null) ?? null;
    if (!accountId || !templateId) {
      // CHECK constraint guarantees both are set when type='general'.
      // Defensive: treat a corrupt row as no-match.
      return NO_STAMP("no_campaign");
    }

    const { data: template } = await admin
      .from("service_templates")
      .select(
        "id, is_general, affiliate_program_enabled, commission_type, commission_value",
      )
      .eq("id", templateId)
      .maybeSingle();
    if (!template) return NO_STAMP("no_campaign");
    if (template.affiliate_program_enabled !== true) {
      return NO_STAMP("program_disabled");
    }

    const { data: account } = await admin
      .from("affiliate_accounts")
      .select("id, status")
      .eq("id", accountId)
      .maybeSingle();
    if (!account || account.status !== "active") {
      return NO_STAMP("account_not_active");
    }

    // Default 10% percent if admin enabled the program but didn't set a
    // rate (spec §10 Phase 1.5 decision #3).
    const rateType =
      ((template.commission_type as StampRateType | null) ?? "percent");
    const rateValue =
      template.commission_value != null ? Number(template.commission_value) : 10;

    return {
      source_assignment_id: null,
      source_template_id: template.id as string,
      source_campaign_id: null,
      rate_type_stamp: rateType,
      rate_value_stamp: rateValue,
      affiliate_account_id: account.id as string,
      reason: "stamped",
    };
  }

  if (
    !campaign.owner_affiliate_id ||
    campaign.owner_affiliate_type !== "diviner_affiliate" ||
    !campaign.source_assignment_id
  ) {
    // Per-diviner path: malformed campaign row (missing owner or
    // assignment link) is treated as no-match.
    return NO_STAMP("campaign_inactive");
  }

  // 3. Destination match — SERVICE needs template_id comparison; PROFILE
  //    compares diviner_id only.
  let templateId: string | null = null;
  if (input.serviceId) {
    const { data: svc } = await admin
      .from("services")
      .select("template_id")
      .eq("id", input.serviceId)
      .maybeSingle();
    templateId = (svc?.template_id as string | null) ?? null;
  }

  const matchesService =
    campaign.destination_type === "SERVICE" &&
    campaign.destination_service_template_id != null &&
    campaign.destination_service_template_id === templateId;
  const matchesProfile =
    campaign.destination_type === "PROFILE" &&
    campaign.diviner_id === input.divinerId;
  if (!matchesService && !matchesProfile) {
    return NO_STAMP("destination_mismatch");
  }

  // 4. Source assignment still active + pull the live rate to stamp.
  const { data: assignment } = await admin
    .from("diviner_service_affiliates")
    .select("id, is_active, commission_type, commission_value, affiliate_id")
    .eq("id", campaign.source_assignment_id)
    .maybeSingle();
  if (!assignment || !assignment.is_active) {
    return NO_STAMP("assignment_inactive");
  }

  // 5. Affiliate account must be 'active' (not blocked / unclaimed). We hit
  //    this check again at webhook time (creditAffiliateConversion), but
  //    stamping early means blocked accounts never even get rate-locked
  //    to a pending booking. Cheaper to fail fast.
  const { data: junction } = await admin
    .from("diviner_affiliates")
    .select("affiliate_account_id")
    .eq("id", assignment.affiliate_id as string)
    .maybeSingle();
  if (!junction || !junction.affiliate_account_id) {
    return NO_STAMP("account_not_active");
  }
  const { data: account } = await admin
    .from("affiliate_accounts")
    .select("status")
    .eq("id", junction.affiliate_account_id as string)
    .maybeSingle();
  if (!account || account.status !== "active") {
    return NO_STAMP("account_not_active");
  }

  // All five conditions pass — stamp the booking.
  return {
    source_assignment_id: assignment.id as string,
    source_template_id: null,
    source_campaign_id: null,
    rate_type_stamp: (assignment.commission_type as StampRateType) ?? "percent",
    rate_value_stamp: Number(assignment.commission_value ?? 0),
    affiliate_account_id: junction.affiliate_account_id as string,
    reason: "stamped",
  };
}
