import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";



export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const search = sp.get("search")?.trim() ?? "";
  const startFrom = sp.get("start_date_from") ?? "";
  const startTo = sp.get("start_date_to") ?? "";

  const admin = createAdminClient();
  let query = admin.from("wheel_signs").select("*").order("priority", { ascending: true });

  if (search) query = query.ilike("title", `%${search}%`);
  if (startFrom) query = query.gte("start_date", startFrom);
  if (startTo) query = query.lte("start_date", startTo);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, start_date, end_date, theme_image, icon_image, priority, is_active } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("wheel_signs")
    .insert({ title, start_date, end_date, theme_image, icon_image, priority, is_active })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
