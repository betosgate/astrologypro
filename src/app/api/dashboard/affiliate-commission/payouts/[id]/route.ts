import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliate-commission/payouts/[id]
// Returns a single payout record owned by the authenticated diviner.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized" },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("affiliate_payout_records")
    .select(
      "id, affiliate_user_id, diviner_user_id, amount_cents, currency, payout_method, reference_number, notes, status, paid_at, created_at"
    )
    .eq("id", id)
    .eq("diviner_user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Payout not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

// PATCH /api/dashboard/affiliate-commission/payouts/[id]
// Body: { action: "verify" | "reverse" }
// verify: moves status from "recorded" → "verified"
// reverse: moves status from "recorded"|"verified" → "reversed" and un-marks linked commission entries
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body" },
      { status: 422 }
    );
  }

  const { action } = body as Record<string, unknown>;
  if (action !== "verify" && action !== "reverse") {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        detail: "action must be 'verify' or 'reverse'.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Fetch and verify ownership
  const { data: existing, error: fetchError } = await admin
    .from("affiliate_payout_records")
    .select("id, diviner_user_id, affiliate_user_id, status, amount_cents")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Payout not found" },
      { status: 404 }
    );
  }

  if (existing.diviner_user_id !== user.id) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Forbidden" },
      { status: 403 }
    );
  }

  if (action === "verify") {
    if (existing.status !== "recorded") {
      return NextResponse.json(
        {
          type: "https://httpstatuses.io/422",
          title: "Validation error",
          detail: `Cannot verify a payout with status '${existing.status}'. Only 'recorded' payouts can be verified.`,
        },
        { status: 422 }
      );
    }

    const { data, error } = await admin
      .from("affiliate_payout_records")
      .update({ status: "verified" })
      .eq("id", id)
      .select("id, status, amount_cents, paid_at")
      .single();

    if (error) {
      return NextResponse.json(
        { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
        { status: 500 }
      );
    }

    await admin.from("affiliate_commission_audit").insert({
      actor_user_id: user.id,
      action: "verify_payout",
      entity_type: "affiliate_payout_records",
      entity_id: id,
      before_state: existing,
      after_state: data,
    });

    return NextResponse.json({ data });
  }

  // action === "reverse"
  const reversibleStatuses = ["recorded", "verified"];
  if (!reversibleStatuses.includes(existing.status as string)) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        detail: `Cannot reverse a payout with status '${existing.status}'. Only 'recorded' or 'verified' payouts can be reversed.`,
      },
      { status: 422 }
    );
  }

  const { data, error } = await admin
    .from("affiliate_payout_records")
    .update({ status: "reversed" })
    .eq("id", id)
    .select("id, status, amount_cents, paid_at")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  // Fetch linked commission entries via payout allocations and revert their status
  const { data: allocations } = await admin
    .from("affiliate_payout_allocations")
    .select("ledger_entry_id")
    .eq("payout_record_id", id);

  if (allocations && allocations.length > 0) {
    const entryIds = allocations.map(
      (a: { ledger_entry_id: string }) => a.ledger_entry_id
    );

    // Revert entries that were paid back to "approved" so they remain payable
    await admin
      .from("commission_ledger_entries")
      .update({ status: "approved" })
      .in("id", entryIds)
      .eq("status", "paid");
  }

  await admin.from("affiliate_commission_audit").insert({
    actor_user_id: user.id,
    action: "reverse_payout",
    entity_type: "affiliate_payout_records",
    entity_id: id,
    before_state: existing,
    after_state: data,
    reason: "payout reversal requested by diviner",
  });

  return NextResponse.json({ data });
}
