"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  on_hold: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  paid: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  reversed: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

interface CommissionRow {
  id: string;
  order_reference: string | null;
  order_amount_cents: number;
  commission_type: string;
  commission_rate: number;
  commission_amount_cents: number;
  status: string;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function AffiliateCommissionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cursors, setCursors] = useState<Array<string | null>>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(async (cursor: string | null, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (status !== "all") params.set("status", status);
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/affiliate/commissions?${params.toString()}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setError("You are not registered as an affiliate.");
        setItems([]);
        return;
      }
      if (!res.ok) {
        const json = await res.json();
        setError((json as { title?: string }).title ?? "Failed to load commissions.");
        return;
      }
      const json = await res.json() as { data: CommissionRow[]; hasMore: boolean; nextCursor: string | null };
      setItems(json.data);
      setHasMore(json.hasMore);
    } catch {
      setError("Unexpected error loading commissions.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setCursors([null]);
    setPageIndex(0);
    fetchPage(null, statusFilter);
  }, [statusFilter, fetchPage]);

  function goNext() {
    const nextPageIndex = pageIndex + 1;
    const lastItem = items[items.length - 1];
    const newCursor = lastItem?.id ?? null;
    const newCursors = [...cursors.slice(0, nextPageIndex), newCursor];
    setCursors(newCursors);
    setPageIndex(nextPageIndex);
    fetchPage(newCursor, statusFilter);
  }

  function goPrev() {
    const prevPageIndex = pageIndex - 1;
    setPageIndex(prevPageIndex);
    fetchPage(cursors[prevPageIndex] ?? null, statusFilter);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commissions</h1>
        <p className="text-muted-foreground">Your commission history.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Commission History</CardTitle>
            <CardDescription>Paginated, 20 per page.</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No commissions found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order Ref</TableHead>
                      <TableHead>Order Amount</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDateStr(row.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {row.order_reference ?? "—"}
                        </TableCell>
                        <TableCell>{formatCents(row.order_amount_cents)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCents(row.commission_amount_cents)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Page {pageIndex + 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageIndex === 0}
                    onClick={goPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasMore}
                    onClick={goNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
