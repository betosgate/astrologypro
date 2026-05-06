import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodCutoffIso } from "@/lib/affiliate-analytics-period";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/affiliate-analytics/utm-attribution?period=...
 * Top-20 UTM sources by total commission. Joins clicks → conversions on
 * campaign_clicks.conversion_id (last-touch attribution per Phase 3 §7).
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/04-funnel-cohort.md
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
    .from("campaign_clicks")
    .select(
      "utm_source, conversion_id, campaign_conversions!inner(commission_amount_cents, order_amount_cents, converted_at, reversed_at)",
    )
    .not("conversion_id", "is", null)
    .gte("campaign_conversions.converted_at", cutoff)
    .is("campaign_conversions.reversed_at", null)
    .limit(10000);

  const tally = new Map<
    string,
    { conversions: number; gross: number; commission: number }
  >();
  for (const r of (rows ?? []) as Array<Record<string, unknown>>) {
    const source = ((r.utm_source as string | null) ?? "(none)") + "";
    const cc = r.campaign_conversions as Record<string, unknown> | null;
    if (!cc) continue;
    const entry = tally.get(source) ?? {
      conversions: 0,
      gross: 0,
      commission: 0,
    };
    entry.conversions += 1;
    entry.gross += Number((cc.order_amount_cents as number | null) ?? 0);
    entry.commission += Number((cc.commission_amount_cents as number | null) ?? 0);
    tally.set(source, entry);
  }

  const sources = Array.from(tally.entries())
    .map(([source, agg]) => ({
      source,
      conversions: agg.conversions,
      gross: agg.gross,
      commission: agg.commission,
    }))
    .sort((a, b) => b.commission - a.commission)
    .slice(0, 20);

  return NextResponse.json({ period, cutoff, sources });
}
