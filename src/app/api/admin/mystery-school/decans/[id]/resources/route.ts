import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["pdf", "video", "audio", "link", "image", "text"]);

/**
 * POST /api/admin/mystery-school/decans/[id]/resources
 * Body: { title, resource_type, url?, description?, sort_order?, is_published? }
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
  const resourceType =
    typeof body.resource_type === "string" ? body.resource_type : "link";
  if (!ALLOWED_TYPES.has(resourceType)) {
    return NextResponse.json(
      { error: `resource_type must be one of: ${Array.from(ALLOWED_TYPES).join(", ")}` },
      { status: 422 },
    );
  }
  const isPublished = body.is_published === true;
  const nowIso = new Date().toISOString();

  const admin = createAdminClient();
  const { data: inserted, error } = await admin
    .from("decan_resources")
    .insert({
      decan_id: decanId,
      title,
      resource_type: resourceType,
      url: typeof body.url === "string" ? body.url : null,
      description:
        typeof body.description === "string" ? body.description : null,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      is_published: isPublished,
      published_at: isPublished ? nowIso : null,
    })
    .select("*")
    .single();
  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create resource" },
      { status: 500 },
    );
  }

  // Sprint Task 09: notify all current Decan-phase students that a new
  // resource was published. Best-effort, fire-and-forget.
  if (isPublished) {
    void (async () => {
      try {
        const { notifyDecanResourcePublished } = await import(
          "@/lib/mystery-school/decan-content-notifications"
        );
        await notifyDecanResourcePublished({
          admin,
          decanId,
          resourceTitle: title,
        });
      } catch (err) {
        console.error("[admin/decans/resources] notify failed", err);
      }
    })();
  }

  return NextResponse.json({ resource: inserted }, { status: 201 });
}
