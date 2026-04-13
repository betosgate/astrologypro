"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  ArrowUpDown,
  TrendingUp,
  Megaphone,
  BarChart3,
  DollarSign,
  Users,
  Target,
} from "lucide-react";

/* ---------- types ---------- */

interface Summary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommissionsPaid: number;
  avgROI: number;
}

interface CampaignRow {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  affiliates: number;
  conversions: number;
  revenue: number;
  commissionSpent: number;
  budgetCap: number;
  budgetUsedPct: number;
  roi: number;
}

interface MonthlyRow {
  month: string;
  conversions: number;
  revenue: number;
  commissions: number;
}

interface ReportData {
  summary: Summary;
  campaigns: CampaignRow[];
  monthly: MonthlyRow[];
}

/* ---------- helpers ---------- */

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  paused: "secondary",
  draft: "outline",
  ended: "destructive",
  completed: "secondary",
};

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function fmtDate(iso: string | null) {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function budgetColor(pct: number): string {
  if (pct > 95) return "bg-red-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}

const PERIODS = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
] as const;

type SortKey = "revenue" | "conversions" | "roi" | "commissionSpent";

/* ---------- component ---------- */

export default function CampaignReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("30d");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortAsc, setSortAsc] = useState(false);

  const loadReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/campaigns/reports?period=${p}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.title ?? "Failed to load report");
        return;
      }
      const json: ReportData = await res.json();
      setData(json);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(period);
  }, [period, loadReport]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sortedCampaigns = data
    ? [...data.campaigns].sort((a, b) => {
        const diff = (a[sortKey] as number) - (b[sortKey] as number);
        return sortAsc ? diff : -diff;
      })
    : [];

  /* ---------- loading skeleton ---------- */

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campaign Reports</h1>
            <p className="text-muted-foreground">Performance metrics for your campaigns.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaign Reports</h1>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => loadReport(period)}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { summary, monthly } = data;

  // Chart bar heights
  const maxConversions = Math.max(...monthly.map((m) => m.conversions), 1);
  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campaign Reports</h1>
            <p className="text-muted-foreground">Performance metrics for your affiliate campaigns.</p>
          </div>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p.value)}
            disabled={loading}
          >
            {p.label}
          </Button>
        ))}
        {loading && <Loader2 className="size-4 animate-spin text-muted-foreground ml-2" />}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalCampaigns}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.activeCampaigns}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalConversions.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCurrency(summary.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg ROI</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.avgROI}%</p>
            <p className="text-xs text-muted-foreground">
              Commissions: {fmtCurrency(summary.totalCommissionsPaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      {monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              Monthly Performance
            </CardTitle>
            <CardDescription>Conversions and revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 sm:gap-2 overflow-x-auto pb-2" style={{ minHeight: 200 }}>
              {monthly.map((m) => {
                const convHeight = Math.max((m.conversions / maxConversions) * 150, 4);
                const revHeight = Math.max((m.revenue / maxRevenue) * 150, 4);

                return (
                  <div key={m.month} className="flex flex-col items-center gap-1 min-w-[48px]">
                    <div className="flex items-end gap-0.5" style={{ height: 160 }}>
                      <div
                        className="w-4 rounded-t bg-primary/70"
                        style={{ height: convHeight }}
                        title={`${m.conversions} conversions`}
                      />
                      <div
                        className="w-4 rounded-t bg-emerald-500/70"
                        style={{ height: revHeight }}
                        title={fmtCurrency(m.revenue)}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {fmtMonth(m.month)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-sm bg-primary/70" /> Conversions
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-sm bg-emerald-500/70" /> Revenue
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            {sortedCampaigns.length} campaign{sortedCampaigns.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedCampaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No campaigns yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Affiliates</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort("conversions")}
                        type="button"
                      >
                        Conversions <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort("revenue")}
                        type="button"
                      >
                        Revenue <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort("commissionSpent")}
                        type="button"
                      >
                        Commission <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort("roi")}
                        type="button"
                      >
                        ROI <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCampaigns.map((camp) => (
                    <TableRow key={camp.id}>
                      <TableCell className="font-medium">{camp.name}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[camp.status] ?? "outline"}>
                          {camp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {fmtDate(camp.startDate)} - {fmtDate(camp.endDate)}
                      </TableCell>
                      <TableCell>{camp.affiliates}</TableCell>
                      <TableCell>{camp.conversions.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{fmtCurrency(camp.revenue)}</TableCell>
                      <TableCell>{fmtCurrency(camp.commissionSpent)}</TableCell>
                      <TableCell>
                        {camp.budgetCap > 0 ? (
                          <div className="min-w-[80px]">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>{camp.budgetUsedPct}%</span>
                              <span className="text-muted-foreground">{fmtCurrency(camp.budgetCap)}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${budgetColor(camp.budgetUsedPct)}`}
                                style={{ width: `${Math.min(camp.budgetUsedPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No cap</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={camp.roi > 0 ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                          {camp.roi}%
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
    </div>
  );
}
