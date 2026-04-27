"use client";

// /admin/reports/affiliates/conversions
// Paginated conversion log with admin-side filters. Each non-reversed
// row exposes a "Reverse" button that opens a reason-required modal
// (Flow K, spec §5).
//
// Spec: docs/specs/affiliate-commission-system.md §6.1, §5 Flow J/K

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Undo2 } from "lucide-react";
import { ReportsTabs } from "../_components/reports-tabs";
import { OverrideActionButton } from "../_components/override-action-button";

interface Conversion {
  id: string;
  campaign_id: string;
  affiliate_id: string;
  affiliate_type: string;
  booking_id: string | null;
  order_amount_cents: number;
  commission_amount_cents: number;
  rate_type_used: "percentage" | "fixed";
  rate_value_used: number;
  reversed_at: string | null;
  reversed_reason: string | null;
  created_at: string;
  campaign:
    | { diviner_id: string | null; name: string | null }
    | { diviner_id: string | null; name: string | null }[]
    | null;
}

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtRate(type: "percentage" | "fixed", value: number) {
  return type === "percentage"
    ? `${value}%`
    : `${fmtCents(value)} fixed`;
}

function campaignName(c: Conversion["campaign"]): string {
  if (!c) return "—";
  const first = Array.isArray(c) ? c[0] : c;
  return first?.name ?? "(unnamed)";
}

export default function AdminReportsConversionsPage() {
  const [divinerId, setDivinerId] = useState("");
  const [affiliateId, setAffiliateId] = useState("");
  const [status, setStatus] = useState<"all" | "earned" | "reversed">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [rows, setRows] = useState<Conversion[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildUrl = useCallback(
    (nextCursor?: string | null) => {
      const params = new URLSearchParams({ limit: "25" });
      if (divinerId) params.set("diviner_id", divinerId);
      if (affiliateId) params.set("affiliate_id", affiliateId);
      if (status === "earned") params.set("status", "earned");
      else if (status === "reversed") params.set("status", "reversed");
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (nextCursor) params.set("cursor", nextCursor);
      return `/api/admin/reports/affiliates/conversions?${params.toString()}`;
    },
    [divinerId, affiliateId, status, dateFrom, dateTo],
  );

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl());
      if (res.ok) {
        const j = await res.json();
        setRows((j.data as Conversion[]) ?? []);
        setCursor(j.nextCursor ?? null);
        setHasMore(Boolean(j.hasMore));
      }
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(cursor));
      if (res.ok) {
        const j = await res.json();
        setRows((prev) => [...prev, ...((j.data as Conversion[]) ?? [])]);
        setCursor(j.nextCursor ?? null);
        setHasMore(Boolean(j.hasMore));
      }
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Conversions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Per-conversion ledger. Reverse with a reason — sends notifications
          and writes to admin_action_log.
        </p>
      </header>

      <ReportsTabs />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-1">
            <Label htmlFor="diviner-id">Diviner ID</Label>
            <Input
              id="diviner-id"
              placeholder="UUID"
              value={divinerId}
              onChange={(e) => setDivinerId(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="affiliate-id">Affiliate ID (junction)</Label>
            <Input
              id="affiliate-id"
              placeholder="UUID"
              value={affiliateId}
              onChange={(e) => setAffiliateId(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(v as "all" | "earned" | "reversed")
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="earned">Earned only</SelectItem>
                <SelectItem value="reversed">Reversed only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-from">From</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-to">To</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex items-end md:col-span-3 lg:col-span-5">
            <Button onClick={loadFirstPage} disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Apply filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion log</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No conversions match your filters.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Rate used</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {fmtDateTime(r.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{campaignName(r.campaign)}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {r.campaign_id.slice(0, 8)}…
                          </div>
                        </TableCell>
                        <TableCell>{fmtCents(r.order_amount_cents)}</TableCell>
                        <TableCell className="text-sm">
                          {fmtRate(r.rate_type_used, r.rate_value_used)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {fmtCents(r.commission_amount_cents)}
                        </TableCell>
                        <TableCell>
                          {r.reversed_at ? (
                            <Badge variant="outline">
                              reversed
                              {r.reversed_reason
                                ? ` · ${r.reversed_reason.slice(0, 40)}`
                                : ""}
                            </Badge>
                          ) : (
                            <Badge variant="default">earned</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!r.reversed_at && (
                            <OverrideActionButton
                              endpoint={`/api/admin/conversions/${r.id}/reverse`}
                              method="POST"
                              buttonLabel="Reverse"
                              buttonVariant="outline"
                              buttonSize="sm"
                              buttonIcon={
                                <Undo2
                                  className="mr-1.5 size-3.5"
                                  aria-hidden
                                />
                              }
                              dialogTitle="Reverse this conversion"
                              dialogDescription="Marks the row as reversed, fires affiliate.reversal notifications, and writes to admin_action_log. Existing payouts are not affected."
                              confirmLabel="Reverse"
                              successToast="Conversion reversed"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
