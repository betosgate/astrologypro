import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET  /api/admin/pricing/[id]/plans   — list plans for a pricing item
 * POST /api/admin/pricing/[id]/plans   — create a new plan under this item
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pricing_plans")
    .select("*")
    .eq("item_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin/pricing/plans GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ plans: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const displayName = String(body.display_name ?? "").trim();
  if (!displayName) {
    return NextResponse.json({ error: "display_name is required" }, { status: 422 });
  }

  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "amount must be a non-negative number" }, { status: 422 });
  }

  let mrp: number | null = null;
  if (body.mrp !== undefined && body.mrp !== null && body.mrp !== "") {
    mrp = typeof body.mrp === "number" ? body.mrp : Number(body.mrp);
    if (!Number.isFinite(mrp) || mrp < 0) {
      return NextResponse.json({ error: "mrp must be a non-negative number" }, { status: 422 });
    }
  }

  const currency = body.currency === "USD" ? "USD" : "INR";
  const stripePriceId = typeof body.stripe_price_id === "string" ? body.stripe_price_id.trim() || null : null;
  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  const sortOrder = typeof body.sort_order === "number" ? body.sort_order : 0;

  let customFields: unknown[] = [];
  if (body.custom_fields !== undefined) {
    if (!Array.isArray(body.custom_fields)) {
      return NextResponse.json({ error: "custom_fields must be an array" }, { status: 422 });
    }
    for (const f of body.custom_fields) {
      if (!f || typeof f !== "object" || !f.label || !f.value || !f.slug) {
        return NextResponse.json({ error: "Each custom field must have label, value, and slug" }, { status: 422 });
      }
    }
    customFields = body.custom_fields;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pricing_plans")
    .insert({
      item_id: id,
      display_name: displayName,
      amount,
      mrp,
      stripe_price_id: stripePriceId,
      stripe_price_name: typeof body.stripe_price_name === "string" ? body.stripe_price_name.trim() || null : null,
      currency,
      description,
      sort_order: sortOrder,
      is_active: typeof body.is_active === "boolean" ? body.is_active : true,
      custom_fields: customFields,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/pricing/plans POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ plan: data }, { status: 201 });
}
