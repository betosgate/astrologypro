"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Megaphone,
  Target,
  Users,
  DollarSign,
  Clock,
} from "lucide-react";

/* ---------- types ---------- */

interface Summary {
  campaignsJoined: number;
  activeCampaigns: number;
  totalConversions: number;
  totalEarned: number;
  pendingEarnings: number;
}

interface CampaignRow {
  campaignName: string;
  divinerName: string;
  status: string;
  startDate: string | null;
  myConversions: number;
  myEarnings: number;
  commissionRate: number;
}

interface ReportData {
  summary: Summary;
  campaigns: CampaignRow[];
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

const PERIODS = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
] as const;

/* ---------- component ---------- */

export default function AdvocateCampaignsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("30d");

  const loadReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/advocate/campaigns?period=${p}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.title ?? "Failed to load campaigns");
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

  /* ---------- loading skeleton ---------- */

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Loading your campaign data...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-8 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
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

  const { summary, campaigns } = data;

  const kpis = [
    {
      label: "Campaigns Joined",
      value: summary.campaignsJoined,
      icon: Megaphone,
      color: "text-blue-500",
    },
    {
      label: "Active",
      value: summary.activeCampaigns,
      icon: Target,
      color: "text-emerald-500",
    },
    {
      label: "Total Conversions",
      value: summary.totalConversions,
      icon: Users,
      color: "text-purple-500",
    },
    {
      label: "Total Earned",
      value: fmtCurrency(summary.totalEarned),
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      label: "Pending Earnings",
      value: fmtCurrency(summary.pendingEarnings),
      icon: Clock,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground">
          Your campaign participation and earnings
        </p>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Period:</span>
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
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <Icon className={`size-3.5 ${kpi.color}`} />
                  {kpi.label}
                </CardDescription>
                <CardTitle className="text-2xl">{kpi.value}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <CardDescription>
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} you are participating in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              You have not joined any campaigns yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Campaign</th>
                    <th className="pb-2 text-left font-medium">Diviner</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                    <th className="pb-2 text-left font-medium">Start Date</th>
                    <th className="pb-2 text-right font-medium">Conversions</th>
                    <th className="pb-2 text-right font-medium">Earnings</th>
                    <th className="pb-2 text-right font-medium">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaigns.map((camp, i) => (
                    <tr key={`${camp.campaignName}-${i}`}>
                      <td className="py-2 font-medium">{camp.campaignName}</td>
                      <td className="py-2 text-muted-foreground">{camp.divinerName}</td>
                      <td className="py-2">
                        <Badge variant={STATUS_COLORS[camp.status] ?? "outline"}>
                          {camp.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-muted-foreground">{fmtDate(camp.startDate)}</td>
                      <td className="py-2 text-right">{camp.myConversions}</td>
                      <td className="py-2 text-right font-medium">{fmtCurrency(camp.myEarnings)}</td>
                      <td className="py-2 text-right text-muted-foreground">{camp.commissionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings by Campaign */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Earnings by Campaign</CardTitle>
            <CardDescription>Proportional earnings breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const maxEarnings = Math.max(...campaigns.map((c) => c.myEarnings), 1);
              return (
                <div className="space-y-3">
                  {campaigns
                    .filter((c) => c.myEarnings > 0)
                    .map((camp, i) => {
                      const pct = (camp.myEarnings / maxEarnings) * 100;
                      return (
                        <div key={`earn-${camp.campaignName}-${i}`} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{camp.campaignName}</span>
                            <span className="text-muted-foreground">
                              {fmtCurrency(camp.myEarnings)}
                            </span>
                          </div>
                          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500/70 transition-all"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  {campaigns.every((c) => c.myEarnings === 0) && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No earnings recorded yet.
                    </p>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
