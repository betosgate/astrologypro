import { createAdminClient } from "@/lib/supabase/admin";

export type AffiliateCommissionProductType =
  | "signup"
  | "subscription"
  | "booking"
  | "weekly_subscription";

export async function recordAffiliateCommission(params: {
  affiliateCode: string;
  amountCents: number;
  orderRef: string;
  productType: AffiliateCommissionProductType;
  divinerId?: string | null;
}) {
  const { affiliateCode, amountCents, orderRef, productType, divinerId = null } = params;
  const admin = createAdminClient();

  // Legacy advocate table support
  const { data: advocate } = await admin
    .from("affiliates")
    .select("id, commission_percent, total_referrals, total_earned")
    .eq("referral_code", affiliateCode)
    .eq("is_active", true)
    .maybeSingle();

  if (advocate) {
    const commissionAmount =
      Math.round((amountCents * (Number(advocate.commission_percent) / 100)) / 100);

    await admin.from("affiliate_referrals").insert({
      affiliate_id: advocate.id,
      commission_amount: commissionAmount / 100,
      status: "pending",
      metadata: { order_reference: orderRef, product_type: productType },
    });

    await admin
      .from("affiliates")
      .update({
        total_referrals: (advocate.total_referrals ?? 0) + 1,
        total_earned: Number(advocate.total_earned ?? 0) + commissionAmount / 100,
      })
      .eq("id", advocate.id);

    return;
  }

  const { data: link } = await admin
    .from("affiliate_referral_links")
    .select("id, affiliate_id, diviner_id")
    .eq("slug", affiliateCode)
    .eq("is_active", true)
    .maybeSingle();

  if (!link) return;

  const { data: existingCommission } = await admin
    .from("affiliate_commissions")
    .select("id")
    .eq("order_reference", orderRef)
    .maybeSingle();

  if (existingCommission) return;

  const { data: divAffiliate } = await admin
    .from("diviner_affiliates")
    .select("id, default_commission_type, default_commission_value")
    .eq("id", link.affiliate_id)
    .maybeSingle();

  if (!divAffiliate) return;

  const commissionType = divAffiliate.default_commission_type ?? "percentage";
  const commissionRate = Number(divAffiliate.default_commission_value ?? 0);
  const commissionAmountCents =
    commissionType === "percentage"
      ? Math.round(amountCents * (commissionRate / 100))
      : Math.round(commissionRate);

  await admin.from("affiliate_commissions").insert({
    affiliate_id: divAffiliate.id,
    diviner_id: divinerId ?? link.diviner_id,
    link_id: link.id,
    order_reference: orderRef,
    order_amount_cents: amountCents,
    commission_type: commissionType,
    commission_rate: commissionRate,
    commission_amount_cents: commissionAmountCents,
    status: "pending",
    notes: `${productType} commission`,
  });

  await admin
    .from("affiliate_referral_links")
    .update({ conversions: ((link as { conversions?: number }).conversions ?? 0) + 1 })
    .eq("id", link.id);
}
