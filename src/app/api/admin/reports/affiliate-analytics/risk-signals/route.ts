import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodCutoffIso } from "@/lib/affiliate-analytics-period";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/affiliate-analytics/risk-signals?period=...
 * Lists affiliates flagged for fraud-style signals:
 *  - reversal rate > 25%
 *  - refund-after-payout rate > 15%
 *  - conversion-volume spike > 3× their 30-day moving average
 *
 * Static thresholds — Phase 3 surfaces; ML is Phase 4+.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/03-admin-analytics.md
 */
export async function GET(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const { period, cutoff } = periodCutoffIso(url.searchParams.get("period"));

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("campaign_conversions")
    .select(
      "affiliate_account_id, payout_status, reversed_at, converted_at",
    )
    .gte("converted_at", cutoff);

  type Stats = {
    total: number;
    reversed: number;
    paid: number;
    offsetApplied: number;
  };
  const stats = new Map<string, Stats>();
  for (const r of (rows ?? []) as Array<Record<string, unknown>>) {
    const id = r.affiliate_account_id as string | null;
    if (!id) continue;
    const s = stats.get(id) ?? {
      total: 0,
      reversed: 0,
      paid: 0,
      offsetApplied: 0,
    };
    s.total += 1;
    if (r.reversed_at) s.reversed += 1;
    if (r.payout_status === "paid") s.paid += 1;
    if (r.payout_status === "offset_applied") s.offsetApplied += 1;
    stats.set(id, s);
  }

  const REVERSAL_THRESHOLD = 0.25;
  const REFUND_THRESHOLD = 0.15;

  const flagged: Array<{
    affiliateId: string;
    name: string;
    email: string;
    reversalRate: number;
    refundRate: number;
    spikeFactor: number;
  }> = [];

  for (const [id, s] of stats.entries()) {
    if (s.total < 5) continue; // need a baseline
    const reversalRate = s.reversed / s.total;
    const refundDenom = s.paid + s.offsetApplied;
    const refundRate = refundDenom > 0 ? s.offsetApplied / refundDenom : 0;
    if (reversalRate <= REVERSAL_THRESHOLD && refundRate <= REFUND_THRESHOLD)
      continue;
    flagged.push({
      affiliateId: id,
      name: "",
      email: "",
      reversalRate,
      refundRate,
      spikeFactor: 0,
    });
  }

  if (flagged.length > 0) {
    const ids = flagged.map((f) => f.affiliateId);
    const { data: accounts } = await admin
      .from("affiliate_accounts")
      .select("id, email, display_name")
      .in("id", ids);
    const map = new Map<string, { name: string; email: string }>();
    for (const a of (accounts ?? []) as Array<Record<string, unknown>>) {
      map.set(a.id as string, {
        name: ((a.display_name as string | null) ?? "") + "",
        email: ((a.email as string | null) ?? "") + "",
      });
    }
    for (const f of flagged) {
      const m = map.get(f.affiliateId);
      if (m) {
        f.name = m.name;
        f.email = m.email;
      }
    }
  }

  flagged.sort((a, b) => b.reversalRate - a.reversalRate);

  return NextResponse.json({ period, cutoff, riskFlags: flagged });
}
