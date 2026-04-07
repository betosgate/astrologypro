import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliate-commission/payouts
// Query params: affiliate_id?, limit?, cursor?
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const affiliateId = searchParams.get("affiliate_id");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();
  let query = admin
    .from("affiliate_payout_records")
    .select(
      "id, affiliate_user_id, amount_cents, currency, payout_method, reference_number, notes, status, paid_at, created_at"
    )
    .eq("diviner_user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (affiliateId) query = query.eq("affiliate_user_id", affiliateId);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hasMore = (data ?? []).length > limit;
  const items = hasMore ? (data ?? []).slice(0, limit) : (data ?? []);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}

// POST /api/dashboard/affiliate-commission/payouts
// Body: { affiliate_user_id, amount_cents, payout_method?, reference_number?, notes?, ledger_entry_ids[] }
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
  }

  const {
    affiliate_user_id,
    amount_cents,
    payout_method,
    reference_number,
    notes,
    ledger_entry_ids,
  } = body as Record<string, unknown>;

  if (
    typeof affiliate_user_id !== "string" || affiliate_user_id.trim() === "" ||
    typeof amount_cents !== "number" || amount_cents <= 0
  ) {
    return NextResponse.json(
      { error: "affiliate_user_id (string) and amount_cents (positive number) are required." },
      { status: 422 }
    );
  }

  const entryIds: string[] = Array.isArray(ledger_entry_ids)
    ? (ledger_entry_ids as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  const admin = createAdminClient();

  // Build payout record insert
  const payoutInsert: Record<string, unknown> = {
    diviner_user_id: user.id,
    affiliate_user_id,
    amount_cents,
    currency: "usd",
    status: "recorded",
    paid_at: new Date().toISOString(),
    created_by: user.id,
  };
  if (typeof payout_method === "string" && payout_method.trim() !== "") {
    payoutInsert.payout_method = payout_method.trim();
  }
  if (typeof reference_number === "string" && reference_number.trim() !== "") {
    payoutInsert.reference_number = reference_number.trim();
  }
  if (typeof notes === "string" && notes.trim() !== "") {
    payoutInsert.notes = notes.trim();
  }

  const { data: payout, error: payoutError } = await admin
    .from("affiliate_payout_records")
    .insert(payoutInsert)
    .select(
      "id, affiliate_user_id, amount_cents, currency, payout_method, reference_number, notes, status, paid_at, created_at"
    )
    .single();

  if (payoutError) return NextResponse.json({ error: payoutError.message }, { status: 500 });

  // Create allocations and mark ledger entries as paid
  if (entryIds.length > 0) {
    // Verify each entry belongs to this diviner and this affiliate
    const { data: entries, error: entriesError } = await admin
      .from("commission_ledger_entries")
      .select("id, commission_amount_cents, diviner_user_id, affiliate_user_id")
      .in("id", entryIds)
      .eq("diviner_user_id", user.id)
      .eq("affiliate_user_id", affiliate_user_id);

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    const verifiedEntries = entries ?? [];

    if (verifiedEntries.length > 0) {
      // Create allocations
      const allocations = verifiedEntries.map((e) => ({
        payout_record_id: payout.id,
        ledger_entry_id: e.id,
        amount_cents: e.commission_amount_cents,
      }));
      await admin.from("affiliate_payout_allocations").insert(allocations);

      // Mark entries as paid
      await admin
        .from("commission_ledger_entries")
        .update({ status: "paid" })
        .in(
          "id",
          verifiedEntries.map((e) => e.id)
        );
    }
  }

  await admin.from("affiliate_commission_audit").insert({
    actor_user_id: user.id,
    action: "create_payout",
    entity_type: "affiliate_payout_records",
    entity_id: payout.id,
    after_state: { ...payout, ledger_entry_ids: entryIds },
  });

  return NextResponse.json({ data: payout }, { status: 201 });
}
