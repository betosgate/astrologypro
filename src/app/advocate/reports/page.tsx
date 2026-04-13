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
  Users,
  DollarSign,
  Clock,
  Percent,
  Copy,
  Check,
  Link2,
} from "lucide-react";

type Period = "30d" | "90d" | "1y" | "all";

interface Summary {
  totalReferrals: number;
  totalEarned: number;
  totalPaid: number;
  pendingAmount: number;
  commissionRate: number;
  referralCode: string;
  conversionRate: number;
}

interface ReferralRow {
  id: string;
  clientName: string;
  bookingDate: string | null;
  commissionAmount: number;
  status: string;
  serviceName: string;
}

interface MonthlyRow {
  month: string;
  referrals: number;
  earned: number;
  paid: number;
}

interface StatusBreakdown {
  pending: number;
  earned: number;
  paid: number;
}

interface ReportData {
  summary: Summary;
  referrals: ReferralRow[];
  monthly: MonthlyRow[];
  statusBreakdown: StatusBreakdown;
}

const PERIOD_LABELS: { value: Period; label: string }[] = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
];

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export default function AdvocateReportsPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/advocate/reports?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = async () => {
    if (!data) return;
    const url = `${window.location.origin}?ref=${data.summary.referralCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Performance Report
          </h1>
          <p className="text-muted-foreground">Loading your report...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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

  if (!data) return null;

  const { summary, referrals, monthly, statusBreakdown } = data;
  const referralUrl = `${typeof window !== "undefined" ? window.location.origin : ""}?ref=${summary.referralCode}`;
  const statusTotal =
    statusBreakdown.pending + statusBreakdown.earned + statusBreakdown.paid;

  const kpis = [
    {
      label: "Total Referrals",
      value: summary.totalReferrals,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Total Earned",
      value: formatCurrency(summary.totalEarned),
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      label: "Pending Payout",
      value: formatCurrency(summary.pendingAmount),
      icon: Clock,
      color: "text-amber-500",
    },
    {
      label: "Commission Rate",
      value: `${summary.commissionRate}%`,
      icon: Percent,
      color: "text-purple-500",
    },
  ];

  const maxMonthlyRefs = Math.max(...monthly.map((m) => m.referrals), 1);
  const maxMonthlyEarned = Math.max(...monthly.map((m) => m.earned), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Performance Report
        </h1>
        <p className="text-muted-foreground">
          Detailed breakdown of your referral performance
        </p>
      </div>

      {/* Referral link banner */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4 text-amber-500" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link to earn {summary.commissionRate}% on every booking
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">
            {referralUrl}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="size-3.5 text-green-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span className="ml-1.5 hidden sm:inline">
              {copied ? "Copied" : "Copy"}
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Period:
        </span>
        {PERIOD_LABELS.map((p) => (
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
      </div>

      {/* Monthly performance chart */}
      {monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Referrals and earnings by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthly.map((m) => {
                const refW = Math.max(
                  (m.referrals / maxMonthlyRefs) * 100,
                  2
                );
                const earnW = Math.max(
                  (m.earned / maxMonthlyEarned) * 100,
                  2
                );
                return (
                  <div key={m.month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{formatMonth(m.month)}</span>
                      <span className="text-muted-foreground">
                        {m.referrals} referral{m.referrals !== 1 ? "s" : ""} |{" "}
                        {formatCurrency(m.earned)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div
                        className="h-3 rounded bg-blue-500/70 transition-all"
                        style={{ width: `${refW}%` }}
                        title={`${m.referrals} referrals`}
                      />
                      <div
                        className="h-3 rounded bg-amber-500/70 transition-all"
                        style={{ width: `${earnW}%` }}
                        title={`${formatCurrency(m.earned)} earned`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded bg-blue-500/70" />
                Referrals
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded bg-amber-500/70" />
                Earnings
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
          <CardDescription>
            Distribution of referral statuses ({statusTotal} total)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusTotal > 0 ? (
            <>
              <div className="flex h-6 overflow-hidden rounded-full">
                {statusBreakdown.pending > 0 && (
                  <div
                    className="bg-yellow-500 transition-all"
                    style={{
                      width: `${(statusBreakdown.pending / statusTotal) * 100}%`,
                    }}
                    title={`Pending: ${statusBreakdown.pending}`}
                  />
                )}
                {statusBreakdown.earned > 0 && (
                  <div
                    className="bg-blue-500 transition-all"
                    style={{
                      width: `${(statusBreakdown.earned / statusTotal) * 100}%`,
                    }}
                    title={`Earned: ${statusBreakdown.earned}`}
                  />
                )}
                {statusBreakdown.paid > 0 && (
                  <div
                    className="bg-green-500 transition-all"
                    style={{
                      width: `${(statusBreakdown.paid / statusTotal) * 100}%`,
                    }}
                    title={`Paid: ${statusBreakdown.paid}`}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded bg-yellow-500" />
                  Pending ({statusBreakdown.pending})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded bg-blue-500" />
                  Earned ({statusBreakdown.earned})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded bg-green-500" />
                  Paid ({statusBreakdown.paid})
                </span>
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No referrals to display
            </p>
          )}
        </CardContent>
      </Card>

      {/* Referral history table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            All bookings referred via your link ({referrals.length} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No referrals for this period. Share your link to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Client</th>
                    <th className="pb-2 text-left font-medium">Service</th>
                    <th className="pb-2 text-left font-medium">Date</th>
                    <th className="pb-2 text-right font-medium">Commission</th>
                    <th className="pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {referrals.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2">{r.clientName}</td>
                      <td className="py-2 text-muted-foreground">
                        {r.serviceName}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {r.bookingDate
                          ? new Date(r.bookingDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(r.commissionAmount)}
                      </td>
                      <td className="py-2 text-right">
                        <Badge
                          variant={
                            r.status === "paid" ? "default" : "secondary"
                          }
                          className={
                            r.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-600"
                              : r.status === "earned"
                                ? "bg-blue-500/10 text-blue-600"
                                : ""
                          }
                        >
                          {r.status}
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

      {/* Conversion rate */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium">Conversion Rate</p>
            <p className="text-xs text-muted-foreground">
              Referrals that converted to earned or paid
            </p>
          </div>
          <p className="text-2xl font-bold">{summary.conversionRate}%</p>
        </CardContent>
      </Card>
    </div>
  );
}
