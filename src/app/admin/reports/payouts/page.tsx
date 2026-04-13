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
import { Loader2, DollarSign, Wallet, Users, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  totalRevenue: number;
  totalPlatformFees: number;
  totalDivinerPayouts: number;
  totalAffiliateCommissions: number;
  avgPlatformFeePercent: number;
}

interface DivinerPayout {
  divinerId: string;
  divinerName: string;
  totalRevenue: number;
  platformFee: number;
  payout: number;
  bookings: number;
  stripeAccountId: string | null;
}

interface AffiliateCommission {
  affiliateId: string;
  affiliateName: string;
  referralCode: string | null;
  totalReferrals: number;
  totalEarned: number;
  pendingAmount: number;
}

interface MonthlyRow {
  month: string;
  revenue: number;
  platformFees: number;
  divinerPayouts: number;
  affiliateCommissions: number;
}

interface PayoutReport {
  summary: Summary;
  divinerPayouts: DivinerPayout[];
  affiliateCommissions: AffiliateCommission[];
  monthly: MonthlyRow[];
}

const PERIODS = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayoutsReportPage() {
  const [data, setData] = useState<PayoutReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/payouts?period=${period}`);
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
          Failed to load payout data.
        </p>
      </div>
    );
  }

  const { summary, divinerPayouts, affiliateCommissions, monthly } = data;

  const maxMonthlyRevenue = Math.max(
    ...monthly.map((m) => m.revenue),
    1
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "#f5f0e8" }}
        >
          Payout & Commission Report
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(184,188,208,0.6)" }}>
          Revenue breakdown, diviner payouts, and affiliate commissions.
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

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <Percent className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {formatCurrency(summary.totalPlatformFees)}
              </span>
              <Badge variant="secondary">
                {summary.avgPlatformFeePercent}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Diviner Payouts
            </CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalDivinerPayouts)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Affiliate Commissions
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalAffiliateCommissions)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diviner Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Diviner Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          {divinerPayouts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No completed bookings in this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Diviner</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">Net Payout</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead>Stripe Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divinerPayouts.map((d) => (
                    <TableRow key={d.divinerId}>
                      <TableCell className="font-medium">
                        {d.divinerName}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(d.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(d.platformFee)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(d.payout)}
                      </TableCell>
                      <TableCell className="text-right">{d.bookings}</TableCell>
                      <TableCell>
                        {d.stripeAccountId ? (
                          <Badge variant="default">Connected</Badge>
                        ) : (
                          <Badge variant="destructive">No Account</Badge>
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

      {/* Affiliate Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Affiliate Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {affiliateCommissions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No affiliate commissions in this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead className="text-right">Referrals</TableHead>
                    <TableHead className="text-right">Total Earned</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliateCommissions.map((a) => (
                    <TableRow key={a.affiliateId}>
                      <TableCell className="font-medium">
                        {a.affiliateName}
                      </TableCell>
                      <TableCell>
                        {a.referralCode ? (
                          <Badge variant="outline">{a.referralCode}</Badge>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {a.totalReferrals}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(a.totalEarned)}
                      </TableCell>
                      <TableCell className="text-right">
                        {a.pendingAmount > 0 ? (
                          <span className="text-amber-400">
                            {formatCurrency(a.pendingAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatCurrency(0)}
                          </span>
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

      {/* Monthly Breakdown Chart */}
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
                const platformPct = maxMonthlyRevenue
                  ? (m.platformFees / maxMonthlyRevenue) * 100
                  : 0;
                const divinerPct = maxMonthlyRevenue
                  ? (m.divinerPayouts / maxMonthlyRevenue) * 100
                  : 0;
                const affPct = maxMonthlyRevenue
                  ? (m.affiliateCommissions / maxMonthlyRevenue) * 100
                  : 0;

                return (
                  <div key={m.month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{m.month}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(m.revenue)}
                      </span>
                    </div>
                    <div className="flex h-5 w-full gap-px overflow-hidden rounded">
                      {platformPct > 0 && (
                        <div
                          className="rounded-l bg-amber-500"
                          style={{ width: `${platformPct}%` }}
                          title={`Platform Fees: ${formatCurrency(m.platformFees)}`}
                        />
                      )}
                      {divinerPct > 0 && (
                        <div
                          className="bg-emerald-500"
                          style={{ width: `${divinerPct}%` }}
                          title={`Diviner Payouts: ${formatCurrency(m.divinerPayouts)}`}
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
                  <div className="size-3 rounded bg-amber-500" />
                  <span>Platform Fees</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded bg-emerald-500" />
                  <span>Diviner Payouts</span>
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
