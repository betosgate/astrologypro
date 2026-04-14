import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateServiceCommerceValidation } from "@/lib/service-commerce-validation";

export const dynamic = "force-dynamic";

const SELECT_COLS = "*";

async function loadCommerceContext(
  admin: ReturnType<typeof createAdminClient>,
  services: Array<Record<string, unknown>>
) {
  const divinerIds = Array.from(
    new Set(
      services
        .map((service) =>
          typeof service.diviner_id === "string" ? service.diviner_id : ""
        )
        .filter(Boolean)
    )
  );
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

  const [{ data: diviners }, { data: pricingItems }] = await Promise.all([
    divinerIds.length > 0
      ? admin
          .from("diviners")
          .select("id, stripe_account_id, charges_enabled, payouts_enabled")
          .in("id", divinerIds)
      : Promise.resolve({ data: [] }),
    pricingKeys.length > 0
      ? admin
          .from("global_pricing")
          .select("id, item_key, is_active")
          .in("item_key", pricingKeys)
      : Promise.resolve({ data: [] }),
  ]);

  const pricingItemIds = (pricingItems ?? []).map((item) => item.id);
  const { data: pricingPlans } = pricingItemIds.length
    ? await admin
        .from("pricing_plans")
        .select("item_id, is_active")
        .in("item_id", pricingItemIds)
        .eq("is_active", true)
    : { data: [] };

  const divinerMap = new Map((diviners ?? []).map((diviner) => [diviner.id, diviner]));
  const pricingItemMap = new Map(
    (pricingItems ?? []).map((item) => [item.item_key, item])
  );
  const activePlanCountByItemId = new Map<string, number>();
  for (const plan of pricingPlans ?? []) {
    activePlanCountByItemId.set(
      plan.item_id,
      (activePlanCountByItemId.get(plan.item_id) ?? 0) + 1
    );
  }

  return { divinerMap, pricingItemMap, activePlanCountByItemId };
}

/**
 * GET /api/admin/services
 * List all services across all diviners. Supports pagination + search.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20", 10)));
  const search = sp.get("search")?.trim() || null;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const admin = createAdminClient();
  let query = admin.from("services").select(SELECT_COLS, { count: "exact" });

  if (search) {
    const pattern = `%${search.replace(/[%_]/g, (c) => `\\${c}`)}%`;
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
  }

  const { data, count, error } = await query
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const services = (data ?? []) as Array<Record<string, unknown>>;
  const { divinerMap, pricingItemMap, activePlanCountByItemId } =
    await loadCommerceContext(admin, services);

  return NextResponse.json({
    services: services.map((service) => {
      const pricingKey =
        typeof service.pricing_item_key === "string"
          ? service.pricing_item_key.trim()
          : "";
      const pricingItem = pricingKey ? pricingItemMap.get(pricingKey) : null;
      return {
        ...service,
        commerce_validation: evaluateServiceCommerceValidation(
          service,
          typeof service.diviner_id === "string"
            ? divinerMap.get(service.diviner_id)
            : null,
          {
            pricingItemExists: Boolean(pricingItem),
            pricingItemActive: pricingItem?.is_active === true,
            hasActivePlan: pricingItem
              ? (activePlanCountByItemId.get(pricingItem.id) ?? 0) > 0
              : false,
          }
        ),
      };
    }),
    total: count ?? 0,
    page,
    pageSize,
  });
}

/**
 * POST /api/admin/services
 * Create a new service.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const diviner_id = typeof body.diviner_id === "string" ? body.diviner_id : null;
  const category = typeof body.category === "string" ? body.category : "astrology";
  const description = typeof body.description === "string" ? body.description.trim() : null;
  const duration_minutes = typeof body.duration_minutes === "number" ? body.duration_minutes : 60;
  const base_price = typeof body.base_price === "number" ? body.base_price : 0;
  const overage_rate = typeof body.overage_rate === "number" ? body.overage_rate : 0.50;

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 422 });
  if (!diviner_id) return NextResponse.json({ error: "diviner_id is required." }, { status: 422 });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const admin = createAdminClient();
  const pricing_item_key = typeof body.pricing_item_key === "string" ? body.pricing_item_key.trim() || null : null;
  const platform_fee_percent = typeof body.platform_fee_percent === "number" ? body.platform_fee_percent : null;
  const is_active = body.is_active !== false;

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, stripe_account_id, charges_enabled, payouts_enabled")
    .eq("id", diviner_id)
    .maybeSingle();

  if (!diviner) {
    return NextResponse.json({ error: "Assigned diviner not found." }, { status: 422 });
  }

  let pricingItem: { id: string; is_active: boolean } | null = null;
  if (pricing_item_key) {
    const { data } = await admin
      .from("global_pricing")
      .select("id, is_active")
      .eq("item_key", pricing_item_key)
      .maybeSingle();
    pricingItem = data ?? null;
  }

  let hasActivePlan = false;
  if (pricingItem) {
    const { count } = await admin
      .from("pricing_plans")
      .select("*", { count: "exact", head: true })
      .eq("item_id", pricingItem.id)
      .eq("is_active", true);
    hasActivePlan = (count ?? 0) > 0;
  }

  const validation = evaluateServiceCommerceValidation(
    {
      slug,
      duration_minutes,
      base_price,
      pricing_item_key,
      is_active,
      product_kind: typeof body.product_kind === "string" ? body.product_kind : "session",
    },
    diviner,
    {
      pricingItemExists: Boolean(pricingItem),
      pricingItemActive: pricingItem?.is_active === true,
      hasActivePlan,
    }
  );

  if (is_active && validation.errors.length > 0) {
    return NextResponse.json(
      { error: validation.errors[0], validation },
      { status: 422 }
    );
  }

  const { data, error } = await admin.from("services").insert({
    diviner_id,
    name,
    slug,
    category,
    description,
    duration_minutes,
    base_price,
    overage_rate,
    pricing_item_key,
    platform_fee_percent,
    is_active,
    is_featured: !!body.is_featured,
    is_primary: body.is_primary !== false,
    requires_birth_data: body.requires_birth_data !== false,
    sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data }, { status: 201 });
}
