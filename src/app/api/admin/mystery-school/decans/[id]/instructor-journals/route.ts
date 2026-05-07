import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["text", "audio", "video"]);

/**
 * POST /api/admin/mystery-school/decans/[id]/instructor-journals
 * Body: { title, entry_type, content?, media_url?, duration_seconds?, instructor_name?, is_published? }
 *
 * Sprint: docs/tasks/2026-05-06/mystery-school-decan-admin-content-upgrade.md
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: decanId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 422 });
  }
  const entryType =
    typeof body.entry_type === "string" ? body.entry_type : "text";
  if (!ALLOWED_TYPES.has(entryType)) {
    return NextResponse.json(
      { error: `entry_type must be one of: ${Array.from(ALLOWED_TYPES).join(", ")}` },
      { status: 422 },
    );
  }
  const isPublished = body.is_published === true;
  const nowIso = new Date().toISOString();

  const admin = createAdminClient();
  const { data: inserted, error } = await admin
    .from("decan_instructor_journals")
    .insert({
      decan_id: decanId,
      title,
      entry_type: entryType,
      content: typeof body.content === "string" ? body.content : null,
      media_url: typeof body.media_url === "string" ? body.media_url : null,
      duration_seconds:
        typeof body.duration_seconds === "number"
          ? body.duration_seconds
          : null,
      instructor_name:
        typeof body.instructor_name === "string"
          ? body.instructor_name
          : null,
      is_published: isPublished,
      published_at: isPublished ? nowIso : null,
    })
    .select("*")
    .single();
  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create instructor journal" },
      { status: 500 },
    );
  }

  if (isPublished) {
    void (async () => {
      try {
        const { notifyInstructorJournalPublished } = await import(
          "@/lib/mystery-school/decan-content-notifications"
        );
        await notifyInstructorJournalPublished({
          admin,
          decanId,
          journalTitle: title,
        });
      } catch (err) {
        console.error("[admin/decans/instructor-journals] notify failed", err);
      }
    })();
  }

  return NextResponse.json({ journal: inserted }, { status: 201 });
}
