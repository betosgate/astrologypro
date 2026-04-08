import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/doctrine-links ───────────────────────────────────────────

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("doctrine_links")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// ─── POST /api/admin/doctrine-links ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { label, description, url, link_type, icon, sort_order, is_active } = body;

  if (!label || typeof label !== "string" || label.trim() === "") {
    return NextResponse.json({ error: "label is required" }, { status: 422 });
  }
  if (!url || typeof url !== "string" || url.trim() === "") {
    return NextResponse.json({ error: "url is required" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("doctrine_links")
    .insert({
      label: label.trim(),
      description: description ?? null,
      url: url.trim(),
      link_type: link_type ?? "study",
      icon: icon ?? null,
      sort_order: typeof sort_order === "number" ? sort_order : 0,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
