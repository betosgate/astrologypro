import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/diviners/[id]/assign-phone
 *
 * Direct admin path to assign a Chime number from the pool to a diviner,
 * WITHOUT requiring the diviner to have submitted a phone-number request
 * first. Mirrors the writes performed by
 * `/api/admin/phone-requests/[id]/assign` so the resulting state is
 * indistinguishable from a request-driven assignment.
 *
 * Body: { chime_phone_number_id: uuid }
 *
 * Order of writes (each guarded so concurrent admins can't double-assign):
 *   1. chime_phone_numbers : status 'available' → 'assigned',
 *                            assigned_diviner_id, assigned_at
 *   2. diviners            : chime_phone_number, chime_sma_phone_arn,
 *                            phone_provider = 'chime'
 *
 * If step 2 fails, step 1 is compensated (released back to 'available').
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: divinerId } = await params;
  if (!divinerId) {
    return NextResponse.json({ error: "Missing diviner id" }, { status: 400 });
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

  // ── 0. Validate diviner + pool row up front ─────────────────────────────
  const { data: diviner, error: divErr } = await admin
    .from("diviners")
    .select("id, chime_phone_number")
    .eq("id", divinerId)
    .maybeSingle();

  if (divErr) {
    console.error("[admin/diviners/assign-phone] diviner lookup", divErr);
    return NextResponse.json({ error: divErr.message }, { status: 500 });
  }
  if (!diviner) {
    return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
  }
  if (diviner.chime_phone_number) {
    return NextResponse.json(
      {
        error: "Diviner already has a Chime phone number assigned",
        phoneNumber: diviner.chime_phone_number,
      },
      { status: 409 },
    );
  }

  const { data: pool, error: poolErr } = await admin
    .from("chime_phone_numbers")
    .select("id, phone_number, phone_arn, status, assigned_diviner_id")
    .eq("id", chimePhoneNumberId)
    .maybeSingle();

  if (poolErr) {
    console.error("[admin/diviners/assign-phone] pool lookup", poolErr);
    return NextResponse.json({ error: poolErr.message }, { status: 500 });
  }
  if (!pool) {
    return NextResponse.json(
      { error: "Chime phone number not found in pool" },
      { status: 404 },
    );
  }
  if (pool.status !== "available") {
    return NextResponse.json(
      { error: `Pool number is currently '${pool.status}', not available` },
      { status: 409 },
    );
  }

  const assignedAt = new Date().toISOString();

  // ── 1. Claim the pool row (guarded: still available) ────────────────────
  const { data: poolUpd, error: poolUpdErr } = await admin
    .from("chime_phone_numbers")
    .update({
      status: "assigned",
      assigned_diviner_id: divinerId,
      assigned_at: assignedAt,
    })
    .eq("id", pool.id)
    .eq("status", "available")
    .select("id, phone_number, phone_arn")
    .maybeSingle();

  if (poolUpdErr || !poolUpd) {
    console.error("[admin/diviners/assign-phone] pool claim", poolUpdErr);
    return NextResponse.json(
      { error: "Failed to claim pool row — it may have just been taken." },
      { status: 409 },
    );
  }

  // ── 2. Mirror onto the diviner row ──────────────────────────────────────
  const { error: divUpdErr } = await admin
    .from("diviners")
    .update({
      chime_phone_number: poolUpd.phone_number,
      chime_sma_phone_arn: poolUpd.phone_arn,
      phone_provider: "chime",
    })
    .eq("id", divinerId);

  if (divUpdErr) {
    // Compensate: release the pool row.
    await admin
      .from("chime_phone_numbers")
      .update({
        status: "available",
        assigned_diviner_id: null,
        assigned_at: null,
      })
      .eq("id", pool.id);
    console.error("[admin/diviners/assign-phone] diviner update", divUpdErr);
    return NextResponse.json({ error: divUpdErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    phoneNumber: poolUpd.phone_number,
    phoneArn: poolUpd.phone_arn,
    assignedAt,
  });
}
