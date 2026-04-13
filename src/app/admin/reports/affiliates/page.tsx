"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, DollarSign, Wallet, Users, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopAdvocate {
  id: string;
  name: string;
  referralCode: string;
  referrals: number;
  earned: number;
  paid: number;
  pending: number;
  isActive: boolean;
}

interface TopAffiliate {
  id: string;
  name: string;
  divinerName: string;
  commissions: number;
  conversions: number;
  status: string;
}

interface DivinerAffiliateRow {
  divinerId: string;
  divinerName: string;
  affiliateCount: number;
  totalCommissions: number;
  totalPaid: number;
}

interface MonthlyRow {
  month: string;
  advocateEarnings: number;
  affiliateCommissions: number;
}

interface AffiliateReport {
  advocates: {
    total: number;
    active: number;
    totalReferrals: number;
    totalEarned: number;
    totalPaid: number;
    pending: number;
    topAdvocates: TopAdvocate[];
  };
  affiliates: {
    total: number;
    active: number;
    totalCommissions: number;
    totalPaid: number;
    pending: number;
    byDiviner: DivinerAffiliateRow[];
    topAffiliates: TopAffiliate[];
  };
  combined: {
    totalEarned: number;
    totalPaid: number;
    pending: number;
    activePartners: number;
    monthly: MonthlyRow[];
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODS = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
] as const;

const TABS = [
  { value: "advocates", label: "Social Advocates" },
  { value: "affiliates", label: "Diviner Affiliates" },
  { value: "combined", label: "Combined" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AffiliatesReportPage() {
  const [data, setData] = useState<AffiliateReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [tab, setTab] = useState<TabValue>("advocates");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/affiliates?period=${period}`);
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
        <p className="text-sm text-muted-foreground">
          Failed to load affiliate data.
        </p>
      </div>
    );
  }

  const { advocates, affiliates, combined } = data;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "#f5f0e8" }}
        >
          Affiliate & Social Advocate Report
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(184,188,208,0.6)" }}>
          Combined metrics for social advocates and diviner affiliate programs.
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
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(combined.totalEarned)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Both affiliate systems combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(combined.totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {combined.pending > 0 ? (
                <span className="text-amber-400">
                  {formatCurrency(combined.pending)}
                </span>
              ) : (
                formatCurrency(0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{combined.activePartners}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {advocates.active} advocates + {affiliates.active} affiliates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "advocates" && (
        <AdvocatesTab advocates={advocates} />
      )}
      {tab === "affiliates" && (
        <AffiliatesTab affiliates={affiliates} />
      )}
      {tab === "combined" && (
        <CombinedTab combined={combined} />
      )}
    </div>
  );
}

// ─── Social Advocates Tab ─────────────────────────────────────────────────────

function AdvocatesTab({ advocates }: { advocates: AffiliateReport["advocates"] }) {
  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryMini label="Total Advocates" value={String(advocates.total)} />
        <SummaryMini label="Active" value={String(advocates.active)} />
        <SummaryMini label="Total Referrals" value={String(advocates.totalReferrals)} />
        <SummaryMini label="Earned" value={formatCurrency(advocates.totalEarned)} />
        <SummaryMini label="Paid" value={formatCurrency(advocates.totalPaid)} />
        <SummaryMini label="Pending" value={formatCurrency(advocates.pending)} highlight={advocates.pending > 0} />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Social Advocates</CardTitle>
        </CardHeader>
        <CardContent>
          {advocates.topAdvocates.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No social advocates found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead className="text-right">Referrals</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advocates.topAdvocates.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.referralCode}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{a.referrals}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(a.earned)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(a.paid)}
                      </TableCell>
                      <TableCell className="text-right">
                        {a.pending > 0 ? (
                          <span className="text-amber-400">
                            {formatCurrency(a.pending)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatCurrency(0)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
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

// ─── Diviner Affiliates Tab ───────────────────────────────────────────────────

function AffiliatesTab({ affiliates }: { affiliates: AffiliateReport["affiliates"] }) {
  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryMini label="Total Affiliates" value={String(affiliates.total)} />
        <SummaryMini label="Active" value={String(affiliates.active)} />
        <SummaryMini label="Commissions" value={formatCurrency(affiliates.totalCommissions)} />
        <SummaryMini label="Paid" value={formatCurrency(affiliates.totalPaid)} />
        <SummaryMini label="Pending" value={formatCurrency(affiliates.pending)} highlight={affiliates.pending > 0} />
      </div>

      {/* By Diviner Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commissions by Diviner</CardTitle>
        </CardHeader>
        <CardContent>
          {affiliates.byDiviner.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No diviner affiliate data found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Diviner</TableHead>
                    <TableHead className="text-right">Affiliate Count</TableHead>
                    <TableHead className="text-right">Total Commissions</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.byDiviner.map((d) => (
                    <TableRow key={d.divinerId}>
                      <TableCell className="font-medium">
                        {d.divinerName}
                      </TableCell>
                      <TableCell className="text-right">
                        {d.affiliateCount}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(d.totalCommissions)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(d.totalPaid)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Affiliates</CardTitle>
        </CardHeader>
        <CardContent>
          {affiliates.topAffiliates.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No affiliate commissions found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Diviner</TableHead>
                    <TableHead className="text-right">Commissions</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.topAffiliates.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>{a.divinerName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(a.commissions)}
                      </TableCell>
                      <TableCell className="text-right">
                        {a.conversions}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === "active"
                              ? "default"
                              : a.status === "suspended" || a.status === "blocked"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {a.status}
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
    </div>
  );
}

// ─── Combined Tab ─────────────────────────────────────────────────────────────

function CombinedTab({ combined }: { combined: AffiliateReport["combined"] }) {
  const { monthly } = combined;

  const maxMonthly = Math.max(
    ...monthly.map((m) => m.advocateEarnings + m.affiliateCommissions),
    1
  );

  return (
    <div className="space-y-6">
      {/* Combined totals */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryMini label="Total Earned" value={formatCurrency(combined.totalEarned)} />
        <SummaryMini label="Total Paid" value={formatCurrency(combined.totalPaid)} />
        <SummaryMini label="Pending" value={formatCurrency(combined.pending)} highlight={combined.pending > 0} />
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {monthly.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No monthly data available.
            </p>
          ) : (
            <div className="space-y-3">
              {monthly.map((m) => {
                const advPct = maxMonthly
                  ? (m.advocateEarnings / maxMonthly) * 100
                  : 0;
                const affPct = maxMonthly
                  ? (m.affiliateCommissions / maxMonthly) * 100
                  : 0;
                const total = m.advocateEarnings + m.affiliateCommissions;

                return (
                  <div key={m.month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{m.month}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <div className="flex h-5 w-full gap-px overflow-hidden rounded">
                      {advPct > 0 && (
                        <div
                          className="rounded-l bg-emerald-500"
                          style={{ width: `${advPct}%` }}
                          title={`Advocate Earnings: ${formatCurrency(m.advocateEarnings)}`}
                        />
                      )}
                      {affPct > 0 && (
                        <div
                          className="rounded-r bg-blue-500"
                          style={{ width: `${affPct}%` }}
                          title={`Affiliate Commissions: ${formatCurrency(m.affiliateCommissions)}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded bg-emerald-500" />
                  <span>Advocate Earnings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded bg-blue-500" />
                  <span>Affiliate Commissions</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Shared mini summary card ─────────────────────────────────────────────────

function SummaryMini({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${highlight ? "text-amber-400" : ""}`}>
        {value}
      </p>
    </div>
  );
}
