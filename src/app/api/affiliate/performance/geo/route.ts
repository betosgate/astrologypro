import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodCutoffIso } from "@/lib/affiliate-analytics-period";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/performance/geo?period=...
 * Top-10 countries by click count for the current affiliate's campaigns.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/01-affiliate-performance.md
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const { period, cutoff } = periodCutoffIso(url.searchParams.get("period"));

  const admin = createAdminClient();
  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate) {
    return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });
  }
  const affiliateId = (affiliate as { id: string }).id;

  const { data: campaigns } = await admin
    .from("affiliate_campaigns")
    .select("id")
    .eq("owner_affiliate_account_id", affiliateId);
  const campaignIds = (campaigns ?? []).map((c) => (c as { id: string }).id);
  if (campaignIds.length === 0) {
    return NextResponse.json({ period, cutoff, items: [] });
  }

  const { data: clicks } = await admin
    .from("campaign_clicks")
    .select("country_code")
    .in("campaign_id", campaignIds)
    .eq("is_bot", false)
    .gte("clicked_at", cutoff)
    .limit(10000);

  const tally = new Map<string, number>();
  for (const c of (clicks ?? []) as Array<Record<string, unknown>>) {
    const country = ((c.country_code as string | null) ?? "??").toUpperCase();
    tally.set(country, (tally.get(country) ?? 0) + 1);
  }

  const sorted = Array.from(tally.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  const top = sorted.slice(0, 10);
  const otherCount = sorted.slice(10).reduce((s, c) => s + c.count, 0);
  const items = otherCount > 0 ? [...top, { country: "Other", count: otherCount }] : top;

  return NextResponse.json({ period, cutoff, items });
}
