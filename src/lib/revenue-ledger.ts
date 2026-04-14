import { createAdminClient } from "@/lib/supabase/admin";

export const WEEKLY_SUBSCRIPTION_DIVINER_SHARE_PERCENT = 70;
export const WEEKLY_SUBSCRIPTION_PLATFORM_SHARE_PERCENT = 30;

export type RevenueLedgerSourceType =
  | "booking"
  | "weekly_subscription"
  | "weekly_subscription_invoice"
  | "gift_certificate"
  | "telephony";

export type RevenueLedgerSettlementStatus =
  | "pending"
  | "approved"
  | "held"
  | "paid"
  | "reversed"
  | "disputed";

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
  settlementStatus?: RevenueLedgerSettlementStatus;
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
    settlement_status: params.settlementStatus ?? "approved",
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

export async function getRevenueLedgerEntryByReference(
  sourceType: RevenueLedgerSourceType,
  sourceReference: string,
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("revenue_ledger_entries")
    .select(
      "id, source_type, source_reference, diviner_id, gross_amount_cents, platform_fee_cents, affiliate_commission_cents, diviner_net_amount_cents, settlement_status, settlement_note, settlement_metadata, refunded_gross_amount_cents, refunded_platform_fee_cents, refunded_affiliate_commission_cents, refunded_diviner_net_amount_cents",
    )
    .eq("source_type", sourceType)
    .eq("source_reference", sourceReference)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

type ApplyRefundToRevenueLedgerParams = {
  sourceType: RevenueLedgerSourceType;
  sourceReference: string;
  refundAmountCents: number;
  refundEventId?: string | null;
  actorUserId?: string | null;
  actorRole?: "admin" | "diviner" | "system";
  reason?: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function applyRefundToRevenueLedger(
  params: ApplyRefundToRevenueLedgerParams,
) {
  const admin = createAdminClient();
  const entry = await getRevenueLedgerEntryByReference(
    params.sourceType,
    params.sourceReference,
  );

  if (!entry) {
    throw new Error("Revenue ledger entry not found for refund reconciliation.");
  }

  const grossAmountCents = Number(entry.gross_amount_cents ?? 0);
  const platformFeeCents = Number(entry.platform_fee_cents ?? 0);
  const affiliateCommissionCents = Number(entry.affiliate_commission_cents ?? 0);
  const divinerNetAmountCents = Number(entry.diviner_net_amount_cents ?? 0);

  const refundedGrossAmountCents = Number(entry.refunded_gross_amount_cents ?? 0);
  const refundedPlatformFeeCents = Number(entry.refunded_platform_fee_cents ?? 0);
  const refundedAffiliateCommissionCents = Number(
    entry.refunded_affiliate_commission_cents ?? 0,
  );
  const refundedDivinerNetAmountCents = Number(
    entry.refunded_diviner_net_amount_cents ?? 0,
  );

  const remainingGross = Math.max(0, grossAmountCents - refundedGrossAmountCents);
  const refundAmountCents = clamp(
    Math.round(params.refundAmountCents),
    0,
    remainingGross,
  );

  if (refundAmountCents <= 0) {
    return entry;
  }

  const remainingPlatform = Math.max(0, platformFeeCents - refundedPlatformFeeCents);
  const remainingAffiliate = Math.max(
    0,
    affiliateCommissionCents - refundedAffiliateCommissionCents,
  );
  const remainingDivinerNet = Math.max(
    0,
    divinerNetAmountCents - refundedDivinerNetAmountCents,
  );

  let platformRefund = Math.min(
    remainingPlatform,
    Math.round((platformFeeCents / Math.max(grossAmountCents, 1)) * refundAmountCents),
  );
  let affiliateRefund = Math.min(
    remainingAffiliate,
    Math.round(
      (affiliateCommissionCents / Math.max(grossAmountCents, 1)) * refundAmountCents,
    ),
  );
  let divinerNetRefund = Math.min(
    remainingDivinerNet,
    refundAmountCents - platformRefund - affiliateRefund,
  );

  let allocated = platformRefund + affiliateRefund + divinerNetRefund;
  let remainder = refundAmountCents - allocated;

  if (remainder > 0) {
    const divinerHeadroom = remainingDivinerNet - divinerNetRefund;
    const divinerIncrement = Math.min(divinerHeadroom, remainder);
    divinerNetRefund += divinerIncrement;
    remainder -= divinerIncrement;
  }
  if (remainder > 0) {
    const platformHeadroom = remainingPlatform - platformRefund;
    const platformIncrement = Math.min(platformHeadroom, remainder);
    platformRefund += platformIncrement;
    remainder -= platformIncrement;
  }
  if (remainder > 0) {
    const affiliateHeadroom = remainingAffiliate - affiliateRefund;
    const affiliateIncrement = Math.min(affiliateHeadroom, remainder);
    affiliateRefund += affiliateIncrement;
    remainder -= affiliateIncrement;
  }

  const nextRefundedGross = refundedGrossAmountCents + refundAmountCents;
  const nextRefundedPlatform = refundedPlatformFeeCents + platformRefund;
  const nextRefundedAffiliate =
    refundedAffiliateCommissionCents + affiliateRefund;
  const nextRefundedDivinerNet =
    refundedDivinerNetAmountCents + divinerNetRefund;

  const settlementMetadata = {
    ...(entry.settlement_metadata && typeof entry.settlement_metadata === "object"
      ? (entry.settlement_metadata as Record<string, unknown>)
      : {}),
    lastRefundEventId: params.refundEventId ?? null,
    lastRefundActorRole: params.actorRole ?? null,
    lastRefundReason: params.reason ?? null,
    lastRefundAt: new Date().toISOString(),
  };

  const settlementStatus =
    nextRefundedGross >= grossAmountCents ? "reversed" : entry.settlement_status;

  const { data, error } = await admin
    .from("revenue_ledger_entries")
    .update({
      refunded_gross_amount_cents: nextRefundedGross,
      refunded_platform_fee_cents: nextRefundedPlatform,
      refunded_affiliate_commission_cents: nextRefundedAffiliate,
      refunded_diviner_net_amount_cents: nextRefundedDivinerNet,
      last_refund_at: new Date().toISOString(),
      settlement_status: settlementStatus,
      settlement_note:
        settlementStatus === "reversed"
          ? params.reason ?? "Fully refunded"
          : entry.settlement_note,
      settlement_metadata: settlementMetadata,
      settled_at: settlementStatus === "reversed" ? new Date().toISOString() : null,
      settled_by_user_id:
        settlementStatus === "reversed" && params.actorUserId
          ? params.actorUserId
          : null,
    })
    .eq("id", entry.id)
    .select(
      "id, source_type, source_reference, diviner_id, gross_amount_cents, platform_fee_cents, affiliate_commission_cents, diviner_net_amount_cents, settlement_status, settlement_note, refunded_gross_amount_cents, refunded_platform_fee_cents, refunded_affiliate_commission_cents, refunded_diviner_net_amount_cents",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (params.refundEventId) {
    const { error: refundEventError } = await admin
      .from("refund_events")
      .update({ revenue_ledger_entry_id: entry.id })
      .eq("id", params.refundEventId);

    if (refundEventError) {
      throw new Error(refundEventError.message);
    }
  }

  return data;
}
