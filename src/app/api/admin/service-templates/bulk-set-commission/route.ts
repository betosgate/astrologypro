// POST /api/admin/service-templates/bulk-set-commission
//
// Phase 1.5 admin helper: apply one commission rate across every general
// template that currently has the affiliate program enabled. Useful when
// launching the program at a single platform-wide rate, or running a
// promo. Per spec §10 Phase 1.5, this is destructive of per-template
// overrides — the calling UI must surface that warning.
//
// Spec: docs/specs/affiliate-commission-system.md §10 Phase 1.5
// Task: docs/tasks/2026-04-28/affiliate-phase-1-5-general-products/06-admin-ui.md

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const commission_type = body.commission_type;
  if (commission_type !== "percent" && commission_type !== "flat") {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: {
          commission_type:
            "validation_error: must be 'percent' or 'flat'",
        },
      },
      { status: 422 },
    );
  }

  const rawValue = body.commission_value;
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: {
          commission_value:
            "validation_error: commission_value is required for bulk update",
        },
      },
      { status: 422 },
    );
  }
  const commission_value = Number(rawValue);
  if (!Number.isFinite(commission_value) || commission_value < 0) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: {
          commission_value:
            "validation_error: must be a non-negative number",
        },
      },
      { status: 422 },
    );
  }
  if (commission_type === "percent" && commission_value > 100) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: {
          commission_value: "percent_over_100",
        },
      },
      { status: 422 },
    );
  }
  if (commission_type === "flat" && commission_value > 100000) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: {
          commission_value: "flat_over_cap",
        },
      },
      { status: 422 },
    );
  }

  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 500)
      : "bulk admin update";

  const admin = createAdminClient();

  // Apply only to ENABLED general templates. Admin pre-staging a rate on a
  // disabled template via the per-template form is left alone — the bulk
  // update is for the active program.
  const { data: updated, error: updateErr } = await admin
    .from("service_templates")
    .update({
      commission_type,
      commission_value,
      updated_by: user.id,
    })
    .eq("is_general", true)
    .eq("affiliate_program_enabled", true)
    .select("id");

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  const updated_count = updated?.length ?? 0;

  // Audit log (best effort — don't fail the response on audit error).
  try {
    await admin.from("admin_action_log").insert({
      admin_user_id: user.id,
      action_kind: "service_templates_bulk_commission_update",
      target_resource_type: "service_templates",
      target_resource_id: null,
      reason,
      payload: {
        commission_type,
        commission_value,
        updated_count,
      },
    });
  } catch (err) {
    console.error(
      "[admin/service-templates/bulk-set-commission] audit log failed",
      {
        commission_type,
        commission_value,
        updated_count,
        err: err instanceof Error ? err.message : String(err),
      },
    );
  }

  return NextResponse.json({
    data: {
      updated_count,
      commission_type,
      commission_value,
    },
  });
}
