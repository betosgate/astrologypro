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
  | "lookup_error";

export interface StampResult {
  source_assignment_id: string | null;
  rate_type_stamp: StampRateType | null;
  rate_value_stamp: number | null;
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
  rate_type_stamp: null,
  rate_value_stamp: null,
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
      "id, diviner_id, status, owner_type, owner_affiliate_id, owner_affiliate_type, source_assignment_id, destination_type, destination_service_template_id",
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
  if (campaign.status !== "active" || campaign.owner_type !== "affiliate") {
    return NO_STAMP("campaign_inactive");
  }
  if (
    !campaign.owner_affiliate_id ||
    campaign.owner_affiliate_type !== "diviner_affiliate" ||
    !campaign.source_assignment_id
  ) {
    // Phase 1: only diviner-affiliate campaigns stamp. Malformed campaign row
    // (missing owner or assignment link) is treated as no-match.
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
    rate_type_stamp: (assignment.commission_type as StampRateType) ?? "percent",
    rate_value_stamp: Number(assignment.commission_value ?? 0),
    reason: "stamped",
  };
}
