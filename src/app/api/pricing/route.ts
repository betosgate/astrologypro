import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/pricing?keys=key1,key2,...
 *
 * Public read of multiple active global_pricing items with their active plans.
 * Used by signup/pricing pages to display available products and plans.
 *
 * Response (200): { items: [{ item_key, item_name, description, html_description, plans: [...] }, ...] }
 */
export async function GET(req: NextRequest) {
  const keysParam = req.nextUrl.searchParams.get("keys")?.trim();
  if (!keysParam) {
    return NextResponse.json({ error: "keys parameter is required (comma-separated item_keys)" }, { status: 400 });
  }

  const keys = keysParam.split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    return NextResponse.json({ error: "At least one key is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch items
  const { data: items, error: itemsErr } = await admin
    .from("global_pricing")
    .select("id, item_key, item_name, description, html_description")
    .in("item_key", keys)
    .eq("is_active", true)
    .order("item_key", { ascending: true });

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }
  if (!items || items.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Fetch plans for all items in one query
  const itemIds = items.map((i) => i.id);
  const { data: plans, error: plansErr } = await admin
    .from("pricing_plans")
    .select("plan_id, item_id, display_name, amount, mrp, stripe_price_id, currency, description, html_description, custom_fields, sort_order, onetime_amount, onetime_currency, recurring_amount, recurring_currency, recurring_interval")
    .in("item_id", itemIds)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (plansErr) {
    return NextResponse.json({ error: plansErr.message }, { status: 500 });
  }

  // Group plans by item_id
  const plansByItem: Record<string, typeof plans> = {};
  for (const plan of plans ?? []) {
    const key = plan.item_id as string;
    if (!plansByItem[key]) plansByItem[key] = [];
    plansByItem[key].push(plan);
  }

  // Build response maintaining the requested key order
  const result = keys
    .map((key) => {
      const item = items.find((i) => i.item_key === key);
      if (!item) return null;
      return {
        item_key: item.item_key,
        item_name: item.item_name,
        description: item.description,
        html_description: item.html_description,
        plans: (plansByItem[item.id] ?? []).map(({ item_id, ...rest }) => rest),
      };
    })
    .filter(Boolean);

  return NextResponse.json({ items: result });
}
