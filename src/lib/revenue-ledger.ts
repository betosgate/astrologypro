import { createAdminClient } from "@/lib/supabase/admin";

export const WEEKLY_SUBSCRIPTION_DIVINER_SHARE_PERCENT = 70;
export const WEEKLY_SUBSCRIPTION_PLATFORM_SHARE_PERCENT = 30;

export type RevenueLedgerSourceType =
  | "booking"
  | "weekly_subscription"
  | "weekly_subscription_invoice"
  | "gift_certificate"
  | "telephony";

interface RecordRevenueLedgerEntryParams {
  sourceType: RevenueLedgerSourceType;
  sourceReference: string;
  sourceId?: string | null;
  divinerId?: string | null;
  clientId?: string | null;
  productId?: string | null;
  grossAmountCents: number;
  platformFeeCents: number;
  affiliateCommissionCents?: number;
  currency?: string | null;
  recognizedAt?: string;
  metadata?: Record<string, unknown>;
}

export async function getAffiliateCommissionTotalForOrderRef(orderReference: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("affiliate_commissions")
    .select("commission_amount_cents")
    .eq("order_reference", orderReference);

  if (error) {
    console.error("[revenue-ledger] affiliate commission lookup failed", {
      orderReference,
      error,
    });
    return 0;
  }

  return (data ?? []).reduce(
    (sum, row) => sum + Number(row.commission_amount_cents ?? 0),
    0,
  );
}

export async function recordRevenueLedgerEntry(
  params: RecordRevenueLedgerEntryParams,
) {
  const admin = createAdminClient();
  const grossAmountCents = Math.max(0, Math.round(params.grossAmountCents));
  const platformFeeCents = Math.max(0, Math.round(params.platformFeeCents));
  const affiliateCommissionCents = Math.max(
    0,
    Math.round(params.affiliateCommissionCents ?? 0),
  );
  const divinerGrossAmountCents = Math.max(0, grossAmountCents - platformFeeCents);
  const divinerNetAmountCents = Math.max(
    0,
    divinerGrossAmountCents - affiliateCommissionCents,
  );
  const platformNetAmountCents = platformFeeCents;

  const payload = {
    source_type: params.sourceType,
    source_reference: params.sourceReference,
    source_id: params.sourceId ?? null,
    diviner_id: params.divinerId ?? null,
    client_id: params.clientId ?? null,
    product_id: params.productId ?? null,
    gross_amount_cents: grossAmountCents,
    platform_fee_cents: platformFeeCents,
    diviner_gross_amount_cents: divinerGrossAmountCents,
    affiliate_commission_cents: affiliateCommissionCents,
    diviner_net_amount_cents: divinerNetAmountCents,
    platform_net_amount_cents: platformNetAmountCents,
    currency: (params.currency ?? "usd").toLowerCase(),
    recognized_at: params.recognizedAt ?? new Date().toISOString(),
    metadata: params.metadata ?? {},
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from("revenue_ledger_entries")
    .upsert(payload, { onConflict: "source_type,source_reference" });

  if (error) {
    throw new Error(error.message);
  }
}
