import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";
import { requireDecanEligibilityOr403 } from "@/lib/mystery-school/decan-gate";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["text", "audio", "video", "image", "mixed"]);
const ALLOWED_INITIAL_STATUS = new Set(["draft", "submitted"]);

/**
 * GET /api/mystery-school/decan/[id]/journal-entries
 * Returns the current student's optional Decan journal entries (any status).
 *
 * Sprint: docs/tasks/2026-05-06/mystery-school-decan-admin-content-upgrade.md
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json(
      { error: "Mystery School access required" },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const gate = await requireDecanEligibilityOr403(admin, user.id);
  if (gate) return gate;

  const { id: decanId } = await params;

  const { data, error } = await admin
    .from("decan_student_journal_entries")
    .select(
      "id, decan_id, title, content, entry_type, audio_url, video_url, image_url, status, submitted_at, reviewed_at, feedback_text, rating, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .eq("decan_id", decanId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

/**
 * POST /api/mystery-school/decan/[id]/journal-entries
 * Body: { title?, content?, entry_type, audio_url?, video_url?, image_url?, status }
 *
 * Creates an optional Decan journal entry. `status` may be 'draft' or
 * 'submitted'. Server stamps submitted_at when status='submitted'.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json(
      { error: "Mystery School access required" },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const gate = await requireDecanEligibilityOr403(admin, user.id);
  if (gate) return gate;

  const { id: decanId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const entryType =
    typeof body.entry_type === "string" ? body.entry_type : "text";
  if (!ALLOWED_TYPES.has(entryType)) {
    return NextResponse.json(
      { error: `entry_type must be one of: ${Array.from(ALLOWED_TYPES).join(", ")}` },
      { status: 422 },
    );
  }

  const status =
    typeof body.status === "string" ? body.status : "draft";
  if (!ALLOWED_INITIAL_STATUS.has(status)) {
    return NextResponse.json(
      { error: "status must be 'draft' or 'submitted'" },
      { status: 422 },
    );
  }

  // Resolve student_id from mystery_school_students.
  const { data: studentRow } = await admin
    .from("mystery_school_students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const studentId = (studentRow as { id?: string } | null)?.id ?? null;
  if (!studentId) {
    return NextResponse.json(
      { error: "Mystery School student record not found" },
      { status: 404 },
    );
  }

  const nowIso = new Date().toISOString();
  const { data: inserted, error } = await admin
    .from("decan_student_journal_entries")
    .insert({
      student_id: studentId,
      user_id: user.id,
      decan_id: decanId,
      title: typeof body.title === "string" ? body.title : null,
      content: typeof body.content === "string" ? body.content : null,
      entry_type: entryType,
      audio_url: typeof body.audio_url === "string" ? body.audio_url : null,
      video_url: typeof body.video_url === "string" ? body.video_url : null,
      image_url: typeof body.image_url === "string" ? body.image_url : null,
      status,
      submitted_at: status === "submitted" ? nowIso : null,
    })
    .select(
      "id, decan_id, title, content, entry_type, audio_url, video_url, image_url, status, submitted_at, created_at, updated_at",
    )
    .single();

  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create journal entry" },
      { status: 500 },
    );
  }

  return NextResponse.json({ entry: inserted }, { status: 201 });
}
