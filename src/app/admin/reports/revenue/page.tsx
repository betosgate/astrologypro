"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  DollarSign,
  CalendarDays,
  Percent,
  Wallet,
  Receipt,
  Landmark,
} from "lucide-react";
import type { RevenueResponse } from "@/app/api/admin/reports/revenue/route";

// ─── Types ──────────────────────────────────────────────────────────────────

type Period = "30d" | "90d" | "1y" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "30d": "30 Days",
  "90d": "90 Days",
  "1y": "1 Year",
  all: "All Time",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function fmtNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function fmtPercent(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RevenueReportPage() {
  const [period, setPeriod] = useState<Period>("90d");
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/revenue?period=${p}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `HTTP ${res.status}`);
      }
      const json: RevenueResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => fetchData(period)}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, byDiviner, byService, monthly } = data;
  const maxMonthlyRevenue = Math.max(...monthly.map((m) => m.revenue), 1);

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Revenue Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Financial overview of recognized monetized events
          </p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              disabled={loading}
            >
              {PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Loading overlay for period changes ─────────────────────────────── */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating...
        </div>
      )}

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {fmtCurrency(summary.totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Monetized Events
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {fmtNumber(summary.totalEvents)}
            </p>
            <p className="text-xs text-muted-foreground">
              Avg {fmtCurrency(summary.avgEventValue)} per event
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Platform Fees
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {fmtCurrency(summary.platformFees)}
            </p>
            <p className="text-xs text-muted-foreground">
              Gross fee take, {fmtPercent(summary.platformFees / Math.max(summary.totalRevenue, 1))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Platform Net
            </CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {fmtCurrency(summary.platformNetRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">
              Actual kept share, {fmtPercent(summary.platformShareRatio)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Affiliate Commissions
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {fmtCurrency(summary.affiliateCommissions)}
            </p>
            <p className="text-xs text-muted-foreground">
              {fmtPercent(summary.affiliateShareRatio)} of gross revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Diviner Gross
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {fmtCurrency(summary.divinerGrossPayouts)}
            </p>
            <p className="text-xs text-muted-foreground">
              Before affiliate deductions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Diviner Net
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {fmtCurrency(summary.divinerPayouts)}
            </p>
            <p className="text-xs text-muted-foreground">
              Actual paid share, {fmtPercent(summary.divinerShareRatio)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Monthly Revenue Chart ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {monthly.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No recognized revenue in this period
            </p>
          ) : (
            <div className="flex items-end gap-2 overflow-x-auto pb-2">
              {monthly.map((m) => {
                const heightPct = (m.revenue / maxMonthlyRevenue) * 100;
                return (
                  <div
                    key={m.month}
                    className="flex min-w-[60px] flex-1 flex-col items-center gap-1"
                  >
                    <span className="text-xs font-medium tabular-nums">
                      {fmtCurrency(m.revenue)}
                    </span>
                    <div
                      className="w-full rounded-t bg-primary transition-all"
                      style={{
                        height: `${Math.max(heightPct, 4)}px`,
                        maxHeight: "200px",
                        minHeight: "4px",
                      }}
                      title={`${m.month}: ${fmtCurrency(m.revenue)} (${m.bookings} events)`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {m.month}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {m.bookings}e
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Revenue by Diviner ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Diviner</CardTitle>
        </CardHeader>
        <CardContent>
          {byDiviner.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No data
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Diviner</th>
                    <th className="pb-2 pr-4 text-right font-medium">
                      Revenue
                    </th>
                    <th className="pb-2 pr-4 text-right font-medium">
                      Events
                    </th>
                    <th className="pb-2 text-right font-medium">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {byDiviner.map((d) => (
                    <tr key={d.divinerId} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">
                        {d.divinerName}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtCurrency(d.revenue)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtNumber(d.bookings)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {fmtCurrency(d.avgPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Revenue by Source Type ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Source Type</CardTitle>
        </CardHeader>
        <CardContent>
          {byService.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No data
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Category</th>
                    <th className="pb-2 pr-4 text-right font-medium">
                      Revenue
                    </th>
                    <th className="pb-2 pr-4 text-right font-medium">
                      Events
                    </th>
                    <th className="pb-2 text-right font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {byService.map((s) => (
                    <tr key={s.category} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <Badge variant="secondary" className="capitalize">
                          {s.category}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtCurrency(s.revenue)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtNumber(s.bookings)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {summary.totalRevenue > 0
                          ? fmtPercent(s.revenue / summary.totalRevenue)
                          : "0.0%"}
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
