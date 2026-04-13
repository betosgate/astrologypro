"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Megaphone,
  Target,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

/* ---------- types ---------- */

interface Summary {
  totalCampaigns: number;
  activeCampaigns: number;
  platformWideCampaigns: number;
  divinerCampaigns: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommissions: number;
}

interface ByDivinerRow {
  divinerName: string;
  campaigns: number;
  conversions: number;
  revenue: number;
}

interface TopCampaignRow {
  name: string;
  divinerName: string;
  conversions: number;
  revenue: number;
  status: string;
}

interface MonthlyRow {
  month: string;
  conversions: number;
  revenue: number;
  commissions: number;
}

interface ReportData {
  summary: Summary;
  byDiviner: ByDivinerRow[];
  topCampaigns: TopCampaignRow[];
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

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const PERIODS = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
] as const;

/* ---------- component ---------- */

export default function AdminCampaignReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/reports?period=${period}`);
      if (res.ok) {
        setData(await res.json());
      }
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

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Failed to load campaign data.</p>
      </div>
    );
  }

  const { summary, byDiviner, topCampaigns, monthly } = data;

  const maxMonthlyRevenue = Math.max(...monthly.map((m) => m.revenue), 1);
  const maxMonthlyCommissions = Math.max(...monthly.map((m) => m.commissions), 1);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#f5f0e8" }}>
          Campaign Performance Report
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(184,188,208,0.6)" }}>
          Platform-wide campaign metrics and performance breakdown.
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
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

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.activeCampaigns} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Types</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.platformWideCampaigns} / {summary.divinerCampaigns}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Platform / Diviner
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalConversions} conversions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalCommissions)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Campaigns</CardTitle>
          <CardDescription>Highest revenue campaigns platform-wide</CardDescription>
        </CardHeader>
        <CardContent>
          {topCampaigns.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No campaigns found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Diviner</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCampaigns.map((camp, i) => (
                    <TableRow key={`${camp.name}-${i}`}>
                      <TableCell className="font-medium">{camp.name}</TableCell>
                      <TableCell>{camp.divinerName}</TableCell>
                      <TableCell className="text-right">{camp.conversions}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(camp.revenue)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[camp.status] ?? "outline"}>
                          {camp.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* By Diviner Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns by Diviner</CardTitle>
          <CardDescription>Performance breakdown per diviner</CardDescription>
        </CardHeader>
        <CardContent>
          {byDiviner.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No diviner campaign data.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Diviner</TableHead>
                    <TableHead className="text-right">Campaigns</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byDiviner.map((row) => (
                    <TableRow key={row.divinerName}>
                      <TableCell className="font-medium">{row.divinerName}</TableCell>
                      <TableCell className="text-right">{row.campaigns}</TableCell>
                      <TableCell className="text-right">{row.conversions}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend Chart */}
      {monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              Monthly Trend
            </CardTitle>
            <CardDescription>Revenue and commissions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 sm:gap-2 overflow-x-auto pb-2" style={{ minHeight: 200 }}>
              {monthly.map((m) => {
                const revHeight = Math.max((m.revenue / maxMonthlyRevenue) * 150, 4);
                const commHeight = Math.max((m.commissions / maxMonthlyCommissions) * 150, 4);

                return (
                  <div key={m.month} className="flex flex-col items-center gap-1 min-w-[48px]">
                    <div className="flex items-end gap-0.5" style={{ height: 160 }}>
                      <div
                        className="w-4 rounded-t bg-emerald-500/70"
                        style={{ height: revHeight }}
                        title={`${formatCurrency(m.revenue)} revenue`}
                      />
                      <div
                        className="w-4 rounded-t bg-amber-500/70"
                        style={{ height: commHeight }}
                        title={`${formatCurrency(m.commissions)} commissions`}
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
                <span className="inline-block size-2.5 rounded-sm bg-emerald-500/70" /> Revenue
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-sm bg-amber-500/70" /> Commissions
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
