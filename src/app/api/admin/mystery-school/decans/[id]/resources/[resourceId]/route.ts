import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["pdf", "video", "audio", "link", "image", "text"]);
const EDITABLE_FIELDS = new Set([
  "title",
  "resource_type",
  "url",
  "description",
  "sort_order",
  "is_published",
]);

/**
 * PUT /api/admin/mystery-school/decans/[id]/resources/[resourceId]
 * Body: any subset of EDITABLE_FIELDS.
 *
 * Sprint: docs/tasks/2026-05-06/mystery-school-decan-admin-content-upgrade.md
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> },
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: decanId, resourceId } = await params;

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
  if (typeof patch.resource_type === "string" && !ALLOWED_TYPES.has(patch.resource_type)) {
    return NextResponse.json(
      { error: `resource_type must be one of: ${Array.from(ALLOWED_TYPES).join(", ")}` },
      { status: 422 },
    );
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No editable fields supplied" }, { status: 422 });
  }

  const admin = createAdminClient();

  // Was this previously unpublished but is now being published?
  let firePublishNotification = false;
  let resolvedTitle = "";
  if (patch.is_published === true) {
    const { data: existing } = await admin
      .from("decan_resources")
      .select("id, is_published, title, decan_id")
      .eq("id", resourceId)
      .maybeSingle();
    const e = existing as Record<string, unknown> | null;
    if (e && e.is_published !== true) {
      firePublishNotification = true;
      resolvedTitle = (e.title as string) ?? "";
    }
    if (e && (e.decan_id as string) !== decanId) {
      return NextResponse.json(
        { error: "Resource does not belong to this Decan" },
        { status: 422 },
      );
    }
    patch.published_at = new Date().toISOString();
  }

  const { data: updated, error } = await admin
    .from("decan_resources")
    .update(patch)
    .eq("id", resourceId)
    .eq("decan_id", decanId)
    .select("*")
    .single();
  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to update resource" },
      { status: 500 },
    );
  }

  if (firePublishNotification) {
    void (async () => {
      try {
        const { notifyDecanResourcePublished } = await import(
          "@/lib/mystery-school/decan-content-notifications"
        );
        await notifyDecanResourcePublished({
          admin,
          decanId,
          resourceTitle: resolvedTitle || ((updated as Record<string, unknown>).title as string) || "",
        });
      } catch (err) {
        console.error("[admin/decans/resources/PUT] notify failed", err);
      }
    })();
  }

  return NextResponse.json({ resource: updated });
}

/**
 * DELETE /api/admin/mystery-school/decans/[id]/resources/[resourceId]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> },
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: decanId, resourceId } = await params;

  const admin = createAdminClient();
  const { error } = await admin
    .from("decan_resources")
    .delete()
    .eq("id", resourceId)
    .eq("decan_id", decanId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
