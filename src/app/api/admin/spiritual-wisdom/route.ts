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

  const sp = req.nextUrl.searchParams;
  const createdFrom = sp.get("created_from");
  const createdTo = sp.get("created_to");
  const updatedFrom = sp.get("updated_from");
  const updatedTo = sp.get("updated_to");

  const admin = createAdminClient();
  let query = admin
    .from("spiritual_wisdom")
    .select("*")
    .order("priority", { ascending: true });

  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo + "T23:59:59");
  if (updatedFrom) query = query.gte("updated_at", updatedFrom);
  if (updatedTo) query = query.lte("updated_at", updatedTo + "T23:59:59");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, descriptive_title, content, image_url, youtube_url, type, priority, is_active } = body;

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("spiritual_wisdom")
    .insert({ title, descriptive_title: descriptive_title ?? null, content: content ?? null, image_url: image_url ?? null, youtube_url: youtube_url ?? null, type: type ?? "text", priority: priority ?? 0, is_active: is_active ?? true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
