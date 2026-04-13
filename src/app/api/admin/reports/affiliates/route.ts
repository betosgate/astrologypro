import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopAdvocate {
  id: string;
  name: string;
  referralCode: string;
  referrals: number;
  earned: number;
  paid: number;
  pending: number;
  isActive: boolean;
}

interface TopAffiliate {
  id: string;
  name: string;
  divinerName: string;
  commissions: number;
  conversions: number;
  status: string;
}

interface DivinerAffiliateRow {
  divinerId: string;
  divinerName: string;
  affiliateCount: number;
  totalCommissions: number;
  totalPaid: number;
}

interface MonthlyRow {
  month: string;
  advocateEarnings: number;
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── GET /api/admin/reports/affiliates ────────────────────────────────────────
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

  try {
    // ── 1. Social Advocates ─────────────────────────────────────────────────
    const { data: advocates, error: advError } = await db
      .from("social_advocates")
      .select("id, name, referral_code, total_referrals, total_earned, total_paid, is_active, created_at");
    if (advError) throw advError;

    const advRows = advocates ?? [];
    const filteredAdvocates = since
      ? advRows.filter((a) => new Date(a.created_at) >= since)
      : advRows;

    // For all advocates (not filtered) to get totals
    const totalAdvocates = advRows.length;
    const activeAdvocates = advRows.filter((a) => a.is_active).length;

    let advTotalReferrals = 0;
    let advTotalEarned = 0;
    let advTotalPaid = 0;

    const topAdvocates: TopAdvocate[] = advRows
      .map((a) => {
        const earned = Number(a.total_earned ?? 0);
        const paid = Number(a.total_paid ?? 0);
        advTotalReferrals += Number(a.total_referrals ?? 0);
        advTotalEarned += earned;
        advTotalPaid += paid;
        return {
          id: a.id,
          name: a.name ?? "Unknown",
          referralCode: a.referral_code ?? "",
          referrals: Number(a.total_referrals ?? 0),
          earned: round2(earned),
          paid: round2(paid),
          pending: round2(earned - paid),
          isActive: a.is_active ?? false,
        };
      })
      .sort((a, b) => b.earned - a.earned)
      .slice(0, 20);

    const advPending = round2(advTotalEarned - advTotalPaid);

    // Advocate referrals for monthly breakdown
    let advRefQuery = db
      .from("affiliate_referrals")
      .select("id, commission_amount, status, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (since) {
      advRefQuery = advRefQuery.gte("created_at", since.toISOString());
    }
    const { data: advReferrals, error: advRefErr } = await advRefQuery;
    if (advRefErr) throw advRefErr;

    const advMonthMap = new Map<string, number>();
    for (const r of advReferrals ?? []) {
      const key = toMonthKey(r.created_at);
      const amount = Number(r.commission_amount ?? 0);
      advMonthMap.set(key, (advMonthMap.get(key) ?? 0) + amount);
    }

    // ── 2. Diviner Affiliates ───────────────────────────────────────────────
    let affQuery = db
      .from("diviner_affiliates")
      .select("id, diviner_id, name, email, status, default_commission_value, created_at");
    if (since) {
      affQuery = affQuery.gte("created_at", since.toISOString());
    }
    const { data: dAffiliates, error: dAffErr } = await affQuery;
    if (dAffErr) throw dAffErr;

    const dAffRows = dAffiliates ?? [];
    const totalDivinerAffiliates = dAffRows.length;
    const activeDivinerAffiliates = dAffRows.filter((a) => a.status === "active").length;

    // Fetch all commissions in period
    let commQuery = db
      .from("affiliate_commissions")
      .select("id, affiliate_id, diviner_id, commission_amount_cents, status, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (since) {
      commQuery = commQuery.gte("created_at", since.toISOString());
    }
    const { data: commissions, error: commErr } = await commQuery;
    if (commErr) throw commErr;

    const commRows = commissions ?? [];

    // Aggregate per affiliate
    const affAggMap = new Map<
      string,
      { totalCents: number; paidCents: number; count: number; divinerId: string }
    >();
    let totalCommissionsCents = 0;
    let totalPaidCents = 0;

    for (const c of commRows) {
      const cents = Number(c.commission_amount_cents ?? 0);
      totalCommissionsCents += cents;
      if (c.status === "paid") totalPaidCents += cents;

      const aid = c.affiliate_id as string;
      const existing = affAggMap.get(aid);
      if (existing) {
        existing.totalCents += cents;
        if (c.status === "paid") existing.paidCents += cents;
        existing.count += 1;
      } else {
        affAggMap.set(aid, {
          totalCents: cents,
          paidCents: c.status === "paid" ? cents : 0,
          count: 1,
          divinerId: c.diviner_id as string,
        });
      }
    }

    // Aggregate per diviner
    const divinerAggMap = new Map<
      string,
      { affiliateIds: Set<string>; totalCents: number; paidCents: number }
    >();
    for (const [affId, agg] of affAggMap.entries()) {
      const did = agg.divinerId;
      const existing = divinerAggMap.get(did);
      if (existing) {
        existing.affiliateIds.add(affId);
        existing.totalCents += agg.totalCents;
        existing.paidCents += agg.paidCents;
      } else {
        divinerAggMap.set(did, {
          affiliateIds: new Set([affId]),
          totalCents: agg.totalCents,
          paidCents: agg.paidCents,
        });
      }
    }

    // Also count affiliates with no commissions per diviner
    const divinerAffCountMap = new Map<string, Set<string>>();
    for (const a of dAffRows) {
      const did = a.diviner_id as string;
      const existing = divinerAffCountMap.get(did);
      if (existing) {
        existing.add(a.id);
      } else {
        divinerAffCountMap.set(did, new Set([a.id]));
      }
    }

    // Fetch diviner names
    const allDivinerIds = new Set([
      ...divinerAggMap.keys(),
      ...divinerAffCountMap.keys(),
    ]);
    const divinerNameMap = new Map<string, string>();
    if (allDivinerIds.size > 0) {
      const { data: diviners } = await db
        .from("diviners")
        .select("id, display_name")
        .in("id", Array.from(allDivinerIds));
      for (const d of diviners ?? []) {
        divinerNameMap.set(d.id, d.display_name ?? "Unknown");
      }
    }

    // Build byDiviner list
    const allDivinerKeySet = new Set([
      ...divinerAggMap.keys(),
      ...divinerAffCountMap.keys(),
    ]);
    const byDiviner: DivinerAffiliateRow[] = Array.from(allDivinerKeySet)
      .map((did) => {
        const agg = divinerAggMap.get(did);
        const affCount = divinerAffCountMap.get(did)?.size ?? 0;
        return {
          divinerId: did,
          divinerName: divinerNameMap.get(did) ?? "Unknown",
          affiliateCount: affCount,
          totalCommissions: round2((agg?.totalCents ?? 0) / 100),
          totalPaid: round2((agg?.paidCents ?? 0) / 100),
        };
      })
      .sort((a, b) => b.totalCommissions - a.totalCommissions);

    // Build top affiliates
    const affLookup = new Map(dAffRows.map((a) => [a.id, a]));
    const topAffiliates: TopAffiliate[] = Array.from(affAggMap.entries())
      .map(([affId, agg]) => {
        const info = affLookup.get(affId);
        return {
          id: affId,
          name: info?.name ?? "Unknown",
          divinerName: divinerNameMap.get(agg.divinerId) ?? "Unknown",
          commissions: round2(agg.totalCents / 100),
          conversions: agg.count,
          status: info?.status ?? "unknown",
        };
      })
      .sort((a, b) => b.commissions - a.commissions)
      .slice(0, 20);

    // Monthly breakdown for diviner affiliate commissions
    const affMonthMap = new Map<string, number>();
    for (const c of commRows) {
      const key = toMonthKey(c.created_at);
      const cents = Number(c.commission_amount_cents ?? 0);
      affMonthMap.set(key, (affMonthMap.get(key) ?? 0) + cents);
    }

    // ── 3. Combined ─────────────────────────────────────────────────────────
    const totalAffCommissions = round2(totalCommissionsCents / 100);
    const totalAffPaid = round2(totalPaidCents / 100);
    const totalAffPending = round2(totalAffCommissions - totalAffPaid);

    const combinedTotalEarned = round2(advTotalEarned + totalAffCommissions);
    const combinedTotalPaid = round2(advTotalPaid + totalAffPaid);
    const combinedPending = round2(advPending + totalAffPending);

    // Monthly combined
    const allMonthKeys = new Set([...advMonthMap.keys(), ...affMonthMap.keys()]);
    const monthly: MonthlyRow[] = Array.from(allMonthKeys)
      .sort()
      .map((month) => ({
        month,
        advocateEarnings: round2(advMonthMap.get(month) ?? 0),
        affiliateCommissions: round2((affMonthMap.get(month) ?? 0) / 100),
      }));

    // ── 4. Response ─────────────────────────────────────────────────────────
    return NextResponse.json({
      advocates: {
        total: totalAdvocates,
        active: activeAdvocates,
        totalReferrals: advTotalReferrals,
        totalEarned: round2(advTotalEarned),
        totalPaid: round2(advTotalPaid),
        pending: advPending,
        topAdvocates,
      },
      affiliates: {
        total: totalDivinerAffiliates,
        active: activeDivinerAffiliates,
        totalCommissions: totalAffCommissions,
        totalPaid: totalAffPaid,
        pending: totalAffPending,
        byDiviner,
        topAffiliates,
      },
      combined: {
        totalEarned: combinedTotalEarned,
        totalPaid: combinedTotalPaid,
        pending: combinedPending,
        activePartners: activeAdvocates + activeDivinerAffiliates,
        monthly,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: message },
      { status: 500 }
    );
  }
}
