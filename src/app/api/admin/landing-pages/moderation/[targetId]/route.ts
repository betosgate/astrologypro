/**
 * PATCH /api/admin/landing-pages/moderation/[targetId]
 * Approve, flag, or reject a landing page or section.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ targetId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { targetId } = await params;

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

  let body: { target_type?: string; moderation_status?: string; moderation_note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 422, title: "Invalid JSON" }, { status: 422 });
  }

  const { target_type, moderation_status, moderation_note } = body;

  // V2: only per-block moderation exists. Page-level container was removed.
  if (target_type !== "section") {
    return NextResponse.json(
      { status: 422, title: "target_type must be 'section'" },
      { status: 422 },
    );
  }

  const validStatuses = ["approved", "pending_review", "flagged", "rejected"];
  if (!validStatuses.includes(moderation_status ?? "")) {
    return NextResponse.json({ status: 422, title: `moderation_status must be one of: ${validStatuses.join(", ")}` }, { status: 422 });
  }

  const updates: Record<string, unknown> = {
    moderation_status,
    moderation_note: moderation_note ?? null,
  };

  // Rejected section → disable
  if (moderation_status === "rejected") {
    updates.is_enabled = false;
  }

  const { data: updated, error } = await admin
    .from("diviner_service_blocks")
    .update(updates)
    .eq("id", targetId)
    .select("id, section_type, moderation_status, is_enabled")
    .single();

  if (error) {
    return NextResponse.json({ status: 500, title: "Update failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ target_type: "section", record: updated });
}
