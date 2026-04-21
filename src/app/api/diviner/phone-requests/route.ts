import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/diviner/phone-requests
 *
 * Create a new pending phone-number request for the currently authenticated
 * diviner. Rejects if:
 *   - caller is not authenticated,
 *   - caller is not a diviner,
 *   - caller already has a Chime number assigned,
 *   - caller already has a pending request.
 *
 * Body (all optional): { note?: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body (optional).
  let note: string | null = null;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof body.note === "string") {
      const trimmed = body.note.trim();
      if (trimmed.length > 500) {
        return NextResponse.json(
          { error: "note must be 500 characters or fewer" },
          { status: 422 },
        );
      }
      note = trimmed.length > 0 ? trimmed : null;
    }
  } catch {
    // no body / invalid JSON — ignore, note stays null
  }

  // Use service-role client for the subsequent object-scoped queries so the
  // checks are not filtered by RLS (we enforce authorization explicitly).
  const admin = createAdminClient();

  // 1. Resolve caller's diviner row.
  const { data: diviner, error: divinerErr } = await admin
    .from("diviners")
    .select("id, chime_phone_number")
    .eq("user_id", user.id)
    .maybeSingle();

  if (divinerErr) {
    console.error("[diviner/phone-requests POST] diviner lookup", divinerErr);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!diviner) {
    return NextResponse.json(
      { error: "Only diviners can request phone numbers" },
      { status: 403 },
    );
  }

  // 2. Already has a number — nothing to request.
  if (diviner.chime_phone_number) {
    return NextResponse.json(
      {
        error:
          "You already have a Chime phone number assigned. Contact the admin if you need a change.",
      },
      { status: 409 },
    );
  }

  // 3. Already has a pending request.
  const { data: existingPending, error: existingErr } = await admin
    .from("phone_number_requests")
    .select("id, created_at")
    .eq("diviner_id", diviner.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingErr) {
    console.error("[diviner/phone-requests POST] pending lookup", existingErr);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (existingPending) {
    return NextResponse.json(
      {
        error: "You already have a pending phone number request",
        request: existingPending,
      },
      { status: 409 },
    );
  }

  // 4. Create the request.
  const { data: created, error: insertErr } = await admin
    .from("phone_number_requests")
    .insert({
      diviner_id: diviner.id,
      status: "pending",
      note,
    })
    .select("id, status, note, created_at")
    .single();

  if (insertErr) {
    // Partial unique index ux_phone_number_requests_one_pending_per_diviner
    // will surface as 23505 if a race slipped past the check above.
    if (insertErr.code === "23505") {
      return NextResponse.json(
        { error: "You already have a pending phone number request" },
        { status: 409 },
      );
    }
    console.error("[diviner/phone-requests POST] insert", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ request: created }, { status: 201 });
}
