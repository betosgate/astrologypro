import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface LedgerRow {
  affiliate_user_id: string;
  commission_amount_cents: number;
  status: string;
}

interface PayoutRow {
  affiliate_user_id: string;
  amount_cents: number;
  paid_at: string;
}

// GET /api/dashboard/affiliate-commission/summary
// Returns per-affiliate commission summary for the authenticated diviner
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Fetch all ledger entries for this diviner (unbounded — summary aggregation)
  const { data: ledgerRows, error: ledgerError } = await admin
    .from("commission_ledger_entries")
    .select("affiliate_user_id, commission_amount_cents, status")
    .eq("diviner_user_id", user.id);

  if (ledgerError) return NextResponse.json({ error: ledgerError.message }, { status: 500 });

  // Fetch all payouts for this diviner
  const { data: payoutRows, error: payoutError } = await admin
    .from("affiliate_payout_records")
    .select("affiliate_user_id, amount_cents, paid_at")
    .eq("diviner_user_id", user.id)
    .order("paid_at", { ascending: false });

  if (payoutError) return NextResponse.json({ error: payoutError.message }, { status: 500 });

  // Resolve diviner record so we can scope affiliate lookup correctly
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // migrated-to-canonical-accounts: 2026-04-23 (Task 06)
  // Join affiliate_accounts so canonical identity is used when available.
  // The auth-user → affiliate lookup also preferably uses account.user_id
  // (canonical) and falls back to legacy diviner_affiliates.user_id.
  const { data: affiliateRows, error: affiliateError } = diviner
    ? await admin
        .from("diviner_affiliates")
        .select(
          `id, name, email, user_id,
           account:affiliate_accounts ( user_id, name, email )`
        )
        .eq("diviner_id", diviner.id)
    : { data: [], error: null };

  if (affiliateError) return NextResponse.json({ error: affiliateError.message }, { status: 500 });

  type AffRow = {
    id: string;
    name: string | null;
    email: string | null;
    user_id: string | null;
    account: { user_id: string | null; name: string; email: string } | null;
  };
  const affiliateNameMap: Record<string, { name: string; email: string }> = {};
  ((affiliateRows ?? []) as unknown as AffRow[]).forEach((a) => {
    const uid = a.account?.user_id ?? a.user_id;
    if (uid) {
      affiliateNameMap[uid] = {
        name: a.account?.name ?? a.name ?? "",
        email: a.account?.email ?? a.email ?? "",
      };
    }
  });

  // Aggregate by affiliate_user_id
  const summaryMap: Record<
    string,
    { total_earned: number; pending: number; approved: number; paid: number; last_payout_at: string | null }
  > = {};

  (ledgerRows as LedgerRow[] ?? []).forEach((row) => {
    const aff = row.affiliate_user_id;
    if (!summaryMap[aff]) {
      summaryMap[aff] = { total_earned: 0, pending: 0, approved: 0, paid: 0, last_payout_at: null };
    }
    const amount = Number(row.commission_amount_cents);
    summaryMap[aff].total_earned += amount;
    if (row.status === "pending") summaryMap[aff].pending += amount;
    else if (row.status === "approved" || row.status === "payable") summaryMap[aff].approved += amount;
    else if (row.status === "paid") summaryMap[aff].paid += amount;
  });

  (payoutRows as PayoutRow[] ?? []).forEach((row) => {
    const aff = row.affiliate_user_id;
    if (!summaryMap[aff]) {
      summaryMap[aff] = { total_earned: 0, pending: 0, approved: 0, paid: 0, last_payout_at: null };
    }
    if (!summaryMap[aff].last_payout_at || row.paid_at > summaryMap[aff].last_payout_at!) {
      summaryMap[aff].last_payout_at = row.paid_at;
    }
  });

  const data = Object.entries(summaryMap).map(([affiliate_user_id, stats]) => ({
    affiliate_user_id,
    name: affiliateNameMap[affiliate_user_id]?.name ?? null,
    email: affiliateNameMap[affiliate_user_id]?.email ?? null,
    ...stats,
  }));

  return NextResponse.json({ data });
}
