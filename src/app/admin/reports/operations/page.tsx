"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, RadioTower, Receipt, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Period = "7d" | "30d" | "90d";

interface OperationsReport {
  summary: {
    failedDeliveries: number;
    overdueDeliveries: number;
    subscriptionIssues: number;
    unbilledTelephonyCount: number;
    unbilledTelephonyCostCents: number;
    pendingAffiliateCommissions: number;
    pendingAffiliateAmountCents: number;
  };
  failedDeliveries: Array<{
    id: string;
    subject: string;
    failed_at: string | null;
    failed_recipient_count?: number | null;
    last_error: string | null;
    diviners?: { display_name?: string | null; username?: string | null } | null;
  }>;
  overdueDeliveries: Array<{
    id: string;
    subject: string;
    scheduled_for: string;
    diviners?: { display_name?: string | null; username?: string | null } | null;
  }>;
  subscriptionIssues: Array<{
    id: string;
    email: string;
    status: string;
    current_period_end: string | null;
    diviners?: { display_name?: string | null; username?: string | null } | null;
  }>;
  unbilledTelephonyByDiviner: Array<{
    divinerId: string;
    divinerName: string;
    username: string | null;
    usageCount: number;
    totalCostCents: number;
  }>;
  pendingAffiliateByDiviner: Array<{
    divinerId: string;
    divinerName: string;
    username: string | null;
    commissionCount: number;
    pendingAmountCents: number;
  }>;
}

const PERIODS: Period[] = ["7d", "30d", "90d"];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDiviner(diviner?: { display_name?: string | null; username?: string | null } | null) {
  if (!diviner) return "Unknown diviner";
  return diviner.display_name || diviner.username || "Unknown diviner";
}

export default function OperationsReportPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<OperationsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPeriod: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/operations?period=${nextPeriod}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load operations report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations Health</h1>
          <p className="text-sm text-muted-foreground">
            Monitor failed deliveries, billing backlogs, and subscription trouble states.
          </p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={period === option ? "default" : "outline"}
              onClick={() => setPeriod(option)}
              disabled={loading}
            >
              {option === "7d" ? "7 Days" : option === "30d" ? "30 Days" : "90 Days"}
            </Button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : error && !data ? (
        <div className="flex flex-col items-center gap-4 py-24">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => load(period)}>Retry</Button>
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Delivery Failures</CardTitle>
                <AlertTriangle className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.summary.failedDeliveries}</p>
                <p className="text-xs text-muted-foreground">
                  {data.summary.overdueDeliveries} scheduled sends are overdue
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Subscription Issues</CardTitle>
                <WalletCards className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.summary.subscriptionIssues}</p>
                <p className="text-xs text-muted-foreground">
                  Past-due or unpaid weekly subscribers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Unbilled Telephony</CardTitle>
                <RadioTower className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(data.summary.unbilledTelephonyCostCents)}</p>
                <p className="text-xs text-muted-foreground">
                  {data.summary.unbilledTelephonyCount} usage rows still not invoiced
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Affiliate Payouts</CardTitle>
                <Receipt className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(data.summary.pendingAffiliateAmountCents)}</p>
                <p className="text-xs text-muted-foreground">
                  {data.summary.pendingAffiliateCommissions} pending or approved commissions
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Failed Weekly Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                {data.failedDeliveries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No failed deliveries in this period.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Diviner</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>When</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.failedDeliveries.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{formatDiviner(row.diviners)}</TableCell>
                          <TableCell>{row.subject}</TableCell>
                          <TableCell>{row.failed_at ? new Date(row.failed_at).toLocaleString() : "—"}</TableCell>
                          <TableCell className="max-w-xs text-xs text-muted-foreground">
                            {row.last_error ?? `${row.failed_recipient_count ?? 0} recipients failed`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overdue Scheduled Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                {data.overdueDeliveries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No overdue scheduled deliveries.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Diviner</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Scheduled For</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.overdueDeliveries.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{formatDiviner(row.diviners)}</TableCell>
                          <TableCell>{row.subject}</TableCell>
                          <TableCell>{new Date(row.scheduled_for).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Subscription Payment Issues</CardTitle>
              </CardHeader>
              <CardContent>
                {data.subscriptionIssues.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No weekly subscription payment issues.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Diviner</TableHead>
                        <TableHead>Subscriber</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Renews</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.subscriptionIssues.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{formatDiviner(row.diviners)}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell className="capitalize">{row.status.replace("_", " ")}</TableCell>
                          <TableCell>{row.current_period_end ? new Date(row.current_period_end).toLocaleDateString() : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unbilled Telephony By Diviner</CardTitle>
              </CardHeader>
              <CardContent>
                {data.unbilledTelephonyByDiviner.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No unbilled telephony usage.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Diviner</TableHead>
                        <TableHead>Usage Rows</TableHead>
                        <TableHead>Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.unbilledTelephonyByDiviner.map((row) => (
                        <TableRow key={row.divinerId}>
                          <TableCell>{row.divinerName}</TableCell>
                          <TableCell>{row.usageCount}</TableCell>
                          <TableCell>{formatCurrency(row.totalCostCents)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Pending Affiliate Commissions By Diviner</CardTitle>
              </CardHeader>
              <CardContent>
                {data.pendingAffiliateByDiviner.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending affiliate payouts.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Diviner</TableHead>
                        <TableHead>Pending Commissions</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.pendingAffiliateByDiviner.map((row) => (
                        <TableRow key={row.divinerId}>
                          <TableCell>{row.divinerName}</TableCell>
                          <TableCell>{row.commissionCount}</TableCell>
                          <TableCell>{formatCurrency(row.pendingAmountCents)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
