import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusCount {
  status: string;
  count: number;
}

interface CancellationReason {
  reason: string;
  count: number;
}

interface DurationBucket {
  range: string;
  count: number;
}

interface DailyPoint {
  date: string;
  total: number;
  completed: number;
  noShow: number;
}

interface BookingSummary {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  pending: number;
  confirmed: number;
  completionRate: number;
  noShowRate: number;
  cancellationRate: number;
  avgDurationMinutes: number | null;
  totalRefunds: number;
  refundCount: number;
}

export interface BookingAnalytics {
  summary: BookingSummary;
  byStatus: StatusCount[];
  cancellationReasons: CancellationReason[];
  durationDistribution: DurationBucket[];
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

// ─── GET /api/admin/reports/bookings ─────────────────────────────────────────

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
    // ── 1. Fetch all bookings in period for aggregation ──────────────────────
    let query = db
      .from("bookings")
      .select(
        "id, status, actual_duration_minutes, refund_amount, cancellation_reason, scheduled_at"
      );

    if (dateAfter) {
      query = query.gte("scheduled_at", dateAfter);
    }

    const { data: bookings, error } = await query;
    if (error) throw error;

    const rows = bookings ?? [];

    // ── 2. Summary ───────────────────────────────────────────────────────────
    const total = rows.length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const cancelled = rows.filter((r) => r.status === "canceled").length;
    const noShow = rows.filter((r) => r.status === "no_show").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const confirmed = rows.filter((r) => r.status === "confirmed").length;

    const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
    const noShowRate = total > 0 ? Math.round((noShow / total) * 1000) / 10 : 0;
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 1000) / 10 : 0;

    // Avg duration for completed bookings
    const completedDurations = rows
      .filter((r) => r.status === "completed" && r.actual_duration_minutes != null)
      .map((r) => r.actual_duration_minutes as number);

    const avgDurationMinutes =
      completedDurations.length > 0
        ? Math.round(
            (completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length) * 10
          ) / 10
        : null;

    // Refunds
    const refundRows = rows.filter(
      (r) => r.refund_amount != null && (r.refund_amount as number) > 0
    );
    const totalRefunds = refundRows.reduce((sum, r) => sum + (r.refund_amount as number), 0);
    const refundCount = refundRows.length;

    const summary: BookingSummary = {
      total,
      completed,
      cancelled,
      noShow,
      pending,
      confirmed,
      completionRate,
      noShowRate,
      cancellationRate,
      avgDurationMinutes,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      refundCount,
    };

    // ── 3. By Status ─────────────────────────────────────────────────────────
    const statusMap = new Map<string, number>();
    for (const r of rows) {
      const s = r.status ?? "unknown";
      statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
    }
    const byStatus: StatusCount[] = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // ── 4. Cancellation Reasons ──────────────────────────────────────────────
    const reasonMap = new Map<string, number>();
    for (const r of rows) {
      if (r.status === "canceled" && r.cancellation_reason) {
        const reason = r.cancellation_reason as string;
        reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
      }
    }
    const cancellationReasons: CancellationReason[] = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // ── 5. Duration Distribution ─────────────────────────────────────────────
    const buckets = { "0-30 min": 0, "30-60 min": 0, "60-90 min": 0, "90+ min": 0 };
    for (const r of rows) {
      if (r.actual_duration_minutes == null) continue;
      const d = r.actual_duration_minutes as number;
      if (d < 30) buckets["0-30 min"]++;
      else if (d < 60) buckets["30-60 min"]++;
      else if (d < 90) buckets["60-90 min"]++;
      else buckets["90+ min"]++;
    }
    const durationDistribution: DurationBucket[] = Object.entries(buckets).map(
      ([range, count]) => ({ range, count })
    );

    // ── 6. Daily Trend (last 30 days of period) ──────────────────────────────
    const dailyMap = new Map<string, { total: number; completed: number; noShow: number }>();

    // Determine the 30-day window for the daily trend
    const now = new Date();
    const dailyStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const r of rows) {
      if (!r.scheduled_at) continue;
      const d = new Date(r.scheduled_at as string);
      if (d < dailyStart) continue;

      const dateKey = d.toISOString().slice(0, 10);
      const entry = dailyMap.get(dateKey) ?? { total: 0, completed: 0, noShow: 0 };
      entry.total++;
      if (r.status === "completed") entry.completed++;
      if (r.status === "no_show") entry.noShow++;
      dailyMap.set(dateKey, entry);
    }

    const daily: DailyPoint[] = Array.from(dailyMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const result: BookingAnalytics = {
      summary,
      byStatus,
      cancellationReasons,
      durationDistribution,
      daily,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
