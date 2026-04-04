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
  const createdFrom = sp.get("created_from");
  const createdTo = sp.get("created_to");

  const admin = createAdminClient();
  let query = admin
    .from("webinars")
    .select("*")
    .order("scheduled_at", { ascending: false });

  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo + "T23:59:59");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, description, host_name, scheduled_at, duration_mins, join_url, recording_url, is_free, price, is_active } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!host_name) return NextResponse.json({ error: "Host name is required" }, { status: 400 });
  if (!scheduled_at) return NextResponse.json({ error: "Scheduled at is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("webinars")
    .insert({ title, description, host_name, scheduled_at, duration_mins, join_url, recording_url, is_free, price, is_active })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
