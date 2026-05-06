import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_REVIEW_STATUSES = new Set(["reviewed", "revision_requested"]);

/**
 * PUT /api/admin/mystery-school/journals/[id]/review
 * Body: { status: 'reviewed' | 'revision_requested', feedback_text?: string, rating?: number (1-5) }
 *
 * Records admin review on a `decan_student_journal_entries` row. Sets
 * reviewed_at + reviewed_by + status (+ feedback_text/rating if provided),
 * and fires the affiliate.feedback_received notification (Task 09).
 *
 * Sprint: docs/tasks/2026-05-06/mystery-school-decan-admin-content-upgrade.md
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: entryId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status : "";
  if (!ALLOWED_REVIEW_STATUSES.has(status)) {
    return NextResponse.json(
      { error: "status must be 'reviewed' or 'revision_requested'" },
      { status: 422 },
    );
  }
  let rating: number | null = null;
  if (body.rating !== undefined && body.rating !== null) {
    const r = Number(body.rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return NextResponse.json(
        { error: "rating must be an integer 1-5" },
        { status: 422 },
      );
    }
    rating = r;
  }
  const feedbackText =
    typeof body.feedback_text === "string" ? body.feedback_text : null;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("decan_student_journal_entries")
    .select("id, user_id, decan_id, title")
    .eq("id", entryId)
    .maybeSingle();
  const e = existing as Record<string, unknown> | null;
  if (!e) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("decan_student_journal_entries")
    .update({
      status,
      feedback_text: feedbackText,
      rating,
      reviewed_at: nowIso,
      reviewed_by: adminUser.id,
    })
    .eq("id", entryId)
    .select("*")
    .single();
  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to record review" },
      { status: 500 },
    );
  }

  // Notify the student that feedback is available.
  void (async () => {
    try {
      const { notifyFeedbackReceived } = await import(
        "@/lib/mystery-school/decan-content-notifications"
      );
      await notifyFeedbackReceived({
        admin,
        userId: e.user_id as string,
        decanId: e.decan_id as string,
        entryId: e.id as string,
        entryTitle: (e.title as string | null) ?? null,
        status,
        rating,
      });
    } catch (err) {
      console.error("[admin/journals/review] notify failed", err);
    }
  })();

  return NextResponse.json({ entry: updated });
}
