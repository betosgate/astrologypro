import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const divinerId = sp.get("diviner_id");

  const admin = createAdminClient();
  let query = admin
    .from("availability_templates")
    .select("*, diviners(id, display_name, username)")
    .order("created_at", { ascending: false });

  if (divinerId) query = query.eq("diviner_id", divinerId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { diviner_id, title, start_date, end_date, weekdays, start_time, end_time, timezone, duration_minutes, description, is_active } = body;

  if (!diviner_id || !start_date || !end_date || !weekdays || !start_time || !end_time || !timezone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("availability_templates")
    .insert({
      diviner_id,
      title: title || "Available",
      start_date,
      end_date,
      weekdays,
      start_time,
      end_time,
      timezone,
      duration_minutes: duration_minutes || 60,
      description: description || null,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}
