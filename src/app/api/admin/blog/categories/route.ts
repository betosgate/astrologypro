import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET(_req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_categories")
    .select("id, name, slug, description, parent_id, sort_order, is_active, created_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, slug: slugInput, description, parent_id, sort_order = 0, is_active = true } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 422 });
  }

  const slug = slugInput?.trim() || toSlug(name.trim());

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_categories")
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      parent_id: parent_id || null,
      sort_order,
      is_active,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
