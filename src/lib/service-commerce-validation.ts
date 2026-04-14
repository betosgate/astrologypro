import { isDivinerPayoutReadyForPaidServices, isPaidService } from "@/lib/payout-readiness";

type ServiceLike = {
  slug?: string | null;
  duration_minutes?: number | null;
  base_price?: number | null;
  pricing_item_key?: string | null;
  is_active?: boolean | null;
  product_kind?: string | null;
};

type DivinerLike = {
  stripe_account_id?: string | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
};

type PricingLinkState = {
  pricingItemExists: boolean;
  pricingItemActive: boolean;
  hasActivePlan: boolean;
};

export interface ServiceCommerceValidation {
  publicSellable: boolean;
  payoutReady: boolean;
  pricingLinked: boolean;
  hasValidPricingLink: boolean;
  errors: string[];
  warnings: string[];
}

export function evaluateServiceCommerceValidation(
  service: ServiceLike,
  diviner: DivinerLike | null | undefined,
  pricing: PricingLinkState
): ServiceCommerceValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const slug = String(service.slug ?? "").trim();
  const productKind = String(service.product_kind ?? "session").trim() || "session";
  const durationMinutes = Number(service.duration_minutes ?? 0);
  const pricingLinked = Boolean(service.pricing_item_key);
  const payoutReady = isDivinerPayoutReadyForPaidServices(diviner);
  const paidService = isPaidService(service);

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.push("Service slug is missing or invalid.");
  }

  if (productKind === "session" && durationMinutes <= 0) {
    errors.push("Session services must have a positive duration.");
  }

  if (pricingLinked) {
    if (!pricing.pricingItemExists) {
      errors.push("Linked pricing item does not exist.");
    } else {
      if (!pricing.pricingItemActive) {
        errors.push("Linked pricing item is inactive.");
      }
      if (!pricing.hasActivePlan) {
        errors.push("Linked pricing item has no active plan.");
      }
    }
  }

  if (service.is_active && paidService && !payoutReady) {
    errors.push("Paid public selling is blocked until Stripe Connect payouts are ready.");
  }

  if (!pricingLinked && paidService) {
    warnings.push("Paid service is using fallback base_price instead of linked admin pricing.");
  }

  if (pricingLinked && !paidService && pricing.hasActivePlan) {
    warnings.push("Linked pricing exists but the current runtime price resolves to zero.");
  }

  return {
    publicSellable: errors.length === 0,
    payoutReady,
    pricingLinked,
    hasValidPricingLink:
      !pricingLinked || (pricing.pricingItemExists && pricing.pricingItemActive && pricing.hasActivePlan),
    errors,
    warnings,
  };
}
