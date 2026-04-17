import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/service-audit";

export const dynamic = "force-dynamic";

type RouteParams = { params: { id: string; templateId: string } };

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/diviners/[id]/services/[templateId]
// Toggle enable/disable/publish/unpublish for a specific service assignment.
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { id: divinerId, templateId } = params;
  const now = new Date().toISOString();

  // Fetch current diviner_services record
  const { data: ds, error: dsErr } = await admin
    .from("diviner_services")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("template_id", templateId)
    .maybeSingle();

  if (dsErr) return NextResponse.json({ error: dsErr.message }, { status: 500 });
  if (!ds) return NextResponse.json({ error: "Service not assigned to this diviner" }, { status: 404 });

  const oldValue: Record<string, unknown> = {
    is_enabled:     ds.is_enabled,
    is_published:   ds.is_published,
    publish_status: ds.publish_status,
    price:          ds.price,
    notes:          ds.notes,
  };

  const patch: Record<string, unknown> = {};
  let action: string | null = null;

  // ── Toggle is_enabled ─────────────────────────────────────────────────────
  if ("is_enabled" in body) {
    const enabling = body.is_enabled === true;

    if (enabling) {
      patch.is_enabled  = true;
      patch.enabled_at  = now;
      patch.enabled_by  = user.id;
      patch.disabled_at = null;
      patch.disabled_by = null;
      action = "service_enabled";
    } else {
      // Disabling also forces unpublish (constraint: disabled ⟹ not published)
      patch.is_enabled    = false;
      patch.is_published  = false;
      patch.publish_status = "unpublished";
      patch.disabled_at   = now;
      patch.disabled_by   = user.id;
      patch.unpublished_at = now;
      action = "service_disabled";
    }
  }

  // ── Toggle is_published ───────────────────────────────────────────────────
  if ("is_published" in body) {
    const publishing = body.is_published === true;

    if (publishing) {
      if (!ds.is_enabled && !("is_enabled" in body && body.is_enabled === true)) {
        return NextResponse.json(
          { error: "Cannot publish a disabled service" },
          { status: 422 }
        );
      }
      patch.is_published  = true;
      patch.publish_status = "published";
      patch.published_at  = now;
      action = action ?? "landing_page_published";
    } else {
      patch.is_published  = false;
      patch.publish_status = "unpublished";
      patch.unpublished_at = now;
      action = action ?? "landing_page_unpublished";
    }
  }

  // ── Explicit publish_status ───────────────────────────────────────────────
  if ("publish_status" in body && typeof body.publish_status === "string") {
    const allowed = ["draft", "published", "unpublished", "archived"];
    if (!allowed.includes(body.publish_status)) {
      return NextResponse.json({ error: "Invalid publish_status" }, { status: 422 });
    }
    patch.publish_status = body.publish_status;
    if (body.publish_status === "published") {
      patch.is_published = true;
      action = action ?? "landing_page_published";
    } else {
      patch.is_published = false;
      if (body.publish_status === "archived") {
        action = action ?? "landing_page_archived";
      } else {
        action = action ?? "landing_page_unpublished";
      }
    }
  }

  // ── Price override ────────────────────────────────────────────────────────
  if ("price" in body && body.price != null) {
    patch.price = Number(body.price);
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  if ("notes" in body) {
    patch.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const { data: updated, error: updateErr } = await admin
    .from("diviner_services")
    .update(patch)
    .eq("diviner_id", divinerId)
    .eq("template_id", templateId)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Audit log
  if (action) {
    await writeAuditLog(admin, {
      diviner_id:          divinerId,
      service_template_id: templateId,
      diviner_service_id:  ds.id,
      action:              action as Parameters<typeof writeAuditLog>[1]["action"],
      performed_by:        user.id,
      performed_by_role:   "admin",
      old_value:           oldValue,
      new_value:           patch,
      reason:              typeof body.notes === "string" ? body.notes.trim() || null : null,
    });
  }

  return NextResponse.json({ diviner_service: updated });
}
