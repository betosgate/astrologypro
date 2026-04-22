/**
 * POST /api/dashboard/landing-pages/[templateId]/toggle-live
 *
<<<<<<< HEAD
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
=======
 * Canonical Live/Offline toggle introduced in the 2026-04-21 landing-page
 * simplification sprint. Writes ONLY the diviner-owned flag
 * diviner_services.is_published (never the admin-owned flags
 * services.is_active / diviner_services.is_enabled).
 *
 * Replaces the pre-V2 pair:
 *   POST /publish   — flagged off (feature-gated callers)
 *   POST /unpublish — now returns 410 via its route file
 *
 * Body:     { is_published: boolean }
 * Success:  200 { ok: true, is_published }
 * Guarded:  409 "Cannot toggle — service is admin-disabled" when
 *             services.is_active=false OR diviner_services.is_enabled=false
 *
 * Every supabase-js write checks .error and surfaces it — no silent
 * failures (the 2026-04-21 incident was caused by a swallowed
 * CHECK-constraint error on the old code path).
>>>>>>> 3126914b0f0c2c89b3ff208536117927c230f3f0
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
<<<<<<< HEAD
=======
export const runtime = "nodejs";
>>>>>>> 3126914b0f0c2c89b3ff208536117927c230f3f0

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

<<<<<<< HEAD
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
      publish_status: desired ? "published" : "unpublished",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ds.id)
    .select("id, is_published, publish_status, is_enabled")
    .single();

  if (error) {
    return problem(500, "Update failed", error.message);
  }

  return NextResponse.json({
    template_id: templateId,
    is_published: updated.is_published,
    publish_status: updated.publish_status,
    is_enabled: updated.is_enabled,
  });
=======
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    is_published?: boolean;
  };
  if (typeof body.is_published !== "boolean") {
    return NextResponse.json(
      {
        title: "Validation error",
        detail: "is_published must be boolean",
        status: 422,
      },
      { status: 422 }
    );
  }
  const nextIsPublished = body.is_published;

  const admin = createAdminClient();

  // Ownership + admin-gate check. One round trip, explicit error check.
  const { data: ds, error: readErr } = await admin
    .from("diviner_services")
    .select(
      "id, diviner_id, template_id, is_enabled, is_published, diviners:diviner_id ( user_id ), service_templates:template_id ( id, is_active )"
    )
    .eq("template_id", templateId)
    .maybeSingle();

  if (readErr) {
    console.error("[toggle-live] diviner_services read failed", {
      templateId,
      user_id: user.id,
      err: readErr,
    });
    return NextResponse.json(
      { title: "Database error", detail: readErr.message, status: 500 },
      { status: 500 }
    );
  }
  if (!ds) {
    return NextResponse.json(
      { title: "Not found", status: 404 },
      { status: 404 }
    );
  }

  const divinerRel = ds.diviners as { user_id: string } | { user_id: string }[] | null;
  const ownerUserId = Array.isArray(divinerRel)
    ? divinerRel[0]?.user_id
    : divinerRel?.user_id;
  if (!ownerUserId || ownerUserId !== user.id) {
    return NextResponse.json(
      { title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  // Admin gate
  const svcRel = ds.service_templates as
    | { is_active: boolean }
    | { is_active: boolean }[]
    | null;
  const svcActive = Array.isArray(svcRel) ? svcRel[0]?.is_active : svcRel?.is_active;
  if (ds.is_enabled === false || svcActive === false) {
    return NextResponse.json(
      {
        title: "Cannot toggle — service is admin-disabled",
        status: 409,
      },
      { status: 409 }
    );
  }

  // No-op short-circuit
  if (ds.is_published === nextIsPublished) {
    return NextResponse.json({ ok: true, is_published: ds.is_published });
  }

  const { error: updateErr } = await admin
    .from("diviner_services")
    .update({ is_published: nextIsPublished })
    .eq("id", ds.id);

  if (updateErr) {
    console.error("[toggle-live] diviner_services update failed", {
      diviner_service_id: ds.id,
      next_is_published: nextIsPublished,
      err: updateErr,
    });
    return NextResponse.json(
      { title: "Database error", detail: updateErr.message, status: 500 },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, is_published: nextIsPublished });
>>>>>>> 3126914b0f0c2c89b3ff208536117927c230f3f0
}
