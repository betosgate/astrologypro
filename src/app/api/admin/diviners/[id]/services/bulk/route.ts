/**
 * POST /api/admin/diviners/[id]/services/bulk
 *
 * Bulk apply enable / disable across a set of templates. Rewritten in Task 04
 * of the 2026-04-21 landing-page-simplification: the `publish` and `unpublish`
 * actions were removed — publish state belongs to the diviner, not the admin.
 *
 * Accepted actions:
 *   - enable   → sets is_enabled=true, mirrors services.is_active=true
 *   - disable  → sets is_enabled=false AND forces is_published=false (CHECK)
 *
 * Any other action returns 422. The `publish`/`unpublish` actions previously
 * supported here are no longer accepted.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/service-audit";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, ...(detail ? { detail } : {}) },
    { status },
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) return problem(401, "Unauthorized");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return problem(422, "Invalid JSON");
  }

  const action = body.action as string;
  const templateIds = Array.isArray(body.template_ids) ? (body.template_ids as string[]) : [];
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

  const ADMIN_OWNED_ACTIONS = ["enable", "disable"];
  if (!ADMIN_OWNED_ACTIONS.includes(action)) {
    return problem(
      422,
      "Invalid action",
      `action must be one of: ${ADMIN_OWNED_ACTIONS.join(", ")}. Publish state is diviner-owned under V2.`,
    );
  }
  if (templateIds.length === 0) {
    return problem(422, "Empty template_ids", "template_ids must be a non-empty array");
  }

  const admin = createAdminClient();
  const { id: divinerId } = await params;
  const now = new Date().toISOString();

  const results: { template_id: string; success: boolean; error?: string }[] = [];

  for (const templateId of templateIds) {
    try {
      const { data: ds } = await admin
        .from("diviner_services")
        .select("id, is_enabled, is_published, price, notes")
        .eq("diviner_id", divinerId)
        .eq("template_id", templateId)
        .maybeSingle();

      const patch: Record<string, unknown> = {};
      let auditAction: string;

      if (action === "enable") {
        if (!ds) {
          // Auto-assign. Cloned rows start OFFLINE (is_published=false) per V2.
          const { data: tmpl } = await admin
            .from("service_templates")
            .select("id, name, slug, category, base_price, is_active")
            .eq("id", templateId)
            .maybeSingle();
          if (!tmpl || !tmpl.is_active) {
            results.push({
              template_id: templateId,
              success: false,
              error: "Template not found or inactive",
            });
            continue;
          }
          await admin.from("diviner_services").insert({
            diviner_id: divinerId,
            template_id: templateId,
            price: tmpl.base_price ?? 0,
            is_enabled: true,
            is_published: false,
            enabled_at: now,
            enabled_by: user.id,
            notes,
          });
          // Mirror to services.is_active so the public route can find it.
          await admin
            .from("services")
            .update({ is_active: true })
            .eq("diviner_id", divinerId)
            .eq("template_id", templateId);
          results.push({ template_id: templateId, success: true });
          continue;
        }
        patch.is_enabled = true;
        patch.enabled_at = now;
        patch.enabled_by = user.id;
        patch.disabled_at = null;
        patch.disabled_by = null;
        auditAction = "service_enabled";
      } else {
        // disable
        if (!ds) {
          results.push({ template_id: templateId, success: true });
          continue;
        }
        patch.is_enabled = false;
        // CHECK constraint: disabled ⟹ not published.
        patch.is_published = false;
        patch.disabled_at = now;
        patch.disabled_by = user.id;
        patch.unpublished_at = now;
        auditAction = "service_disabled";
      }

      const { error: updateErr } = await admin
        .from("diviner_services")
        .update(patch)
        .eq("diviner_id", divinerId)
        .eq("template_id", templateId);

      if (updateErr) {
        results.push({
          template_id: templateId,
          success: false,
          error: updateErr.message,
        });
        continue;
      }

      if ("is_enabled" in patch) {
        await admin
          .from("services")
          .update({ is_active: patch.is_enabled === true })
          .eq("diviner_id", divinerId)
          .eq("template_id", templateId);
      }

      if (ds) {
        await writeAuditLog(admin, {
          diviner_id: divinerId,
          service_template_id: templateId,
          diviner_service_id: ds.id,
          action: auditAction as Parameters<typeof writeAuditLog>[1]["action"],
          performed_by: user.id,
          performed_by_role: "admin",
          old_value: { is_enabled: ds.is_enabled, is_published: ds.is_published },
          new_value: patch,
          reason: notes,
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
