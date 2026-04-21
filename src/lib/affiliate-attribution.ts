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
       commission_value_snapshot, commission_type_snapshot, source_assignment_id,
       destination_type, destination_service_template_id`
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
    commission_value_snapshot:
      campaign.commission_value_snapshot != null
        ? Number(campaign.commission_value_snapshot)
        : null,
    commission_type_snapshot:
      (campaign.commission_type_snapshot as AffiliateCommissionType | null) ?? null,
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
