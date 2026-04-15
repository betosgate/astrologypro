"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  DollarSign,
  Wallet,
  Percent,
  RotateCcw,
  CreditCard,
  Settings,
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "30d" | "90d" | "1y" | "all";

type Insights = {
  avgSessionValue: number;
  clientLtv: number;
  refundRate: number;
  taxReserve: number;
  taxReservePercent: number;
  discountImpact: number;
  revenueBySourceType: Array<{ sourceType: string; amount: number }>;
  topClients: Array<{ clientId: string; clientName: string; totalRevenue: number; sessions: number }>;
  pendingPayout: number;
  monthlyGoal: number;
  projectedMonthRevenue: number;
  thisMonthRevenue: number;
  ytdRevenue: number;
};

type FinanceResponse = {
  diviner: {
    id: string;
    displayName: string;
    stripeAccountId: string | null;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  };
  summary: {
    grossRevenue: number;
    platformFees: number;
    affiliateCommissions: number;
    divinerGross: number;
    divinerNet: number;
    grossRevenueAfterRefunds: number;
    affiliateCommissionsAfterRefunds: number;
    divinerNetAfterRefunds: number;
    refundsTotal: number;
    refundsCount: number;
    eventsCount: number;
  };
  monthly: Array<{
    month: string;
    grossRevenue: number;
    divinerNet: number;
    affiliateCommissions: number;
    grossRevenueAfterRefunds: number;
  }>;
  refunds: Array<{
    id: string;
    refundedAt: string;
    refundAmount: number;
    refundReason: string | null;
    status: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    sourceType: string;
    sourceReference: string;
    recognizedAt: string;
    grossRevenue: number;
    platformFees: number;
    affiliateCommissions: number;
    divinerNet: number;
    refundedGrossRevenue: number;
    refundedAffiliateCommissions: number;
    refundedDivinerNet: number;
    settlementStatus: string;
  }>;
  insights: Insights;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
];

const SOURCE_COLORS: Record<string, string> = {
  booking: "#6366f1",
  telephony: "#f59e0b",
  weekly_subscription: "#10b981",
  weekly_subscription_invoice: "#10b981",
  gift_certificate: "#ec4899",
  other: "#94a3b8",
};

