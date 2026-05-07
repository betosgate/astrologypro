"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Play, RefreshCw, AlertTriangle } from "lucide-react";
import { PayoutsKillSwitchPanel } from "../_components/payouts-kill-switch-panel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayoutRow {
  id: string;
  affiliate_account_id: string;
  ripe_total_cents: number;
  offset_applied_cents: number;
  net_transferred_cents: number;
  stripe_transfer_id: string | null;
  status: string;
  failure_reason: string | null;
  created_at: string;
  transferred_at: string | null;
  trigger_source: string;
  notes: string | null;
}

interface TriggerResult {
  scanned?: number;
  affiliatesProcessed?: number;
  payoutsCreated?: number;
  totalNetCents?: number;
  dryRun?: boolean;
  blocked?: { affiliateAccountId: string; reason: string }[];
  failed?: { payoutId: string; reason: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dollars(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "completed") return "default";
  if (s === "failed") return "destructive";
  if (s === "dry_run") return "outline";
  return "secondary";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AffiliatePayoutsAdminPage() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<TriggerResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliate-payouts?limit=50", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items?: PayoutRow[] };
      setPayouts(data.items ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runManualTrigger() {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/admin/affiliate-payouts/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerSource: "admin_manual" }),
      });
      const body = (await res.json()) as TriggerResult & { error?: string };
      if (!res.ok) {
        toast.error(body.error ?? "Trigger failed");
        return;
      }
      setTriggerResult(body);
      toast.success("Payout pass complete");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setTriggering(false);
    }
  }

  const failed = payouts.filter((p) => p.status === "failed");

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate payouts</h1>
          <p className="text-muted-foreground text-sm">
            Kill-switch, manual trigger, and payout history.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={load}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            <span className="ml-1.5">Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={runManualTrigger}
            disabled={triggering}
          >
            {triggering ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Play className="mr-1.5 size-4" />
            )}
            Run payout pass
          </Button>
        </div>
      </header>

      {/* Kill-switch */}
      <PayoutsKillSwitchPanel />

      {/* Last trigger result */}
      {triggerResult && (
        <Card className={triggerResult.dryRun ? "border-orange-300" : "border-emerald-300"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Last pass result</CardTitle>
            <CardDescription>
              {triggerResult.dryRun
                ? "Kill-switch is OFF — dry-run mode, no Stripe transfers issued."
                : "Live mode — Stripe transfers were attempted."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-muted-foreground">Scanned</p>
              <p className="font-semibold">{triggerResult.scanned ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Processed</p>
              <p className="font-semibold">{triggerResult.affiliatesProcessed ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payouts</p>
              <p className="font-semibold">{triggerResult.payoutsCreated ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Net transferred</p>
              <p className="font-semibold">{dollars(triggerResult.totalNetCents ?? 0)}</p>
            </div>
            {(triggerResult.blocked?.length ?? 0) > 0 && (
              <div className="col-span-2 sm:col-span-4">
                <p className="text-muted-foreground">Blocked</p>
                <ul className="text-xs mt-1 space-y-0.5">
                  {triggerResult.blocked!.map((b) => (
                    <li key={b.affiliateAccountId} className="font-mono">
                      {b.affiliateAccountId.slice(0, 8)}… — {b.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(triggerResult.failed?.length ?? 0) > 0 && (
              <div className="col-span-2 sm:col-span-4">
                <p className="text-destructive font-medium">Failed</p>
                <ul className="text-xs mt-1 space-y-0.5 text-destructive">
                  {triggerResult.failed!.map((f) => (
                    <li key={f.payoutId} className="font-mono">
                      {f.payoutId.slice(0, 8)}… — {f.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Failed payouts alert */}
      {failed.length > 0 && !triggerResult && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="size-4" aria-hidden />
              {failed.length} failed payout{failed.length > 1 ? "s" : ""}
            </CardTitle>
            <CardDescription>
              These will be retried on the next cron tick. If they keep
              failing, investigate the affiliate&apos;s Stripe account status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {failed.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <code className="font-mono text-xs">{p.id.slice(0, 8)}…</code>
                  <span className="text-muted-foreground">{p.failure_reason ?? "unknown"}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Payout history */}
      <Card>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
          <CardDescription>Most recent 50 payouts across all affiliates.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : payouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payouts yet. Run a payout pass or wait for the next cron tick.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Offset</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Stripe Transfer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">
                        {p.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.affiliate_account_id.slice(0, 8)}…
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(p.status)}>
                          {p.status}
                        </Badge>
                        {p.failure_reason && (
                          <p className="mt-0.5 text-xs text-destructive">
                            {p.failure_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {dollars(p.ripe_total_cents)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {p.offset_applied_cents > 0
                          ? `−${dollars(p.offset_applied_cents)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {dollars(p.net_transferred_cents)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.stripe_transfer_id ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.transferred_at
                          ? new Date(p.transferred_at).toLocaleDateString()
                          : new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">
                        {p.trigger_source.replace(/_/g, " ")}
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
