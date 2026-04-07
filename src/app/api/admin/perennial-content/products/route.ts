import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";
  const category_id = searchParams.get("category_id") ?? "";

  const admin = createAdminClient();
  let query = admin
    .from("perennial_products")
    .select(
      "id, name, description, mrp, offer_price, preorder_price, priority, category_id, status, main_image_url, details_image_url, is_visible, created_at, updated_at, perennial_product_categories(id, title)"
    )
    .order("priority", { ascending: false })
    .order("id", { ascending: true });

  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("name", `%${search}%`);
  if (category_id) query = query.eq("category_id", category_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name, description, mrp, offer_price, preorder_price,
    priority, category_id, status,
    main_image_url, details_image_url, is_visible,
  } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 422 });
  }
  if (mrp == null || isNaN(Number(mrp))) {
    return NextResponse.json({ error: "mrp must be a number" }, { status: 422 });
  }
  if (offer_price == null || isNaN(Number(offer_price))) {
    return NextResponse.json({ error: "offer_price must be a number" }, { status: 422 });
  }
  if (preorder_price == null || isNaN(Number(preorder_price))) {
    return NextResponse.json({ error: "preorder_price must be a number" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("perennial_products")
    .insert({
      name: name.trim(),
      description: description || "",
      mrp: Number(mrp),
      offer_price: Number(offer_price),
      preorder_price: Number(preorder_price),
      priority: priority ?? 0,
      category_id: category_id || null,
      status: status || "active",
      main_image_url: main_image_url || null,
      details_image_url: details_image_url || null,
      is_visible: is_visible !== false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
