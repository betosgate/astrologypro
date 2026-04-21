/**
 * TypeScript types for the service-scoped affiliate model introduced in
 * the 2026-04-21 sprint (migration 20260421000001_affiliate_service_assignments).
 *
 * Single source of truth for:
 *   - DivinerServiceAffiliate (the assignment row)
 *   - AffiliateCampaignOwnerType
 *   - affiliate-owner extensions on existing campaign/click/conversion types
 */

export type AffiliateType = "diviner_affiliate" | "social_advocate";
export type AffiliateCampaignOwnerType = "diviner" | "affiliate";
export type AffiliateCommissionType = "percent" | "flat";
export type AffiliateDestinationType = "PROFILE" | "SERVICE";

export type ConversionCommissionSource =
  | "campaign_assignment"
  | "legacy_campaign_affiliates"
  | "manual_override";

/**
 * Row from diviner_service_affiliates — the source of truth for which
 * affiliates are authorized to promote a diviner's profile or specific
 * service, and at what commission rate.
 */
export interface DivinerServiceAffiliate {
  id: string;
  diviner_id: string;

  /** PROFILE → destination_id IS NULL; SERVICE → destination_id = service_template_id */
  destination_type: AffiliateDestinationType;
  destination_id: string | null;

  affiliate_id: string;
  affiliate_type: AffiliateType;

  commission_type: AffiliateCommissionType;
  commission_value: number;

  is_active: boolean;
  assigned_at: string;
  assigned_by: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Owner-related columns added to affiliate_campaigns. Spread into the
 * broader AffiliateCampaign type where needed.
 */
export interface AffiliateCampaignOwnerFields {
  owner_type: AffiliateCampaignOwnerType;
  owner_affiliate_id: string | null;
  owner_affiliate_type: AffiliateType | null;
  commission_value_snapshot: number | null;
  commission_type_snapshot: AffiliateCommissionType | null;
  source_assignment_id: string | null;
}

/** Extra columns added to campaign_clicks by this sprint. */
export interface CampaignClickAffiliateFields {
  affiliate_id: string | null;
  affiliate_type: AffiliateType | null;
  commission_value_snapshot: number | null;
  commission_type_snapshot: AffiliateCommissionType | null;
  ref_code: string | null;
}

/** Extra columns added to campaign_conversions by this sprint. */
export interface CampaignConversionExtensions {
  booking_id: string | null;
  ref_code_snapshot: string | null;
  commission_source: ConversionCommissionSource;
  reversed_at: string | null;
  reversed_by: string | null;
  reversal_reason: string | null;
}

/**
 * Payload accepted by the diviner's "create assignment" API.
 * destination_id is required for SERVICE scope; must be null for PROFILE.
 */
export interface CreateAssignmentInput {
  destination_type: AffiliateDestinationType;
  destination_id?: string | null;
  affiliate_id: string;
  affiliate_type: AffiliateType;
  commission_type: AffiliateCommissionType;
  commission_value: number;
  notes?: string | null;
}

export interface UpdateAssignmentInput {
  commission_type?: AffiliateCommissionType;
  commission_value?: number;
  is_active?: boolean;
  notes?: string | null;
}
