import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodCutoffIso } from "@/lib/affiliate-analytics-period";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/performance/top-campaigns?period=...
 * Top-10 campaigns by commission for the current affiliate.
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

  const { data: rows } = await admin
    .from("campaign_conversions")
    .select(
      "campaign_id, commission_amount_cents, order_amount_cents, reversed_at, converted_at",
    )
    .eq("affiliate_account_id", affiliateId)
    .gte("converted_at", cutoff)
    .is("reversed_at", null);

  const map = new Map<
    string,
    { commissionCents: number; orderCents: number; count: number }
  >();
  for (const r of (rows ?? []) as Array<Record<string, unknown>>) {
    const id = r.campaign_id as string | null;
    if (!id) continue;
    const entry = map.get(id) ?? {
      commissionCents: 0,
      orderCents: 0,
      count: 0,
    };
    entry.commissionCents += Number(
      (r.commission_amount_cents as number | null) ?? 0,
    );
    entry.orderCents += Number((r.order_amount_cents as number | null) ?? 0);
    entry.count += 1;
    map.set(id, entry);
  }

  const sorted = Array.from(map.entries())
    .sort((a, b) => b[1].commissionCents - a[1].commissionCents)
    .slice(0, 10);

  // Resolve campaign names
  const campaignIds = sorted.map(([id]) => id);
  let names = new Map<string, { name: string | null; share_code: string | null }>();
  if (campaignIds.length > 0) {
    const { data: campaigns } = await admin
      .from("affiliate_campaigns")
      .select("id, name, share_code")
      .in("id", campaignIds);
    for (const c of (campaigns ?? []) as Array<Record<string, unknown>>) {
      names.set(c.id as string, {
        name: (c.name as string | null) ?? null,
        share_code: (c.share_code as string | null) ?? null,
      });
    }
  }

  const items = sorted.map(([id, agg]) => {
    const meta = names.get(id);
    return {
      campaignId: id,
      name: meta?.name ?? meta?.share_code ?? id,
      shareCode: meta?.share_code ?? null,
      commissionCents: agg.commissionCents,
      orderCents: agg.orderCents,
      count: agg.count,
    };
  });

  return NextResponse.json({ period, cutoff, items });
}
