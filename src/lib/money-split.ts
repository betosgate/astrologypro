export type MoneySplitTrace = {
  platformFeePercent: number;
  grossAmountCents: number;
  platformFeeRule: string;
  affiliateRule: string;
  affiliateShareCapPercent?: number | null;
  memberDiscountApplied?: boolean;
};

export type CalculatedMoneySplit = {
  grossAmountCents: number;
  platformFeeCents: number;
  divinerGrossAmountCents: number;
  affiliateCommissionCents: number;
  divinerNetAmountCents: number;
  platformNetAmountCents: number;
  trace: MoneySplitTrace;
};

export function calculateMoneySplit(params: {
  grossAmountCents: number;
  platformFeePercent: number;
  affiliateCommissionCents?: number;
  platformFeeRule?: string;
  affiliateRule?: string;
  affiliateShareCapPercent?: number | null;
  memberDiscountApplied?: boolean;
}): CalculatedMoneySplit {
  const grossAmountCents = Math.max(0, Math.round(params.grossAmountCents));
  const platformFeePercent = Number.isFinite(params.platformFeePercent)
    ? Math.max(0, params.platformFeePercent)
    : 0;
  const platformFeeCents = Math.max(
    0,
    Math.round(grossAmountCents * (platformFeePercent / 100)),
  );
  const divinerGrossAmountCents = Math.max(0, grossAmountCents - platformFeeCents);
  const affiliateCommissionCents = Math.max(
    0,
    Math.min(
      divinerGrossAmountCents,
      Math.round(params.affiliateCommissionCents ?? 0),
    ),
  );
  const divinerNetAmountCents = Math.max(
    0,
    divinerGrossAmountCents - affiliateCommissionCents,
  );

  return {
    grossAmountCents,
    platformFeeCents,
    divinerGrossAmountCents,
    affiliateCommissionCents,
    divinerNetAmountCents,
    platformNetAmountCents: platformFeeCents,
    trace: {
      platformFeePercent,
      grossAmountCents,
      platformFeeRule: params.platformFeeRule ?? "default_platform_fee_percent",
      affiliateRule: params.affiliateRule ?? "no_affiliate_share",
      affiliateShareCapPercent: params.affiliateShareCapPercent ?? null,
      memberDiscountApplied: params.memberDiscountApplied === true,
    },
  };
}
