import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return null;
  return user;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const startFrom = sp.get("start_date_from");
  const startTo = sp.get("start_date_to");
  const category = sp.get("category");

  const admin = createAdminClient();
  let query = admin
    .from("calendar_events")
    .select("*")
    .order("start_at", { ascending: false });

  if (startFrom) query = query.gte("start_at", startFrom);
  if (startTo) query = query.lte("start_at", startTo + "T23:59:59");
  if (category) query = query.ilike("category", `%${category}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, description, category, start_at, end_at, display_for, priority, is_active } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!start_at) return NextResponse.json({ error: "Start date is required" }, { status: 400 });
  if (!display_for) return NextResponse.json({ error: "Audience (display_for) is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("calendar_events")
    .insert({ title, description, category, start_at, end_at, display_for, priority: priority ?? 0, is_active: is_active ?? true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
