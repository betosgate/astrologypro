import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/pricing/[itemKey]
 *
 * Public read of an active global_pricing item and its active plans.
 * Used by signup pages to display available plans and prices.
 *
 * Response (200): { item_key, item_name, description, plans: [...] }
 * Response (404): { error: "Pricing item not found or inactive" }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemKey: string }> },
) {
  const { itemKey } = await params;
  if (!itemKey) {
    return NextResponse.json({ error: "itemKey is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch the item
  const { data: item, error: itemErr } = await admin
    .from("global_pricing")
    .select("id, item_key, item_name, description, html_description")
    .eq("item_key", itemKey)
    .eq("is_active", true)
    .maybeSingle();

  if (itemErr) {
    return NextResponse.json({ error: itemErr.message }, { status: 500 });
  }
  if (!item) {
    return NextResponse.json(
      { error: "Pricing item not found or inactive" },
      { status: 404 },
    );
  }

  // Fetch active plans for this item
  const { data: plans, error: plansErr } = await admin
    .from("pricing_plans")
    .select("plan_id, display_name, amount, mrp, stripe_price_id, currency, description, html_description, custom_fields, sort_order, onetime_amount, onetime_currency, recurring_amount, recurring_currency, recurring_interval")
    .eq("item_id", item.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (plansErr) {
    return NextResponse.json({ error: plansErr.message }, { status: 500 });
  }

  return NextResponse.json({
    item_key: item.item_key,
    item_name: item.item_name,
    description: item.description,
    html_description: item.html_description,
    plans: plans ?? [],
  });
}
