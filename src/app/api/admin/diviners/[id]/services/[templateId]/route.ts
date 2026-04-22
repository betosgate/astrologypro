/**
 * PATCH /api/admin/diviners/[id]/services/[templateId]
 *
 * Admin-only flip of the admin-owned flags for a single service assignment.
 *
 * Rewritten in Task 04 of the 2026-04-21 landing-page-simplification.
 *
 * Ownership split under V2:
 *   - Admin owns:   services.is_active, diviner_services.is_enabled, price, notes
 *   - Diviner owns: diviner_services.is_published / publish_status
 *
 * This endpoint therefore accepts ONLY `is_enabled`, `price`, `notes`. Any
 * attempt to set `is_published`, `publish_status`, `published_at`, or
 * `unpublished_at` returns 422 per RFC 9457.
 *
 * Services.is_active stays in lockstep with diviner_services.is_enabled when
 * the admin flips enable — disabling a service hides it from the public site
 * regardless of the diviner's publish state. We also force `is_published=false`
 * and `publish_status='unpublished'` when admin disables, because the CHECK
 * constraint `disabled ⟹ not published` remains in place.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/service-audit";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string; templateId: string }> };

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, ...(detail ? { detail } : {}) },
    { status },
  );
}

const ADMIN_OWNED_FIELDS = new Set(["is_enabled", "price", "notes"]);
const DIVINER_OWNED_FIELDS = new Set([
  "is_published",
  "published_at",
  "unpublished_at",
]);

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const user = await getAdminUser();
  if (!user) return problem(401, "Unauthorized");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return problem(422, "Invalid JSON");
  }

  // ── Reject any diviner-owned flag ─────────────────────────────────────────
  const bodyKeys = Object.keys(body);
  const divinerOwnedAttempt = bodyKeys.filter((k) => DIVINER_OWNED_FIELDS.has(k));
  if (divinerOwnedAttempt.length > 0) {
    return problem(
      422,
      "Diviner-owned field",
      `Admins cannot change these fields: ${divinerOwnedAttempt.join(", ")}. Publish state belongs to the diviner (POST /api/dashboard/landing-pages/:templateId/toggle-live).`,
    );
  }

  // ── Reject unknown fields ─────────────────────────────────────────────────
  const unknownAttempt = bodyKeys.filter((k) => !ADMIN_OWNED_FIELDS.has(k));
  if (unknownAttempt.length > 0) {
    return problem(
      422,
      "Unknown fields",
      `These fields are not accepted here: ${unknownAttempt.join(", ")}. Allowed: ${[...ADMIN_OWNED_FIELDS].join(", ")}.`,
    );
  }

  const admin = createAdminClient();
  const { id: divinerId, templateId } = await params;
  const now = new Date().toISOString();

  const { data: ds, error: dsErr } = await admin
    .from("diviner_services")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("template_id", templateId)
    .maybeSingle();

  if (dsErr) return problem(500, "Lookup failed", dsErr.message);
  if (!ds) return problem(404, "Service not assigned to this diviner");

  const oldValue: Record<string, unknown> = {
    is_enabled: ds.is_enabled,
    is_published: ds.is_published,
    price: ds.price,
    notes: ds.notes,
  };

  const patch: Record<string, unknown> = {};
  let action: string | null = null;

  // ── is_enabled ────────────────────────────────────────────────────────────
  if ("is_enabled" in body) {
    if (typeof body.is_enabled !== "boolean") {
      return problem(422, "Invalid is_enabled", "Must be boolean.");
    }
    const enabling = body.is_enabled;
    if (enabling) {
      patch.is_enabled = true;
      patch.enabled_at = now;
      patch.enabled_by = user.id;
      patch.disabled_at = null;
      patch.disabled_by = null;
      action = "service_enabled";
    } else {
      // CHECK constraint disabled ⟹ not published — force publish fields off.
      // This is admin enforcing an availability gate, not admin flipping
      // diviner publish intent; the diviner can re-publish once admin
      // re-enables.
      patch.is_enabled = false;
      patch.is_published = false;
      patch.disabled_at = now;
      patch.disabled_by = user.id;
      patch.unpublished_at = now;
      action = "service_disabled";
    }
  }

  // ── price ─────────────────────────────────────────────────────────────────
  if ("price" in body && body.price != null) {
    const n = Number(body.price);
    if (!Number.isFinite(n) || n < 0) {
      return problem(422, "Invalid price", "Price must be a non-negative number.");
    }
    patch.price = n;
  }

  // ── notes ─────────────────────────────────────────────────────────────────
  if ("notes" in body) {
    if (body.notes !== null && typeof body.notes !== "string") {
      return problem(422, "Invalid notes", "Must be a string or null.");
    }
    patch.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  }

  if (Object.keys(patch).length === 0) {
    return problem(400, "No changes provided");
  }

  const { data: updated, error: updateErr } = await admin
    .from("diviner_services")
    .update(patch)
    .eq("diviner_id", divinerId)
    .eq("template_id", templateId)
    .select()
    .single();

  if (updateErr) return problem(500, "Update failed", updateErr.message);

  // Keep services.is_active in lockstep with is_enabled so the public route's
  // admin gate lines up with this endpoint.
  if ("is_enabled" in patch) {
    await admin
      .from("services")
      .update({ is_active: patch.is_enabled === true })
      .eq("diviner_id", divinerId)
      .eq("template_id", templateId);
  }

  if (action) {
    await writeAuditLog(admin, {
      diviner_id: divinerId,
      service_template_id: templateId,
      diviner_service_id: ds.id,
      action: action as Parameters<typeof writeAuditLog>[1]["action"],
      performed_by: user.id,
      performed_by_role: "admin",
      old_value: oldValue,
      new_value: patch,
      reason: typeof body.notes === "string" ? body.notes.trim() || null : null,
    });
  }

  return NextResponse.json({ diviner_service: updated });
}
