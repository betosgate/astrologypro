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
  Users,
  UserCheck,
  MousePointerClick,
  DollarSign,
  Clock,
  ArrowLeft,
  ArrowUpDown,
  ExternalLink,
  TrendingUp,
} from "lucide-react";

/* ---------- types ---------- */

interface Summary {
  totalAffiliates: number;
  activeAffiliates: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalCommissionsPaid: number;
  totalCommissionsPending: number;
  totalRevenue: number;
}

interface AffiliateRow {
  id: string;
  name: string;
  email: string;
  status: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
  totalCommission: number;
  pendingCommission: number;
  lastActivity: string | null;
}

interface MonthlyRow {
  month: string;
  clicks: number;
  conversions: number;
  commissions: number;
  revenue: number;
}

interface TopLink {
  slug: string;
  url: string;
  clicks: number;
  conversions: number;
}

interface ReportData {
  summary: Summary;
  affiliates: AffiliateRow[];
  monthly: MonthlyRow[];
  topLinks: TopLink[];
}

/* ---------- helpers ---------- */

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "outline",
  suspended: "secondary",
  blocked: "destructive",
};

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
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

const PERIODS = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
] as const;

type SortKey = "totalCommission" | "clicks" | "conversions" | "conversionRate";

/* ---------- component ---------- */

export default function AffiliateReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("30d");
  const [sortKey, setSortKey] = useState<SortKey>("totalCommission");
  const [sortAsc, setSortAsc] = useState(false);

  const loadReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/affiliates/reports?period=${p}`);
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

  const sortedAffiliates = data
    ? [...data.affiliates].sort((a, b) => {
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
            <h1 className="text-2xl font-bold tracking-tight">Affiliate Reports</h1>
            <p className="text-muted-foreground">Performance metrics for your affiliate network.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate Reports</h1>
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

  const { summary, monthly, topLinks } = data;

  // Chart bar heights — find max for scaling
  const maxConversions = Math.max(...monthly.map((m) => m.conversions), 1);
  const maxCommissions = Math.max(...monthly.map((m) => m.commissions), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href="/dashboard/affiliates">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Affiliate Reports</h1>
            <p className="text-muted-foreground">Performance metrics for your affiliate network.</p>
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
            <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalAffiliates}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.activeAffiliates}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Click-to-Conversion</CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.conversionRate}%</p>
            <p className="text-xs text-muted-foreground">
              {summary.totalConversions} / {summary.totalClicks} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commissions Paid</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCents(summary.totalCommissionsPaid)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {fmtCents(summary.totalCommissionsPending)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance Chart */}
      {monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              Monthly Performance
            </CardTitle>
            <CardDescription>Conversions and commissions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 sm:gap-2 overflow-x-auto pb-2" style={{ minHeight: 200 }}>
              {monthly.map((m) => {
                const convHeight = Math.max((m.conversions / maxConversions) * 150, 4);
                const commHeight = Math.max((m.commissions / maxCommissions) * 150, 4);

                return (
                  <div key={m.month} className="flex flex-col items-center gap-1 min-w-[48px]">
                    <div className="flex items-end gap-0.5" style={{ height: 160 }}>
                      <div
                        className="w-4 rounded-t bg-primary/70"
                        style={{ height: convHeight }}
                        title={`${m.conversions} conversions`}
                      />
                      <div
                        className="w-4 rounded-t bg-amber-500/70"
                        style={{ height: commHeight }}
                        title={fmtCents(m.commissions)}
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
                <span className="inline-block size-2.5 rounded-sm bg-amber-500/70" /> Commissions
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affiliate Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Affiliate Performance</CardTitle>
          <CardDescription>
            {sortedAffiliates.length} affiliate{sortedAffiliates.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedAffiliates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No affiliates yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort("clicks")}
                        type="button"
                      >
                        Clicks <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
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
                        onClick={() => handleSort("conversionRate")}
                        type="button"
                      >
                        Rate <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort("totalCommission")}
                        type="button"
                      >
                        Commission <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAffiliates.map((aff) => (
                    <TableRow key={aff.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{aff.name}</p>
                          <p className="text-xs text-muted-foreground">{aff.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[aff.status] ?? "outline"}>{aff.status}</Badge>
                      </TableCell>
                      <TableCell>{aff.clicks.toLocaleString()}</TableCell>
                      <TableCell>{aff.conversions.toLocaleString()}</TableCell>
                      <TableCell>{aff.conversionRate}%</TableCell>
                      <TableCell className="font-medium">{fmtCents(aff.totalCommission)}</TableCell>
                      <TableCell className="text-amber-600">{fmtCents(aff.pendingCommission)}</TableCell>
                      <TableCell className="text-muted-foreground">{fmtDate(aff.lastActivity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Referral Links */}
      {topLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Referral Links</CardTitle>
            <CardDescription>Most active referral links by clicks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLinks.map((link) => {
                    const rate = link.clicks > 0
                      ? Math.round((link.conversions / link.clicks) * 1000) / 10
                      : 0;
                    return (
                      <TableRow key={link.slug}>
                        <TableCell className="font-mono text-sm">{link.slug}</TableCell>
                        <TableCell>
                          {link.url ? (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <span className="truncate max-w-[240px]">{link.url}</span>
                              <ExternalLink className="size-3 shrink-0" />
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell>{link.clicks.toLocaleString()}</TableCell>
                        <TableCell>{link.conversions.toLocaleString()}</TableCell>
                        <TableCell>{rate}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
