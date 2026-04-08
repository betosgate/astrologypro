import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET  /api/admin/pricing                — list all rows (admin)
 * POST /api/admin/pricing                — create a new pricing row (admin)
 *   Body: { item_key, item_name, price, currency?, description?, is_active? }
 *
 * Per-item edit/delete lives at /api/admin/pricing/[id].
 */

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("global_pricing")
    .select("id, item_key, item_name, price, currency, description, is_active, created_at, updated_at")
    .order("item_key", { ascending: true });

  if (error) {
    console.error("[admin/pricing GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const itemKey = String(body.item_key ?? "").trim();
  const itemName = String(body.item_name ?? "").trim();
  const priceRaw = body.price;
  const currencyRaw = body.currency;

  if (!itemKey) {
    return NextResponse.json({ error: "item_key is required" }, { status: 422 });
  }
  if (!itemName) {
    return NextResponse.json({ error: "item_name is required" }, { status: 422 });
  }
  const price = typeof priceRaw === "number" ? priceRaw : Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json(
      { error: "price must be a non-negative number" },
      { status: 422 },
    );
  }
  const currency = currencyRaw === "USD" ? "USD" : "INR";

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("global_pricing")
    .insert({
      item_key: itemKey,
      item_name: itemName,
      price,
      currency,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      is_active: typeof body.is_active === "boolean" ? body.is_active : true,
    })
    .select()
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "An item with this item_key already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data }, { status: 201 });
}
