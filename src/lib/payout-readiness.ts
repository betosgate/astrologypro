type DivinerPayoutShape = {
  stripe_account_id?: string | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
};

type ServicePriceShape = {
  base_price?: number | null;
};

export function isPaidService(service: ServicePriceShape | null | undefined): boolean {
  return Number(service?.base_price ?? 0) > 0;
}

export function isDivinerPayoutReadyForPaidServices(
  diviner: DivinerPayoutShape | null | undefined
): boolean {
  return Boolean(
    diviner?.stripe_account_id &&
      diviner?.charges_enabled === true &&
      diviner?.payouts_enabled === true
  );
}

export function canPubliclySellService(
  service: ServicePriceShape | null | undefined,
  diviner: DivinerPayoutShape | null | undefined
): boolean {
  if (!isPaidService(service)) {
    return true;
  }

  return isDivinerPayoutReadyForPaidServices(diviner);
}
