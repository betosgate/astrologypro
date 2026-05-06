import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodCutoffIso } from "@/lib/affiliate-analytics-period";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/finance/affiliate-mix?period=30d|90d|365d|all
 *
 * For the diviner viewing their finance page: how much of their gross
 * came from affiliate referrals vs direct, plus the top-5 affiliates
 * driving bookings to them.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/02-diviner-mix.md
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

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) {
    return NextResponse.json({ error: "Not a diviner" }, { status: 404 });
  }
  const divinerId = (diviner as { id: string }).id;

  // Bookings in the window — split by affiliate vs direct.
  const { data: bookings } = await admin
    .from("bookings")
    .select(
      "id, base_price, affiliate_commission_amount_cents, ref_code, scheduled_at, status",
    )
    .eq("diviner_id", divinerId)
    .gte("scheduled_at", cutoff)
    .neq("status", "cancelled");

  let affiliateGross = 0;
  let directGross = 0;
  let affiliateBookingCount = 0;
  let directBookingCount = 0;
  let totalCommission = 0;

  for (const b of (bookings ?? []) as Array<Record<string, unknown>>) {
    const grossCents = Math.round(Number((b.base_price as number | null) ?? 0) * 100);
    const commissionCents = Number(
      (b.affiliate_commission_amount_cents as number | null) ?? 0,
    );
    if (commissionCents > 0 || b.ref_code) {
      affiliateGross += grossCents;
      affiliateBookingCount += 1;
      totalCommission += commissionCents;
    } else {
      directGross += grossCents;
      directBookingCount += 1;
    }
  }

  const totalGross = affiliateGross + directGross;
  const pctViaAffiliate = totalGross > 0 ? affiliateGross / totalGross : 0;
  const avgCommissionPerAffiliateBookingCents =
    affiliateBookingCount > 0
      ? Math.round(totalCommission / affiliateBookingCount)
      : 0;

  // Top-5 affiliates driving bookings to this diviner
  const { data: conversions } = await admin
    .from("campaign_conversions")
    .select(
      "affiliate_account_id, commission_amount_cents, booking_id, converted_at",
    )
    .gte("converted_at", cutoff)
    .is("reversed_at", null);

  // Filter to bookings owned by this diviner
  const bookingIds = new Set(
    ((bookings ?? []) as Array<{ id: string }>).map((b) => b.id),
  );
  const tally = new Map<string, { commCents: number; bookings: number }>();
  for (const c of (conversions ?? []) as Array<Record<string, unknown>>) {
    if (!bookingIds.has(c.booking_id as string)) continue;
    const accountId = c.affiliate_account_id as string | null;
    if (!accountId) continue;
    const entry = tally.get(accountId) ?? { commCents: 0, bookings: 0 };
    entry.commCents += Number(
      (c.commission_amount_cents as number | null) ?? 0,
    );
    entry.bookings += 1;
    tally.set(accountId, entry);
  }
  const sorted = Array.from(tally.entries())
    .sort((a, b) => b[1].commCents - a[1].commCents)
    .slice(0, 5);
  const accountIds = sorted.map(([id]) => id);
  let nameMap = new Map<string, string>();
  if (accountIds.length > 0) {
    const { data: accounts } = await admin
      .from("affiliate_accounts")
      .select("id, email, display_name")
      .in("id", accountIds);
    for (const a of (accounts ?? []) as Array<Record<string, unknown>>) {
      nameMap.set(
        a.id as string,
        ((a.display_name as string | null) ?? (a.email as string | null) ?? "—") +
          "",
      );
    }
  }
  const topAffiliates = sorted.map(([id, agg]) => ({
    id,
    name: nameMap.get(id) ?? id,
    commCents: agg.commCents,
    bookings: agg.bookings,
  }));

  return NextResponse.json({
    period,
    cutoff,
    metrics: {
      affiliateGrossCents: affiliateGross,
      directGrossCents: directGross,
      totalGrossCents: totalGross,
      pctViaAffiliate,
      affiliateBookingCount,
      directBookingCount,
      totalCommissionOutflowCents: totalCommission,
      avgCommissionPerAffiliateBookingCents,
    },
    topAffiliates,
  });
}
