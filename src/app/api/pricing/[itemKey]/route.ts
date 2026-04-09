import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/pricing/[itemKey]
 *
 * Public read of an active global_pricing row by item_key. Used by signup
 * pages (e.g. /diviner-signup) to display the current price. Public is fine
 * because the values are advertised on the marketing site anyway and the
 * RLS policy on global_pricing allows public SELECT for is_active = true.
 *
 * Response (200): { item_key, item_name, price, currency, description }
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
  const { data, error } = await admin
    .from("global_pricing")
    .select("item_key, item_name, price, currency, description")
    .eq("item_key", itemKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Pricing item not found or inactive" },
      { status: 404 },
    );
  }
  return NextResponse.json(data);
}
