import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/affiliate/commissions
// Returns the authenticated user's commission ledger entries + payout history
// Requires the user to be listed in the affiliates table
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Verify the user is an affiliate
  const { data: affiliateRecord } = await admin
    .from("affiliates")
    .select("id, name, email, diviner_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!affiliateRecord) {
    return NextResponse.json({ error: "Not an affiliate account" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const cursor = searchParams.get("cursor");

  // Ledger entries for this affiliate
  let ledgerQuery = admin
    .from("commission_ledger_entries")
    .select(
      "id, diviner_user_id, order_amount_cents, commission_amount_cents, status, description, period_start, period_end, approved_at, created_at"
    )
    .eq("affiliate_user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) ledgerQuery = ledgerQuery.lt("id", cursor);

  const { data: ledgerRows, error: ledgerError } = await ledgerQuery;
  if (ledgerError) return NextResponse.json({ error: ledgerError.message }, { status: 500 });

  const hasMore = (ledgerRows ?? []).length > limit;
  const ledgerItems = hasMore ? (ledgerRows ?? []).slice(0, limit) : (ledgerRows ?? []);
  const nextCursor = hasMore ? ledgerItems[ledgerItems.length - 1]?.id : null;

  // Payout history for this affiliate
  const { data: payouts, error: payoutError } = await admin
    .from("affiliate_payout_records")
    .select(
      "id, amount_cents, currency, payout_method, reference_number, notes, status, paid_at, created_at"
    )
    .eq("affiliate_user_id", user.id)
    .order("paid_at", { ascending: false })
    .limit(50);

  if (payoutError) return NextResponse.json({ error: payoutError.message }, { status: 500 });

  // Summary stats
  const allLedger = await admin
    .from("commission_ledger_entries")
    .select("commission_amount_cents, status")
    .eq("affiliate_user_id", user.id);

  let totalEarned = 0;
  let totalPaid = 0;
  let totalPending = 0;

  (allLedger.data ?? []).forEach((row) => {
    const amount = Number(row.commission_amount_cents);
    totalEarned += amount;
    if (row.status === "paid") totalPaid += amount;
    else if (row.status === "pending" || row.status === "approved" || row.status === "payable") totalPending += amount;
  });

  return NextResponse.json({
    affiliate: { id: affiliateRecord.id, name: affiliateRecord.name, email: affiliateRecord.email },
    summary: { total_earned: totalEarned, total_paid: totalPaid, total_pending: totalPending },
    ledger: ledgerItems,
    payouts: payouts ?? [],
    nextCursor,
    hasMore,
  });
}
