import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface DivinerPayout {
  divinerId: string;
  divinerName: string;
  totalRevenue: number;
  platformFee: number;
  affiliateCommissions: number;
  payout: number;
  bookings: number;
  refundAmount: number;
  refundCount: number;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  settlementStatusCounts: Record<string, number>;
}

interface AffiliateCommission {
  affiliateId: string;
  affiliateName: string;
  totalReferrals: number;
  totalEarned: number;
  // Phase 1 has no paid/pending split — everything not reversed is
  // "pending payout" until Stripe auto-split ships in Phase 2.
  pendingAmount: number;
}

interface MonthlyRow {
  month: string;
  revenue: number;
  platformFees: number;
  divinerPayouts: number;
  affiliateCommissions: number;
  refunds: number;
}

function periodToDate(period: string): string | null {
  const now = new Date();
  switch (period) {
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    case "1y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
    case "all":
    default:
      return null;
  }
}

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get("period") ?? "30d";
  const since = periodToDate(period);
  const db = createAdminClient();

  try {
    let ledgerQuery = db
      .from("revenue_ledger_entries")
      .select(
        "id, diviner_id, gross_amount_cents, platform_fee_cents, affiliate_commission_cents, diviner_net_amount_cents, refunded_gross_amount_cents, refunded_diviner_net_amount_cents, settlement_status, recognized_at"
      )
      .order("recognized_at", { ascending: false })
      .order("id", { ascending: false });

    let refundsQuery = db
      .from("refund_events")
      .select("id, diviner_id, amount_cents, created_at")
      .order("created_at", { ascending: false });

    // Post System A: affiliate ledger is campaign_conversions. There's
    // no `status` enum (pending/approved/paid) in Phase 1 — conversions
    // are either earned (reversed_at IS NULL) or reversed. Phase 2
    // (Stripe auto-split) will add paid_at for true payout semantics.
    let affiliateQuery = db
      .from("campaign_conversions")
      .select("affiliate_id, commission_amount_cents, reversed_at, created_at")
      .order("created_at", { ascending: false });

    if (since) {
      ledgerQuery = ledgerQuery.gte("recognized_at", since);
      refundsQuery = refundsQuery.gte("created_at", since);
      affiliateQuery = affiliateQuery.gte("created_at", since);
    }

    // v2: campaign_conversions.affiliate_id is a `diviner_affiliates.id`
    // (junction id), NOT an `affiliates.id` (legacy System A table). Look
    // up names through the canonical v2 chain: junction → account.
    const [
      { data: diviners, error: divinersError },
      { data: ledgerRows, error: ledgerError },
      { data: refundRows, error: refundsError },
      { data: affiliateRows, error: affiliateError },
      { data: affiliateDetails, error: affiliateDetailsError },
    ] = await Promise.all([
      db
        .from("diviners")
        .select("id, display_name, stripe_account_id, charges_enabled, payouts_enabled")
        .order("display_name", { ascending: true }),
      ledgerQuery,
      refundsQuery,
      affiliateQuery,
      db
        .from("diviner_affiliates")
        .select("id, account:affiliate_accounts(name, email)"),
    ]);

    if (divinersError) throw divinersError;
    if (ledgerError) throw ledgerError;
    if (refundsError) throw refundsError;
    if (affiliateError) throw affiliateError;
    if (affiliateDetailsError) throw affiliateDetailsError;

    const payoutMap = new Map<
      string,
      {
        totalRevenue: number;
        platformFee: number;
        affiliateCommissions: number;
        payout: number;
        bookings: number;
        refundAmount: number;
        refundCount: number;
        settlementStatusCounts: Record<string, number>;
      }
    >();

    for (const diviner of diviners ?? []) {
      payoutMap.set(diviner.id, {
        totalRevenue: 0,
        platformFee: 0,
        affiliateCommissions: 0,
        payout: 0,
        bookings: 0,
        refundAmount: 0,
        refundCount: 0,
        settlementStatusCounts: {},
      });
    }

    for (const row of ledgerRows ?? []) {
      const bucket = payoutMap.get(row.diviner_id ?? "");
      if (!bucket) continue;
      bucket.totalRevenue += Number(row.gross_amount_cents ?? 0) / 100;
      bucket.platformFee += Number(row.platform_fee_cents ?? 0) / 100;
      bucket.affiliateCommissions += Number(row.affiliate_commission_cents ?? 0) / 100;
      bucket.payout += Number(row.diviner_net_amount_cents ?? 0) / 100;
      bucket.bookings += 1;
      const status = String(row.settlement_status ?? "approved");
      bucket.settlementStatusCounts[status] =
        (bucket.settlementStatusCounts[status] ?? 0) + 1;
    }

    for (const row of refundRows ?? []) {
      const bucket = payoutMap.get(row.diviner_id ?? "");
      if (!bucket) continue;
      bucket.refundAmount += Number(row.amount_cents ?? 0) / 100;
      bucket.refundCount += 1;
    }

    const divinerLookup = new Map((diviners ?? []).map((row) => [row.id, row]));
    const divinerPayouts: DivinerPayout[] = Array.from(payoutMap.entries())
      .map(([divinerId, agg]) => {
        const diviner = divinerLookup.get(divinerId);
        return {
          divinerId,
          divinerName: diviner?.display_name ?? "Unknown",
          totalRevenue: Math.round(agg.totalRevenue * 100) / 100,
          platformFee: Math.round(agg.platformFee * 100) / 100,
          affiliateCommissions: Math.round(agg.affiliateCommissions * 100) / 100,
          payout: Math.round(agg.payout * 100) / 100,
          bookings: agg.bookings,
          refundAmount: Math.round(agg.refundAmount * 100) / 100,
          refundCount: agg.refundCount,
          stripeAccountId: diviner?.stripe_account_id ?? null,
          chargesEnabled: diviner?.charges_enabled === true,
          payoutsEnabled: diviner?.payouts_enabled === true,
          settlementStatusCounts: agg.settlementStatusCounts,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const totalRevenue = divinerPayouts.reduce((sum, row) => sum + row.totalRevenue, 0);
    const totalPlatformFees = divinerPayouts.reduce((sum, row) => sum + row.platformFee, 0);
    const totalDivinerPayouts = divinerPayouts.reduce((sum, row) => sum + row.payout, 0);
    const totalAffiliateCommissions = divinerPayouts.reduce(
      (sum, row) => sum + row.affiliateCommissions,
      0,
    );
    const totalRefundAmount = divinerPayouts.reduce((sum, row) => sum + row.refundAmount, 0);
    const totalRefundCount = divinerPayouts.reduce((sum, row) => sum + row.refundCount, 0);

    const affLookup = new Map((affiliateDetails ?? []).map((row) => [row.id, row]));
    const affMap = new Map<
      string,
      { totalEarned: number; pendingAmount: number; count: number }
    >();
    for (const row of affiliateRows ?? []) {
      const affiliateId = row.affiliate_id as string | null;
      if (!affiliateId) continue;
      const amount = Number(row.commission_amount_cents ?? 0) / 100;
      const existing = affMap.get(affiliateId) ?? {
        totalEarned: 0,
        pendingAmount: 0,
        count: 0,
      };
      if (row.reversed_at) {
        // Reversed conversions don't contribute to earned or pending.
        affMap.set(affiliateId, existing);
        continue;
      }
      existing.totalEarned += amount;
      existing.count += 1;
      // Phase 1 has no paid/pending split — everything not reversed is
      // "pending payout" until Stripe auto-split ships in Phase 2.
      existing.pendingAmount += amount;
      affMap.set(affiliateId, existing);
    }

    const affiliateCommissions: AffiliateCommission[] = Array.from(affMap.entries())
      .map(([affiliateId, agg]) => {
        const info = affLookup.get(affiliateId) as
          | {
              id: string;
              account:
                | { name: string | null; email: string | null }
                | { name: string | null; email: string | null }[]
                | null;
            }
          | undefined;
        const account = Array.isArray(info?.account) ? info?.account[0] : info?.account;
        return {
          affiliateId,
          affiliateName: account?.name ?? account?.email ?? "Unknown",
          totalReferrals: agg.count,
          totalEarned: Math.round(agg.totalEarned * 100) / 100,
          pendingAmount: Math.round(agg.pendingAmount * 100) / 100,
        };
      })
      .sort((a, b) => b.totalEarned - a.totalEarned);

    const monthlyMap = new Map<
      string,
      {
        revenue: number;
        platformFees: number;
        divinerPayouts: number;
        affiliateCommissions: number;
        refunds: number;
      }
    >();

    for (const row of ledgerRows ?? []) {
      const date = new Date(row.recognized_at as string);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthlyMap.get(key) ?? {
        revenue: 0,
        platformFees: 0,
        divinerPayouts: 0,
        affiliateCommissions: 0,
        refunds: 0,
      };
      existing.revenue += Number(row.gross_amount_cents ?? 0) / 100;
      existing.platformFees += Number(row.platform_fee_cents ?? 0) / 100;
      existing.divinerPayouts += Number(row.diviner_net_amount_cents ?? 0) / 100;
      existing.affiliateCommissions += Number(row.affiliate_commission_cents ?? 0) / 100;
      monthlyMap.set(key, existing);
    }

    for (const row of refundRows ?? []) {
      const date = new Date(row.created_at as string);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthlyMap.get(key) ?? {
        revenue: 0,
        platformFees: 0,
        divinerPayouts: 0,
        affiliateCommissions: 0,
        refunds: 0,
      };
      existing.refunds += Number(row.amount_cents ?? 0) / 100;
      monthlyMap.set(key, existing);
    }

    const monthly: MonthlyRow[] = Array.from(monthlyMap.entries())
      .map(([month, value]) => ({
        month,
        revenue: Math.round(value.revenue * 100) / 100,
        platformFees: Math.round(value.platformFees * 100) / 100,
        divinerPayouts: Math.round(value.divinerPayouts * 100) / 100,
        affiliateCommissions: Math.round(value.affiliateCommissions * 100) / 100,
        refunds: Math.round(value.refunds * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const avgPlatformFeePercent =
      totalRevenue > 0 ? Math.round((totalPlatformFees / totalRevenue) * 1000) / 10 : 0;

    return NextResponse.json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
        totalDivinerPayouts: Math.round(totalDivinerPayouts * 100) / 100,
        totalAffiliateCommissions: Math.round(totalAffiliateCommissions * 100) / 100,
        totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
        totalRefundCount,
        avgPlatformFeePercent,
      },
      divinerPayouts,
      affiliateCommissions,
      monthly,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
