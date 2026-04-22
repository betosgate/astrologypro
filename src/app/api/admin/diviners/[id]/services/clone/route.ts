import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/service-audit";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/diviners/[id]/services/clone
// Copies all enabled diviner_services from a source diviner to this one.
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

  const sourceDivinerId = typeof body.source_diviner_id === "string" ? body.source_diviner_id : null;
  if (!sourceDivinerId) {
    return NextResponse.json({ error: "source_diviner_id is required" }, { status: 422 });
  }

  const includePrices = body.include_prices === true;
  // Task 04 (2026-04-21): `include_publish` is no longer honored. Cloned
  // assignments always start OFFLINE — the target diviner must publish them
  // themselves via the dashboard toggle-live endpoint. Silently ignore the
  // param for backward compat but never propagate publish state.
  if ("include_publish" in body) {
    // No-op; swallowed intentionally. Kept as soft-deprecation.
  }

  const admin = createAdminClient();
  const { id: targetDivinerId } = await params;

  if (sourceDivinerId === targetDivinerId) {
    return NextResponse.json({ error: "Source and target diviner cannot be the same" }, { status: 422 });
  }

  // Validate both diviners exist
  const [{ data: source }, { data: target }] = await Promise.all([
    admin.from("diviners").select("id").eq("id", sourceDivinerId).maybeSingle(),
    admin.from("diviners").select("id").eq("id", targetDivinerId).maybeSingle(),
  ]);

  if (!source) return NextResponse.json({ error: "Source diviner not found" }, { status: 404 });
  if (!target) return NextResponse.json({ error: "Target diviner not found" }, { status: 404 });

  // Fetch source's enabled services
  const { data: sourceServices } = await admin
    .from("diviner_services")
    .select("*")
    .eq("diviner_id", sourceDivinerId)
    .eq("is_enabled", true);

  if (!sourceServices || sourceServices.length === 0) {
    return NextResponse.json({ cloned: 0, skipped: 0, message: "Source diviner has no enabled services" });
  }

  // Fetch target's existing assignments
  const { data: existingAssignments } = await admin
    .from("diviner_services")
    .select("template_id")
    .eq("diviner_id", targetDivinerId);

  const existingTemplateIds = new Set((existingAssignments ?? []).map((a) => a.template_id));

  const now = new Date().toISOString();
  let cloned = 0;
  let skipped = 0;

  for (const ss of sourceServices) {
    if (existingTemplateIds.has(ss.template_id)) {
      skipped++;
      continue;
    }

    const insertPayload = {
      diviner_id: targetDivinerId,
      template_id: ss.template_id,
      // Always copy price for now — `includePrices` reserved for future UI
      // that lets the admin opt out and keep the global base_price instead.
      price: includePrices ? ss.price : ss.price,
      is_enabled: true,
      // V2: cloned rows are never live. Target diviner publishes themselves.
      is_published: false,
      publish_status: "draft",
      enabled_at: now,
      enabled_by: user.id,
      published_at: null,
      notes: `Cloned from diviner ${sourceDivinerId}`,
    };

    const { data: ds, error: insertErr } = await admin
      .from("diviner_services")
      .insert(insertPayload)
      .select()
      .single();

    if (insertErr) continue; // skip on error

    await writeAuditLog(admin, {
      diviner_id:          targetDivinerId,
      service_template_id: ss.template_id,
      diviner_service_id:  ds.id,
      action:              "service_enabled",
      performed_by:        user.id,
      performed_by_role:   "admin",
      new_value:           insertPayload,
      reason:              `Cloned from diviner ${sourceDivinerId}`,
    });

    cloned++;
  }

  return NextResponse.json({ cloned, skipped });
}
