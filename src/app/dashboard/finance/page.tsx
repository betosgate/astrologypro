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
} from "lucide-react";

type Period = "30d" | "90d" | "1y" | "all";

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
    refundsTotal: number;
    refundsCount: number;
    eventsCount: number;
  };
  monthly: Array<{
    month: string;
    grossRevenue: number;
    divinerNet: number;
    affiliateCommissions: number;
  }>;
  refunds: Array<{
    id: string;
    refundedAt: string;
    refundAmount: number;
    refundReason: string | null;
    scheduledAt: string | null;
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
  }>;
};

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
];

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardFinancePage() {
  const [period, setPeriod] = useState<Period>("90d");
  const [data, setData] = useState<FinanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPeriod: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/finance?period=${nextPeriod}`);
      const json = (await res.json().catch(() => ({}))) as FinanceResponse & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load finance data");
      }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">
            Your revenue, platform fees, affiliate deductions, refunds, and net share.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout Readiness</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground">Stripe account</p>
            <p className="mt-1 font-medium">
              {data.diviner.stripeAccountId ? "Connected" : "Missing"}
            </p>
          </div>
          <div className="rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground">Charges</p>
            <p className="mt-1 font-medium">
              {data.diviner.chargesEnabled ? "Enabled" : "Not enabled"}
            </p>
          </div>
          <div className="rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground">Payouts</p>
            <p className="mt-1 font-medium">
              {data.diviner.payoutsEnabled ? "Enabled" : "Not enabled"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCurrency(data.summary.grossRevenue)}</p>
            <p className="text-xs text-muted-foreground">{data.summary.eventsCount} monetized events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <Percent className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCurrency(data.summary.platformFees)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Affiliate Share</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCurrency(data.summary.affiliateCommissions)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Diviner Gross</CardTitle>
            <Percent className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCurrency(data.summary.divinerGross)}</p>
            <p className="text-xs text-muted-foreground">Before affiliate deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Diviner Net</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCurrency(data.summary.divinerNet)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Refunds</CardTitle>
            <RotateCcw className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCurrency(data.summary.refundsTotal)}</p>
            <p className="text-xs text-muted-foreground">{data.summary.refundsCount} refunds</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {data.monthly.length === 0 ? (
            <p className="text-sm text-muted-foreground">No finance activity in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Affiliate Share</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.monthly.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell className="text-right">{fmtCurrency(row.grossRevenue)}</TableCell>
                    <TableCell className="text-right">{fmtCurrency(row.affiliateCommissions)}</TableCell>
                    <TableCell className="text-right font-medium">{fmtCurrency(row.divinerNet)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Finance Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent ledger activity.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Platform Fee</TableHead>
                  <TableHead className="text-right">Affiliate</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentActivity.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{fmtDate(row.recognizedAt)}</TableCell>
                    <TableCell className="capitalize">{row.sourceType.replaceAll("_", " ")}</TableCell>
                    <TableCell className="text-right">{fmtCurrency(row.grossRevenue)}</TableCell>
                    <TableCell className="text-right">{fmtCurrency(row.platformFees)}</TableCell>
                    <TableCell className="text-right">{fmtCurrency(row.affiliateCommissions)}</TableCell>
                    <TableCell className="text-right font-medium">{fmtCurrency(row.divinerNet)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Refunds</CardTitle>
        </CardHeader>
        <CardContent>
          {data.refunds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No refunds in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Refunded</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.refunds.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{fmtDate(row.refundedAt)}</TableCell>
                    <TableCell>{fmtDate(row.scheduledAt)}</TableCell>
                    <TableCell>{row.refundReason ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">{fmtCurrency(row.refundAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
