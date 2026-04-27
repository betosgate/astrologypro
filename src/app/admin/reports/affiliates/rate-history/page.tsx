"use client";

// /admin/reports/affiliates/rate-history
// Paginated platform rate-edit audit. Read-only.
//
// Spec: docs/specs/affiliate-commission-system.md §6.1, §5 Flow G

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { ReportsTabs } from "../_components/reports-tabs";

interface RateHistoryRow {
  id: string;
  assignment_id: string;
  old_commission_type: "percentage" | "fixed" | null;
  old_commission_value: number | null;
  new_commission_type: "percentage" | "fixed";
  new_commission_value: number;
  changed_at: string;
  changed_by: string | null;
  reason: string | null;
  assignment:
    | {
        diviner_id: string | null;
        affiliate_id: string | null;
        destination_type: string | null;
        destination_id: string | null;
      }
    | {
        diviner_id: string | null;
        affiliate_id: string | null;
        destination_type: string | null;
        destination_id: string | null;
      }[]
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

function fmtRate(type: "percentage" | "fixed" | null, value: number | null) {
  if (!type || value === null) return "—";
  return type === "percentage" ? `${value}%` : `${fmtCents(value)} fixed`;
}

function assignmentScope(a: RateHistoryRow["assignment"]) {
  if (!a) return "—";
  const first = Array.isArray(a) ? a[0] : a;
  if (!first) return "—";
  return `${first.destination_type ?? "—"}${first.destination_id ? `: ${first.destination_id.slice(0, 8)}…` : ""}`;
}

export default function AdminReportsRateHistoryPage() {
  const [divinerId, setDivinerId] = useState("");
  const [affiliateId, setAffiliateId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [rows, setRows] = useState<RateHistoryRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildUrl = useCallback(
    (nextCursor?: string | null) => {
      const params = new URLSearchParams({ limit: "25" });
      if (divinerId) params.set("diviner_id", divinerId);
      if (affiliateId) params.set("affiliate_id", affiliateId);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (nextCursor) params.set("cursor", nextCursor);
      return `/api/admin/reports/affiliates/rate-history?${params.toString()}`;
    },
    [divinerId, affiliateId, dateFrom, dateTo],
  );

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl());
      if (res.ok) {
        const j = await res.json();
        setRows((j.data as RateHistoryRow[]) ?? []);
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
        setRows((prev) => [
          ...prev,
          ...((j.data as RateHistoryRow[]) ?? []),
        ]);
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
        <h1 className="text-2xl font-semibold tracking-tight">Rate history</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide audit of commission-rate edits. New rates affect only
          NEW bookings — existing bookings keep what they were stamped with.
        </p>
      </header>

      <ReportsTabs />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
          <div className="flex items-end md:col-span-2 lg:col-span-4">
            <Button onClick={loadFirstPage} disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Apply filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate edits</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No rate edits match your filters.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Assignment scope</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {fmtDateTime(r.changed_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {assignmentScope(r.assignment)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtRate(r.old_commission_type, r.old_commission_value)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {fmtRate(r.new_commission_type, r.new_commission_value)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.reason ?? "—"}
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
