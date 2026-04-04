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

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mandalism_content")
    .select("*")
    .order("priority", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    content_type,
    title,
    description,
    url,
    pdf_url,
    content_body,
    start_at,
    end_at,
    access_control,
    priority,
    is_published,
  } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!content_type) return NextResponse.json({ error: "Content type is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mandalism_content")
    .insert({
      content_type,
      title,
      description,
      url,
      pdf_url,
      content_body,
      start_at,
      end_at,
      access_control: access_control ?? "members",
      priority: priority ?? 0,
      is_published: is_published ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
