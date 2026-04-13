"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Eye,
  CalendarDays,
  CheckCircle,
  TrendingUp,
  Globe,
  Users,
} from "lucide-react";
import type { FunnelAnalytics } from "@/app/api/admin/reports/funnel/route";

// ─── Period options ─────────────────────────────────────────────────────────

const PERIODS = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
] as const;

// ─── Funnel stage colors ────────────────────────────────────────────────────

const FUNNEL_COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function FunnelAnalyticsPage() {
  const [data, setData] = useState<FunnelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("30d");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/reports/funnel?period=${period}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { funnel, byDiviner, topReferrers, daily } = data;

  // Funnel stages
  const stages = [
    { label: "Page Views", count: funnel.pageViews, icon: Eye },
    { label: "Unique Visitors", count: funnel.uniqueVisitors, icon: Users },
    {
      label: "Bookings Created",
      count: funnel.bookingsCreated,
      icon: CalendarDays,
    },
    { label: "Bookings Paid", count: funnel.bookingsPaid, icon: TrendingUp },
    {
      label: "Sessions Completed",
      count: funnel.sessionsCompleted,
      icon: CheckCircle,
    },
  ];

  const maxStageCount = Math.max(funnel.pageViews, 1);

  // Daily chart max
  const maxDailyViews = Math.max(...daily.map((d) => d.views), 1);
  const maxDailyBookings = Math.max(...daily.map((d) => d.bookings), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Funnel Analytics
          </h1>
          <p className="text-muted-foreground">
            Conversion funnel from page views to completed sessions
          </p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stages.map((stage, i) => {
              const widthPercent = Math.max(
                (stage.count / maxStageCount) * 100,
                8
              );
              const percentOfTop =
                funnel.pageViews > 0
                  ? ((stage.count / funnel.pageViews) * 100).toFixed(1)
                  : "0.0";
              const dropOff =
                i > 0 && stages[i - 1].count > 0
                  ? (
                      ((stages[i - 1].count - stage.count) /
                        stages[i - 1].count) *
                      100
                    ).toFixed(1)
                  : null;
              const Icon = stage.icon;

              return (
                <div key={stage.label} className="flex items-center gap-4">
                  <div className="w-36 shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-sm font-medium">
                      <Icon className="size-4 text-muted-foreground" />
                      {stage.label}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`${FUNNEL_COLORS[i]} h-10 rounded transition-all`}
                        style={{ width: `${widthPercent}%` }}
                      />
                      <div className="flex items-baseline gap-2 whitespace-nowrap">
                        <span className="text-lg font-bold tabular-nums">
                          {stage.count.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {percentOfTop}%
                        </span>
                        {dropOff !== null && (
                          <Badge variant="secondary" className="text-xs">
                            -{dropOff}% drop
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rate Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              View to Booking
            </CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {funnel.viewToBookingRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {funnel.bookingsCreated.toLocaleString()} bookings from{" "}
              {funnel.pageViews.toLocaleString()} views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Booking to Completion
            </CardTitle>
            <CheckCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {funnel.bookingToCompletionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {funnel.sessionsCompleted.toLocaleString()} completed from{" "}
              {funnel.bookingsCreated.toLocaleString()} bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Conversion
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {funnel.overallConversionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {funnel.sessionsCompleted.toLocaleString()} completed from{" "}
              {funnel.pageViews.toLocaleString()} views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
              Views
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              Bookings
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-purple-500" />
              Completed
            </span>
          </div>

          <div
            className="flex items-end gap-[2px]"
            style={{ height: 180 }}
          >
            {daily.map((day) => {
              const viewH =
                maxDailyViews > 0
                  ? Math.max((day.views / maxDailyViews) * 100, 1)
                  : 1;
              const bookingH =
                maxDailyBookings > 0
                  ? Math.max((day.bookings / maxDailyBookings) * 100, 1)
                  : 1;
              const completedH =
                maxDailyBookings > 0
                  ? Math.max((day.completed / maxDailyBookings) * 100, 1)
                  : 1;

              return (
                <div
                  key={day.date}
                  className="group relative flex flex-1 items-end gap-[1px]"
                  style={{ height: "100%" }}
                >
                  {/* Views bar */}
                  <div
                    className="flex-1 rounded-t bg-blue-500/70"
                    style={{ height: `${viewH}%`, minHeight: 2 }}
                  />
                  {/* Bookings bar */}
                  <div
                    className="flex-1 rounded-t bg-emerald-500/70"
                    style={{ height: `${bookingH}%`, minHeight: 2 }}
                  />
                  {/* Completed bar */}
                  <div
                    className="flex-1 rounded-t bg-purple-500/70"
                    style={{ height: `${completedH}%`, minHeight: 2 }}
                  />

                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-14 left-1/2 z-10 -translate-x-1/2 rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 whitespace-nowrap">
                    <div className="font-medium">{day.date}</div>
                    <div>
                      {day.views} views / {day.bookings} bookings /{" "}
                      {day.completed} completed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Per-Diviner Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Per-Diviner Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {byDiviner.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No diviner data for this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium">Diviner</th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      Page Views
                    </th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      Unique Visitors
                    </th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      Bookings
                    </th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      Completed
                    </th>
                    <th className="pb-2 font-medium text-right">
                      Conversion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byDiviner.map((d) => (
                    <tr key={d.divinerId} className="border-b last:border-0">
                      <td className="py-2.5 pr-4">
                        <div className="font-medium">{d.divinerName}</div>
                        {d.username && (
                          <div className="text-xs text-muted-foreground">
                            @{d.username}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {d.pageViews.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {d.uniqueVisitors.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {d.bookings.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {d.completed.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge
                          variant={
                            d.conversionRate >= 5
                              ? "default"
                              : d.conversionRate >= 2
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {d.conversionRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Referrers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-4" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topReferrers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No referrer data for this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium">Source</th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      Views
                    </th>
                    <th className="pb-2 font-medium text-right">
                      Bookings
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topReferrers.map((ref) => (
                    <tr
                      key={ref.referrer}
                      className="border-b last:border-0"
                    >
                      <td className="py-2.5 pr-4">{ref.referrer}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {ref.views.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {ref.bookings.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