const SOURCE_LABELS: Record<string, string> = {
  booking: "Booking",
  telephony: "Phone Session",
  weekly_subscription: "Weekly Subscription",
  weekly_subscription_invoice: "Weekly Sub Invoice",
  gift_certificate: "Gift Certificate",
};

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function fmtPct(fraction: number, decimals = 1) {
  return `${(fraction * 100).toFixed(decimals)}%`;
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtMonth(key: string) {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

function RevenueBarChart({ monthly }: { monthly: FinanceResponse["monthly"] }) {
  const WIDTH = 600;
  const HEIGHT = 180;
  const PADDING = { top: 20, right: 10, bottom: 40, left: 55 };
  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;

  if (monthly.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    );
  }

  const maxVal = Math.max(...monthly.map((m) => m.divinerNet), 1);
  const barW = Math.max(8, Math.floor((chartW / monthly.length) * 0.6));
  const gap = chartW / monthly.length;

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PADDING.top + chartH * (1 - t),
    label: fmtCurrency(maxVal * t),
  }));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      aria-label="Monthly diviner net revenue bar chart"
      role="img"
    >
      {/* Y-axis grid lines */}
      {ticks.map((tick) => (
        <g key={tick.label}>
          <line
            x1={PADDING.left}
            y1={tick.y}
            x2={WIDTH - PADDING.right}
            y2={tick.y}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
          <text
            x={PADDING.left - 6}
            y={tick.y + 4}
            textAnchor="end"
            fontSize={9}
            fill="currentColor"
            opacity={0.5}
          >
            {tick.label.replace("$", "$").replace(",000", "k")}
          </text>
        </g>
      ))}

      {/* Bars */}
      {monthly.map((m, i) => {
        const barH = Math.max(2, (m.divinerNet / maxVal) * chartH);
        const x = PADDING.left + i * gap + gap / 2 - barW / 2;
        const y = PADDING.top + chartH - barH;
        return (
          <g key={m.month}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill="#6366f1"
              opacity={0.85}
            />
            {/* Month label */}
            <text
              x={x + barW / 2}
              y={HEIGHT - PADDING.bottom + 14}
              textAnchor="middle"
              fontSize={8}
              fill="currentColor"
              opacity={0.6}
            >
              {fmtMonth(m.month).split(" ")[0]}
            </text>
            {/* Value on tall bars */}
            {barH > 24 && (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={7}
                fill="currentColor"
                opacity={0.7}
              >
                {fmtCurrency(m.divinerNet).replace(",000", "k")}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Revenue Source Stacked Bar ───────────────────────────────────────────────

function RevenueSourceBar({ sources }: { sources: Insights["revenueBySourceType"] }) {
  const total = sources.reduce((s, x) => s + x.amount, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No breakdown data for this period.</p>;
  }
  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-5 w-full overflow-hidden rounded-full">
        {sources.map((src) => {
          const pct = (src.amount / total) * 100;
          const color = SOURCE_COLORS[src.sourceType] ?? SOURCE_COLORS.other;
          return (
            <div
              key={src.sourceType}
              style={{ width: `${pct}%`, backgroundColor: color }}
              title={`${SOURCE_LABELS[src.sourceType] ?? src.sourceType}: ${fmtCurrency(src.amount)}`}
            />
          );
        })}
      </div>
      {/* Legend */}
      <div className="space-y-1">
        {sources.map((src) => {
          const pct = (src.amount / total) * 100;
          const color = SOURCE_COLORS[src.sourceType] ?? SOURCE_COLORS.other;
          return (
            <div key={src.sourceType} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">
                  {SOURCE_LABELS[src.sourceType] ?? src.sourceType}
                </span>
              </div>
              <div className="flex items-center gap-2 tabular-nums">
                <span className="font-medium">{fmtCurrency(src.amount)}</span>
                <span className="text-muted-foreground">({pct.toFixed(0)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Goal Settings Modal ──────────────────────────────────────────────────────

function GoalSettings({
  initialGoal,
  initialTax,
  onClose,
  onSaved,
}: {
  initialGoal: number;
  initialTax: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [goal, setGoal] = useState(String(Math.round(initialGoal)));
  const [tax, setTax] = useState(String(initialTax));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const g = parseFloat(goal);
    const t = parseFloat(tax);
    if (isNaN(g) || g < 0) { setErr("Goal must be a positive number"); return; }
    if (isNaN(t) || t < 0 || t > 60) { setErr("Tax reserve must be 0–60%"); return; }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/dashboard/finance/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyGoalDollars: g, taxReservePercent: t }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to save");
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-xl">
        <h2 className="mb-4 text-base font-semibold">Finance Goals</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Monthly Revenue Goal ($)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Tax Reserve %
            </label>
            <input
              type="number"
              min={0}
              max={60}
              step={0.5}
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardFinancePage() {
  const [period, setPeriod] = useState<Period>("90d");
  const [data, setData] = useState<FinanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGoals, setShowGoals] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (nextPeriod: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/finance?period=${nextPeriod}`);
      const json = (await res.json().catch(() => ({}))) as FinanceResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load finance data");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [load, period]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/dashboard/finance/export?period=${period}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? `finance-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent — CSV export failure is non-critical
    } finally {
      setExporting(false);
    }
  }

  // ── Loading / error states ──────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button className="mt-4" variant="outline" onClick={() => load(period)}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { summary, monthly, refunds, recentActivity, insights } = data;

  // Refund rate color
  const refundRateColor =
    insights.refundRate > 0.1
      ? "text-destructive"
      : insights.refundRate < 0.05
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-amber-600 dark:text-amber-400";

  return (
    <div className="space-y-6">
      {showGoals && (
        <GoalSettings
          initialGoal={insights.monthlyGoal}
          initialTax={insights.taxReservePercent}
          onClose={() => setShowGoals(false)}
          onSaved={() => { setShowGoals(false); load(period); }}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">
            Your revenue, fees, payouts, and net earnings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={period === option.value ? "default" : "outline"}
              onClick={() => setPeriod(option.value)}
              disabled={loading}
            >
              {option.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={exporting || loading}
            aria-label="Export CSV"
          >
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span className="ml-1.5 hidden sm:inline">Export CSV</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowGoals(true)}
            aria-label="Finance goals settings"
          >
            <Settings className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Row 1: Hero KPI strip ──────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {/* Total Revenue — this month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Revenue (Month)</CardTitle>
            <DollarSign className="size-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-bold">{fmtCurrency(insights.thisMonthRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">net earned this month</p>
          </CardContent>
        </Card>

        {/* Avg Session Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Session</CardTitle>
            <TrendingUp className="size-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-bold">{fmtCurrency(insights.avgSessionValue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">per session</p>
          </CardContent>
        </Card>

        {/* Refund Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Refund Rate</CardTitle>
            <RotateCcw className="size-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className={`text-xl font-bold ${refundRateColor}`}>
              {fmtPct(insights.refundRate)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.refundsCount} refund{summary.refundsCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Pending Payout */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pending Payout</CardTitle>
            <Clock className="size-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-bold">{fmtCurrency(insights.pendingPayout)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">awaiting settlement</p>
          </CardContent>
        </Card>

        {/* Tax Reserve */}
        <Card className="border-amber-300 dark:border-amber-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Tax Reserve</CardTitle>
            <AlertTriangle className="size-3.5 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {fmtCurrency(insights.taxReserve)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              set aside ({insights.taxReservePercent}%)
            </p>
          </CardContent>
        </Card>

        {/* YTD Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">YTD Revenue</CardTitle>
            <Wallet className="size-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-bold">{fmtCurrency(insights.ytdRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">year to date (net)</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Chart + Top Clients ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              Revenue Trend — Diviner Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueBarChart monthly={monthly} />
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              Top Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No client data in this period.</p>
            ) : (
              insights.topClients.map((client, idx) => (
                <div key={client.clientId} className="flex items-center gap-3">
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: idx === 0 ? "#fbbf24" : idx === 1 ? "#94a3b8" : idx === 2 ? "#cd7c2f" : "#e2e8f0",
                      color: idx < 3 ? "#fff" : "#64748b",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.sessions} session{client.sessions !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    {fmtCurrency(client.totalRevenue)}
                  </span>
                </div>
              ))
            )}
            {insights.clientLtv > 0 && (
              <div className="pt-2 border-t text-xs text-muted-foreground">
                Avg client LTV:{" "}
                <span className="font-semibold text-foreground">
                  {fmtCurrency(insights.clientLtv)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Revenue by Type + Discount Impact ───────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="size-4 text-muted-foreground" />
              Revenue by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueSourceBar sources={insights.revenueBySourceType} />
          </CardContent>
        </Card>

        {/* Discount Impact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="size-4 text-muted-foreground" />
              Discount Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-bold">
                {fmtCurrency(insights.discountImpact)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                total revenue discounted away
              </p>
            </div>
            {insights.discountImpact > 0 && (
              <p className="text-sm text-muted-foreground rounded-lg border p-3 bg-muted/40">
                Your generosity costs{" "}
                <span className="font-semibold text-foreground">
                  {fmtCurrency(insights.discountImpact)}
                </span>{" "}
                in discounts — but builds client loyalty and repeat bookings.
              </p>
            )}
            {insights.discountImpact === 0 && (
              <p className="text-sm text-muted-foreground">No discounts applied in this period.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Payout Readiness ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="size-4 text-muted-foreground" />
            Payout Readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground text-xs mb-1">Stripe Account</p>
            <div className="flex items-center gap-1.5 font-medium">
              {data.diviner.stripeAccountId ? (
                <>
                  <CheckCircle className="size-3.5 text-emerald-500" />
                  Connected
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3.5 text-destructive" />
                  Missing
                </>
              )}
            </div>
          </div>
          <div className="rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground text-xs mb-1">Charges</p>
            <div className="flex items-center gap-1.5 font-medium">
              {data.diviner.chargesEnabled ? (
                <>
                  <CheckCircle className="size-3.5 text-emerald-500" />
                  Enabled
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  Not enabled
                </>
              )}
            </div>
          </div>
          <div className="rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground text-xs mb-1">Payouts</p>
            <div className="flex items-center gap-1.5 font-medium">
              {data.diviner.payoutsEnabled ? (
                <>
                  <CheckCircle className="size-3.5 text-emerald-500" />
                  Enabled
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  Not enabled
                </>
              )}
            </div>
          </div>
          <div className="rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground text-xs mb-1">Pending Amount</p>
            <p className="font-semibold">{fmtCurrency(insights.pendingPayout)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Est. 2–3 business days after settlement
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Row 5: Monthly Breakdown ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {monthly.length === 0 ? (
            <p className="text-sm text-muted-foreground">No finance activity in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">After Refunds</TableHead>
                    <TableHead className="text-right">Affiliate Share</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthly.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{fmtMonth(row.month)}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(row.grossRevenue)}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(row.grossRevenueAfterRefunds)}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(row.affiliateCommissions)}</TableCell>
                      <TableCell className="text-right font-medium">{fmtCurrency(row.divinerNet)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Row 6: Recent Activity ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Finance Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent ledger activity.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">Affiliate</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-right">Refunded</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">{fmtDate(row.recognizedAt)}</TableCell>
                      <TableCell className="capitalize whitespace-nowrap">
                        {(SOURCE_LABELS[row.sourceType] ?? row.sourceType).replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-right">{fmtCurrency(row.grossRevenue)}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(row.platformFees)}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(row.affiliateCommissions)}</TableCell>
                      <TableCell className="text-right font-medium">{fmtCurrency(row.divinerNet)}</TableCell>
                      <TableCell className="text-right">
                        {row.refundedGrossRevenue > 0 ? (
                          <span className="text-destructive">{fmtCurrency(row.refundedGrossRevenue)}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            row.settlementStatus === "settled" || row.settlementStatus === "approved"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : row.settlementStatus === "pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : row.settlementStatus === "refunded"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {row.settlementStatus.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Row 7: Recent Refunds ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Refunds</CardTitle>
        </CardHeader>
        <CardContent>
          {refunds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No refunds in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refunded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">{fmtDate(row.refundedAt)}</TableCell>
                      <TableCell className="capitalize">{row.status ?? "—"}</TableCell>
                      <TableCell>{row.refundReason ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {fmtCurrency(row.refundAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Footer summary ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <span className="block font-medium text-foreground">{fmtCurrency(summary.grossRevenue)}</span>
            Gross revenue
          </div>
          <div>
            <span className="block font-medium text-foreground">{fmtCurrency(summary.platformFees)}</span>
            Platform fees
          </div>
          <div>
            <span className="block font-medium text-foreground">{fmtCurrency(summary.affiliateCommissions)}</span>
            Affiliate commissions
          </div>
          <div>
            <span className="block font-medium text-foreground">{summary.eventsCount}</span>
            Monetized events
          </div>
        </div>
      </div>
    </div>
  );
}
