import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Ensures a default "General Referral" campaign exists for the given affiliate.
 * Called on first dashboard load so affiliates never see an empty campaigns list.
 *
 * Returns the default campaign ID (existing or newly created).
 */
export async function ensureDefaultCampaign(opts: {
  affiliateId: string;
  affiliateType: "social_advocate" | "diviner_affiliate";
  /** For diviner_affiliates — the diviner who owns this affiliate */
  divinerId?: string;
  affiliateName: string;
  commissionPercent?: number;
}): Promise<string | null> {
  const admin = createAdminClient();

  // Check if this affiliate already has any campaign enrollment
  const { data: existing } = await admin
    .from("campaign_affiliates")
    .select("campaign_id")
    .eq("affiliate_id", opts.affiliateId)
    .eq("affiliate_type", opts.affiliateType === "social_advocate" ? "social_advocate" : "diviner_affiliate")
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0].campaign_id as string;
  }

  // Create a default campaign
  const campaignName = `General Referral — ${opts.affiliateName}`;
  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data: campaign, error: campErr } = await admin
    .from("affiliate_campaigns")
    .insert({
      diviner_id: opts.divinerId ?? null,
      name: campaignName,
      description: "Default referral campaign — share your link to earn commissions on every signup and booking.",
      status: "active",
      start_date: now,
      end_date: null, // no expiration
      commission_type: "percentage",
      commission_value: opts.commissionPercent ?? 10,
      budget_cap_cents: null, // unlimited
      target_product_type: null, // all products
      utm_source: "referral",
      utm_medium: opts.affiliateType === "social_advocate" ? "advocate" : "affiliate",
      utm_campaign: `default-${opts.affiliateId.slice(0, 8)}`,
    })
    .select("id")
    .single();

  if (campErr || !campaign) {
    console.error("[ensureDefaultCampaign] Failed to create campaign:", campErr);
    return null;
  }

  // Enroll the affiliate in the campaign
  await admin.from("campaign_affiliates").insert({
    campaign_id: campaign.id,
    affiliate_id: opts.affiliateId,
    affiliate_type: opts.affiliateType === "social_advocate" ? "social_advocate" : "diviner_affiliate",
  });

  return campaign.id as string;
}
