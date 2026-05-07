import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = new Set([
  "title",
  "decan_name",
  "sign",
  "planet",
  "decan_number",
  "start_month",
  "start_day",
  "end_month",
  "end_day",
  "astronomical_start",
  "astronomical_end",
  "tarot_card_ref",
  "tarot_explanation",
  "artwork_url",
  "preview_text",
  "description",
  "learning_objectives",
  "practice_focus_title",
  "practice_focus_instructions",
  "practice_focus_technique",
  "intro_video_url",
  "intro_audio_url",
  "ritual_video_url",
  "related_audio_url",
  "content_active",
]);

/**
 * GET /api/admin/mystery-school/decans/[id]
 * Returns a single decan with rituals + resources + instructor journals
 * (all rows, including unpublished — admin needs the full picture).
 *
 * Sprint: docs/tasks/2026-05-06/mystery-school-decan-admin-content-upgrade.md
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const admin = createAdminClient();
  const [decanRes, ritualsRes, resourcesRes, instructorRes] = await Promise.all([
    admin.from("decans").select("*").eq("id", id).maybeSingle(),
    admin
      .from("decan_rituals")
      .select("id, step_order, step_type, content, is_published, created_at, updated_at")
      .eq("decan_id", id)
      .order("step_order", { ascending: true }),
    admin
      .from("decan_resources")
      .select("*")
      .eq("decan_id", id)
      .order("sort_order", { ascending: true }),
    admin
      .from("decan_instructor_journals")
      .select("*")
      .eq("decan_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (decanRes.error) {
    return NextResponse.json({ error: decanRes.error.message }, { status: 500 });
  }
  if (!decanRes.data) {
    return NextResponse.json({ error: "Decan not found" }, { status: 404 });
  }

  return NextResponse.json({
    decan: decanRes.data,
    rituals: ritualsRes.data ?? [],
    resources: resourcesRes.data ?? [],
    instructor_journals: instructorRes.data ?? [],
  });
}

/**
 * PUT /api/admin/mystery-school/decans/[id]
 * Body: any subset of EDITABLE_FIELDS — server-side allowlist enforced.
 * Updates content_updated_at automatically.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (EDITABLE_FIELDS.has(k)) patch[k] = v;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No editable fields supplied" }, { status: 422 });
  }
  patch.content_updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("decans")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to update decan" },
      { status: 500 },
    );
  }

  return NextResponse.json({ decan: updated });
}
