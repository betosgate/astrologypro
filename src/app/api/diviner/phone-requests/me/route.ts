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
 * (Request button vs. Pending badge).
 *
 * Response shape:
 *   {
 *     hasPhoneNumber: boolean,
 *     currentRequest: {
 *       id, status, created_at, assigned_at, rejected_at, rejected_reason
 *     } | null,
 *     // latestRequest is the most recent request regardless of status, so
 *     // the UI can show "Assigned on ..." or "Rejected because ..." right
 *     // after the admin acts, even after the pending row resolves.
 *     latestRequest: { id, status, created_at, assigned_at, rejected_at, rejected_reason } | null
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
    .select("id, chime_phone_number")
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

  return NextResponse.json({
    hasPhoneNumber: !!diviner.chime_phone_number,
    currentRequest,
    latestRequest: latest,
  });
}
