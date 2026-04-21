/**
 * POST /api/dashboard/landing-pages/[templateId]/toggle-live
 *
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
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

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
}
