import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";



export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("astro_decan_info")
    .select("*, wheel_signs(title)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { sign_id, sign_name, planet, tarot_name, greek_daemon, decan, description, is_active } = body;

  if (!sign_name) return NextResponse.json({ error: "Sign name is required" }, { status: 400 });
  if (!planet) return NextResponse.json({ error: "Planet is required" }, { status: 400 });
  if (!tarot_name) return NextResponse.json({ error: "Tarot name is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("astro_decan_info")
    .insert({ sign_id, sign_name, planet, tarot_name, greek_daemon, decan, description, is_active })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
