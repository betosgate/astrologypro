import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRICING } from "@/lib/constants";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DivinerPayout {
  divinerId: string;
  divinerName: string;
  totalRevenue: number;
  platformFee: number;
  payout: number;
  bookings: number;
  stripeAccountId: string | null;
}

interface AffiliateCommission {
  affiliateId: string;
  affiliateName: string;
  referralCode: string | null;
  totalReferrals: number;
  totalEarned: number;
  pendingAmount: number;
}

interface MonthlyRow {
  month: string;
  revenue: number;
  platformFees: number;
  divinerPayouts: number;
  affiliateCommissions: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function periodToDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case "all":
    default:
      return null;
  }
}

// ─── GET /api/admin/reports/payouts ──────────────────────────────────────────
// Query params:
//   period   30d | 90d | 1y | all  (default: 30d)

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const period = searchParams.get("period") ?? "30d";
  const since = periodToDate(period);

  const db = createAdminClient();
  const feePercent = PRICING.platformFeePercent;

  try {
    // ── 1. Completed bookings with diviner info ──────────────────────────────
    let bookingsQuery = db
      .from("bookings")
      .select(
        "id, total_amount, diviner_id, completed_at, diviners(id, display_name, stripe_account_id)"
      )
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .order("id", { ascending: false });

    if (since) {
      bookingsQuery = bookingsQuery.gte("completed_at", since.toISOString());
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery;
    if (bookingsError) throw bookingsError;

    const rows = bookings ?? [];

    // ── 2. Aggregate per diviner ─────────────────────────────────────────────
    const divinerMap = new Map<
      string,
      {
        name: string;
        revenue: number;
        count: number;
        stripeAccountId: string | null;
      }
    >();

    let totalRevenue = 0;

    for (const b of rows) {
      const amount = Number(b.total_amount ?? 0);
      totalRevenue += amount;

      const did = b.diviner_id as string;
      const divinerInfo = b.diviners as unknown as {
        id: string;
        display_name: string;
        stripe_account_id: string | null;
      } | null;

      const existing = divinerMap.get(did);
      if (existing) {
        existing.revenue += amount;
        existing.count += 1;
      } else {
        divinerMap.set(did, {
          name: divinerInfo?.display_name ?? "Unknown",
          revenue: amount,
          count: 1,
          stripeAccountId: divinerInfo?.stripe_account_id ?? null,
        });
      }
    }

    const totalPlatformFees = Math.round(totalRevenue * (feePercent / 100) * 100) / 100;
    const totalDivinerPayouts = Math.round((totalRevenue - totalPlatformFees) * 100) / 100;

    const divinerPayouts: DivinerPayout[] = Array.from(divinerMap.entries())
      .map(([divinerId, d]) => {
        const fee = Math.round(d.revenue * (feePercent / 100) * 100) / 100;
        return {
          divinerId,
          divinerName: d.name,
          totalRevenue: Math.round(d.revenue * 100) / 100,
          platformFee: fee,
          payout: Math.round((d.revenue - fee) * 100) / 100,
          bookings: d.count,
          stripeAccountId: d.stripeAccountId,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // ── 3. Affiliate commissions ─────────────────────────────────────────────
    let refQuery = db
      .from("affiliate_referrals")
      .select(
        "id, affiliate_id, commission_amount, status, created_at"
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (since) {
      refQuery = refQuery.gte("created_at", since.toISOString());
    }

    const { data: referrals, error: refError } = await refQuery;
    if (refError) throw refError;

    const refRows = referrals ?? [];

    // Group by affiliate_id
    const affMap = new Map<
      string,
      { totalEarned: number; pendingAmount: number; count: number }
    >();

    for (const r of refRows) {
      const aid = r.affiliate_id as string;
      const amount = Number(r.commission_amount ?? 0);
      const existing = affMap.get(aid);
      if (existing) {
        existing.totalEarned += amount;
        existing.count += 1;
        if (r.status === "pending") existing.pendingAmount += amount;
      } else {
        affMap.set(aid, {
          totalEarned: amount,
          pendingAmount: r.status === "pending" ? amount : 0,
          count: 1,
        });
      }
    }

    // Fetch affiliate details
    const affiliateIds = Array.from(affMap.keys());
    let totalAffiliateCommissions = 0;
    const affiliateCommissions: AffiliateCommission[] = [];

    if (affiliateIds.length > 0) {
      const { data: affiliates } = await db
        .from("affiliates")
        .select("id, name, referral_code")
        .in("id", affiliateIds);

      const affLookup = new Map(
        (affiliates ?? []).map((a) => [a.id, a])
      );

      for (const [affiliateId, agg] of affMap.entries()) {
        const info = affLookup.get(affiliateId);
        totalAffiliateCommissions += agg.totalEarned;
        affiliateCommissions.push({
          affiliateId,
          affiliateName: info?.name ?? "Unknown",
          referralCode: info?.referral_code ?? null,
          totalReferrals: agg.count,
          totalEarned: Math.round(agg.totalEarned * 100) / 100,
          pendingAmount: Math.round(agg.pendingAmount * 100) / 100,
        });
      }

      affiliateCommissions.sort((a, b) => b.totalEarned - a.totalEarned);
    }

    totalAffiliateCommissions =
      Math.round(totalAffiliateCommissions * 100) / 100;

    // ── 4. Monthly breakdown ─────────────────────────────────────────────────
    const monthMap = new Map<
      string,
      { revenue: number; platformFees: number; divinerPayouts: number }
    >();

    for (const b of rows) {
      const completedAt = b.completed_at as string | null;
      if (!completedAt) continue;
      const d = new Date(completedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const amount = Number(b.total_amount ?? 0);
      const fee = Math.round(amount * (feePercent / 100) * 100) / 100;

      const existing = monthMap.get(key);
      if (existing) {
        existing.revenue += amount;
        existing.platformFees += fee;
        existing.divinerPayouts += amount - fee;
      } else {
        monthMap.set(key, {
          revenue: amount,
          platformFees: fee,
          divinerPayouts: amount - fee,
        });
      }
    }

    // Add affiliate commissions per month
    const monthAffMap = new Map<string, number>();
    for (const r of refRows) {
      const createdAt = r.created_at as string;
      const d = new Date(createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const amount = Number(r.commission_amount ?? 0);
      monthAffMap.set(key, (monthAffMap.get(key) ?? 0) + amount);
    }

    const allMonthKeys = new Set([
      ...monthMap.keys(),
      ...monthAffMap.keys(),
    ]);

    const monthly: MonthlyRow[] = Array.from(allMonthKeys)
      .sort()
      .map((month) => {
        const m = monthMap.get(month);
        const affComm = monthAffMap.get(month) ?? 0;
        return {
          month,
          revenue: Math.round((m?.revenue ?? 0) * 100) / 100,
          platformFees: Math.round((m?.platformFees ?? 0) * 100) / 100,
          divinerPayouts: Math.round((m?.divinerPayouts ?? 0) * 100) / 100,
          affiliateCommissions: Math.round(affComm * 100) / 100,
        };
      });

    // ── 5. Response ──────────────────────────────────────────────────────────
    return NextResponse.json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPlatformFees,
        totalDivinerPayouts,
        totalAffiliateCommissions,
        avgPlatformFeePercent: feePercent,
      },
      divinerPayouts,
      affiliateCommissions,
      monthly,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: message },
      { status: 500 }
    );
  }
}
