import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FunnelSummary {
  pageViews: number;
  uniqueVisitors: number;
  bookingsCreated: number;
  bookingsPaid: number;
  sessionsCompleted: number;
  viewToBookingRate: number;
  bookingToCompletionRate: number;
  overallConversionRate: number;
}

interface DivinerFunnel {
  divinerId: string;
  divinerName: string;
  username: string;
  pageViews: number;
  uniqueVisitors: number;
  bookings: number;
  completed: number;
  conversionRate: number;
}

interface TopReferrer {
  referrer: string;
  views: number;
  bookings: number;
}

interface DailyPoint {
  date: string;
  views: number;
  bookings: number;
  completed: number;
}

export interface FunnelAnalytics {
  funnel: FunnelSummary;
  byDiviner: DivinerFunnel[];
  topReferrers: TopReferrer[];
  daily: DailyPoint[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─── GET /api/admin/reports/funnel ──────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const period = searchParams.get("period") ?? "30d";
  const dateAfter = periodToDate(period);

  const db = createAdminClient();

  try {
    // ── 1. Fetch page_views ────────────────────────────────────────────────
    let pvQuery = db
      .from("page_views")
      .select("diviner_id, ip_hash, referrer, created_at");

    if (dateAfter) {
      pvQuery = pvQuery.gte("created_at", dateAfter);
    }

    const { data: pageViews, error: pvError } = await pvQuery;
    if (pvError) throw pvError;
    const pvRows = pageViews ?? [];

    // ── 2. Fetch bookings ──────────────────────────────────────────────────
    let bkQuery = db
      .from("bookings")
      .select("id, diviner_id, status, stripe_payment_status, created_at");

    if (dateAfter) {
      bkQuery = bkQuery.gte("created_at", dateAfter);
    }

    const { data: bookings, error: bkError } = await bkQuery;
    if (bkError) throw bkError;
    const bkRows = bookings ?? [];

    // ── 3. Fetch diviners for display names ────────────────────────────────
    const divinerIds = new Set<string>();
    for (const pv of pvRows) {
      if (pv.diviner_id) divinerIds.add(pv.diviner_id as string);
    }
    for (const bk of bkRows) {
      if (bk.diviner_id) divinerIds.add(bk.diviner_id as string);
    }

    const divinerMap = new Map<
      string,
      { display_name: string; username: string }
    >();

    if (divinerIds.size > 0) {
      const { data: diviners } = await db
        .from("diviners")
        .select("id, display_name, username")
        .in("id", Array.from(divinerIds));

      for (const d of diviners ?? []) {
        divinerMap.set(d.id as string, {
          display_name: d.display_name as string,
          username: d.username as string,
        });
      }
    }

    // ── 4. Funnel summary ──────────────────────────────────────────────────
    const totalPageViews = pvRows.length;
    const uniqueIps = new Set(
      pvRows.map((r) => r.ip_hash as string).filter(Boolean)
    );
    const uniqueVisitors = uniqueIps.size;

    const bookingsCreated = bkRows.length;
    const bookingsPaid = bkRows.filter(
      (r) =>
        r.stripe_payment_status === "succeeded" ||
        (r.status !== "pending" && r.status !== "canceled")
    ).length;
    const sessionsCompleted = bkRows.filter(
      (r) => r.status === "completed"
    ).length;

    const funnel: FunnelSummary = {
      pageViews: totalPageViews,
      uniqueVisitors,
      bookingsCreated,
      bookingsPaid,
      sessionsCompleted,
      viewToBookingRate:
        totalPageViews > 0
          ? round1((bookingsCreated / totalPageViews) * 100)
          : 0,
      bookingToCompletionRate:
        bookingsCreated > 0
          ? round1((sessionsCompleted / bookingsCreated) * 100)
          : 0,
      overallConversionRate:
        totalPageViews > 0
          ? round1((sessionsCompleted / totalPageViews) * 100)
          : 0,
    };

    // ── 5. By diviner ──────────────────────────────────────────────────────
    const dvPvMap = new Map<
      string,
      { views: number; ips: Set<string> }
    >();
    for (const pv of pvRows) {
      const did = pv.diviner_id as string;
      if (!did) continue;
      const entry = dvPvMap.get(did) ?? { views: 0, ips: new Set<string>() };
      entry.views++;
      if (pv.ip_hash) entry.ips.add(pv.ip_hash as string);
      dvPvMap.set(did, entry);
    }

    const dvBkMap = new Map<
      string,
      { bookings: number; completed: number }
    >();
    for (const bk of bkRows) {
      const did = bk.diviner_id as string;
      if (!did) continue;
      const entry = dvBkMap.get(did) ?? { bookings: 0, completed: 0 };
      entry.bookings++;
      if (bk.status === "completed") entry.completed++;
      dvBkMap.set(did, entry);
    }

    const allDivinerIds = new Set([
      ...dvPvMap.keys(),
      ...dvBkMap.keys(),
    ]);

    const byDiviner: DivinerFunnel[] = Array.from(allDivinerIds)
      .map((did) => {
        const info = divinerMap.get(did);
        const pvData = dvPvMap.get(did);
        const bkData = dvBkMap.get(did);
        const views = pvData?.views ?? 0;
        const bks = bkData?.bookings ?? 0;
        return {
          divinerId: did,
          divinerName: info?.display_name ?? "Unknown",
          username: info?.username ?? "",
          pageViews: views,
          uniqueVisitors: pvData?.ips.size ?? 0,
          bookings: bks,
          completed: bkData?.completed ?? 0,
          conversionRate: views > 0 ? round1((bks / views) * 100) : 0,
        };
      })
      .sort((a, b) => b.conversionRate - a.conversionRate);

    // ── 6. Top referrers ───────────────────────────────────────────────────
    // Group page views by referrer hostname
    const refViewMap = new Map<string, number>();
    for (const pv of pvRows) {
      const ref = pv.referrer as string | null;
      if (!ref) continue;
      const hostname = extractHostname(ref);
      if (!hostname) continue;
      refViewMap.set(hostname, (refViewMap.get(hostname) ?? 0) + 1);
    }

    // For bookings from referrers, we match by diviner + date proximity
    // Simplified: count bookings whose diviner had views from that referrer
    const refBookingMap = new Map<string, Set<string>>();
    for (const pv of pvRows) {
      const ref = pv.referrer as string | null;
      if (!ref) continue;
      const hostname = extractHostname(ref);
      const did = pv.diviner_id as string;
      if (!hostname || !did) continue;
      const entry = refBookingMap.get(hostname) ?? new Set<string>();
      entry.add(did);
      refBookingMap.set(hostname, entry);
    }

    // Count bookings for diviners that had views from each referrer
    const refBkCounts = new Map<string, number>();
    for (const [hostname, divinerSet] of refBookingMap.entries()) {
      let count = 0;
      for (const did of divinerSet) {
        count += dvBkMap.get(did)?.bookings ?? 0;
      }
      refBkCounts.set(hostname, count);
    }

    const topReferrers: TopReferrer[] = Array.from(refViewMap.entries())
      .map(([referrer, views]) => ({
        referrer,
        views,
        bookings: refBkCounts.get(referrer) ?? 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // ── 7. Daily trend (last 30 days of the period) ────────────────────────
    const now = new Date();
    const dailyDays = 30;
    const dailyStart = new Date(
      now.getTime() - dailyDays * 24 * 60 * 60 * 1000
    );

    const dayBuckets = new Map<
      string,
      { views: number; bookings: number; completed: number }
    >();
    for (let i = dailyDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dayBuckets.set(d.toISOString().slice(0, 10), {
        views: 0,
        bookings: 0,
        completed: 0,
      });
    }

    for (const pv of pvRows) {
      const d = new Date(pv.created_at as string);
      if (d < dailyStart) continue;
      const key = d.toISOString().slice(0, 10);
      const entry = dayBuckets.get(key);
      if (entry) entry.views++;
    }

    for (const bk of bkRows) {
      const d = new Date(bk.created_at as string);
      if (d < dailyStart) continue;
      const key = d.toISOString().slice(0, 10);
      const entry = dayBuckets.get(key);
      if (entry) {
        entry.bookings++;
        if (bk.status === "completed") entry.completed++;
      }
    }

    const daily: DailyPoint[] = Array.from(dayBuckets.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const result: FunnelAnalytics = {
      funnel,
      byDiviner,
      topReferrers,
      daily,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
