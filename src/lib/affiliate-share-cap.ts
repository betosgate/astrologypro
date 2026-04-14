import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_MAX_DIVINER_AFFILIATE_SHARE_PERCENT = 60;

export async function getMaxDivinerAffiliateSharePercent() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("max_diviner_affiliate_share_percent")
    .limit(1)
    .single();

  if (error || !data) {
    return DEFAULT_MAX_DIVINER_AFFILIATE_SHARE_PERCENT;
  }

  const value = Number(data.max_diviner_affiliate_share_percent);
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_DIVINER_AFFILIATE_SHARE_PERCENT;
  }

  return value;
}

export async function assertAffiliateShareWithinCap(params: {
  commissionType: unknown;
  commissionValue: unknown;
}) {
  const commissionType = typeof params.commissionType === "string" ? params.commissionType : null;
  const commissionValue =
    typeof params.commissionValue === "number" ? params.commissionValue : Number.NaN;

  if (!commissionType || !Number.isFinite(commissionValue)) {
    return;
  }

  const capPercent = await getMaxDivinerAffiliateSharePercent();

  if (commissionType === "percentage" && commissionValue > capPercent) {
    throw new Error(
      `Affiliate share cannot exceed the current platform cap of ${capPercent}% of the diviner share.`,
    );
  }
}
