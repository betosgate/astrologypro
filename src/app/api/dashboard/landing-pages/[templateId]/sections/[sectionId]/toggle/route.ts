/**
 * PATCH /api/dashboard/landing-pages/[templateId]/sections/[sectionId]/toggle
 *
 * Toggle a block's `is_enabled` flag. Under V2 every block is diviner-owned
 * (there is no "system" block concept), so there is no is_removable guard.
 *
 * Rewritten in Task 03 of the 2026-04-21 landing-page-simplification.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string; sectionId: string }>;
}

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, ...(detail ? { detail } : {}) },
    { status },
  );
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { sectionId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) return problem(403, "Forbidden");

  let body: { is_enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return problem(422, "Invalid JSON");
  }

  if (typeof body.is_enabled !== "boolean") {
    return problem(422, "Invalid is_enabled", "`is_enabled` must be boolean.");
  }

  const { data: block } = await admin
    .from("diviner_service_blocks")
    .select("id, section_type, slot")
    .eq("id", sectionId)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!block) return problem(404, "Block not found");

  const { data: updated, error } = await admin
    .from("diviner_service_blocks")
    .update({ is_enabled: body.is_enabled, updated_by: user.id })
    .eq("id", sectionId)
    .eq("diviner_id", diviner.id)
    .select(
      "id, diviner_id, section_type, slot, title, content_json, body_html, primary_image_url, display_order, is_enabled, moderation_status, moderation_note, created_at, updated_at",
    )
    .single();

  if (error || !updated) {
    return problem(500, "Update failed", error?.message ?? "unknown error");
  }

  return NextResponse.json({ block: updated });
}
