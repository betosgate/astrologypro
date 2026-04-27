import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/diviner/phone-requests/me
 *
 * Returns the current phone-number-request status for the authenticated
 * diviner. Used by the Phone tab to decide which UI state to render
 * (Request button vs. Pending badge vs. assigned number).
 *
 * Self-healing: there are two writes that the admin assignment flow
 * normally performs together — one to `chime_phone_numbers` (claiming a
 * pool row) and one to `diviners.chime_phone_number` (mirroring the
 * number onto the diviner). If those drift apart (e.g. admin marked a
 * pool row as assigned via direct SQL, or the diviner-row update
 * silently failed), the diviner's settings page would wrongly show the
 * "Request Phone Number" CTA even though a number is sitting in the
 * pool with their id on it. To prevent that, this endpoint reconciles
 * the two on every read: if the pool says a number is assigned to this
 * diviner but the diviner row is empty, we mirror the value into the
 * diviner row before returning.
 *
 * Response shape:
 *   {
 *     hasPhoneNumber: boolean,
 *     // Set when a number is currently assigned. Null otherwise.
 *     phoneNumber: string | null,
 *     phoneDialinEnabled: boolean,
 *     currentRequest: { ... } | null,
 *     latestRequest: { ... } | null
 *   }
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: diviner, error: divinerErr } = await admin
    .from("diviners")
    .select(
      "id, chime_phone_number, chime_sma_phone_arn, phone_dialin_enabled, twilio_phone_number"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (divinerErr) {
    console.error("[diviner/phone-requests/me] diviner lookup", divinerErr);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!diviner) {
    return NextResponse.json(
      { error: "Only diviners can access this endpoint" },
      { status: 403 },
    );
  }

  // ── Reconciliation: check the pool for an assigned row pointing at us ──
  // If diviners.chime_phone_number is missing OR diverges from the pool,
  // we trust the pool (since it's the row admin updates first when
  // assigning) and mirror its value onto the diviner row.
  let chimePhoneNumber = diviner.chime_phone_number ?? null;
  if (!chimePhoneNumber) {
    const { data: poolRow, error: poolErr } = await admin
      .from("chime_phone_numbers")
      .select("phone_number, phone_arn")
      .eq("assigned_diviner_id", diviner.id)
      .eq("status", "assigned")
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (poolErr) {
      console.error(
        "[diviner/phone-requests/me] pool lookup for self-heal",
        poolErr,
      );
      // Non-fatal — fall through with chimePhoneNumber still null.
    } else if (poolRow?.phone_number) {
      // Mirror the pool's value onto the diviner row so future reads
      // (including the settings page's own Supabase query) see the
      // correct value. We don't fail the whole response if this update
      // errors — the in-memory value below is enough for this render.
      const { error: healErr } = await admin
        .from("diviners")
        .update({
          chime_phone_number: poolRow.phone_number,
          chime_sma_phone_arn: poolRow.phone_arn,
          phone_provider: "chime",
        })
        .eq("id", diviner.id);

      if (healErr) {
        console.error(
          "[diviner/phone-requests/me] self-heal update failed",
          healErr,
        );
      }

      chimePhoneNumber = poolRow.phone_number;
    }
  }

  // Most recent request (any status) — for display after resolution.
  const { data: latestRows, error: latestErr } = await admin
    .from("phone_number_requests")
    .select("id, status, created_at, assigned_at, rejected_at, rejected_reason")
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (latestErr) {
    console.error("[diviner/phone-requests/me] latest lookup", latestErr);
    return NextResponse.json({ error: latestErr.message }, { status: 500 });
  }

  const latest = latestRows?.[0] ?? null;
  const currentRequest = latest && latest.status === "pending" ? latest : null;

  // Effective phone number prefers the (now-reconciled) Chime number,
  // falling back to a legacy Twilio number if one is on file. The Phone
  // tab UI shows whichever exists.
  const effectivePhoneNumber =
    chimePhoneNumber ?? diviner.twilio_phone_number ?? null;

  // Look up the shared central Chime line. Many deployments don't issue
  // per-diviner numbers at all — every diviner shares one central number,
  // and inbound calls are routed by the booking PIN. The Phone tab uses
  // this so it can show the shared number to a diviner who has no
  // personal one, instead of nagging them to "Request Phone Number" they
  // don't actually need.
  const { data: centralRow, error: centralErr } = await admin
    .from("chime_phone_numbers")
    .select("phone_number")
    .eq("status", "central")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (centralErr) {
    console.error(
      "[diviner/phone-requests/me] central lookup",
      centralErr,
    );
    // Non-fatal — fall through; the UI just won't show a central fallback.
  }

  const centralPhoneNumber = centralRow?.phone_number ?? null;

  return NextResponse.json({
    hasPhoneNumber: !!effectivePhoneNumber,
    phoneNumber: effectivePhoneNumber,
    phoneDialinEnabled: !!diviner.phone_dialin_enabled,
    // Shared central line — present iff the platform has provisioned a
    // central number. Diviners without a personal number can still
    // receive PIN-routed inbound calls through this number.
    centralPhoneNumber,
    currentRequest,
    latestRequest: latest,
  });
}
