import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const session_type = searchParams.get("session_type") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const admin = createAdminClient();
  let query = admin
    .from("class_configurations")
    .select("id, class_name, description, session_type, max_participants, duration_minutes, quarter_id, status, priority, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (session_type) query = query.eq("session_type", session_type);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { class_name, description, session_type, max_participants, duration_minutes, quarter_id, priority, status } = body;

  if (!class_name) {
    return NextResponse.json({ error: "class_name is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("class_configurations")
    .insert({
      class_name,
      description: description || null,
      session_type: session_type || "live",
      max_participants: max_participants ?? null,
      duration_minutes: duration_minutes ?? null,
      quarter_id: quarter_id || null,
      priority: priority ?? 0,
      status: status || "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
