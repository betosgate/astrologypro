/**
 * POST /api/dashboard/landing-pages/[templateId]/toggle-live
 *
 * Flips `diviner_services.is_published` for the owning diviner's (template).
 * The ONLY publish gate under V2. The admin still owns `services.is_active`
 * and `diviner_services.is_enabled`; attempting to toggle live while either
 * admin flag is off returns 409 per the Task 05 contract.
 *
 * Request body:
 *   { "is_published": boolean }
 *
 * Authorization: only the owning diviner (via diviner_services).
 *
 * Replaces the legacy publish + unpublish endpoints. See
 * docs/tasks/2026-04-21/landing-page-simplification/03-builder-simplification.md
 * and 05-dashboard-simplification.md for the full contract.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, ...(detail ? { detail } : {}) },
    { status },
  );
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;

  // ── Auth ───────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) return problem(403, "Forbidden");

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return problem(422, "Invalid JSON");
  }
  if (typeof body.is_published !== "boolean") {
    return problem(
      422,
      "Validation error",
      "Body must be `{ \"is_published\": true | false }`.",
    );
  }
  const desired = body.is_published;

  // ── Load service + admin gates in one round-trip ───────────────────────────
  const { data: ds } = await admin
    .from("diviner_services")
    .select("id, is_enabled, is_published, template_id")
    .eq("diviner_id", diviner.id)
    .eq("template_id", templateId)
    .maybeSingle();
  if (!ds) return problem(404, "Service not assigned to this diviner");

  const { data: svc } = await admin
    .from("services")
    .select("is_active")
    .eq("diviner_id", diviner.id)
    .eq("template_id", templateId)
    .maybeSingle();

  const adminDisabled = !ds.is_enabled || !(svc?.is_active ?? true);
  if (desired === true && adminDisabled) {
    return problem(
      409,
      "Cannot toggle — service is admin-disabled",
      "An administrator has disabled this service. Contact support to re-enable it before going live.",
    );
  }

  // ── Apply ──────────────────────────────────────────────────────────────────
  const { data: updated, error } = await admin
    .from("diviner_services")
    .update({
      is_published: desired,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ds.id)
    .select("id, is_published, is_enabled")
    .single();

  if (error) {
    return problem(500, "Update failed", error.message);
  }

  return NextResponse.json({
    template_id: templateId,
    is_published: updated.is_published,
    is_enabled: updated.is_enabled,
  });
}
