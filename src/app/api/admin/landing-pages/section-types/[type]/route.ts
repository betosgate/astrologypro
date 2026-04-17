/**
 * PATCH /api/admin/landing-pages/section-types/[type]
 * Update admin-controlled limits for a section type.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ type: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { type } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: 401, title: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminUser) return NextResponse.json({ status: 403, title: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 422, title: "Invalid JSON" }, { status: 422 });
  }

  const allowed = [
    "is_globally_enabled", "max_per_page", "max_body_length",
    "max_image_size_bytes", "max_images_per_section",
    "allowed_image_types", "allowed_video_sources",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ status: 422, title: "No valid fields to update" }, { status: 422 });
  }

  const { data: updated, error } = await admin
    .from("section_type_config")
    .update(updates)
    .eq("type", type)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ status: 500, title: "Update failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ section_type: updated });
}
