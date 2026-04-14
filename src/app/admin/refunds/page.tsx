"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

type RefundRow = {
  id: string;
  scheduled_at: string;
  base_price: number;
  refund_amount: number | null;
  refunded_at: string | null;
  refund_reason: string | null;
  status: string;
  no_show_type: "diviner" | "client" | null;
  stripe_payment_intent_id: string | null;
  ledger_gross_amount: number;
  ledger_platform_fee: number;
  ledger_affiliate_commission: number;
  ledger_diviner_net: number;
  ledger_remaining_gross_amount: number;
  ledger_remaining_platform_fee: number;
  ledger_remaining_affiliate_commission: number;
  ledger_remaining_diviner_net: number;
  settlement_status: string | null;
  settlement_note: string | null;
  affiliate_refund_amount: number;
  finance_note_type: string | null;
  finance_note: string | null;
  clients: { full_name: string | null; email: string } | null;
  diviners: { id?: string | null; display_name: string | null } | null;
};

export default function AdminRefundsPage() {
  const [rows, setRows] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "refunded" | "no_show">("all");
  const [search, setSearch] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [refunding, setRefunding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (overrides?: { createdFrom?: string; createdTo?: string }) => {
    setLoading(true);
    const params = new URLSearchParams();
    const cf = overrides?.createdFrom ?? createdFrom;
    const ct = overrides?.createdTo ?? createdTo;
    if (cf) params.set("created_from", cf);
    if (ct) params.set("created_to", ct);
    const res = await fetch(`/api/admin/refunds?${params}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows ?? []);
    }
    setLoading(false);
  }, [createdFrom, createdTo]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function issueRefund(bookingId: string, amount: number) {
    const reason = window.prompt(
      `Issue admin refund of ${formatCurrency(amount)} for this booking?\nEnter reason (or cancel):`,
      "Admin-issued refund"
    );
    if (!reason) return;

    setRefunding(bookingId);
    setError(null);
    const res = await fetch("/api/admin/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Refund failed");
    } else {
      await load();
    }
    setRefunding(null);
  }

  const filtered = rows.filter((r) => {
    if (filter === "pending") return !r.refunded_at && r.stripe_payment_intent_id;
    if (filter === "refunded") return !!r.refunded_at;
    if (filter === "no_show") return r.no_show_type !== null;
    return true;
  }).filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (r.clients?.full_name ?? "").toLowerCase().includes(s) ||
      (r.clients?.email ?? "").toLowerCase().includes(s) ||
      (r.diviners?.display_name ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refund Management</h1>
          <p className="text-muted-foreground">
            Review and issue refunds for bookings
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
          <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {(["all", "pending", "refunded", "no_show"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === "no_show" ? "No-Show" : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
          <Input
            placeholder="Search client or diviner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Booking date from</Label>
            <Input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Booking date to</Label>
            <Input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="w-40" />
          </div>
          <Button size="sm" onClick={() => load()}>Search</Button>
          <Button size="sm" variant="outline" onClick={() => { setCreatedFrom(""); setCreatedTo(""); load({ createdFrom: "", createdTo: "" }); }}>Reset</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filtered.length})</CardTitle>
          <CardDescription>
            Bookings with Stripe payments — sorted by most recent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No results.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Date</th>
                    <th className="pb-2 text-left font-medium">Client</th>
                    <th className="pb-2 text-left font-medium">Diviner</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                    <th className="pb-2 text-right font-medium">Platform</th>
                    <th className="pb-2 text-right font-medium">Affiliate</th>
                    <th className="pb-2 text-right font-medium">Diviner Net</th>
                    <th className="pb-2 text-right font-medium">Remaining</th>
                    <th className="pb-2 text-right font-medium">Refund</th>
                    <th className="pb-2 text-left font-medium">Reason</th>
                    <th className="pb-2 text-left font-medium">Finance Note</th>
                    <th className="pb-2 text-center font-medium">No-Show</th>
                    <th className="pb-2 text-center font-medium">Status</th>
                    <th className="pb-2 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => {
                    const isRefunded = !!r.refunded_at;
                    const canRefund =
                      !isRefunded && !!r.stripe_payment_intent_id;
                    return (
                      <tr key={r.id}>
                        <td className="py-2 text-muted-foreground whitespace-nowrap">
                          {new Date(r.scheduled_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2">
                          <div>{r.clients?.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.clients?.email ?? ""}
                          </div>
                        </td>
                        <td className="py-2">
                          {r.diviners?.display_name ?? "—"}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {formatCurrency(r.base_price ?? 0)}
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(r.ledger_platform_fee ?? 0)}
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(r.ledger_affiliate_commission ?? 0)}
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(r.ledger_diviner_net ?? 0)}
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(r.ledger_remaining_gross_amount ?? 0)}
                        </td>
                        <td className="py-2 text-right">
                          {r.refund_amount != null
                            ? formatCurrency(r.refund_amount)
                            : "—"}
                        </td>
                        <td className="py-2 max-w-[180px] truncate text-muted-foreground">
                          {r.refund_reason ?? "—"}
                        </td>
                        <td className="py-2 max-w-[220px] truncate text-muted-foreground">
                          {r.finance_note ?? r.settlement_note ?? "—"}
                        </td>
                        <td className="py-2 text-center">
                          {r.no_show_type ? (
                            <Badge
                              variant="secondary"
                              className={
                                r.no_show_type === "diviner"
                                  ? "bg-red-500/10 text-red-600"
                                  : "bg-amber-500/10 text-amber-600"
                              }
                            >
                              {r.no_show_type}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 text-center">
                          <Badge
                            variant={isRefunded ? "default" : "outline"}
                          >
                            {isRefunded ? "Refunded" : r.settlement_status ?? r.status}
                          </Badge>
                        </td>
                        <td className="py-2 text-center">
                          {canRefund ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              disabled={refunding === r.id}
                              onClick={() =>
                                issueRefund(r.id, r.base_price ?? 0)
                              }
                            >
                              {refunding === r.id ? "Processing…" : "Refund"}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {isRefunded ? "Done" : "No payment"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
