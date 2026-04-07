"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowLeft, TrendingUp, DollarSign, Clock, Wallet } from "lucide-react";

interface LedgerEntry {
  id: string;
  order_amount_cents: number;
  commission_amount_cents: number;
  status: string;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  approved_at: string | null;
  created_at: string;
}

interface PayoutRecord {
  id: string;
  amount_cents: number;
  currency: string;
  payout_method: string | null;
  reference_number: string | null;
  status: string;
  paid_at: string;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDateStr(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    payable: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    paid: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    reversed: "bg-muted text-muted-foreground",
    recorded: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

export default function AffiliateCommissionDetailPage({
  params,
}: {
  params: Promise<{ affiliateId: string }>;
}) {
  const { affiliateId } = use(params);
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [ledgerCursor, setLedgerCursor] = useState<string | null>(null);
  const [ledgerHasMore, setLedgerHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadData = useCallback(
    async (reset = true) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({ affiliate_id: affiliateId });
      if (!reset && ledgerCursor) params.set("cursor", ledgerCursor);

      const [ledgerRes, payoutsRes] = await Promise.all([
        fetch(`/api/dashboard/affiliate-commission/ledger?${params.toString()}`),
        reset
          ? fetch(`/api/dashboard/affiliate-commission/payouts?affiliate_id=${affiliateId}`)
          : Promise.resolve(null),
      ]);

      if (ledgerRes.ok) {
        const json = await ledgerRes.json() as { data: LedgerEntry[]; nextCursor: string | null; hasMore: boolean };
        if (reset) {
          setLedger(json.data ?? []);
        } else {
          setLedger((prev) => [...prev, ...(json.data ?? [])]);
        }
        setLedgerCursor(json.nextCursor);
        setLedgerHasMore(json.hasMore);
      }
      if (payoutsRes?.ok) {
        const json = await payoutsRes.json() as { data: PayoutRecord[] };
        setPayouts(json.data ?? []);
      }

      if (reset) setLoading(false);
      else setLoadingMore(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [affiliateId, ledgerCursor]
  );

  useEffect(() => {
    void loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affiliateId]);

  // Compute balance from ledger
  const totalEarned = ledger.reduce((s, e) => s + e.commission_amount_cents, 0);
  const totalPaid = payouts.reduce((s, p) => s + p.amount_cents, 0);
  const pending = ledger
    .filter((e) => ["pending", "approved", "payable"].includes(e.status))
    .reduce((s, e) => s + e.commission_amount_cents, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/affiliate-commission">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate Commission Detail</h1>
          <p className="text-muted-foreground font-mono text-sm">{affiliateId}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCents(totalEarned)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCents(pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-sky-600">{formatCents(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCents(totalEarned - totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger History */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Ledger</CardTitle>
          <CardDescription>Full ledger history for this affiliate.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {ledger.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No ledger entries for this affiliate.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order Amount</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDateStr(entry.created_at)}
                        </TableCell>
                        <TableCell>{formatCents(entry.order_amount_cents)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCents(entry.commission_amount_cents)}
                        </TableCell>
                        <TableCell>{statusBadge(entry.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">
                          {entry.description ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {entry.period_start && entry.period_end
                            ? `${entry.period_start} – ${entry.period_end}`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {ledgerHasMore && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData(false)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>All recorded payouts to this affiliate.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payouts recorded for this affiliate.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateStr(payout.paid_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCents(payout.amount_cents)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payout.payout_method ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payout.reference_number ?? "—"}
                      </TableCell>
                      <TableCell>{statusBadge(payout.status)}</TableCell>
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
