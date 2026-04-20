import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/service-audit";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/diviners/[id]/services/bulk
// Apply enable/disable/publish/unpublish to multiple templates at once.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action as string;
  const templateIds = Array.isArray(body.template_ids) ? (body.template_ids as string[]) : [];
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

  const allowedActions = ["enable", "disable", "publish", "unpublish"];
  if (!allowedActions.includes(action)) {
    return NextResponse.json({ error: "action must be enable | disable | publish | unpublish" }, { status: 422 });
  }
  if (templateIds.length === 0) {
    return NextResponse.json({ error: "template_ids must be a non-empty array" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { id: divinerId } = await params;
  const now = new Date().toISOString();

  const results: { template_id: string; success: boolean; error?: string }[] = [];

  for (const templateId of templateIds) {
    try {
      const { data: ds } = await admin
        .from("diviner_services")
        .select("id, is_enabled, is_published, publish_status, price, notes")
        .eq("diviner_id", divinerId)
        .eq("template_id", templateId)
        .maybeSingle();

      const patch: Record<string, unknown> = {};
      let auditAction: string;

      if (action === "enable") {
        if (!ds) {
          // Auto-assign first
          const { data: tmpl } = await admin
            .from("service_templates")
            .select("id, name, slug, category, base_price, is_active")
            .eq("id", templateId)
            .maybeSingle();
          if (!tmpl || !tmpl.is_active) {
            results.push({ template_id: templateId, success: false, error: "Template not found or inactive" });
            continue;
          }
          await admin.from("diviner_services").insert({
            diviner_id: divinerId, template_id: templateId,
            price: tmpl.base_price ?? 0,
            is_enabled: true, is_published: false, publish_status: "draft",
            enabled_at: now, enabled_by: user.id, notes,
          });
          results.push({ template_id: templateId, success: true });
          continue;
        }
        patch.is_enabled = true;
        patch.enabled_at = now;
        patch.enabled_by = user.id;
        patch.disabled_at = null;
        patch.disabled_by = null;
        auditAction = "service_enabled";
      } else if (action === "disable") {
        if (!ds) { results.push({ template_id: templateId, success: true }); continue; }
        patch.is_enabled = false;
        patch.is_published = false;
        patch.publish_status = "unpublished";
        patch.disabled_at = now;
        patch.disabled_by = user.id;
        patch.unpublished_at = now;
        auditAction = "service_disabled";
      } else if (action === "publish") {
        if (!ds || !ds.is_enabled) {
          results.push({ template_id: templateId, success: false, error: "Service not enabled" });
          continue;
        }
        patch.is_published = true;
        patch.publish_status = "published";
        patch.published_at = now;
        auditAction = "landing_page_published";
      } else {
        // unpublish
        if (!ds) { results.push({ template_id: templateId, success: true }); continue; }
        patch.is_published = false;
        patch.publish_status = "unpublished";
        patch.unpublished_at = now;
        auditAction = "landing_page_unpublished";
      }

      const { error: updateErr } = await admin
        .from("diviner_services")
        .update(patch)
        .eq("diviner_id", divinerId)
        .eq("template_id", templateId);

      if (updateErr) {
        results.push({ template_id: templateId, success: false, error: updateErr.message });
        continue;
      }

      if (ds) {
        await writeAuditLog(admin, {
          diviner_id:          divinerId,
          service_template_id: templateId,
          diviner_service_id:  ds.id,
          action:              auditAction as Parameters<typeof writeAuditLog>[1]["action"],
          performed_by:        user.id,
          performed_by_role:   "admin",
          old_value:           { is_enabled: ds.is_enabled, is_published: ds.is_published },
          new_value:           patch,
          reason:              notes,
        });
      }

      results.push({ template_id: templateId, success: true });
    } catch (err) {
      results.push({
        template_id: templateId,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const updated = results.filter((r) => r.success).length;
  const errors = results.filter((r) => !r.success);

  return NextResponse.json({ updated, errors, results });
}
