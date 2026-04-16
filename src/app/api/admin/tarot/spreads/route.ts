import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";



export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tarot_spreads")
    .select("*")
    .order("priority", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, card_count, priority, image_url, layout_json, is_active } = body;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 422 });

  const insertData: Record<string, unknown> = { name, description, card_count, priority, image_url: image_url ?? null, is_active };
  if (layout_json !== undefined) insertData.layout_json = layout_json;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tarot_spreads")
    .insert(insertData)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
