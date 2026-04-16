import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";



export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const createdFrom = sp.get("created_from") ?? "";
  const createdTo = sp.get("created_to") ?? "";

  const admin = createAdminClient();
  let query = admin
    .from("tarot_cards")
    .select("*, tarot_spreads(name)")
    .order("created_at", { ascending: false });

  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo + "T23:59:59");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name, description, arcana, suit, number,
    priority, upright_meaning, reversed_meaning,
    image_url, card_image_url, related_spread_ids,
    spread_id, is_active,
  } = body;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 422 });
  if (priority === undefined || priority === null || priority === "")
    return NextResponse.json({ error: "Priority is required" }, { status: 422 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tarot_cards")
    .insert({
      name, description, arcana, suit, number,
      priority: Number(priority),
      upright_meaning, reversed_meaning,
      image_url,
      card_image_url: card_image_url ?? null,
      related_spread_ids: related_spread_ids ?? null,
      spread_id: spread_id ?? null,
      is_active,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
