import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";
import { requireDecanEligibilityOr403 } from "@/lib/mystery-school/decan-gate";

export const dynamic = "force-dynamic";

const EDITABLE_STATUSES = new Set(["draft", "revision_requested"]);
const ALLOWED_NEW_STATUS = new Set(["draft", "submitted"]);

/**
 * PUT /api/mystery-school/decan/[id]/journal-entries/[entryId]
 * Body: { title?, content?, entry_type?, audio_url?, video_url?, image_url?, status? }
 *
 * Updates a student's optional Decan journal entry. Only entries in
 * `draft` or `revision_requested` status are editable. Sending
 * status='submitted' stamps `submitted_at` and locks the entry to the
 * student until admin reviews it.
 *
 * Sprint: docs/tasks/2026-05-06/mystery-school-decan-admin-content-upgrade.md
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
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

  const { id: decanId, entryId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Confirm the entry exists, belongs to this user, and is editable.
  const { data: existing } = await admin
    .from("decan_student_journal_entries")
    .select("id, user_id, decan_id, status")
    .eq("id", entryId)
    .maybeSingle();

  const e = existing as Record<string, unknown> | null;
  if (!e) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
  if ((e.user_id as string) !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if ((e.decan_id as string) !== decanId) {
    return NextResponse.json(
      { error: "Entry does not belong to this Decan" },
      { status: 422 },
    );
  }
  if (!EDITABLE_STATUSES.has((e.status as string) ?? "")) {
    return NextResponse.json(
      {
        error:
          "Entry is locked. Only draft or revision_requested entries can be edited.",
        code: "entry_locked",
      },
      { status: 409 },
    );
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.content === "string") patch.content = body.content;
  if (typeof body.audio_url === "string") patch.audio_url = body.audio_url;
  if (typeof body.video_url === "string") patch.video_url = body.video_url;
  if (typeof body.image_url === "string") patch.image_url = body.image_url;
  if (typeof body.entry_type === "string") {
    if (!["text", "audio", "video", "image", "mixed"].includes(body.entry_type)) {
      return NextResponse.json(
        { error: "entry_type must be one of: text, audio, video, image, mixed" },
        { status: 422 },
      );
    }
    patch.entry_type = body.entry_type;
  }
  if (typeof body.status === "string") {
    if (!ALLOWED_NEW_STATUS.has(body.status)) {
      return NextResponse.json(
        { error: "status must be 'draft' or 'submitted'" },
        { status: 422 },
      );
    }
    patch.status = body.status;
    if (body.status === "submitted") {
      patch.submitted_at = new Date().toISOString();
    }
  }

  const { data: updated, error } = await admin
    .from("decan_student_journal_entries")
    .update(patch)
    .eq("id", entryId)
    .select(
      "id, decan_id, title, content, entry_type, audio_url, video_url, image_url, status, submitted_at, reviewed_at, feedback_text, rating, created_at, updated_at",
    )
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to update journal entry" },
      { status: 500 },
    );
  }

  return NextResponse.json({ entry: updated });
}
