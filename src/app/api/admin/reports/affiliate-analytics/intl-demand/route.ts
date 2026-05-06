import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodCutoffIso } from "@/lib/affiliate-analytics-period";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/affiliate-analytics/intl-demand?period=...
 * Top-15 countries with rejected non-US affiliate-onboarding attempts
 * (signal for international expansion demand).
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
    .from("affiliate_onboarding_rejections")
    .select("detected_country_code")
    .gte("created_at", cutoff);

  const tally = new Map<string, number>();
  for (const r of (rows ?? []) as Array<Record<string, unknown>>) {
    const country = ((r.detected_country_code as string | null) ?? "??").toUpperCase();
    tally.set(country, (tally.get(country) ?? 0) + 1);
  }

  const items = Array.from(tally.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const totalAttempts = (rows ?? []).length;

  return NextResponse.json({ period, cutoff, items, totalAttempts });
}
