import type { SupabaseClient } from "@supabase/supabase-js";

type ServiceWithPricingKey = {
  pricing_item_key?: string | null;
  base_price?: number | null;
  [key: string]: unknown;
};

type PricingPlanRow = {
  item_id: string;
  amount: number | null;
  onetime_amount: number | null;
  sort_order: number | null;
};

function getRuntimeAmountFromPlan(plan: PricingPlanRow | undefined): number | null {
  if (!plan) return null;
  const candidate = plan.onetime_amount ?? plan.amount;
  return typeof candidate === "number" && Number.isFinite(candidate)
    ? Number(candidate)
    : null;
}

export async function getRuntimePriceMapForServices(
  admin: SupabaseClient,
  services: ServiceWithPricingKey[]
): Promise<Map<string, number>> {
  const pricingKeys = Array.from(
    new Set(
      services
        .map((service) =>
          typeof service.pricing_item_key === "string"
            ? service.pricing_item_key.trim()
            : ""
        )
        .filter(Boolean)
    )
  );

  if (pricingKeys.length === 0) {
    return new Map();
  }

  const { data: items, error: itemError } = await admin
    .from("global_pricing")
    .select("id, item_key")
    .in("item_key", pricingKeys)
    .eq("is_active", true);

  if (itemError || !items?.length) {
    return new Map();
  }

  const itemIds = items.map((item) => item.id);
  const { data: plans, error: plansError } = await admin
    .from("pricing_plans")
    .select("item_id, amount, onetime_amount, sort_order")
    .in("item_id", itemIds)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (plansError || !plans?.length) {
    return new Map();
  }

  const firstPlanByItemId = new Map<string, PricingPlanRow>();
  for (const plan of plans as PricingPlanRow[]) {
    if (!firstPlanByItemId.has(plan.item_id)) {
      firstPlanByItemId.set(plan.item_id, plan);
    }
  }

  const runtimePriceMap = new Map<string, number>();
  for (const item of items) {
    const plan = firstPlanByItemId.get(item.id);
    const price = getRuntimeAmountFromPlan(plan);
    if (price != null) {
      runtimePriceMap.set(item.item_key, price);
    }
  }

  return runtimePriceMap;
}

export async function applyRuntimePricesToServices<T extends ServiceWithPricingKey>(
  admin: SupabaseClient,
  services: T[]
): Promise<T[]> {
  if (services.length === 0) return services;

  const runtimePriceMap = await getRuntimePriceMapForServices(admin, services);

  return services.map((service) => {
    const pricingKey =
      typeof service.pricing_item_key === "string"
        ? service.pricing_item_key.trim()
        : "";
    const runtimePrice =
      pricingKey.length > 0 ? runtimePriceMap.get(pricingKey) : undefined;

    if (runtimePrice == null) {
      return service;
    }

    return {
      ...service,
      base_price: runtimePrice,
    };
  });
}
