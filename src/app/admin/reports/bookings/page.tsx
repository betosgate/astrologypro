"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import type { BookingAnalytics } from "@/app/api/admin/reports/bookings/route";

// ─── Period Options ──────────────────────────────────────────────────────────

const PERIODS = [
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "1 year", value: "1y" },
  { label: "All", value: "all" },
] as const;

// ─── Status Colors ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  canceled: "#ef4444",
  no_show: "#f97316",
  pending: "#eab308",
  confirmed: "#3b82f6",
  in_progress: "#8b5cf6",
};

// ─── Page Component ──────────────────────────────────────────────────────────

export default function BookingAnalyticsPage() {
  const [data, setData] = useState<BookingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/bookings?period=${p}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json: BookingAnalytics = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  function handlePeriodChange(p: string) {
    setPeriod(p);
  }

  // ─── Loading / Error States ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading booking analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#f5f0e8" }}>
          Booking Analytics
        </h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchData(period)}>
              <RefreshCcw className="mr-2 size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { summary, byStatus, cancellationReasons, durationDistribution, daily } = data;

  // ─── Helpers for charts ────────────────────────────────────────────────────

  const totalByStatus = byStatus.reduce((a, b) => a + b.count, 0);
  const maxDuration = Math.max(...durationDistribution.map((d) => d.count), 1);
  const maxDaily = Math.max(...daily.map((d) => d.total), 1);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#f5f0e8" }}>
            Booking Analytics
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(184,188,208,0.6)" }}>
            Overview of booking performance, cancellations, and trends.
          </p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Total Bookings"
          value={summary.total.toLocaleString()}
          icon={<CalendarDays className="size-4" />}
        />
        <KpiCard
          title="Completion Rate"
          value={`${summary.completionRate}%`}
          icon={<CheckCircle className="size-4" />}
          badge={
            summary.completionRate >= 80 ? (
              <Badge variant="default" className="bg-green-600 text-xs">
                Good
              </Badge>
            ) : undefined
          }
        />
        <KpiCard
          title="No-Show Rate"
          value={`${summary.noShowRate}%`}
          icon={<AlertTriangle className="size-4" />}
          badge={
            summary.noShowRate > 10 ? (
              <Badge variant="destructive" className="text-xs">
                High
              </Badge>
            ) : undefined
          }
        />
        <KpiCard
          title="Cancellation Rate"
          value={`${summary.cancellationRate}%`}
          icon={<XCircle className="size-4" />}
        />
        <KpiCard
          title="Avg Duration"
          value={summary.avgDurationMinutes != null ? `${summary.avgDurationMinutes} min` : "—"}
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          title="Total Refunds"
          value={`$${summary.totalRefunds.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<RefreshCcw className="size-4" />}
          subtitle={`${summary.refundCount} refund${summary.refundCount !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Status Breakdown + Duration Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stacked bar */}
            <div className="flex h-8 w-full overflow-hidden rounded-md">
              {byStatus.map((s) => {
                const pct = totalByStatus > 0 ? (s.count / totalByStatus) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={s.status}
                    className="flex items-center justify-center text-xs font-medium text-white"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: STATUS_COLORS[s.status] ?? "#6b7280",
                      minWidth: pct > 0 ? "2px" : undefined,
                    }}
                    title={`${s.status}: ${s.count}`}
                  >
                    {pct >= 8 ? `${Math.round(pct)}%` : ""}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              {byStatus.map((s) => (
                <div key={s.status} className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-3 rounded-sm"
                    style={{ backgroundColor: STATUS_COLORS[s.status] ?? "#6b7280" }}
                  />
                  <span className="text-muted-foreground">
                    {s.status} ({s.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Duration Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Duration Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {durationDistribution.map((bucket) => (
              <div key={bucket.range} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{bucket.range}</span>
                  <span className="font-medium">{bucket.count}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(bucket.count / maxDuration) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cancellation Reasons + Daily Trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cancellation Reasons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cancellation Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            {cancellationReasons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cancellations in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Reason</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancellationReasons.map((r) => (
                      <tr key={r.reason} className="border-b last:border-0">
                        <td className="py-2">{r.reason}</td>
                        <td className="py-2 text-right font-medium">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daily Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {daily.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings in this period.</p>
            ) : (
              <div className="flex items-end gap-[2px]" style={{ height: 160 }}>
                {daily.map((d) => {
                  const heightPct = (d.total / maxDaily) * 100;
                  return (
                    <div
                      key={d.date}
                      className="group relative flex-1 min-w-[4px]"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="absolute bottom-0 w-full rounded-t-sm bg-primary/80 transition-all hover:bg-primary"
                        style={{ height: `${heightPct}%` }}
                        title={`${d.date}: ${d.total} total, ${d.completed} completed, ${d.noShow} no-show`}
                      />
                      {/* Tooltip on hover */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block">
                        <div className="font-medium">{d.date}</div>
                        <div>Total: {d.total}</div>
                        <div>Completed: {d.completed}</div>
                        <div>No-show: {d.noShow}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── KPI Card Component ──────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  icon,
  badge,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{icon}</span>
          {badge}
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
