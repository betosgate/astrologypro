import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/phone-requests/[id]/assign
 *
 * Assign a Chime phone number from the pool to the requesting diviner.
 * Performs the following writes in order, rolling back with best-effort
 * compensating updates if any step fails:
 *
 *   1. Claim the pool row   : chime_phone_numbers[status='available' → 'assigned']
 *   2. Update the diviner   : diviners.chime_phone_number + phone_provider='chime'
 *   3. Resolve the request  : phone_number_requests[status='pending' → 'assigned']
 *
 * Each row-level update uses a guard in the WHERE clause (e.g. checking
 * the prior status) so concurrent requests can't double-assign.
 *
 * Body: { chime_phone_number_id: uuid }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: requestId } = await params;
  if (!requestId) {
    return NextResponse.json({ error: "Missing request id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const chimePhoneNumberId = String(body.chime_phone_number_id ?? "").trim();
  if (!chimePhoneNumberId) {
    return NextResponse.json(
      { error: "chime_phone_number_id is required" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  // ── 0. Load the request + pool row to validate up front ─────────────
  const { data: request, error: reqErr } = await admin
    .from("phone_number_requests")
    .select("id, diviner_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (reqErr) {
    console.error("[admin/phone-requests assign] request lookup", reqErr);
    return NextResponse.json({ error: reqErr.message }, { status: 500 });
  }
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (request.status !== "pending") {
    return NextResponse.json(
      { error: `Request is already ${request.status}` },
      { status: 409 },
    );
  }

  const { data: pool, error: poolErr } = await admin
    .from("chime_phone_numbers")
    .select("id, phone_number, phone_arn, status, assigned_diviner_id")
    .eq("id", chimePhoneNumberId)
    .maybeSingle();

  if (poolErr) {
    console.error("[admin/phone-requests assign] pool lookup", poolErr);
    return NextResponse.json({ error: poolErr.message }, { status: 500 });
  }
  if (!pool) {
    return NextResponse.json({ error: "Chime phone number not found" }, { status: 404 });
  }
  if (pool.status !== "available") {
    return NextResponse.json(
      { error: "That Chime number is not available for assignment" },
      { status: 409 },
    );
  }

  // Resolve the admin_users row for the audit field (fallback to null if
  // the caller is a bootstrap admin without an admin_users row yet).
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const adminUsersRowId = adminRow?.id ?? null;

  const assignedAt = new Date().toISOString();

  // ── 1. Claim the pool row (guard: still available) ──────────────────
  const { data: poolUpd, error: poolUpdErr } = await admin
    .from("chime_phone_numbers")
    .update({
      status: "assigned",
      assigned_diviner_id: request.diviner_id,
      assigned_at: assignedAt,
    })
    .eq("id", pool.id)
    .eq("status", "available")
    .select("id, phone_number, phone_arn")
    .maybeSingle();

  if (poolUpdErr || !poolUpd) {
    console.error("[admin/phone-requests assign] pool update", poolUpdErr);
    return NextResponse.json(
      { error: "Failed to claim pool row; it may have just been taken." },
      { status: 409 },
    );
  }

  // ── 2. Update the diviners row ──────────────────────────────────────
  const { error: divUpdErr } = await admin
    .from("diviners")
    .update({
      chime_phone_number: poolUpd.phone_number,
      chime_sma_phone_arn: poolUpd.phone_arn,
      phone_provider: "chime",
    })
    .eq("id", request.diviner_id);

  if (divUpdErr) {
    // Compensate: release the pool row.
    await admin
      .from("chime_phone_numbers")
      .update({ status: "available", assigned_diviner_id: null, assigned_at: null })
      .eq("id", pool.id);
    console.error("[admin/phone-requests assign] diviner update", divUpdErr);
    return NextResponse.json({ error: divUpdErr.message }, { status: 500 });
  }

  // ── 3. Resolve the request (guard: still pending) ───────────────────
  const { data: reqUpd, error: reqUpdErr } = await admin
    .from("phone_number_requests")
    .update({
      status: "assigned",
      assigned_phone_number_id: pool.id,
      assigned_by_admin_id: adminUsersRowId,
      assigned_at: assignedAt,
    })
    .eq("id", request.id)
    .eq("status", "pending")
    .select("id, status, assigned_at")
    .maybeSingle();

  if (reqUpdErr || !reqUpd) {
    // Compensate: release the pool row + null out diviner fields.
    await admin
      .from("chime_phone_numbers")
      .update({ status: "available", assigned_diviner_id: null, assigned_at: null })
      .eq("id", pool.id);
    await admin
      .from("diviners")
      .update({ chime_phone_number: null, chime_sma_phone_arn: null })
      .eq("id", request.diviner_id);
    console.error("[admin/phone-requests assign] request update", reqUpdErr);
    return NextResponse.json(
      { error: "Failed to finalize request — changes rolled back" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    request: reqUpd,
    phone_number: poolUpd.phone_number,
  });
}
